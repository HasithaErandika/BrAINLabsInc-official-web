import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';

export const blogsRouter = Router();
blogsRouter.use(requireAuth);

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

const BlogSchema = z.object({
  title:       z.string().max(255).optional().nullable(),
  content:     z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

const ImageSchema  = z.object({ image_url: z.string().url().max(255) });
const KeywordSchema = z.object({ keyword: z.string().min(1).max(100) });

// ─── Helper: own-or-admin check ───────────────────────────────────────────────

async function ownOrFail(blogId, memberId, role, res) {
  const { data: blog, error } = await supabase
    .from('blog')
    .select('id, created_by_member_id, approval_status')
    .eq('id', blogId)
    .single();

  if (error || !blog) {
    res.status(404).json({ error: 'Blog not found' });
    return null;
  }

  // Admin always allowed
  if (role === 'admin') return blog;

  // Owner always allowed
  if (blog.created_by_member_id === memberId) return blog;

  // Researcher allowed if it's their RA's content and pending researcher review
  if (role === 'researcher' && blog.approval_status === 'PENDING_RESEARCHER') {
    const { data: ra } = await supabase
      .from('research_assistant')
      .select('assigned_by_researcher_id')
      .eq('member_id', blog.created_by_member_id)
      .single();

    if (ra && ra.assigned_by_researcher_id === memberId) {
      return blog;
    }
  }

  res.status(403).json({ error: 'Not authorised to modify this blog' });
  return null;
}

// ─── GET /blogs ───────────────────────────────────────────────────────────────

blogsRouter.get('/', async (req, res) => {
  let query = supabase
    .from('blog')
    .select('*, blog_keyword(id, keyword), blog_image(id, image_url)')
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

// ─── POST /blogs ──────────────────────────────────────────────────────────────

blogsRouter.post('/', async (req, res) => {
  const parsed = BlogSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { title, content, description } = parsed.data;

  const { data, error } = await supabase
    .from('blog')
    .insert({
      title: title || 'Untitled',
      content: content || '',
      description: description || null,
      created_by_member_id: req.user.sub,
      approval_status: 'DRAFT',
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

  // Admin and Researchers reviewing don't reset to DRAFT
  const updatePayload = { ...parsed.data };
  if (req.user.role !== 'admin') {
    // If it's a researcher editing something NOT pending their review, reset it
    const isReviewing = req.user.role === 'researcher' && blog.approval_status === 'PENDING_RESEARCHER';
    if (!isReviewing) {
      updatePayload.approval_status = 'DRAFT';
    }
  }

  const { data, error } = await supabase
    .from('blog')
    .update(updatePayload)
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

  // Restriction: Only DRAFT content can be deleted by authors.
  if (req.user.role !== 'admin' && blog.approval_status !== 'DRAFT') {
    return res.status(403).json({ error: `Cannot delete content in ${blog.approval_status} state` });
  }

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
