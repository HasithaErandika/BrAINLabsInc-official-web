import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';

export const projectsRouter = Router();
projectsRouter.use(requireAuth);

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

const ProjectSchema = z.object({
  title:       z.string().max(255).optional().nullable(),
  description: z.string().optional().nullable(),
  content:     z.string().optional().nullable(),
});

const DiagramSchema = z.object({ diagram_url: z.string().url().max(255) });

// ─── Helper: own-or-admin check ───────────────────────────────────────────────

async function ownOrFail(projId, memberId, role, res) {
  const { data: proj, error } = await supabase
    .from('project')
    .select('id, created_by_member_id, approval_status')
    .eq('id', projId)
    .single();

  if (error || !proj) {
    res.status(404).json({ error: 'Project not found' });
    return null;
  }

  // Admin always allowed
  if (role === 'admin') return proj;

  // Owner always allowed
  if (proj.created_by_member_id === memberId) return proj;

  // Researcher allowed if it's their RA's content and pending researcher review
  if (role === 'researcher' && proj.approval_status === 'PENDING_RESEARCHER') {
    const { data: ra } = await supabase
      .from('research_assistant')
      .select('assigned_by_researcher_id')
      .eq('member_id', proj.created_by_member_id)
      .single();

    if (ra && ra.assigned_by_researcher_id === memberId) {
      return proj;
    }
  }

  res.status(403).json({ error: 'Not authorised to modify this project' });
  return null;
}

// ─── GET /projects ────────────────────────────────────────────────────────────

projectsRouter.get('/', async (req, res) => {
  let query = supabase
    .from('project')
    .select('*, project_diagram(id, diagram_url)')
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

// ─── POST /projects ───────────────────────────────────────────────────────────

projectsRouter.post('/', async (req, res) => {
  const parsed = ProjectSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { title, description, content } = parsed.data;

  const { data, error } = await supabase
    .from('project')
    .insert({
      title: title || 'Untitled',
      description: description || null,
      content: content || '',
      created_by_member_id: req.user.sub,
      approval_status: 'DRAFT',
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// ─── GET /projects/:id ────────────────────────────────────────────────────────

projectsRouter.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('project')
    .select('*, project_diagram(id, diagram_url)')
    .eq('id', req.params.id)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Project not found' });
  if (req.user.role !== 'admin' && data.created_by_member_id !== req.user.sub) {
    return res.status(403).json({ error: 'Not authorised' });
  }
  res.json(data);
});

// ─── PUT /projects/:id ────────────────────────────────────────────────────────

projectsRouter.put('/:id', async (req, res) => {
  const proj = await ownOrFail(req.params.id, req.user.sub, req.user.role, res);
  if (!proj) return;

  const parsed = ProjectSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  // Admin and Researchers reviewing don't reset to DRAFT
  const updatePayload = { ...parsed.data };
  if (req.user.role !== 'admin') {
    // If it's a researcher editing something NOT pending their review, reset it
    const isReviewing = req.user.role === 'researcher' && proj.approval_status === 'PENDING_RESEARCHER';
    if (!isReviewing) {
      updatePayload.approval_status = 'DRAFT';
    }
  }

  const { data, error } = await supabase
    .from('project')
    .update(updatePayload)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ─── DELETE /projects/:id ─────────────────────────────────────────────────────

projectsRouter.delete('/:id', async (req, res) => {
  const proj = await ownOrFail(req.params.id, req.user.sub, req.user.role, res);
  if (!proj) return;

  // Restriction: Only DRAFT content can be deleted by authors.
  if (req.user.role !== 'admin' && proj.approval_status !== 'DRAFT') {
    return res.status(403).json({ error: `Cannot delete content in ${proj.approval_status} state` });
  }

  const { error } = await supabase.from('project').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Project deleted' });
});

// ─── POST /projects/:id/diagrams ──────────────────────────────────────────────

projectsRouter.post('/:id/diagrams', async (req, res) => {
  const proj = await ownOrFail(req.params.id, req.user.sub, req.user.role, res);
  if (!proj) return;

  const parsed = DiagramSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { data, error } = await supabase
    .from('project_diagram')
    .insert({ project_id: Number(req.params.id), diagram_url: parsed.data.diagram_url })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// ─── DELETE /projects/:id/diagrams/:diagId ────────────────────────────────────

projectsRouter.delete('/:id/diagrams/:diagId', async (req, res) => {
  const proj = await ownOrFail(req.params.id, req.user.sub, req.user.role, res);
  if (!proj) return;

  const { error } = await supabase
    .from('project_diagram')
    .delete()
    .eq('id', req.params.diagId)
    .eq('project_id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Diagram removed' });
});
