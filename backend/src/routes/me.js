import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import {
  getJoined,
  addEducation,
  deleteEducation,
  addOngoingResearch,
  deleteOngoingResearch,
} from '../db/queries.js';

export const meRouter = Router();
meRouter.use(requireAuth);

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

const UpdateProfileSchema = z.object({
  first_name:   z.string().min(1, 'First name is required').max(100).optional(),
  second_name:  z.string().min(1, 'Second name is required').max(100).optional(),
  country:      z.string().max(100).optional().nullable(),
  linkedin_url: z.string().url('Invalid LinkedIn URL').or(z.literal('')).optional().nullable(),
  image_url:    z.string().url('Invalid Image URL').or(z.literal('')).optional().nullable(),
  bio:          z.string().optional().nullable(),
  occupation:   z.string().max(150).optional().nullable(),
  workplace:    z.string().max(150).optional().nullable(),
});

const EducationSchema = z.object({
  degree: z.string().min(1).max(150),
});

const OngoingResearchSchema = z.object({
  title: z.string().min(1).max(255),
});

const ChangePasswordSchema = z.object({
  new_password: z.string().min(6).max(100),
});

// ─── GET /me ─────────────────────────────────────────────────────────────────

meRouter.get('/', async (req, res) => {
  // Primary fetch using member ID from JWT sub
  const { data, error } = await supabase
    .from('member')
    .select(`
      *,
      admin ( member_id ),
      researcher ( *, educational_background(*), ongoing_research(*) ),
      research_assistant ( * )
    `)
    .eq('id', req.user.sub)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Profile identity node not found' });

  // Resolve active specialization (ISA)
  let roleDetail = null;
  let resolvedRole = 'pending';
  
  const adminRow = getJoined(data.admin);
  const researcherRow = getJoined(data.researcher);
  const raRow = getJoined(data.research_assistant);

  if (adminRow) { 
    resolvedRole = 'admin'; 
    roleDetail = adminRow; 
  } else if (researcherRow) { 
    resolvedRole = 'researcher'; 
    roleDetail = researcherRow; 
  } else if (raRow) { 
    resolvedRole = 'research_assistant'; 
    roleDetail = raRow; 
  }

  const { admin, researcher, research_assistant, ...base } = data;

  res.json({ ...base, role: resolvedRole, role_detail: roleDetail });
});

// ─── PUT /me ──────────────────────────────────────────────────────────────────

meRouter.put('/', async (req, res) => {
  const parsed = UpdateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    const errorMessages = parsed.error.errors.map(e => e.message).join(', ');
    return res.status(400).json({ error: errorMessages });
  }

  const { first_name, second_name, country, linkedin_url, image_url, bio, occupation, workplace } = parsed.data;

  // Update base member table
  const memberUpdates = {};
  if (first_name !== undefined) memberUpdates.first_name = first_name;
  if (second_name !== undefined) memberUpdates.second_name = second_name;

  if (Object.keys(memberUpdates).length > 0) {
    const { error } = await supabase.from('member').update(memberUpdates).eq('id', req.user.sub);
    if (error) return res.status(500).json({ error: error.message });
  }

  // Update researcher-specific fields if applicable
  const role = req.user.role;
  if (role === 'researcher') {
    const researcherUpdates = {};
    if (country !== undefined) researcherUpdates.country = country;
    if (linkedin_url !== undefined) researcherUpdates.linkedin_url = linkedin_url;
    if (image_url !== undefined) researcherUpdates.image_url = image_url;
    if (bio !== undefined) researcherUpdates.bio = bio;
    if (occupation !== undefined) researcherUpdates.occupation = occupation;
    if (workplace !== undefined) researcherUpdates.workplace = workplace;

    if (Object.keys(researcherUpdates).length > 0) {
      const { error } = await supabase.from('researcher').update(researcherUpdates).eq('member_id', req.user.sub);
      if (error) return res.status(500).json({ error: error.message });
    }
  }

  res.json({ message: 'Profile node updated successfully' });
});

// ─── Education (researcher only) ──────────────────────────────────────────────

meRouter.post('/education', requireRole('researcher', 'admin'), async (req, res) => {
  const parsed = EducationSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const row = await addEducation(req.user.sub, parsed.data.degree);
  res.status(201).json(row);
});

meRouter.delete('/education/:id', requireRole('researcher', 'admin'), async (req, res) => {
  await deleteEducation(Number(req.params.id), req.user.sub);
  res.json({ message: 'Education entry removed' });
});

// ─── Ongoing Research (researcher only) ───────────────────────────────────────

meRouter.post('/ongoing-research', requireRole('researcher', 'admin'), async (req, res) => {
  const parsed = OngoingResearchSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const row = await addOngoingResearch(req.user.sub, parsed.data.title);
  res.status(201).json(row);
});

meRouter.delete('/ongoing-research/:id', requireRole('researcher', 'admin'), async (req, res) => {
  await deleteOngoingResearch(Number(req.params.id), req.user.sub);
  res.json({ message: 'Ongoing research entry removed' });
});

// ─── GET /me/my-supervisor — RA fetches full details of their supervisor ───────
meRouter.get('/my-supervisor', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  if (req.user.role !== 'research_assistant') {
    return res.status(403).json({ error: 'Only research assistants have a supervisor' });
  }

  // Get the RA's assigned_by_researcher_id
  const { data: raData, error: raError } = await supabase
    .from('research_assistant')
    .select('assigned_by_researcher_id')
    .eq('member_id', req.user.sub)
    .single();

  if (raError || !raData?.assigned_by_researcher_id) {
    return res.status(404).json({ error: 'No supervisor assigned' });
  }

  // Fetch supervisor's member details
  const { data: memberData, error: memberError } = await supabase
    .from('member')
    .select('id, first_name, second_name, contact_email')
    .eq('id', raData.assigned_by_researcher_id)
    .single();

  if (memberError || !memberData) {
    return res.status(404).json({ error: 'Supervisor not found' });
  }

  // Also fetch their researcher profile details
  const { data: resData } = await supabase
    .from('researcher')
    .select('occupation, workplace, bio, image_url')
    .eq('member_id', raData.assigned_by_researcher_id)
    .single();

  // Also fetch assigned research projects
  const { data: projects } = await supabase
    .from('research_assistant_ongoing_research')
    .select('research_id, ongoing_research ( title )')
    .eq('ra_member_id', req.user.sub);

  res.json({ 
    ...memberData, 
    ...(resData ?? {}), 
    assigned_projects: (projects ?? []).map(p => ({ id: p.research_id, title: p.ongoing_research?.title }))
  });
});

// ─── GET /me/my-assistants — Researcher fetches their assigned RAs ─────────────
meRouter.get('/my-assistants', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  if (req.user.role !== 'researcher') {
    return res.status(403).json({ error: 'Only researchers have assistants' });
  }

  const { data, error } = await supabase
    .from('research_assistant')
    .select(`
      member_id, 
      approval_status, 
      member ( id, first_name, second_name, contact_email ),
      research_assistant_ongoing_research ( research_id, ongoing_research ( title ) )
    `)
    .eq('assigned_by_researcher_id', req.user.sub);

  if (error) return res.status(500).json({ error: error.message });

  const flat = (data ?? [])
    .filter(r => r.member)
    .map(r => ({
      member_id:       r.member_id,
      approval_status: r.approval_status,
      id:              r.member.id,
      first_name:      r.member.first_name,
      second_name:     r.member.second_name,
      contact_email:   r.member.contact_email,
      assigned_projects: (r.research_assistant_ongoing_research ?? []).map(p => ({
        id: p.research_id,
        title: p.ongoing_research?.title
      }))
    }));

  res.json(flat);
});

// ─── DELETE /me/my-assistants/:raId — Researcher UNASSIGNS an RA (null supervisor) ─
meRouter.delete('/my-assistants/:raId', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  if (req.user.role !== 'researcher') {
    return res.status(403).json({ error: 'Only researchers can remove assistants' });
  }

  const raId = Number(req.params.raId);
  if (!raId) return res.status(400).json({ error: 'Invalid RA member ID' });

  // Verify this RA is actually assigned to this researcher
  const { data: verify } = await supabase
    .from('research_assistant')
    .select('member_id')
    .eq('member_id', raId)
    .eq('assigned_by_researcher_id', req.user.sub)
    .single();

  if (!verify) return res.status(404).json({ error: 'Research assistant not found under your supervision' });

  // Unassign: set assigned_by_researcher_id to null (RA keeps their role, works alone)
  const { error } = await supabase
    .from('research_assistant')
    .update({ assigned_by_researcher_id: null })
    .eq('member_id', raId);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Research assistant unassigned successfully' });
});

// ─── GET /me/available-assistants — Researcher searches all RAs (incl. unassigned) ─
meRouter.get('/available-assistants', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  if (req.user.role !== 'researcher') {
    return res.status(403).json({ error: 'Only researchers can search assistants' });
  }

  const search = (req.query.q ?? '').toLowerCase();

  const { data, error } = await supabase
    .from('research_assistant')
    .select('member_id, assigned_by_researcher_id, approval_status, member ( id, first_name, second_name, contact_email )');

  if (error) return res.status(500).json({ error: error.message });

  let flat = (data ?? [])
    .filter(r => r.member)
    .map(r => ({
      member_id:                 r.member_id,
      assigned_by_researcher_id: r.assigned_by_researcher_id,
      already_mine:              r.assigned_by_researcher_id === req.user.sub,
      approval_status:           r.approval_status,
      id:                        r.member.id,
      first_name:                r.member.first_name,
      second_name:               r.member.second_name,
      contact_email:             r.member.contact_email,
    }));

  // Filter by search query if provided
  if (search) {
    flat = flat.filter(r =>
      `${r.first_name} ${r.second_name} ${r.contact_email}`.toLowerCase().includes(search)
    );
  }

  res.json(flat);
});

// ─── POST /me/my-assistants — Researcher assigns an RA to themselves ───────────
meRouter.post('/my-assistants', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  if (req.user.role !== 'researcher') {
    return res.status(403).json({ error: 'Only researchers can assign assistants' });
  }

  const { ra_member_id, research_id } = req.body;
  if (!ra_member_id || typeof ra_member_id !== 'number') {
    return res.status(400).json({ error: 'ra_member_id must be a number' });
  }

  // Verify RA exists
  const { data: raRow } = await supabase
    .from('research_assistant')
    .select('member_id, assigned_by_researcher_id')
    .eq('member_id', ra_member_id)
    .single();

  if (!raRow) return res.status(404).json({ error: 'Research assistant not found' });
  
  // Assign/Reassign the RA to this researcher
  const { error } = await supabase
    .from('research_assistant')
    .update({ assigned_by_researcher_id: req.user.sub })
    .eq('member_id', ra_member_id);

  if (error) return res.status(500).json({ error: error.message });

  // Handle optional specific research project assignment
  if (research_id) {
    // First clear existing assignments to projects for this RA if we want only one, 
    // or just add if we support multiple. The request says "assign to research", 
    // I'll assume we replace the project assignment or add to it.
    // For simplicity, let's allow adding.
    await supabase
      .from('research_assistant_ongoing_research')
      .upsert({ ra_member_id: ra_member_id, research_id: research_id }, { onConflict: 'ra_member_id,research_id' });
  }

  res.json({ message: 'Research assistant assigned successfully' });
});

// ─── GET /me/supervisors — list approved researchers for RA to pick from ───────
// Accessible by pending_setup tokens as well as existing RAs re-assigning
meRouter.get('/supervisors', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const allowedRoles = ['research_assistant', 'pending_setup'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Only research assistants can view supervisors' });
  }

  const { data, error } = await supabase
    .from('researcher')
    .select('member_id, member ( id, first_name, second_name )')
    .eq('approval_status', 'APPROVED');

  if (error) return res.status(500).json({ error: error.message });

  // Flatten nested member data into a simple list
  const flat = (data ?? [])
    .filter(r => r.member)
    .map(r => ({
      id:          r.member.id,
      first_name:  r.member.first_name,
      second_name: r.member.second_name,
    }));

  res.json(flat);
});

// ─── PATCH /me/supervisor — UPSERT (first setup OR re-assignment) ─────────────
// Allowed for pending_setup (first time) AND research_assistant (re-assignment)

meRouter.patch('/supervisor', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  if (req.user.role !== 'research_assistant' && req.user.role !== 'pending_setup') {
    return res.status(403).json({ error: 'Only research assistants can set a supervisor' });
  }

  const { assigned_by_researcher_id } = req.body;

  if (!assigned_by_researcher_id || typeof assigned_by_researcher_id !== 'number') {
    return res.status(400).json({ error: 'assigned_by_researcher_id must be a number' });
  }

  // Verify the researcher exists
  const { data: researcher, error: researcherError } = await supabase
    .from('researcher')
    .select('member_id')
    .eq('member_id', assigned_by_researcher_id)
    .single();

  if (researcherError || !researcher) {
    return res.status(404).json({ error: 'Researcher not found' });
  }

  // UPSERT: insert row if first setup, update if already exists
  const { error } = await supabase
    .from('research_assistant')
    .upsert(
      { member_id: req.user.sub, assigned_by_researcher_id, approval_status: 'PENDING_ADMIN' },
      { onConflict: 'member_id' }
    );

  if (error) return res.status(500).json({ error: error.message });

  res.json({ message: 'Supervisor assigned successfully', assigned_by_researcher_id });
});

// ─── POST /me/change-password ───────────────────────────────────────────────

meRouter.post('/change-password', async (req, res) => {
  const parsed = ChangePasswordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const { new_password } = parsed.data;

  // req.user.sub is member.id (integer) — look up the Supabase auth UUID
  const { data: member, error: memberError } = await supabase
    .from('member')
    .select('auth_user_id')
    .eq('id', req.user.sub)
    .single();

  if (memberError || !member) return res.status(404).json({ error: 'Member not found' });

  const { error } = await supabase.auth.admin.updateUserById(member.auth_user_id, {
    password: new_password,
  });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Password updated successfully' });
});
