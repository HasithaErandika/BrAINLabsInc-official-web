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
  first_name:   z.string().min(1).max(100).optional(),
  second_name:  z.string().min(1).max(100).optional(),
  country:      z.string().max(100).optional().nullable(),
  linkedin_url: z.string().url().max(255).optional().nullable(),
  image_url:    z.string().url().max(255).optional().nullable(),
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
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

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

// ─── PATCH /me/supervisor (research_assistant only) ───────────────────────────

meRouter.patch('/supervisor', requireRole('research_assistant'), async (req, res) => {
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

  const { error } = await supabase
    .from('research_assistant')
    .update({ assigned_by_researcher_id })
    .eq('member_id', req.user.sub);

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
