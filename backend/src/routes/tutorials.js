import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';

export const tutorialsRouter = Router();
tutorialsRouter.use(requireAuth);

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

const TutorialSchema = z.object({
  content:     z.string().min(1),
  description: z.string().optional().nullable(),
});

const ImageSchema = z.object({ image_url: z.string().url().max(255) });

// ─── Helper: own-or-admin check ───────────────────────────────────────────────

async function ownOrFail(tutId, memberId, role, res) {
  const { data, error } = await supabase
    .from('tutorial')
    .select('id, created_by_member_id')
    .eq('id', tutId)
    .single();
  if (error || !data) { res.status(404).json({ error: 'Tutorial not found' }); return null; }
  if (role !== 'admin' && data.created_by_member_id !== memberId) {
    res.status(403).json({ error: 'Not authorised to modify this tutorial' }); return null;
  }
  return data;
}

// ─── GET /tutorials ───────────────────────────────────────────────────────────

tutorialsRouter.get('/', async (req, res) => {
  let query = supabase
    .from('tutorial')
    .select('*, tutorial_image(image_url)')
    .order('created_at', { ascending: false });

  if (req.user.role !== 'admin') {
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

  const { data, error } = await supabase
    .from('tutorial')
    .insert({
      ...parsed.data,
      created_by_member_id: req.user.sub,
      approval_status: 'PENDING',
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

  const { data, error } = await supabase
    .from('tutorial')
    .update({ ...parsed.data, approval_status: 'PENDING' })
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
