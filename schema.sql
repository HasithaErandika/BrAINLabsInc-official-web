-- This is the new Schema

CREATE TYPE approval_status_enum AS ENUM ('PENDING', 'APPROVED', 'REJECTED');


CREATE TABLE member (
    id                  SERIAL PRIMARY KEY,
    first_name          VARCHAR(100)        NOT NULL,
    second_name         VARCHAR(100)        NOT NULL,
    contact_email       VARCHAR(150) UNIQUE NOT NULL,
    slug                VARCHAR(150) UNIQUE NOT NULL,
    auth_user_id        UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at          TIMESTAMPTZ         DEFAULT NOW()
);

-- Identity tables are managed by the Express backend via service_role.
ALTER TABLE member DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin DISABLE ROW LEVEL SECURITY;
ALTER TABLE researcher DISABLE ROW LEVEL SECURITY;
ALTER TABLE research_assistant DISABLE ROW LEVEL SECURITY;


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

    -- Admin approval to access the system
    approval_status         approval_status_enum    DEFAULT 'PENDING',
    approved_by_admin_id    INT,

    CONSTRAINT fk_researcher_member
        FOREIGN KEY (member_id)             REFERENCES member(id)       ON DELETE CASCADE,
    CONSTRAINT fk_researcher_approved_by
        FOREIGN KEY (approved_by_admin_id)  REFERENCES admin(member_id) ON DELETE SET NULL
);

-- Research Assistant is a specialisation of member (ISA)
CREATE TABLE research_assistant (
    member_id                   INT PRIMARY KEY,
    assigned_by_researcher_id   INT,

    -- Admin approval to access the system
    approval_status             approval_status_enum    DEFAULT 'PENDING',
    approved_by_admin_id        INT,

    CONSTRAINT fk_ra_member
        FOREIGN KEY (member_id)                 REFERENCES member(id)               ON DELETE CASCADE,
    CONSTRAINT fk_ra_assigned_by
        FOREIGN KEY (assigned_by_researcher_id) REFERENCES researcher(member_id)    ON DELETE SET NULL,
    CONSTRAINT fk_ra_approved_by
        FOREIGN KEY (approved_by_admin_id)      REFERENCES admin(member_id)         ON DELETE SET NULL
);

-- Former Member is a specialisation of member (ISA).
-- Stores all members who have resigned (both Researchers and RAs).
-- The original researcher / research_assistant row is deleted on resignation;
-- this table acts as the permanent archive.
CREATE TABLE former_member (
    member_id               INT PRIMARY KEY,

    -- Which role they held before resigning
    former_role             VARCHAR(50)  NOT NULL CHECK (former_role IN ('RESEARCHER', 'RESEARCH_ASSISTANT')),

    -- Resignation workflow
    resign_date             DATE         NOT NULL,
    resignation_approved_by INT,

    -- Archive of working period (derived from member.created_at → resign_date,
    -- stored explicitly so it survives the member row's soft state)
    working_period_start    DATE         NOT NULL,
    working_period_end      DATE         NOT NULL,

    CONSTRAINT fk_former_member
        FOREIGN KEY (member_id)                 REFERENCES member(id)       ON DELETE CASCADE,
    CONSTRAINT fk_former_approved_by
        FOREIGN KEY (resignation_approved_by)   REFERENCES admin(member_id) ON DELETE SET NULL
);


-- Multivalued: a researcher may hold multiple degrees
CREATE TABLE educational_background (
    id              SERIAL PRIMARY KEY,
    researcher_id   INT         NOT NULL,
    degree          VARCHAR(150) NOT NULL,  -- e.g. BSc, MBBS, BA

    CONSTRAINT fk_edu_researcher
        FOREIGN KEY (researcher_id) REFERENCES researcher(member_id) ON DELETE CASCADE
);

-- Multivalued: a researcher may have multiple ongoing research topics
CREATE TABLE ongoing_research (
    id              SERIAL PRIMARY KEY,
    researcher_id   INT         NOT NULL,
    title           VARCHAR(255) NOT NULL,

    CONSTRAINT fk_ongoing_researcher
        FOREIGN KEY (researcher_id) REFERENCES researcher(member_id) ON DELETE CASCADE
);


-- Blog: created by Researchers, Research Assistants, OR Former Members
CREATE TABLE blog (
    id                  SERIAL PRIMARY KEY,
    title               VARCHAR(255)            NOT NULL,
    content             TEXT                    NOT NULL,
    description         TEXT,

    -- Nullable to allow former members; enforce at app layer which of the
    -- three FKs is populated (exactly one must be non-null)
    created_by_member_id        INT,    -- Researcher or Research Assistant
    created_by_former_member_id INT,    -- Former Member

    approval_status     approval_status_enum    DEFAULT 'PENDING',
    approved_by_admin_id INT,

    created_at          TIMESTAMPTZ             DEFAULT NOW(),
    updated_at          TIMESTAMPTZ             DEFAULT NOW(),

    CONSTRAINT blog_creator_check
        CHECK (
            (created_by_member_id IS NOT NULL AND created_by_former_member_id IS NULL)
            OR
            (created_by_member_id IS NULL AND created_by_former_member_id IS NOT NULL)
        ),

    CONSTRAINT fk_blog_member
        FOREIGN KEY (created_by_member_id)          REFERENCES member(id)           ON DELETE CASCADE,
    CONSTRAINT fk_blog_former_member
        FOREIGN KEY (created_by_former_member_id)   REFERENCES former_member(member_id) ON DELETE CASCADE,
    CONSTRAINT fk_blog_approved_by
        FOREIGN KEY (approved_by_admin_id)          REFERENCES admin(member_id)     ON DELETE SET NULL
);

CREATE TABLE tutorial (
    id                      SERIAL PRIMARY KEY,
    description             TEXT,
    content                 TEXT                    NOT NULL,
    created_by_member_id    INT                     NOT NULL,

    approval_status         approval_status_enum    DEFAULT 'PENDING',
    approved_by_admin_id    INT,

    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT fk_tutorial_member
        FOREIGN KEY (created_by_member_id)  REFERENCES member(id)       ON DELETE CASCADE,
    CONSTRAINT fk_tutorial_approved_by
        FOREIGN KEY (approved_by_admin_id)  REFERENCES admin(member_id) ON DELETE SET NULL
);

CREATE TABLE project (
    id                      SERIAL PRIMARY KEY,
    title                   VARCHAR(255)            NOT NULL,
    description             TEXT,
    created_by_member_id    INT                     NOT NULL,

    approval_status         approval_status_enum    DEFAULT 'PENDING',
    approved_by_admin_id    INT,

    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT fk_project_member
        FOREIGN KEY (created_by_member_id)  REFERENCES member(id)       ON DELETE CASCADE,
    CONSTRAINT fk_project_approved_by
        FOREIGN KEY (approved_by_admin_id)  REFERENCES admin(member_id) ON DELETE SET NULL
);


--Can be accessed by Researcher only

CREATE TABLE event (
    id                      SERIAL PRIMARY KEY,
    title                   VARCHAR(255)            NOT NULL,
    description             TEXT,
    event_date              DATE                    NOT NULL,
    event_time              TIME                    NOT NULL,
    premises                VARCHAR(255)            NOT NULL,
    host                    VARCHAR(150)            NOT NULL,

    -- FK to researcher directly — enforces that only Researchers can create
    created_by_researcher   INT                     NOT NULL,

    approval_status         approval_status_enum    DEFAULT 'PENDING',
    approved_by_admin_id    INT,

    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT fk_event_researcher
        FOREIGN KEY (created_by_researcher) REFERENCES researcher(member_id) ON DELETE CASCADE,
    CONSTRAINT fk_event_approved_by
        FOREIGN KEY (approved_by_admin_id)  REFERENCES admin(member_id)      ON DELETE SET NULL
);

CREATE TABLE grant_info (
    id                      SERIAL PRIMARY KEY,
    title                   VARCHAR(255)            NOT NULL,
    description             TEXT,
    legal_docs              VARCHAR(255),
    passed_date             DATE,
    expire_date             DATE,

    -- FK to researcher directly — enforces that only Researchers can create
    created_by_researcher   INT                     NOT NULL,

    approval_status         approval_status_enum    DEFAULT 'PENDING',
    approved_by_admin_id    INT,

    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT fk_grant_researcher
        FOREIGN KEY (created_by_researcher) REFERENCES researcher(member_id) ON DELETE CASCADE,
    CONSTRAINT fk_grant_approved_by
        FOREIGN KEY (approved_by_admin_id)  REFERENCES admin(member_id)      ON DELETE SET NULL
);


--Publication(Before ISA)

CREATE TABLE publication (
    id                      SERIAL PRIMARY KEY,
    title                   VARCHAR(255)            NOT NULL,
    created_by_member_id    INT                     NOT NULL,

    approval_status         approval_status_enum    DEFAULT 'PENDING',
    approved_by_admin_id    INT,

    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT fk_publication_member
        FOREIGN KEY (created_by_member_id)  REFERENCES member(id)       ON DELETE CASCADE,
    CONSTRAINT fk_publication_approved_by
        FOREIGN KEY (approved_by_admin_id)  REFERENCES admin(member_id) ON DELETE SET NULL
);

CREATE TABLE conference_paper (
    publication_id  INT PRIMARY KEY,
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


--Media attributes for Blog, Tutorial, Project, Event

CREATE TABLE blog_image (
    id          SERIAL PRIMARY KEY,
    blog_id     INT             NOT NULL,
    image_url   VARCHAR(255)    NOT NULL,

    CONSTRAINT fk_blog_image
        FOREIGN KEY (blog_id) REFERENCES blog(id) ON DELETE CASCADE
);

CREATE TABLE blog_keyword (
    id          SERIAL PRIMARY KEY,
    blog_id     INT             NOT NULL,
    keyword     VARCHAR(100)    NOT NULL,

    CONSTRAINT fk_blog_keyword
        FOREIGN KEY (blog_id) REFERENCES blog(id) ON DELETE CASCADE
);

CREATE TABLE tutorial_image (
    id          SERIAL PRIMARY KEY,
    tutorial_id INT             NOT NULL,
    image_url   VARCHAR(255)    NOT NULL,

    CONSTRAINT fk_tutorial_image
        FOREIGN KEY (tutorial_id) REFERENCES tutorial(id) ON DELETE CASCADE
);

CREATE TABLE project_diagram (
    id          SERIAL PRIMARY KEY,
    project_id  INT             NOT NULL,
    diagram_url VARCHAR(255)    NOT NULL,

    CONSTRAINT fk_project_diagram
        FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE
);

CREATE TABLE event_image (
    id          SERIAL PRIMARY KEY,
    event_id    INT             NOT NULL,
    image_url   VARCHAR(255)    NOT NULL,

    CONSTRAINT fk_event_image
        FOREIGN KEY (event_id) REFERENCES event(id) ON DELETE CASCADE
);


--Triggers

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
