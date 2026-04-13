-- BrAIN Labs Inc. — Canonical Database Schema
-- Use this file as the single source of truth. Run against a fresh Supabase project.

-- ─── Enums ────────────────────────────────────────────────────────────────────

-- FIX (workflow): Added DRAFT and PENDING_RESEARCHER to support the full
-- RA → Researcher → Admin approval chain.
CREATE TYPE approval_status_enum AS ENUM (
    'DRAFT',                -- Being worked on; not yet submitted
    'PENDING_RESEARCHER',   -- RA submitted to assigned researcher for review
    'PENDING_ADMIN',        -- Researcher approved and forwarded to admin
    'APPROVED',             -- Admin approved; publicly visible
    'REJECTED'              -- Rejected at any stage
);

-- ─── Core Identity ────────────────────────────────────────────────────────────

CREATE TABLE member (
    id              SERIAL PRIMARY KEY,
    first_name      VARCHAR(100)        NOT NULL,
    second_name     VARCHAR(100)        NOT NULL,
    contact_email   VARCHAR(150) UNIQUE NOT NULL,
    -- FIX M1: Slug must be lowercase alphanumeric with hyphens only.
    slug            VARCHAR(150) UNIQUE NOT NULL
                        CHECK (slug ~ '^[a-z0-9-]+$'),
    auth_user_id    UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Admin is a specialisation of member (ISA)
CREATE TABLE admin (
    member_id   INT PRIMARY KEY,
    CONSTRAINT fk_admin_member
        FOREIGN KEY (member_id) REFERENCES member(id) ON DELETE CASCADE
);

-- Researcher is a specialisation of member (ISA)
CREATE TABLE researcher (
    member_id               INT PRIMARY KEY,
    country                 VARCHAR(100),
    linkedin_url            VARCHAR(255),
    image_url               VARCHAR(255),
    bio                     TEXT,
    occupation              VARCHAR(150),
    workplace               VARCHAR(150),

    approval_status         approval_status_enum    DEFAULT 'PENDING_ADMIN',
    approved_by_admin_id    INT,

    -- FIX D5: Track profile changes.
    updated_at              TIMESTAMPTZ             DEFAULT NOW(),

    CONSTRAINT fk_researcher_member
        FOREIGN KEY (member_id)             REFERENCES member(id)       ON DELETE CASCADE,
    CONSTRAINT fk_researcher_approved_by
        FOREIGN KEY (approved_by_admin_id)  REFERENCES admin(member_id) ON DELETE SET NULL
);

-- Research Assistant is a specialisation of member (ISA)
CREATE TABLE research_assistant (
    member_id                   INT PRIMARY KEY,
    -- FIX D1: assigned_by_researcher_id is NOT NULL — an RA must always have
    -- an assigning researcher. FK is RESTRICT so we cannot delete a researcher
    -- who still has active RAs under them.
    assigned_by_researcher_id   INT NOT NULL,

    approval_status             approval_status_enum    DEFAULT 'PENDING_ADMIN',
    approved_by_admin_id        INT,

    -- FIX D5: Track profile changes.
    updated_at                  TIMESTAMPTZ             DEFAULT NOW(),

    CONSTRAINT fk_ra_member
        FOREIGN KEY (member_id)                 REFERENCES member(id)               ON DELETE CASCADE,
    CONSTRAINT fk_ra_assigned_by
        FOREIGN KEY (assigned_by_researcher_id) REFERENCES researcher(member_id)    ON DELETE RESTRICT,
    CONSTRAINT fk_ra_approved_by
        FOREIGN KEY (approved_by_admin_id)      REFERENCES admin(member_id)         ON DELETE SET NULL
);

-- Former Member archives resigned Researchers and RAs.
-- The original researcher / research_assistant row is deleted on resignation;
-- the member row is preserved for blog authorship FKs.
CREATE TABLE former_member (
    member_id               INT PRIMARY KEY,

    former_role             VARCHAR(50) NOT NULL CHECK (former_role IN ('RESEARCHER', 'RESEARCH_ASSISTANT')),

    resign_date             DATE        NOT NULL,
    resignation_approved_by INT,

    working_period_start    DATE        NOT NULL,
    working_period_end      DATE        NOT NULL,

    CONSTRAINT chk_former_working_period
        CHECK (working_period_end >= working_period_start),

    CONSTRAINT fk_former_member
        FOREIGN KEY (member_id)               REFERENCES member(id)       ON DELETE CASCADE,
    CONSTRAINT fk_former_approved_by
        FOREIGN KEY (resignation_approved_by) REFERENCES admin(member_id) ON DELETE SET NULL
);

-- FIX C3: Block a member from existing in both an active role (researcher or
-- research_assistant) and former_member at the same time.
CREATE OR REPLACE FUNCTION check_former_member_xor()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM researcher       WHERE member_id = NEW.member_id) THEN
        RAISE EXCEPTION 'Member % is still an active researcher; cannot insert into former_member.', NEW.member_id;
    END IF;
    IF EXISTS (SELECT 1 FROM research_assistant WHERE member_id = NEW.member_id) THEN
        RAISE EXCEPTION 'Member % is still an active research assistant; cannot insert into former_member.', NEW.member_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_former_member_xor
    BEFORE INSERT OR UPDATE ON former_member
    FOR EACH ROW EXECUTE FUNCTION check_former_member_xor();

-- RLS: All identity tables are managed exclusively via the Express backend
-- using the service-role key.
ALTER TABLE member              DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin               DISABLE ROW LEVEL SECURITY;
ALTER TABLE researcher          DISABLE ROW LEVEL SECURITY;
ALTER TABLE research_assistant  DISABLE ROW LEVEL SECURITY;
ALTER TABLE former_member       DISABLE ROW LEVEL SECURITY;

-- ─── Researcher Profile (Multivalued) ─────────────────────────────────────────

CREATE TABLE educational_background (
    id              SERIAL PRIMARY KEY,
    researcher_id   INT          NOT NULL,
    degree          VARCHAR(150) NOT NULL,

    CONSTRAINT fk_edu_researcher
        FOREIGN KEY (researcher_id) REFERENCES researcher(member_id) ON DELETE CASCADE
);

CREATE TABLE ongoing_research (
    id              SERIAL PRIMARY KEY,
    researcher_id   INT          NOT NULL,
    title           VARCHAR(255) NOT NULL,

    CONSTRAINT fk_ongoing_researcher
        FOREIGN KEY (researcher_id) REFERENCES researcher(member_id) ON DELETE CASCADE
);

-- ─── Content Tables ───────────────────────────────────────────────────────────

-- Blog: authored by current members OR former members (exactly one FK must be set).
CREATE TABLE blog (
    id                          SERIAL PRIMARY KEY,
    title                       VARCHAR(255)            NOT NULL,
    content                     TEXT                    NOT NULL,
    description                 TEXT,

    -- FIX C1: Changed from CASCADE to SET NULL so deleting a member does not
    -- destroy their published blog posts. Authorship becomes NULL (orphan) but
    -- the content is preserved.
    created_by_member_id        INT,
    created_by_former_member_id INT,

    -- FIX (workflow): Track which researcher reviewed this content when
    -- submitted by an RA. NULL when a researcher authored it directly.
    reviewed_by_researcher_id   INT,

    approval_status             approval_status_enum    DEFAULT 'DRAFT',
    approved_by_admin_id        INT,

    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),

    -- Exactly one creator must be set (XOR)
    CONSTRAINT blog_creator_xor
        CHECK (
            (created_by_member_id IS NOT NULL AND created_by_former_member_id IS NULL)
            OR
            (created_by_member_id IS NULL AND created_by_former_member_id IS NOT NULL)
        ),

    CONSTRAINT fk_blog_member
        FOREIGN KEY (created_by_member_id)          REFERENCES member(id)               ON DELETE SET NULL,
    CONSTRAINT fk_blog_former_member
        FOREIGN KEY (created_by_former_member_id)   REFERENCES former_member(member_id) ON DELETE SET NULL,
    CONSTRAINT fk_blog_reviewed_by
        FOREIGN KEY (reviewed_by_researcher_id)     REFERENCES researcher(member_id)    ON DELETE SET NULL,
    CONSTRAINT fk_blog_approved_by
        FOREIGN KEY (approved_by_admin_id)          REFERENCES admin(member_id)         ON DELETE SET NULL
);

-- FIX C4: When a former_member row is deleted, SET NULL fires on
-- created_by_former_member_id, leaving both creator columns NULL and breaking
-- the XOR. Warn about this so it can be handled at the application layer.
CREATE OR REPLACE FUNCTION warn_blog_xor_broken()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.created_by_member_id IS NULL AND NEW.created_by_former_member_id IS NULL THEN
        RAISE WARNING 'Blog id=% now has no creator (XOR broken). Handle at application layer.', NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_blog_xor_warning
    BEFORE UPDATE ON blog
    FOR EACH ROW EXECUTE FUNCTION warn_blog_xor_broken();

-- Tutorial: authored by a current member.
-- FIX C2: Changed FK to SET NULL so deleting a member does not destroy tutorials.
CREATE TABLE tutorial (
    id                          SERIAL PRIMARY KEY,
    title                       VARCHAR(255)            NOT NULL,
    description                 TEXT,
    content                     TEXT                    NOT NULL,
    created_by_member_id        INT,

    -- FIX (workflow): Researcher who reviewed this if originally written by an RA.
    reviewed_by_researcher_id   INT,

    approval_status             approval_status_enum    DEFAULT 'DRAFT',
    approved_by_admin_id        INT,

    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT fk_tutorial_member
        FOREIGN KEY (created_by_member_id)      REFERENCES member(id)               ON DELETE SET NULL,
    CONSTRAINT fk_tutorial_reviewed_by
        FOREIGN KEY (reviewed_by_researcher_id) REFERENCES researcher(member_id)    ON DELETE SET NULL,
    CONSTRAINT fk_tutorial_approved_by
        FOREIGN KEY (approved_by_admin_id)      REFERENCES admin(member_id)         ON DELETE SET NULL
);

-- FIX C2 + D6: Changed FK to SET NULL; added content TEXT field for consistency
-- with blog and tutorial.
CREATE TABLE project (
    id                          SERIAL PRIMARY KEY,
    title                       VARCHAR(255)            NOT NULL,
    description                 TEXT,
    -- FIX D6: Added content field for consistency with blog and tutorial.
    content                     TEXT,
    created_by_member_id        INT,

    -- FIX (workflow): Researcher who reviewed this if originally written by an RA.
    reviewed_by_researcher_id   INT,

    approval_status             approval_status_enum    DEFAULT 'DRAFT',
    approved_by_admin_id        INT,

    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT fk_project_member
        FOREIGN KEY (created_by_member_id)      REFERENCES member(id)               ON DELETE SET NULL,
    CONSTRAINT fk_project_reviewed_by
        FOREIGN KEY (reviewed_by_researcher_id) REFERENCES researcher(member_id)    ON DELETE SET NULL,
    CONSTRAINT fk_project_approved_by
        FOREIGN KEY (approved_by_admin_id)      REFERENCES admin(member_id)         ON DELETE SET NULL
);

-- Researcher-only content tables.
-- FIX D3: Changed from CASCADE to SET NULL for authorship preservation consistency.

CREATE TABLE event (
    id                      SERIAL PRIMARY KEY,
    title                   VARCHAR(255)            NOT NULL,
    event_type              VARCHAR(100),
    description             TEXT,
    -- FIX M2: Merged separate DATE + TIME into a single TIMESTAMPTZ to preserve
    -- timezone context.
    event_datetime          TIMESTAMPTZ             NOT NULL,
    premises                VARCHAR(255)            NOT NULL,
    host                    VARCHAR(150)            NOT NULL,

    created_by_researcher   INT,

    approval_status         approval_status_enum    DEFAULT 'PENDING_ADMIN',
    approved_by_admin_id    INT,

    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT fk_event_researcher
        FOREIGN KEY (created_by_researcher) REFERENCES researcher(member_id) ON DELETE SET NULL,
    CONSTRAINT fk_event_approved_by
        FOREIGN KEY (approved_by_admin_id)  REFERENCES admin(member_id)      ON DELETE SET NULL
);

CREATE TABLE grant_info (
    id                      SERIAL PRIMARY KEY,
    title                   VARCHAR(255)            NOT NULL,
    description             TEXT,
    -- FIX D4: legal_docs column removed; replaced by grant_document child table below.
    passed_date             DATE,
    expire_date             DATE,

    CONSTRAINT chk_grant_dates
        CHECK (passed_date IS NULL OR expire_date IS NULL OR expire_date >= passed_date),

    created_by_researcher   INT,

    approval_status         approval_status_enum    DEFAULT 'PENDING_ADMIN',
    approved_by_admin_id    INT,

    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT fk_grant_researcher
        FOREIGN KEY (created_by_researcher) REFERENCES researcher(member_id) ON DELETE SET NULL,
    CONSTRAINT fk_grant_approved_by
        FOREIGN KEY (approved_by_admin_id)  REFERENCES admin(member_id)      ON DELETE SET NULL
);

-- FIX D4: Extracted grant_info.legal_docs (single VARCHAR) into a proper child
-- table to support multiple documents per grant, mirroring blog_image pattern.
CREATE TABLE grant_document (
    id          SERIAL PRIMARY KEY,
    grant_id    INT          NOT NULL,
    doc_url     VARCHAR(255) NOT NULL,
    doc_label   VARCHAR(255),

    UNIQUE (grant_id, doc_url),

    CONSTRAINT fk_grant_document
        FOREIGN KEY (grant_id) REFERENCES grant_info(id) ON DELETE CASCADE
);

-- ─── Publications (ISA) ───────────────────────────────────────────────────────

-- FIX C5: Changed from CASCADE to SET NULL so deleting a member does not wipe
-- academic publication records. The authors text field serves as archival record.
CREATE TABLE publication (
    id                      SERIAL PRIMARY KEY,
    title                   VARCHAR(255)            NOT NULL,
    -- NOTE D2: authors as comma-separated string is an anti-pattern. Cannot query
    -- "all publications by Dr. X" without LIKE hacks. Kept as-is for now;
    -- a publication_author junction table is the recommended future upgrade.
    authors                 VARCHAR(500),
    publication_year        INT,

    CONSTRAINT chk_publication_year
        CHECK (publication_year IS NULL OR (publication_year >= 1900 AND publication_year <= 2100)),

    created_by_member_id    INT,

    -- FIX (workflow): Track which researcher reviewed this if written by an RA.
    reviewed_by_researcher_id   INT,

    approval_status         approval_status_enum    DEFAULT 'DRAFT',
    approved_by_admin_id    INT,

    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT fk_publication_member
        FOREIGN KEY (created_by_member_id)      REFERENCES member(id)               ON DELETE SET NULL,
    CONSTRAINT fk_publication_reviewed_by
        FOREIGN KEY (reviewed_by_researcher_id) REFERENCES researcher(member_id)    ON DELETE SET NULL,
    CONSTRAINT fk_publication_approved_by
        FOREIGN KEY (approved_by_admin_id)      REFERENCES admin(member_id)         ON DELETE SET NULL
);

CREATE TABLE conference_paper (
    publication_id  INT PRIMARY KEY,
    -- NOTE M5: paper_id format (arXiv ID? internal ID?) is undocumented.
    -- Add a CHECK constraint here once the format is decided,
    -- e.g. CHECK (paper_id ~ '^[0-9]{4}\.[0-9]{4,5}$') for arXiv IDs.
    paper_id        VARCHAR(100) UNIQUE NOT NULL,
    link            VARCHAR(255),
    description     TEXT,

    CONSTRAINT fk_conf_paper_publication
        FOREIGN KEY (publication_id) REFERENCES publication(id) ON DELETE CASCADE
);

CREATE TABLE book (
    publication_id  INT PRIMARY KEY,
    isbn            VARCHAR(50) UNIQUE NOT NULL,
    link            VARCHAR(255),
    description     TEXT,

    CONSTRAINT fk_book_publication
        FOREIGN KEY (publication_id) REFERENCES publication(id) ON DELETE CASCADE
);

CREATE TABLE journal (
    publication_id  INT PRIMARY KEY,
    issn            VARCHAR(50) UNIQUE NOT NULL,
    link            VARCHAR(255),
    description     TEXT,

    CONSTRAINT fk_journal_publication
        FOREIGN KEY (publication_id) REFERENCES publication(id) ON DELETE CASCADE
);

CREATE TABLE article (
    publication_id  INT PRIMARY KEY,
    doi             VARCHAR(100) UNIQUE NOT NULL,
    link            VARCHAR(255),
    description     TEXT,

    CONSTRAINT fk_article_publication
        FOREIGN KEY (publication_id) REFERENCES publication(id) ON DELETE CASCADE
);

-- ─── Media Attachments ────────────────────────────────────────────────────────

CREATE TABLE blog_image (
    id          SERIAL PRIMARY KEY,
    blog_id     INT          NOT NULL,
    image_url   VARCHAR(255) NOT NULL,

    UNIQUE (blog_id, image_url),

    CONSTRAINT fk_blog_image
        FOREIGN KEY (blog_id) REFERENCES blog(id) ON DELETE CASCADE
);

CREATE TABLE blog_keyword (
    id          SERIAL PRIMARY KEY,
    blog_id     INT          NOT NULL,
    keyword     VARCHAR(100) NOT NULL,

    UNIQUE (blog_id, keyword),

    CONSTRAINT fk_blog_keyword
        FOREIGN KEY (blog_id) REFERENCES blog(id) ON DELETE CASCADE
);

CREATE TABLE tutorial_image (
    id          SERIAL PRIMARY KEY,
    tutorial_id INT          NOT NULL,
    image_url   VARCHAR(255) NOT NULL,

    UNIQUE (tutorial_id, image_url),

    CONSTRAINT fk_tutorial_image
        FOREIGN KEY (tutorial_id) REFERENCES tutorial(id) ON DELETE CASCADE
);

CREATE TABLE project_diagram (
    id          SERIAL PRIMARY KEY,
    project_id  INT          NOT NULL,
    diagram_url VARCHAR(255) NOT NULL,

    -- FIX M3: Added UNIQUE constraint to match blog_image and tutorial_image pattern.
    UNIQUE (project_id, diagram_url),

    CONSTRAINT fk_project_diagram
        FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE
);

CREATE TABLE event_image (
    id          SERIAL PRIMARY KEY,
    event_id    INT          NOT NULL,
    image_url   VARCHAR(255) NOT NULL,

    -- FIX M3: Added UNIQUE constraint to match blog_image and tutorial_image pattern.
    UNIQUE (event_id, image_url),

    CONSTRAINT fk_event_image
        FOREIGN KEY (event_id) REFERENCES event(id) ON DELETE CASCADE
);

-- ─── Auto-update Triggers ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_blog
    BEFORE UPDATE ON blog
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_tutorial
    BEFORE UPDATE ON tutorial
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_project
    BEFORE UPDATE ON project
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_event
    BEFORE UPDATE ON event
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_grant
    BEFORE UPDATE ON grant_info
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_publication
    BEFORE UPDATE ON publication
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- FIX D5: updated_at triggers for researcher and research_assistant profile tables.
CREATE OR REPLACE FUNCTION trigger_set_updated_at_simple()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_researcher
    BEFORE UPDATE ON researcher
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at_simple();

CREATE TRIGGER set_updated_at_research_assistant
    BEFORE UPDATE ON research_assistant
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at_simple();

-- ─── FK Indexes ───────────────────────────────────────────────────────────────
-- FIX M4: Supabase auto-creates PK indexes but not FK indexes.
-- Every FK column in every table gets an explicit index below.

-- member
CREATE INDEX idx_member_auth_user_id             ON member(auth_user_id);

-- researcher
CREATE INDEX idx_researcher_approved_by          ON researcher(approved_by_admin_id);

-- research_assistant
CREATE INDEX idx_ra_assigned_by_researcher       ON research_assistant(assigned_by_researcher_id);
CREATE INDEX idx_ra_approved_by                  ON research_assistant(approved_by_admin_id);

-- former_member
CREATE INDEX idx_former_member_resignation_by    ON former_member(resignation_approved_by);

-- educational_background
CREATE INDEX idx_edu_background_researcher       ON educational_background(researcher_id);

-- ongoing_research
CREATE INDEX idx_ongoing_research_researcher     ON ongoing_research(researcher_id);

-- blog
CREATE INDEX idx_blog_created_by_member          ON blog(created_by_member_id);
CREATE INDEX idx_blog_created_by_former_member   ON blog(created_by_former_member_id);
CREATE INDEX idx_blog_reviewed_by_researcher     ON blog(reviewed_by_researcher_id);
CREATE INDEX idx_blog_approved_by                ON blog(approved_by_admin_id);

-- tutorial
CREATE INDEX idx_tutorial_created_by_member      ON tutorial(created_by_member_id);
CREATE INDEX idx_tutorial_reviewed_by_researcher ON tutorial(reviewed_by_researcher_id);
CREATE INDEX idx_tutorial_approved_by            ON tutorial(approved_by_admin_id);

-- project
CREATE INDEX idx_project_created_by_member       ON project(created_by_member_id);
CREATE INDEX idx_project_reviewed_by_researcher  ON project(reviewed_by_researcher_id);
CREATE INDEX idx_project_approved_by             ON project(approved_by_admin_id);

-- event
CREATE INDEX idx_event_created_by_researcher     ON event(created_by_researcher);
CREATE INDEX idx_event_approved_by               ON event(approved_by_admin_id);

-- grant_info
CREATE INDEX idx_grant_created_by_researcher     ON grant_info(created_by_researcher);
CREATE INDEX idx_grant_approved_by               ON grant_info(approved_by_admin_id);

-- grant_document
CREATE INDEX idx_grant_document_grant_id         ON grant_document(grant_id);

-- publication
CREATE INDEX idx_publication_created_by_member       ON publication(created_by_member_id);
CREATE INDEX idx_publication_reviewed_by_researcher  ON publication(reviewed_by_researcher_id);
CREATE INDEX idx_publication_approved_by             ON publication(approved_by_admin_id);

-- blog_image
CREATE INDEX idx_blog_image_blog_id              ON blog_image(blog_id);

-- blog_keyword
CREATE INDEX idx_blog_keyword_blog_id            ON blog_keyword(blog_id);

-- tutorial_image
CREATE INDEX idx_tutorial_image_tutorial_id      ON tutorial_image(tutorial_id);

-- project_diagram
CREATE INDEX idx_project_diagram_project_id      ON project_diagram(project_id);

-- event_image
CREATE INDEX idx_event_image_event_id            ON event_image(event_id);