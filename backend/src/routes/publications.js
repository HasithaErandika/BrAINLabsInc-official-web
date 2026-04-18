import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';

export const publicationsRouter = Router();
publicationsRouter.use(requireAuth);

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

const PublicationSchema = z.object({
  title:            z.string().max(255).optional().nullable(),
  authors:          z.string().max(500).optional().nullable(),
  publication_year: z.number().int().min(1900).max(2100).optional().nullable(),
});

const ConferencePaperSchema = z.object({
  paper_id:    z.string().max(100).optional().nullable(),
  link:        z.string().max(255).optional().nullable(),
  description: z.string().optional().nullable(),
});

const BookSchema = z.object({
  isbn:        z.string().max(50).optional().nullable(),
  link:        z.string().max(255).optional().nullable(),
  description: z.string().optional().nullable(),
});

const JournalSchema = z.object({
  issn:        z.string().max(50).optional().nullable(),
  link:        z.string().max(255).optional().nullable(),
  description: z.string().optional().nullable(),
});

const ArticleSchema = z.object({
  doi:         z.string().max(100).optional().nullable(),
  link:        z.string().max(255).optional().nullable(),
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
  const { data: pub, error } = await supabase
    .from('publication')
    .select('id, created_by_member_id, approval_status')
    .eq('id', pubId)
    .single();

  if (error || !pub) {
    res.status(404).json({ error: 'Publication not found' });
    return null;
  }

  // Admin always allowed
  if (role === 'admin') return pub;

  // Owner always allowed
  if (pub.created_by_member_id === memberId) return pub;

  // Researcher allowed if it's their RA's content and pending researcher review
  if (role === 'researcher' && pub.approval_status === 'PENDING_RESEARCHER') {
    const { data: ra } = await supabase
      .from('research_assistant')
      .select('assigned_by_researcher_id')
      .eq('member_id', pub.created_by_member_id)
      .single();

    if (ra && ra.assigned_by_researcher_id === memberId) {
      return pub;
    }
  }

  res.status(403).json({ error: 'Not authorised to modify this publication' });
  return null;
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

// ─── POST /publications ───────────────────────────────────────────────────────

publicationsRouter.post('/', async (req, res) => {
  const parsed = PublicationSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { title, authors, publication_year } = parsed.data;

  const { data, error } = await supabase
    .from('publication')
    .insert({
      title: title || 'Untitled',
      authors: authors || '',
      publication_year: publication_year || null,
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

  // Admin and Researchers reviewing don't reset to DRAFT
  const updatePayload = { ...parsed.data };
  if (req.user.role !== 'admin') {
    // If it's a researcher editing something NOT pending their review, reset it
    const isReviewing = req.user.role === 'researcher' && pub.approval_status === 'PENDING_RESEARCHER';
    if (!isReviewing) {
      updatePayload.approval_status = 'DRAFT';
    }
  }

  const { data, error } = await supabase
    .from('publication')
    .update(updatePayload)
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

  // Restriction: Only DRAFT content can be deleted by authors.
  if (req.user.role !== 'admin' && pub.approval_status !== 'DRAFT') {
    return res.status(403).json({ error: `Cannot delete content in ${pub.approval_status} state` });
  }

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
