import { z } from 'zod';

export const BlogSchema = z.object({
  title:       z.string().min(1, 'Title is required').max(255),
  content:     z.string().min(1, 'Content is required'),
  description: z.string().optional().nullable(),
});

export const TutorialSchema = z.object({
  title:       z.string().min(1, 'Title is required').max(255),
  content:     z.string().min(1, 'Content is required'),
  description: z.string().optional().nullable(),
});

export const ProjectSchema = z.object({
  title:       z.string().min(1, 'Title is required').max(255),
  description: z.string().optional().nullable(),
  content:     z.string().optional().nullable(),
});

export const PublicationSchema = z.object({
  title:            z.string().min(1, 'Title is required').max(255),
  authors:          z.string().min(1, 'Authors are required').max(500),
  publication_year: z.number().int().min(1900).max(2100).optional().nullable(),
});

export const EventSchema = z.object({
  title:          z.string().min(1, 'Title is required').max(255),
  event_datetime: z.string().min(1, 'Event date/time is required'),
  premises:       z.string().min(1, 'Premises is required').max(255),
  host:           z.string().min(1, 'Host is required').max(150),
  event_type:     z.string().max(100).optional().nullable(),
  description:    z.string().optional().nullable(),
});

export const GrantSchema = z.object({
  title:       z.string().min(1, 'Title is required').max(255),
  description: z.string().optional().nullable(),
  passed_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional().nullable(),
  expire_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional().nullable(),
});
