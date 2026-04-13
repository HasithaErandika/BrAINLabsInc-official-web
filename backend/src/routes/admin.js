import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { getJoined, approveContent, rejectContent, getAllPendingContent } from '../db/queries.js';

const ResignSchema = z.object({
  resign_date:          z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  working_period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
});

export const adminRouter = Router();
adminRouter.use(requireAuth, requireRole('admin'));

// ─── GET /admin/members ───────────────────────────────────────────────────────

adminRouter.get('/members', async (_req, res) => {
  const { data, error } = await supabase
    .from('member')
    .select(`
      id, first_name, second_name, contact_email, slug, created_at,
      admin ( member_id ),
      researcher ( member_id, approval_status, occupation, workplace, country ),
      research_assistant ( member_id, approval_status, assigned_by_researcher_id )
    `)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  // Flatten role info with robust join check
  const members = (data ?? []).map(m => {
    let role = 'pending';
    let approval_status = null;
    
    const adminRow = getJoined(m.admin);
    const researcherRow = getJoined(m.researcher);
    const raRow = getJoined(m.research_assistant);

    if (adminRow) {
      role = 'admin';
    } else if (researcherRow) {
      role = 'researcher';
      approval_status = researcherRow.approval_status;
    } else if (raRow) {
      role = 'research_assistant';
      approval_status = raRow.approval_status;
    }
    
    const { admin, researcher, research_assistant, ...base } = m;
    return { ...base, role, approval_status };
  });

  res.json(members);
});

// ─── GET /admin/members/:id ───────────────────────────────────────────────────

adminRouter.get('/members/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('member')
    .select(`
      id, first_name, second_name, contact_email, slug, created_at,
      admin ( member_id ),
      researcher ( *, educational_background(*), ongoing_research(*) ),
      research_assistant ( * )
    `)
    .eq('id', req.params.id)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Member not found' });

  let role = 'pending';
  let roleDetail = null;

  const adminRow = getJoined(data.admin);
  const researcherRow = getJoined(data.researcher);
  const raRow = getJoined(data.research_assistant);

  if (adminRow) { role = 'admin'; roleDetail = adminRow; }
  else if (researcherRow) { role = 'researcher'; roleDetail = researcherRow; }
  else if (raRow) { role = 'research_assistant'; roleDetail = raRow; }

  const { admin, researcher, research_assistant, ...base } = data;
  res.json({ ...base, role, role_detail: roleDetail });
});

// ─── PATCH /admin/members/:id/approve ────────────────────────────────────────

adminRouter.patch('/members/:id/approve', async (req, res) => {
  const memberId = Number(req.params.id);
  const adminMemberId = req.user.sub;

  // Try researcher first, then RA
  const { data: r } = await supabase
    .from('researcher')
    .update({ approval_status: 'APPROVED', approved_by_admin_id: adminMemberId })
    .eq('member_id', memberId)
    .select()
    .single();

  if (r) return res.json({ message: 'Researcher approved', data: r });

  const { data: ra, error } = await supabase
    .from('research_assistant')
    .update({ approval_status: 'APPROVED', approved_by_admin_id: adminMemberId })
    .eq('member_id', memberId)
    .select()
    .single();

  if (error || !ra) return res.status(404).json({ error: 'Member not found or not a researcher/RA' });
  res.json({ message: 'Research Assistant approved', data: ra });
});

// ─── PATCH /admin/members/:id/reject ─────────────────────────────────────────

adminRouter.patch('/members/:id/reject', async (req, res) => {
  const memberId = Number(req.params.id);
  const adminMemberId = req.user.sub;

  const { data: r } = await supabase
    .from('researcher')
    .update({ approval_status: 'REJECTED', approved_by_admin_id: adminMemberId })
    .eq('member_id', memberId)
    .select()
    .single();

  if (r) return res.json({ message: 'Researcher rejected', data: r });

  const { data: ra, error } = await supabase
    .from('research_assistant')
    .update({ approval_status: 'REJECTED', approved_by_admin_id: adminMemberId })
    .eq('member_id', memberId)
    .select()
    .single();

  if (error || !ra) return res.status(404).json({ error: 'Member not found or not a researcher/RA' });
  res.json({ message: 'Research Assistant rejected', data: ra });
});

// ─── POST /admin/members/:id/resign ──────────────────────────────────────────

adminRouter.post('/members/:id/resign', async (req, res) => {
  const memberId = Number(req.params.id);
  const adminMemberId = req.user.sub;

  const parsed = ResignSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { resign_date, working_period_start } = parsed.data;

  // Determine former role
  const { data: researcher } = await supabase.from('researcher').select('member_id').eq('member_id', memberId).single();
  const { data: ra } = await supabase.from('research_assistant').select('member_id').eq('member_id', memberId).single();

  if (!researcher && !ra) return res.status(404).json({ error: 'Member is not a researcher or research assistant' });

  const former_role = researcher ? 'RESEARCHER' : 'RESEARCH_ASSISTANT';

  // Create former_member record
  const { error: fmError } = await supabase.from('former_member').insert({
    member_id: memberId,
    former_role,
    resign_date,
    resignation_approved_by: adminMemberId,
    working_period_start,
    working_period_end: resign_date,
  });

  if (fmError) return res.status(500).json({ error: fmError.message });

  // Delete role-specific row (member row is preserved for blog FK)
  const roleTable = researcher ? 'researcher' : 'research_assistant';
  await supabase.from(roleTable).delete().eq('member_id', memberId);

  res.json({ message: `Member archived as former ${former_role.toLowerCase()}` });
});

// ─── GET /admin/content/pending ───────────────────────────────────────────────

adminRouter.get('/content/pending', async (_req, res) => {
  const results = await getAllPendingContent();
  res.json(results);
});

// ─── PATCH /admin/content/:table/:id/approve ──────────────────────────────────

adminRouter.patch('/content/:table/:id/approve', async (req, res) => {
  const data = await approveContent(req.params.table, Number(req.params.id), req.user.sub);
  res.json({ message: 'Content approved', data });
});

// ─── PATCH /admin/content/:table/:id/reject ───────────────────────────────────

adminRouter.patch('/content/:table/:id/reject', async (req, res) => {
  const data = await rejectContent(req.params.table, Number(req.params.id), req.user.sub);
  res.json({ message: 'Content rejected', data });
});
