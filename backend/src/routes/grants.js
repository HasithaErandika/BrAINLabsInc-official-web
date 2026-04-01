import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';

export const grantsRouter = Router();
// Grants are researcher-only (admin can also manage)
grantsRouter.use(requireAuth, requireRole('researcher', 'admin'));

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

const GrantSchema = z.object({
  title:       z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  legal_docs:  z.string().max(255).optional().nullable(),
  passed_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  expire_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
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
  const query = supabase
    .from('grant_info')
    .select('*')
    .order('created_at', { ascending: false });

  if (req.user.role !== 'admin') {
    query.eq('created_by_researcher', req.user.sub);
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
      approval_status: 'PENDING',
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
    .select('*')
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
    .update({ ...parsed.data, approval_status: 'PENDING' })
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
