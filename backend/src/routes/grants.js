import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';

export const grantsRouter = Router();
// Grants are researcher-only (admin can also view/manage)
grantsRouter.use(requireAuth, requireRole('researcher', 'admin'));

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

const GrantSchema = z.object({
  title:       z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  passed_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  expire_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
});

const DocumentSchema = z.object({
  doc_url:   z.string().url().max(255),
  doc_label: z.string().max(150).optional().nullable(),
});

// ─── Helper: own-or-admin check ───────────────────────────────────────────────

async function ownOrFail(grantId, memberId, role, res) {
  const { data, error } = await supabase
    .from('grant_info')
    .select('id, created_by_researcher')
    .eq('id', grantId)
    .single();
  if (error || !data) { res.status(404).json({ error: 'Grant not found' }); return null; }
  if (role !== 'admin' && data.created_by_researcher !== memberId) {
    res.status(403).json({ error: 'Not authorised to modify this grant' }); return null;
  }
  return data;
}

// ─── GET /grants ──────────────────────────────────────────────────────────────

grantsRouter.get('/', async (req, res) => {
  let query = supabase
    .from('grant_info')
    .select('*, grant_document(id, doc_url, doc_label)')
    .order('created_at', { ascending: false });

  if (req.user.role !== 'admin') {
    query = query.eq('created_by_researcher', req.user.sub);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
});

// ─── POST /grants ─────────────────────────────────────────────────────────────

grantsRouter.post('/', async (req, res) => {
  if (req.user.role === 'admin') {
    return res.status(403).json({ error: 'Only researchers can create grants' });
  }

  const parsed = GrantSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { data, error } = await supabase
    .from('grant_info')
    .insert({
      ...parsed.data,
      created_by_researcher: req.user.sub,
      approval_status: 'DRAFT',
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// ─── GET /grants/:id ──────────────────────────────────────────────────────────

grantsRouter.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('grant_info')
    .select('*, grant_document(id, doc_url, doc_label)')
    .eq('id', req.params.id)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Grant not found' });
  if (req.user.role !== 'admin' && data.created_by_researcher !== req.user.sub) {
    return res.status(403).json({ error: 'Not authorised' });
  }
  res.json(data);
});

// ─── PUT /grants/:id ──────────────────────────────────────────────────────────

grantsRouter.put('/:id', async (req, res) => {
  const grant = await ownOrFail(req.params.id, req.user.sub, req.user.role, res);
  if (!grant) return;

  const parsed = GrantSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { data, error } = await supabase
    .from('grant_info')
    .update({ ...parsed.data, approval_status: 'DRAFT' })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ─── DELETE /grants/:id ───────────────────────────────────────────────────────

grantsRouter.delete('/:id', async (req, res) => {
  const grant = await ownOrFail(req.params.id, req.user.sub, req.user.role, res);
  if (!grant) return;

  const { error } = await supabase.from('grant_info').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Grant deleted' });
});

// ─── POST /grants/:id/documents ───────────────────────────────────────────────

grantsRouter.post('/:id/documents', async (req, res) => {
  const grant = await ownOrFail(req.params.id, req.user.sub, req.user.role, res);
  if (!grant) return;

  const parsed = DocumentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { data, error } = await supabase
    .from('grant_document')
    .insert({ grant_id: Number(req.params.id), ...parsed.data })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// ─── DELETE /grants/:id/documents/:docId ─────────────────────────────────────

grantsRouter.delete('/:id/documents/:docId', async (req, res) => {
  const grant = await ownOrFail(req.params.id, req.user.sub, req.user.role, res);
  if (!grant) return;

  const { error } = await supabase
    .from('grant_document')
    .delete()
    .eq('id', req.params.docId)
    .eq('grant_id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Document removed' });
});
