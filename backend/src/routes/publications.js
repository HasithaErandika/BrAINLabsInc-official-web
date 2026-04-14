import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';

export const publicationsRouter = Router();
publicationsRouter.use(requireAuth);

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

const PublicationSchema = z.object({
  title:            z.string().min(1).max(255),
  authors:          z.string().max(500).optional().nullable(),
  publication_year: z.number().int().min(1900).max(2100).optional().nullable(),
});

const ConferencePaperSchema = z.object({
  paper_id:    z.string().min(1).max(100),
  link:        z.string().url().max(255).optional().nullable(),
  description: z.string().optional().nullable(),
});

const BookSchema = z.object({
  isbn:        z.string().min(1).max(50),
  link:        z.string().url().max(255).optional().nullable(),
  description: z.string().optional().nullable(),
});

const JournalSchema = z.object({
  issn:        z.string().min(1).max(50),
  link:        z.string().url().max(255).optional().nullable(),
  description: z.string().optional().nullable(),
});

const ArticleSchema = z.object({
  doi:         z.string().min(1).max(100),
  link:        z.string().url().max(255).optional().nullable(),
  description: z.string().optional().nullable(),
});

// ─── Subtype table map ────────────────────────────────────────────────────────

const SUBTYPE_MAP = {
  'conference-paper': { table: 'conference_paper', schema: ConferencePaperSchema },
  'book':             { table: 'book',             schema: BookSchema },
  'journal':          { table: 'journal',          schema: JournalSchema },
  'article':          { table: 'article',          schema: ArticleSchema },
};

// ─── Helper: own-or-admin check ───────────────────────────────────────────────

async function ownOrFail(pubId, memberId, role, res) {
  const { data, error } = await supabase
    .from('publication')
    .select('id, created_by_member_id')
    .eq('id', pubId)
    .single();
  if (error || !data) { res.status(404).json({ error: 'Publication not found' }); return null; }
  if (role !== 'admin' && data.created_by_member_id !== memberId) {
    res.status(403).json({ error: 'Not authorised to modify this publication' }); return null;
  }
  return data;
}

// ─── GET /publications ────────────────────────────────────────────────────────

publicationsRouter.get('/', async (req, res) => {
  let query = supabase
    .from('publication')
    .select(`
      *,
      conference_paper ( paper_id, link, description ),
      book ( isbn, link, description ),
      journal ( issn, link, description ),
      article ( doi, link, description )
    `)
    .order('created_at', { ascending: false });

  if (req.user.role !== 'admin') {
    query = query.eq('created_by_member_id', req.user.sub);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
});

// ─── POST /publications ───────────────────────────────────────────────────────

publicationsRouter.post('/', async (req, res) => {
  const parsed = PublicationSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { data, error } = await supabase
    .from('publication')
    .insert({
      ...parsed.data,
      created_by_member_id: req.user.sub,
      approval_status: 'DRAFT',
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// ─── GET /publications/:id ────────────────────────────────────────────────────

publicationsRouter.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('publication')
    .select(`
      *,
      conference_paper ( paper_id, link, description ),
      book ( isbn, link, description ),
      journal ( issn, link, description ),
      article ( doi, link, description )
    `)
    .eq('id', req.params.id)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Publication not found' });
  if (req.user.role !== 'admin' && data.created_by_member_id !== req.user.sub) {
    return res.status(403).json({ error: 'Not authorised' });
  }
  res.json(data);
});

// ─── PUT /publications/:id ────────────────────────────────────────────────────

publicationsRouter.put('/:id', async (req, res) => {
  const pub = await ownOrFail(req.params.id, req.user.sub, req.user.role, res);
  if (!pub) return;

  const parsed = PublicationSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { data, error } = await supabase
    .from('publication')
    .update({ ...parsed.data, approval_status: 'DRAFT' })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ─── DELETE /publications/:id ─────────────────────────────────────────────────

publicationsRouter.delete('/:id', async (req, res) => {
  const pub = await ownOrFail(req.params.id, req.user.sub, req.user.role, res);
  if (!pub) return;

  const { error } = await supabase.from('publication').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Publication deleted' });
});

// ─── POST /publications/:id/:subtype ─────────────────────────────────────────
// Links an ISA subtype: conference-paper | book | journal | article

publicationsRouter.post('/:id/:subtype', async (req, res) => {
  const { subtype } = req.params;
  const subtypeConfig = SUBTYPE_MAP[subtype];

  if (!subtypeConfig) {
    return res.status(400).json({
      error: `Invalid subtype. Must be one of: ${Object.keys(SUBTYPE_MAP).join(', ')}`,
    });
  }

  const pub = await ownOrFail(req.params.id, req.user.sub, req.user.role, res);
  if (!pub) return;

  const parsed = subtypeConfig.schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  // Upsert to handle re-linking after edit
  const { data, error } = await supabase
    .from(subtypeConfig.table)
    .upsert(
      { publication_id: Number(req.params.id), ...parsed.data },
      { onConflict: 'publication_id' }
    )
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Unique identifier already exists (duplicate ISBN/ISSN/DOI/paper_id)' });
    }
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json(data);
});
