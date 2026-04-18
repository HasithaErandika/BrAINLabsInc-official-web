import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';

export const eventsRouter = Router();
// Events are researcher-only (admin can also view/manage)
eventsRouter.use(requireAuth, requireRole('researcher', 'admin'));

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

const EventSchema = z.object({
  title:          z.string().max(255).optional().nullable(),
  description:    z.string().optional().nullable(),
  event_datetime: z.string().optional().nullable(),
  event_type:     z.string().max(100).optional().nullable(),
  premises:       z.string().max(255).optional().nullable(),
  host:           z.string().max(150).optional().nullable(),
});

const ImageSchema = z.object({ image_url: z.string().url().max(255) });

// ─── Helper: own-or-admin check ───────────────────────────────────────────────

async function ownOrFail(eventId, memberId, role, res) {
  const { data, error } = await supabase
    .from('event')
    .select('id, created_by_researcher, approval_status')
    .eq('id', eventId)
    .single();
  if (error || !data) { res.status(404).json({ error: 'Event not found' }); return null; }
  if (role !== 'admin' && data.created_by_researcher !== memberId) {
    res.status(403).json({ error: 'Not authorised to modify this event' }); return null;
  }
  return data;
}

// ─── GET /events ──────────────────────────────────────────────────────────────

eventsRouter.get('/', async (req, res) => {
  let query = supabase
    .from('event')
    .select('*, event_image(id, image_url)')
    .order('event_datetime', { ascending: true });

  // Admin only needs to see Pending and Published (Approved)
  if (req.user.role === 'admin') {
    query = query.in('approval_status', ['PENDING_ADMIN', 'APPROVED']);
  } else {
    // Others see only their own
    query = query.eq('created_by_researcher', req.user.sub);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
});

// ─── POST /events ─────────────────────────────────────────────────────────────

eventsRouter.post('/', async (req, res) => {
  // Only researchers can create events (they have a researcher row with member_id)
  if (req.user.role === 'admin') {
    return res.status(403).json({ error: 'Only researchers can create events' });
  }

  const parsed = EventSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { title, description, event_datetime, event_type, premises, host } = parsed.data;

  const { data, error } = await supabase
    .from('event')
    .insert({
      title: title || 'Untitled Event',
      description: description || null,
      event_datetime: event_datetime || new Date().toISOString(),
      event_type: event_type || null,
      premises: premises || 'TBD',
      host: host || 'BrAIN Labs',
      created_by_researcher: req.user.sub,
      approval_status: 'DRAFT',
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// ─── GET /events/:id ──────────────────────────────────────────────────────────

eventsRouter.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('event')
    .select('*, event_image(id, image_url)')
    .eq('id', req.params.id)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Event not found' });
  if (req.user.role !== 'admin' && data.created_by_researcher !== req.user.sub) {
    return res.status(403).json({ error: 'Not authorised' });
  }
  res.json(data);
});

// ─── PUT /events/:id ──────────────────────────────────────────────────────────

eventsRouter.put('/:id', async (req, res) => {
  const ev = await ownOrFail(req.params.id, req.user.sub, req.user.role, res);
  if (!ev) return;

  const parsed = EventSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  // Admin and Researchers reviewing don't reset to DRAFT
  const updatePayload = { ...parsed.data };
  if (req.user.role !== 'admin') {
    // Events are skip PENDING_RESEARCHER, so we check if it's already PENDING_ADMIN
    const isReviewing = req.user.role === 'researcher' && ev.approval_status === 'PENDING_ADMIN';
    if (!isReviewing) {
      updatePayload.approval_status = 'DRAFT';
    }
  }

  const { data, error } = await supabase
    .from('event')
    .update(updatePayload)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ─── DELETE /events/:id ───────────────────────────────────────────────────────

eventsRouter.delete('/:id', async (req, res) => {
  const ev = await ownOrFail(req.params.id, req.user.sub, req.user.role, res);
  if (!ev) return;

  // Restriction: Only DRAFT content can be deleted by authors.
  if (req.user.role !== 'admin' && ev.approval_status !== 'DRAFT') {
    return res.status(403).json({ error: `Cannot delete content in ${ev.approval_status} state` });
  }

  const { error } = await supabase.from('event').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Event deleted' });
});

// ─── POST /events/:id/images ──────────────────────────────────────────────────

eventsRouter.post('/:id/images', async (req, res) => {
  const ev = await ownOrFail(req.params.id, req.user.sub, req.user.role, res);
  if (!ev) return;

  const parsed = ImageSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { data, error } = await supabase
    .from('event_image')
    .insert({ event_id: Number(req.params.id), image_url: parsed.data.image_url })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});
