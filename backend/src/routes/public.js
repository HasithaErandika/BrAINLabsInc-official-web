import { Router } from 'express';
import { supabase } from '../config/supabase.js';

export const publicRouter = Router();

// ─── GET /public/researchers ───────────────────────────────────────────────────

publicRouter.get('/researchers', async (_req, res) => {
  const { data, error } = await supabase
    .from('researcher')
    .select(`
      member_id, country, image_url, bio, occupation, workplace,
      member ( id, first_name, second_name, slug, contact_email )
    `)
    .eq('approval_status', 'APPROVED');

  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
});

// ─── GET /public/researchers/:slug ────────────────────────────────────────────

publicRouter.get('/researchers/:slug', async (req, res) => {
  const { data: memberData, error: memberError } = await supabase
    .from('member')
    .select('id')
    .eq('slug', req.params.slug)
    .single();

  if (memberError || !memberData) return res.status(404).json({ error: 'Researcher not found' });

  const { data, error } = await supabase
    .from('researcher')
    .select(`
      *,
      member ( id, first_name, second_name, slug, contact_email, created_at ),
      educational_background ( id, degree ),
      ongoing_research ( id, title )
    `)
    .eq('member_id', memberData.id)
    .eq('approval_status', 'APPROVED')
    .single();

  if (error || !data) return res.status(404).json({ error: 'Researcher not found or not approved' });
  res.json(data);
});

// ─── GET /public/blogs ────────────────────────────────────────────────────────

publicRouter.get('/blogs/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('blog')
    .select(`
      id, title, content, description, created_at, updated_at,
      member:created_by_member_id ( id, first_name, second_name, slug ),
      former_member:created_by_former_member_id ( member_id, former_role ),
      blog_keyword ( id, keyword ),
      blog_image ( id, image_url )
    `)
    .eq('id', req.params.id)
    .eq('approval_status', 'APPROVED')
    .single();

  if (error || !data) return res.status(404).json({ error: 'Blog not found' });
  res.json(data);
});

publicRouter.get('/blogs', async (_req, res) => {
  const { data, error } = await supabase
    .from('blog')
    .select(`
      id, title, description, created_at, updated_at,
      member:created_by_member_id ( id, first_name, second_name, slug ),
      former_member:created_by_former_member_id ( member_id, former_role ),
      blog_keyword ( keyword ),
      blog_image ( image_url )
    `)
    .eq('approval_status', 'APPROVED')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
});

// ─── GET /public/tutorials ────────────────────────────────────────────────────

publicRouter.get('/tutorials/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('tutorial')
    .select(`
      id, content, description, created_at, updated_at,
      member:created_by_member_id ( id, first_name, second_name, slug ),
      tutorial_image ( id, image_url )
    `)
    .eq('id', req.params.id)
    .eq('approval_status', 'APPROVED')
    .single();

  if (error || !data) return res.status(404).json({ error: 'Tutorial not found' });
  res.json(data);
});

publicRouter.get('/tutorials', async (_req, res) => {
  const { data, error } = await supabase
    .from('tutorial')
    .select(`
      id, title, description, created_at, updated_at,
      member:created_by_member_id ( id, first_name, second_name, slug ),
      tutorial_image ( image_url )
    `)
    .eq('approval_status', 'APPROVED')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
});

// ─── GET /public/projects ─────────────────────────────────────────────────────

publicRouter.get('/projects/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('project')
    .select(`
      id, title, description, created_at, updated_at,
      member:created_by_member_id ( id, first_name, second_name, slug ),
      project_diagram ( id, diagram_url )
    `)
    .eq('id', req.params.id)
    .eq('approval_status', 'APPROVED')
    .single();

  if (error || !data) return res.status(404).json({ error: 'Project not found' });
  res.json(data);
});

publicRouter.get('/projects', async (_req, res) => {
  const { data, error } = await supabase
    .from('project')
    .select(`
      id, title, description, created_at, updated_at,
      member:created_by_member_id ( id, first_name, second_name, slug ),
      project_diagram ( diagram_url )
    `)
    .eq('approval_status', 'APPROVED')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
});

// ─── GET /public/events ───────────────────────────────────────────────────────

publicRouter.get('/events/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('event')
    .select(`
      id, title, description, event_datetime, premises, host, created_at,
      researcher:created_by_researcher ( member_id, member ( first_name, second_name, slug ) ),
      event_image ( id, image_url )
    `)
    .eq('id', req.params.id)
    .eq('approval_status', 'APPROVED')
    .single();

  if (error || !data) return res.status(404).json({ error: 'Event not found' });
  res.json(data);
});

publicRouter.get('/events', async (_req, res) => {
  const { data, error } = await supabase
    .from('event')
    .select(`
      id, title, description, event_datetime, premises, host, created_at,
      researcher:created_by_researcher ( member_id, member ( first_name, second_name, slug ) ),
      event_image ( image_url )
    `)
    .eq('approval_status', 'APPROVED')
    .order('event_datetime', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
});

// ─── GET /public/publications ─────────────────────────────────────────────────

publicRouter.get('/publications/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('publication')
    .select(`
      id, title, created_at,
      member:created_by_member_id ( id, first_name, second_name, slug ),
      conference_paper ( paper_id, link, description ),
      book ( isbn, link, description ),
      journal ( issn, link, description ),
      article ( doi, link, description )
    `)
    .eq('id', req.params.id)
    .eq('approval_status', 'APPROVED')
    .single();

  if (error || !data) return res.status(404).json({ error: 'Publication not found' });
  res.json(data);
});

publicRouter.get('/publications', async (_req, res) => {
  const { data, error } = await supabase
    .from('publication')
    .select(`
      id, title, created_at,
      member:created_by_member_id ( id, first_name, second_name, slug ),
      conference_paper ( paper_id, link, description ),
      book ( isbn, link, description ),
      journal ( issn, link, description ),
      article ( doi, link, description )
    `)
    .eq('approval_status', 'APPROVED')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
});

// ─── GET /public/grants ───────────────────────────────────────────────────────

publicRouter.get('/grants', async (_req, res) => {
  const { data, error } = await supabase
    .from('grant_info')
    .select(`
      id, title, description, passed_date, expire_date,
      member:created_by_researcher ( id, first_name, second_name, slug ),
      grant_document ( id, doc_url, doc_label )
    `)
    .eq('approval_status', 'APPROVED')
    .order('passed_date', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
});

// ─── GET /public/stats ────────────────────────────────────────────────────────

publicRouter.get('/stats', async (_req, res) => {
  // Execute three count queries simultaneously
  const [researchers, projects, publications] = await Promise.all([
    supabase.from('researcher').select('*', { count: 'exact', head: true }).eq('approval_status', 'APPROVED'),
    supabase.from('project').select('*', { count: 'exact', head: true }).eq('approval_status', 'APPROVED'),
    supabase.from('publication').select('*', { count: 'exact', head: true }).eq('approval_status', 'APPROVED'),
  ]);

  res.json({
    researchers: researchers.count ?? 0,
    projects: projects.count ?? 0,
    publications: publications.count ?? 0,
  });
});

