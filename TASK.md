# TASK.md — BrAIN Labs Inc.

> Status legend: `[ ]` = TODO · `[/]` = In Progress · `[x]` = Done

---

## Phase 0 — Schema & Architecture

- [x] Finalise corrected schema (`schema.sql`) — canonical source of truth
- [x] Define approval workflow: `DRAFT → PENDING_RESEARCHER → PENDING_ADMIN → APPROVED / REJECTED`
- [x] ISA role pattern: `member → admin / researcher / research_assistant / former_member`
- [x] Monochrome design system (White / Black / Grayscale — no colour accents)
- [x] Define project layout: `backend/`, `admin/`, `web/`

---

## Phase 1 — Backend (`backend/`)

### Auth
- [x] `POST /auth/register` — creates member only; RA skips role row until supervisor selected
- [x] `POST /auth/login` — role resolution + JWT with `sub` (member id) and `role`
- [x] `requireAuth` middleware
- [x] `requireRole(...roles)` middleware
- [x] `pending_setup` JWT path — RA gets token but no role row; redirected to SelectSupervisor
- [x] `PATCH /me/supervisor` — upsert RA role row with supervisor assignment
- [x] Zod `assigned_by_researcher_id` — `z.coerce.number().int().min(1).nullable().optional()` (no more "Number must be greater than 0")

### Bugs fixed
- [x] Default role variable `'pending'` → `'pending_setup'` in `queries.js`
- [x] All content routes create with `approval_status: 'DRAFT'`
- [x] `getAllPendingContent` queries `PENDING_ADMIN`
- [x] Events: uses `event_datetime` (TIMESTAMPTZ) — removed non-existent `event_date`/`event_time`
- [x] Grants: uses `grant_document` child table — removed non-existent `legal_docs` column
- [x] Tutorials: `title` added to Zod schema
- [x] Projects: `content` field added to Zod schema
- [x] Publications: `authors` + `publication_year` added; subtype upsert on `publication_id`

### Content routes
- [x] `GET /` — list (admin sees all, others see own)
- [x] `POST /` — create with `approval_status: 'DRAFT'`
- [x] `GET /:id` — get one (ownership check)
- [x] `PUT /:id` — update (resets to `DRAFT`)
- [x] `DELETE /:id` — delete (own or admin)
- [x] `POST /grants/:id/documents` + `DELETE /grants/:id/documents/:docId`
- [x] `POST /projects/:id/diagrams` + `DELETE /projects/:id/diagrams/:diagId`
- [x] `DELETE /tutorials/:id/images/:imgId`
- [x] `POST /publications/:id/:subtype` — link ISA subtype (upsert)
- [x] Blog list & detail queries include `id` on `blog_keyword` and `blog_image`

### Approval workflow (`/content`)
- [x] `PATCH /content/:table/:id/submit` — RA → `PENDING_RESEARCHER`; Researcher/Admin → `PENDING_ADMIN`
- [x] `PATCH /content/:table/:id/review` — Researcher → `PENDING_ADMIN` or `REJECTED`
- [x] `GET /content/researcher/reviews` — items in `PENDING_RESEARCHER` for researcher queue

### Admin routes (`/admin`)
- [x] `GET /admin/members` — list all members with role info
- [x] `PATCH /admin/members/:id/approve` / `reject`
- [x] `GET /admin/content/pending` — all `PENDING_ADMIN` content
- [x] `PATCH /admin/content/:table/:id/approve` / `reject`

### TODO
- [ ] Rate limiting middleware
- [ ] Request logging for workflow transitions
- [ ] Resignation workflow → create `former_member`, remove role row
- [ ] `event_image` POST/DELETE routes (child table exists, no routes yet)
- [ ] `grant_investigator` linking table — no routes yet

---

## Phase 2 — Admin Dashboard (`admin/`)

### Design system — Monochrome (White / Black / Grayscale ONLY)
- [x] `index.css` — `@theme` tokens, `.card-modern`, `.card-monochrome`, `.input-monochrome`, `.btn-primary`, `.nav-item`, `.skeleton`, `.animate-enter`, `.animate-fade`
- [x] All `indigo / violet / amber / emerald / blue` colour classes stripped from every `.tsx` / `.ts` / `.css` file
- [x] `Badge.tsx` — `bg-zinc-900`=Approved, `bg-zinc-200`=Pending Admin, `bg-zinc-100`=In Review, `bg-white border`=Draft, strikethrough=Rejected
- [x] `AppLayout.tsx` — black square logo, black user avatar, clean zinc sidebar, `nav-item.active` = `bg-zinc-900 text-white`
- [x] Google Font moved to `<link>` in `index.html` (was `@import` in CSS — caused Vite parse error)
- [x] Removed stale `@apply card-modern` (invalid in Tailwind v4) — inlined properties directly
- [x] `ContentPageTemplate` — black New button, zinc active filter tab, shimmer skeleton loading, "Clear search" link
- [x] `Login.tsx` — black left panel, white right panel, black submit button, no colour orbs
- [x] `SelectSupervisor.tsx` — zinc-50 bg, white card, black selection state, search filter
- [x] `Dashboard.tsx` — zinc pending state, zinc spinner
- [x] `Register.tsx` — monochrome strength indicators, no colour orbs
- [x] `ProfileSettingsModal.tsx` — success state uses `bg-zinc-900`

### Auth
- [x] JWT stored in localStorage (`brain_labs_token`)
- [x] 401 → `brain:session-expired` event → `SessionHandler` component
- [x] Session timeout banner with countdown
- [x] `ProtectedRoute.tsx` — redirects `pending_setup` → `/setup/supervisor`

### MarkdownEditor (full custom rebuild)
- [x] Replaced `@uiw/react-md-editor` — zero extra deps
- [x] **Line numbers gutter** — real-time
- [x] **Syntax highlighting backdrop** — headings / bold / italic / code / blockquotes / lists tinted while typing
- [x] **Toolbar groups**: Headings (H1/H2/H3) · Inline (Bold/Italic/Code) · Block (List/Ordered/Quote/HR) · Misc (Link/Line-break)
- [x] **Write / Preview toggle** — preview renders bold, italic, code, lists, code blocks correctly
- [x] **Heading tags** — use `React.ElementType` lookup map (fix for `Cannot find namespace 'JSX'` TS error)
- [x] **Tab key** → 2-space indent, no focus loss
- [x] **Black caret** — `caretColor: #09090b` always visible
- [x] **Char count + line count** footer
- [x] Unused `lang` variable prefixed `_lang` (fix for TS warning)

### Content pages
- [x] `Blog.tsx` — MarkdownEditor + keyword tag management
- [x] `Tutorials.tsx` — MarkdownEditor + image URL management
- [x] `Projects.tsx` — MarkdownEditor + diagram URL management
- [x] `Grants.tsx` — inline document add/remove
- [x] `Publications.tsx` — subtype save wired, 409 handled gracefully
- [x] `Events.tsx` — date/time/location form with compact stats detail view

### Register
- [x] Always sends `assigned_by_researcher_id: null` during registration (supervisor chosen on next page)
- [x] Zod error response flattened: `{ formErrors, fieldErrors }` → first readable string (no more "Objects are not valid as a React child")

### TODO
- [ ] Researcher review queue page — dedicated view of `PENDING_RESEARCHER` items
- [ ] `former_member` CRUD page — table exists, no UI
- [ ] Grant co-investigators UI — `grant_investigator` table exists, no CRUD
- [ ] Publication → member author links UI

---

## Phase 3 — Public Website (`web/`)

- [ ] Connect to Express `/public/*` read-only endpoints
- [ ] Matching monochrome design
- [ ] SEO: sitemap, metadata, semantic HTML
- [ ] End-to-end smoke test: RA draft → public visibility

---

## Phase 4 — Deployment

- [ ] Dockerfile for backend
- [ ] CI/CD: Render (backend) + Cloudflare Pages (admin + web)
- [ ] Supabase Storage for images / grant documents (replace URL-only input fields)
- [ ] Refresh token support

---

## 🚀 Future Improvements

### High Priority
- [ ] **File upload** — Supabase Storage for blog/project/tutorial images and grant documents
- [ ] **Email notifications** — RA approved/rejected; researcher notified when RA assigned
- [ ] **Content versioning** — edit history for blog/project/tutorial content
- [ ] **Public API** — `/public/*` read-only endpoints for the main website

### Medium Priority
- [ ] **Dashboard analytics** — charts: content by status, member growth, publication trends
- [ ] **Bulk approval UI** — admin selects multiple pending items → approve/reject in one action
- [ ] **Events backend** — `event_image` POST/DELETE routes
- [ ] **Former members page** — no CRUD UI for `former_member` table
- [ ] **Grant co-investigators UI** — `grant_investigator` linking table
- [ ] **Publication → member link** — connect publication authors to member profiles

### Low Priority / Polish
- [ ] **Dark mode** — CSS custom property switch + `localStorage` preference
- [ ] **Mobile sidebar** — bottom nav or collapsible drawer for small screens
- [ ] **Global search** — cross-content search in top header
- [ ] **Keyboard shortcuts** — `N` = new, `Esc` = close, `Cmd+S` = save, `Cmd+P` = preview toggle
- [ ] **MarkdownEditor — Image paste** — paste clipboard image, auto-upload and insert URL
- [ ] **MarkdownEditor — Table builder** — visual table insertion dialog
- [ ] **Accessibility audit** — WCAG 2.1 AA: focus rings, ARIA labels, contrast
