import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';

export const projectsRouter = Router();
projectsRouter.use(requireAuth);

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

const ProjectSchema = z.object({
  title:       z.string().min(1).max(255),
  description: z.string().optional().nullable(),
});

const DiagramSchema = z.object({ diagram_url: z.string().url().max(255) });

// ─── Helper: own-or-admin check ───────────────────────────────────────────────

async function ownOrFail(projId, memberId, role, res) {
  const { data, error } = await supabase
    .from('project')
    .select('id, created_by_member_id')
    .eq('id', projId)
    .single();
  if (error || !data) { res.status(404).json({ error: 'Project not found' }); return null; }
  if (role !== 'admin' && data.created_by_member_id !== memberId) {
    res.status(403).json({ error: 'Not authorised to modify this project' }); return null;
  }
  return data;
}

// ─── GET /projects ────────────────────────────────────────────────────────────

projectsRouter.get('/', async (req, res) => {
  let query = supabase
    .from('project')
    .select('*, project_diagram(diagram_url)')
    .order('created_at', { ascending: false });

  if (req.user.role !== 'admin') {
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

  const { data, error } = await supabase
    .from('project')
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

  const { data, error } = await supabase
    .from('project')
    .update({ ...parsed.data, approval_status: 'PENDING' })
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
