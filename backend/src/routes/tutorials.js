import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';

export const tutorialsRouter = Router();
tutorialsRouter.use(requireAuth);

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

const TutorialSchema = z.object({
  title:       z.string().max(255).optional().nullable(),
  content:     z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

const ImageSchema = z.object({ image_url: z.string().url().max(255) });

// ─── Helper: own-or-admin check ───────────────────────────────────────────────

async function ownOrFail(tutId, memberId, role, res) {
  const { data: tut, error } = await supabase
    .from('tutorial')
    .select('id, created_by_member_id, approval_status')
    .eq('id', tutId)
    .single();

  if (error || !tut) {
    res.status(404).json({ error: 'Tutorial not found' });
    return null;
  }

  // Admin always allowed
  if (role === 'admin') return tut;

  // Owner always allowed
  if (tut.created_by_member_id === memberId) return tut;

  // Researcher allowed if it's their RA's content and pending researcher review
  if (role === 'researcher' && tut.approval_status === 'PENDING_RESEARCHER') {
    const { data: ra } = await supabase
      .from('research_assistant')
      .select('assigned_by_researcher_id')
      .eq('member_id', tut.created_by_member_id)
      .single();

    if (ra && ra.assigned_by_researcher_id === memberId) {
      return tut;
    }
  }

  res.status(403).json({ error: 'Not authorised to modify this tutorial' });
  return null;
}

// ─── GET /tutorials ───────────────────────────────────────────────────────────

tutorialsRouter.get('/', async (req, res) => {
  let query = supabase
    .from('tutorial')
    .select('*, tutorial_image(id, image_url)')
    .order('created_at', { ascending: false });

  // Admin only needs to see Pending and Published (Approved)
  if (req.user.role === 'admin') {
    query = query.in('approval_status', ['PENDING_ADMIN', 'APPROVED']);
  } else if (req.user.role === 'researcher') {
    // Researcher sees their own OR their assistants' pending items
    const { data: assistants } = await supabase
      .from('research_assistant')
      .select('member_id')
      .eq('assigned_by_researcher_id', req.user.sub);
    const assistantIds = (assistants ?? []).map(a => a.member_id);
    
    if (assistantIds.length > 0) {
      query = query.or(`created_by_member_id.eq.${req.user.sub},and(created_by_member_id.in.(${assistantIds.join(',')}),approval_status.eq.PENDING_RESEARCHER)`);
    } else {
      query = query.eq('created_by_member_id', req.user.sub);
    }
  } else {
    // Others see only their own
    query = query.eq('created_by_member_id', req.user.sub);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
});

// ─── POST /tutorials ──────────────────────────────────────────────────────────

tutorialsRouter.post('/', async (req, res) => {
  const parsed = TutorialSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { title, content, description } = parsed.data;

  const { data, error } = await supabase
    .from('tutorial')
    .insert({
      title: title || 'Untitled',
      content: content || '',
      description: description || null,
      created_by_member_id: req.user.sub,
      approval_status: 'DRAFT',
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// ─── GET /tutorials/:id ───────────────────────────────────────────────────────

tutorialsRouter.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('tutorial')
    .select('*, tutorial_image(id, image_url)')
    .eq('id', req.params.id)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Tutorial not found' });
  if (req.user.role !== 'admin' && data.created_by_member_id !== req.user.sub) {
    return res.status(403).json({ error: 'Not authorised' });
  }
  res.json(data);
});

// ─── PUT /tutorials/:id ───────────────────────────────────────────────────────

tutorialsRouter.put('/:id', async (req, res) => {
  const tut = await ownOrFail(req.params.id, req.user.sub, req.user.role, res);
  if (!tut) return;

  const parsed = TutorialSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  // Admin and Researchers reviewing don't reset to DRAFT
  const updatePayload = { ...parsed.data };
  if (req.user.role !== 'admin') {
    // If it's a researcher editing something NOT pending their review, reset it
    const isReviewing = req.user.role === 'researcher' && tut.approval_status === 'PENDING_RESEARCHER';
    if (!isReviewing) {
      updatePayload.approval_status = 'DRAFT';
    }
  }

  const { data, error } = await supabase
    .from('tutorial')
    .update(updatePayload)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ─── DELETE /tutorials/:id ────────────────────────────────────────────────────

tutorialsRouter.delete('/:id', async (req, res) => {
  const tut = await ownOrFail(req.params.id, req.user.sub, req.user.role, res);
  if (!tut) return;

  // Restriction: Only DRAFT content can be deleted by authors.
  if (req.user.role !== 'admin' && tut.approval_status !== 'DRAFT') {
    return res.status(403).json({ error: `Cannot delete content in ${tut.approval_status} state` });
  }

  const { error } = await supabase.from('tutorial').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Tutorial deleted' });
});

// ─── POST /tutorials/:id/images ───────────────────────────────────────────────

tutorialsRouter.post('/:id/images', async (req, res) => {
  const tut = await ownOrFail(req.params.id, req.user.sub, req.user.role, res);
  if (!tut) return;

  const parsed = ImageSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { data, error } = await supabase
    .from('tutorial_image')
    .insert({ tutorial_id: Number(req.params.id), image_url: parsed.data.image_url })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// ─── DELETE /tutorials/:id/images/:imgId ─────────────────────────────────────

tutorialsRouter.delete('/:id/images/:imgId', async (req, res) => {
  const tut = await ownOrFail(req.params.id, req.user.sub, req.user.role, res);
  if (!tut) return;

  const { error } = await supabase
    .from('tutorial_image')
    .delete()
    .eq('id', req.params.imgId)
    .eq('tutorial_id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Image removed' });
});
