import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'dotenv/config';

// ── Route imports ──────────────────────────────────────────────────────────────
import { authRouter } from './routes/auth.js';
import { meRouter } from './routes/me.js';
import { publicRouter } from './routes/public.js';
import { adminRouter } from './routes/admin.js';
import { blogsRouter } from './routes/blogs.js';
import { tutorialsRouter } from './routes/tutorials.js';
import { projectsRouter } from './routes/projects.js';
import { eventsRouter } from './routes/events.js';
import { grantsRouter } from './routes/grants.js';
import { publicationsRouter } from './routes/publications.js';
import { contentRouter } from './routes/content.js';

const app = express();
const PORT = process.env.PORT ?? 3001;

// ── Security & Parsing ─────────────────────────────────────────────────────────
app.use(helmet());

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') ?? [];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. server-to-server, Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Health ─────────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'BrAIN Labs API', version: '2.0.0' });
});

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use('/auth', authRouter);
app.use('/me', meRouter);
app.use('/public', publicRouter);
app.use('/admin', adminRouter);
app.use('/blogs', blogsRouter);
app.use('/tutorials', tutorialsRouter);
app.use('/projects', projectsRouter);
app.use('/events', eventsRouter);
app.use('/grants', grantsRouter);
app.use('/publications', publicationsRouter);
app.use('/content', contentRouter);

// ── 404 ────────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Centralised error handler ──────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(`[Error] ${err.message}`, err.stack);
  const status = err.status ?? err.statusCode ?? 500;
  res.status(status).json({ error: err.message ?? 'Internal server error' });
});

// ── Start ──────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅  BrAIN Labs API running on port ${PORT}`);
});
