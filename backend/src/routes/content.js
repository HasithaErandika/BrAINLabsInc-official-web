/**
 * content.js — Content workflow routes
 *
 * Approval flow:
 *   Research Assistant  →  DRAFT → submit → PENDING_RESEARCHER
 *   Researcher reviews  →  PENDING_RESEARCHER → review → PENDING_ADMIN | REJECTED
 *   Admin approves      →  PENDING_ADMIN → approve → APPROVED | REJECTED
 *
 *   Researcher creates directly:
 *   Researcher  →  DRAFT → submit → PENDING_ADMIN (skip PENDING_RESEARCHER)
 *
 * Routes mounted at /content:
 *   PATCH /content/:table/:id/submit          — submit for review
 *   PATCH /content/:table/:id/review          — researcher review (forward/reject)
 *   GET   /content/researcher/reviews         — pending items for researcher to review
 */

import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';

export const contentRouter = Router();
contentRouter.use(requireAuth);

// ─── Config ───────────────────────────────────────────────────────────────────

// Tables that support the RA → Researcher → Admin path (have reviewed_by_researcher_id)
const REVIEWABLE_TABLES = ['blog', 'tutorial', 'project', 'publication'];
// Tables only researchers can create → skip PENDING_RESEARCHER
const RESEARCHER_ONLY_TABLES = ['event', 'grant_info'];
// All submittable tables
const SUBMITTABLE_TABLES = [...REVIEWABLE_TABLES, ...RESEARCHER_ONLY_TABLES];

// Map table → creator column
const CREATOR_COL = {
  blog:        'created_by_member_id',
  tutorial:    'created_by_member_id',
  project:     'created_by_member_id',
  publication: 'created_by_member_id',
  event:       'created_by_researcher',
  grant_info:  'created_by_researcher',
};

// ─── GET /content/researcher/reviews ─────────────────────────────────────────
// Items in PENDING_RESEARCHER state — for the researcher's review queue

contentRouter.get('/researcher/reviews', requireRole('researcher', 'admin'), async (req, res) => {
  const results = {};

  await Promise.all(
    REVIEWABLE_TABLES.map(async (table) => {
      const { data } = await supabase
        .from(table)
        .select('*')
        .eq('approval_status', 'PENDING_RESEARCHER')
        .order('created_at', { ascending: false });
      results[table] = data ?? [];
    })
  );

  res.json(results);
});

// ─── PATCH /content/:table/:id/submit ────────────────────────────────────────
// Move content from DRAFT to PENDING_RESEARCHER (RA) or PENDING_ADMIN (researcher)

const ReviewStatusSchema = z.object({
  status: z.enum(['PENDING_ADMIN', 'REJECTED']),
});

contentRouter.patch('/:table/:id/submit', async (req, res) => {
  const { table, id } = req.params;
  const { role, sub: memberId } = req.user;

  if (!SUBMITTABLE_TABLES.includes(table)) {
    return res.status(400).json({ error: `Invalid content table: ${table}` });
  }

  // Determine target status
  const isResearcherOnly = RESEARCHER_ONLY_TABLES.includes(table);
  let newStatus;
  if (role === 'research_assistant' && !isResearcherOnly) {
    newStatus = 'PENDING_RESEARCHER';
  } else if (role === 'researcher' || role === 'admin') {
    newStatus = 'PENDING_ADMIN';
  } else {
    return res.status(403).json({ error: 'Research assistants cannot submit events or grants' });
  }

  // Verify ownership and current DRAFT status
  const creatorCol = CREATOR_COL[table];
  const { data: existing } = await supabase
    .from(table)
    .select(`id, ${creatorCol}, approval_status`)
    .eq('id', id)
    .single();

  if (!existing) return res.status(404).json({ error: 'Content not found' });
  if (role !== 'admin' && existing[creatorCol] !== memberId) {
    return res.status(403).json({ error: 'You do not own this content' });
  }
  if (existing.approval_status !== 'DRAFT') {
    return res.status(409).json({ error: `Can only submit DRAFT content (current: ${existing.approval_status})` });
  }

  const { data, error } = await supabase
    .from(table)
    .update({ approval_status: newStatus })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: `Submitted: ${newStatus}`, data });
});

// ─── PATCH /content/:table/:id/review ────────────────────────────────────────
// Researcher forwards to PENDING_ADMIN or rejects PENDING_RESEARCHER content

contentRouter.patch('/:table/:id/review', requireRole('researcher', 'admin'), async (req, res) => {
  const { table, id } = req.params;
  const { sub: memberId, role } = req.user;

  if (!REVIEWABLE_TABLES.includes(table)) {
    return res.status(400).json({ error: `Table '${table}' does not support researcher review` });
  }

  const parsed = ReviewStatusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  // Verify content is in PENDING_RESEARCHER
  const { data: existing } = await supabase
    .from(table)
    .select('id, approval_status')
    .eq('id', id)
    .eq('approval_status', 'PENDING_RESEARCHER')
    .single();

  if (!existing) {
    return res.status(404).json({ error: 'Content not found or not pending researcher review' });
  }

  const updatePayload = {
    approval_status: parsed.data.status,
    reviewed_by_researcher_id: memberId,
  };

  const { data, error } = await supabase
    .from(table)
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: `Review complete: ${parsed.data.status}`, data });
});
