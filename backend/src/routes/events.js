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
  title:          z.string().min(1).max(255),
  description:    z.string().optional().nullable(),
  event_datetime: z.string().min(1, 'Event date/time is required'),
  event_type:     z.string().max(100).optional().nullable(),
  premises:       z.string().min(1).max(255),
  host:           z.string().min(1).max(150),
});

const ImageSchema = z.object({ image_url: z.string().url().max(255) });

// ─── Helper: own-or-admin check ───────────────────────────────────────────────

async function ownOrFail(eventId, memberId, role, res) {
  const { data, error } = await supabase
    .from('event')
    .select('id, created_by_researcher')
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

  if (req.user.role !== 'admin') {
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

  const { data, error } = await supabase
    .from('event')
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

  const { data, error } = await supabase
    .from('event')
    .update({ ...parsed.data, approval_status: 'DRAFT' })
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
