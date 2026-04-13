import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';

export const blogsRouter = Router();
blogsRouter.use(requireAuth);

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

const BlogSchema = z.object({
  title:       z.string().min(1).max(255),
  content:     z.string().min(1),
  description: z.string().optional().nullable(),
});

const ImageSchema  = z.object({ image_url: z.string().url().max(255) });
const KeywordSchema = z.object({ keyword: z.string().min(1).max(100) });

// ─── Helper: own-or-admin check ───────────────────────────────────────────────

async function ownOrFail(blogId, memberId, role, res) {
  const { data, error } = await supabase
    .from('blog')
    .select('id, created_by_member_id')
    .eq('id', blogId)
    .single();
  if (error || !data) { res.status(404).json({ error: 'Blog not found' }); return null; }
  if (role !== 'admin' && data.created_by_member_id !== memberId) {
    res.status(403).json({ error: 'Not authorised to modify this blog' }); return null;
  }
  return data;
}

// ─── GET /blogs ───────────────────────────────────────────────────────────────

blogsRouter.get('/', async (req, res) => {
  let query = supabase
    .from('blog')
    .select('*, blog_keyword(keyword), blog_image(image_url)')
    .order('created_at', { ascending: false });

  // Admin sees all; others see only their own
  if (req.user.role !== 'admin') {
    query = query.eq('created_by_member_id', req.user.sub);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
});

// ─── POST /blogs ──────────────────────────────────────────────────────────────

blogsRouter.post('/', async (req, res) => {
  const parsed = BlogSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { title, content, description } = parsed.data;

  const { data, error } = await supabase
    .from('blog')
    .insert({
      title,
      content,
      description,
      created_by_member_id: req.user.sub,
      approval_status: 'PENDING',
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// ─── GET /blogs/:id ───────────────────────────────────────────────────────────

blogsRouter.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('blog')
    .select('*, blog_keyword(id, keyword), blog_image(id, image_url)')
    .eq('id', req.params.id)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Blog not found' });
  if (req.user.role !== 'admin' && data.created_by_member_id !== req.user.sub) {
    return res.status(403).json({ error: 'Not authorised' });
  }
  res.json(data);
});

// ─── PUT /blogs/:id ───────────────────────────────────────────────────────────

blogsRouter.put('/:id', async (req, res) => {
  const blog = await ownOrFail(req.params.id, req.user.sub, req.user.role, res);
  if (!blog) return;

  const parsed = BlogSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { data, error } = await supabase
    .from('blog')
    .update({ ...parsed.data, approval_status: 'PENDING' }) // reset to pending on edit
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ─── DELETE /blogs/:id ────────────────────────────────────────────────────────

blogsRouter.delete('/:id', async (req, res) => {
  const blog = await ownOrFail(req.params.id, req.user.sub, req.user.role, res);
  if (!blog) return;

  const { error } = await supabase.from('blog').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Blog deleted' });
});

// ─── POST /blogs/:id/images ───────────────────────────────────────────────────

blogsRouter.post('/:id/images', async (req, res) => {
  const blog = await ownOrFail(req.params.id, req.user.sub, req.user.role, res);
  if (!blog) return;

  const parsed = ImageSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { data, error } = await supabase
    .from('blog_image')
    .insert({ blog_id: Number(req.params.id), image_url: parsed.data.image_url })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// ─── DELETE /blogs/:id/images/:imageId ────────────────────────────────────────

blogsRouter.delete('/:id/images/:imageId', async (req, res) => {
  const blog = await ownOrFail(req.params.id, req.user.sub, req.user.role, res);
  if (!blog) return;

  const { error } = await supabase
    .from('blog_image')
    .delete()
    .eq('id', req.params.imageId)
    .eq('blog_id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Image removed' });
});

// ─── POST /blogs/:id/keywords ─────────────────────────────────────────────────

blogsRouter.post('/:id/keywords', async (req, res) => {
  const blog = await ownOrFail(req.params.id, req.user.sub, req.user.role, res);
  if (!blog) return;

  const parsed = KeywordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { data, error } = await supabase
    .from('blog_keyword')
    .insert({ blog_id: Number(req.params.id), keyword: parsed.data.keyword })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// ─── DELETE /blogs/:id/keywords/:keywordId ────────────────────────────────────

blogsRouter.delete('/:id/keywords/:keywordId', async (req, res) => {
  const blog = await ownOrFail(req.params.id, req.user.sub, req.user.role, res);
  if (!blog) return;

  const { error } = await supabase
    .from('blog_keyword')
    .delete()
    .eq('id', req.params.keywordId)
    .eq('blog_id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Keyword removed' });
});
