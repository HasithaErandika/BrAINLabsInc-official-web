# TASK.md — BrAIN Labs Inc. Rebuild Sprint

> Status legend: `[ ]` = TODO · `[/]` = In Progress · `[x]` = Done

---

## Phase 0 — Schema & Decision

- [x] Finalise and review `schema.sql` (canonical schema)
- [x] Compare Ballerina vs Go vs Express.js for backend
- [x] **Decision: Express.js (Node.js)** — best free-tier hosting + ecosystem
- [x] Write `prompt.md`, `CLAUDE.md`, `TASK.md` aligned to new schema

---

## Phase 1 — Backend Scaffold (`backend/`)

- [x] Initialise `backend/` with `npm init` and set `"type": "module"`
- [x] Install dependencies:
  - `express`, `cors`, `helmet`, `dotenv`
  - `@supabase/supabase-js`
  - `jsonwebtoken`
  - `zod`
  - `express-async-errors`
  - Dev: `nodemon`
- [x] Create `backend/src/index.js` (Express app, CORS, helmet, error handler)
- [x] Create `backend/src/config/supabase.js` (service role client)
- [x] Create `backend/.env` and `backend/.env.example`
- [x] Create `backend/src/middleware/auth.js` (JWT verify, attach `req.user`)
- [x] Create `backend/src/middleware/requireRole.js` (role gate factory)
- [x] Health check `GET /health`

---

## Phase 2 — Auth Routes (`backend/src/routes/auth.js`)

- [x] `POST /auth/register`
  - Validate body with Zod (first_name, second_name, contact_email, password, role)
  - Create `member` row via Supabase Auth + `member` table insert
  - Create `researcher` or `research_assistant` row (approval_status = PENDING)
  - Return 201 + basic member info
- [x] `POST /auth/login`
  - Supabase Auth `signInWithPassword`
  - Resolve role from `admin` / `researcher` / `research_assistant` tables
  - Sign JWT with `{ sub: member.id, role, email, slug }`
  - Return `{ token, user }`
- [x] `POST /auth/logout` (client-side only — just return 200)

---

## Phase 3 — Member & Profile Routes

- [x] `GET /me` — Return own member + role-specific profile
- [x] `PUT /me` — Update basic member fields (name, bio, occupation, etc.)
- [x] `POST /me/education` — Add educational_background row
- [x] `DELETE /me/education/:id` — Delete own education row
- [x] `POST /me/ongoing-research` — Add ongoing_research row
- [x] `DELETE /me/ongoing-research/:id` — Delete own ongoing_research row
- [x] `POST /me/change-password` — Change own password (via Supabase auth admin API)

---

## Phase 4 — Admin Routes (`/admin/...`)

- [x] `GET /admin/members` — List all members with joined role info (admin only)
- [x] `GET /admin/members/:id` — Full member detail
- [x] `PATCH /admin/members/:id/approve` — Set researcher/RA approval_status = APPROVED
- [x] `PATCH /admin/members/:id/reject` — Set approval_status = REJECTED
- [x] `POST /admin/members/:id/resign` — Create former_member row; delete researcher/RA row (Zod validated)
- [x] `GET /admin/content/pending` — All pending blogs/tutorials/projects/events/grants
- [x] `PATCH /admin/content/:table/:id/approve` — Set approval_status = APPROVED
- [x] `PATCH /admin/content/:table/:id/reject` — Set approval_status = REJECTED

---

## Phase 5 — Content Routes

### Blogs (`/blogs`)
- [x] `GET /blogs` — List own blogs (admin sees all) — **security fix applied**
- [x] `POST /blogs` — Create blog (approval_status = PENDING; enforce CHECK constraint)
- [x] `GET /blogs/:id` — Get single blog (own only)
- [x] `PUT /blogs/:id` — Update blog (resets to PENDING if content changed)
- [x] `DELETE /blogs/:id` — Delete blog (cascades blog_image, blog_keyword)
- [x] `POST /blogs/:id/images` — Add blog_image
- [x] `DELETE /blogs/:id/images/:imageId` — Remove blog_image
- [x] `POST /blogs/:id/keywords` — Add blog_keyword
- [x] `DELETE /blogs/:id/keywords/:keywordId` — Remove blog_keyword

### Tutorials (`/tutorials`)
- [x] `GET /tutorials` — List own tutorials — **security fix applied**
- [x] `POST /tutorials` — Create tutorial (PENDING)
- [x] `GET /tutorials/:id`
- [x] `PUT /tutorials/:id`
- [x] `DELETE /tutorials/:id`
- [x] `POST /tutorials/:id/images` — Add tutorial_image

### Projects (`/projects`)
- [x] `GET /projects` — List own projects — **security fix applied**
- [x] `POST /projects` — Create project (PENDING)
- [x] `GET /projects/:id`
- [x] `PUT /projects/:id`
- [x] `DELETE /projects/:id`
- [x] `POST /projects/:id/diagrams` — Add project_diagram

### Events (researcher only)
- [x] `GET /events` — List own events — **security fix applied**
- [x] `POST /events` — Create event (PENDING; FK to researcher.member_id)
- [x] `GET /events/:id`
- [x] `PUT /events/:id`
- [x] `DELETE /events/:id`
- [x] `POST /events/:id/images` — Add event_image

### Grants (researcher only)
- [x] `GET /grants` — List own grants — **security fix applied**
- [x] `POST /grants` — Create grant (PENDING; FK to researcher.member_id)
- [x] `GET /grants/:id`
- [x] `PUT /grants/:id`
- [x] `DELETE /grants/:id`

---

## Phase 6 — Publications (`/publications`)

- [x] `GET /publications` — List own publications (joined with subtype) — **security fix applied**
- [x] `POST /publications` — Create publication base row
- [x] `POST /publications/:id/conference-paper` — Link conference_paper
- [x] `POST /publications/:id/book` — Link book
- [x] `POST /publications/:id/journal` — Link journal
- [x] `POST /publications/:id/article` — Link article
- [x] `PUT /publications/:id` — Update base publication
- [x] `DELETE /publications/:id` — Delete (cascades subtypes)

---

## Phase 7 — Public Routes (`/public/...`)

- [x] `GET /public/blogs` — APPROVED blogs only
- [x] `GET /public/blogs/:id` — Single APPROVED blog
- [x] `GET /public/tutorials` — APPROVED tutorials only
- [x] `GET /public/tutorials/:id` — Single APPROVED tutorial
- [x] `GET /public/projects` — APPROVED projects only
- [x] `GET /public/projects/:id` — Single APPROVED project
- [x] `GET /public/events` — APPROVED events only
- [x] `GET /public/events/:id` — Single APPROVED event
- [x] `GET /public/publications` — APPROVED publications (joined with subtypes)
- [x] `GET /public/publications/:id` — Single APPROVED publication
- [x] `GET /public/researchers` — APPROVED researchers (profile cards)
- [x] `GET /public/researchers/:slug` — Full researcher profile

---

## Phase 8 — Admin Dashboard (`admin/`)

- [x] Remove old Ballerina-specific API calls
- [x] `src/lib/api.ts` — Axios instance with base URL, Bearer interceptor, 401 response interceptor
- [x] Auth store (`useAuth.ts`) with Zustand + persist — login, logout, role helpers
- [x] `ProtectedRoute` component (redirect to /login if no token)
- [x] `RoleGuard` component (403 UI for insufficient role)
- [x] **Pages:**
  - [x] `/login` — Login form
  - [x] `/register` — Registration form
  - [x] `/dashboard` — Role-specific dashboard (Admin / Researcher / RA views)
  - [x] `/dashboard/members` — Member list + approve/reject (admin only)
  - [x] `/blog` — Blog list + create/edit
  - [x] `/tutorials` — Tutorial list + create/edit
  - [x] `/projects` — Project list + create/edit
  - [x] `/events` — Events list + create/edit (researcher + admin only — **role guard fixed**)
  - [x] `/grants` — Grants list + create/edit (researcher + admin only — **role guard fixed**)
  - [x] `/publications` — Publications list + create/edit
  - [x] `/account` — Profile editor
  - [x] `/settings` — Settings page
  - [ ] `/content/pending` — Dedicated content approval queue page (pending — currently in AdminDashboard)
  - [ ] `/members/:id` — Deep-linked member detail page

---

## Phase 9 — Public Website Update (`web/`)

- [ ] Update `VITE_API_URL` to point to new Express backend
- [ ] Replace any old API calls with new `/public/*` endpoints
- [ ] Test all public pages: blogs, events, publications, researcher cards

---

## Phase 10 — Deployment

- [ ] Create `backend/Dockerfile` for containerised deployment
- [ ] Create `render.yaml` (Render deployment config for backend)
- [ ] Deploy backend to Render (free tier)
- [ ] Set all environment variables on Render dashboard
- [ ] Deploy `admin/` to Cloudflare Pages
- [ ] Set `VITE_API_URL` in Cloudflare Pages environment
- [ ] Verify CORS from admin domain → Render backend
- [ ] Smoke test end-to-end: login → create blog → admin approve → public visible

---

## Backlog / Future

- [ ] File uploads (images, grant docs) via Supabase Storage
- [ ] Email notifications on approval/rejection (Supabase Edge Functions or Resend)
- [ ] Researcher profile CV export to PDF
- [ ] Public website search across publications and blogs
- [ ] Rate limiting (`express-rate-limit`) on auth endpoints
- [ ] Refresh token support (currently JWT is 7d, no refresh)
- [ ] `/content/pending` dedicated admin page (tabbed by content type)
- [ ] `/members/:id` deep-linked member detail page
