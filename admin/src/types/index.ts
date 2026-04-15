// src/types/index.ts — Shared TypeScript interfaces and enums

export type ApprovalStatus = 'DRAFT' | 'PENDING_RESEARCHER' | 'PENDING_ADMIN' | 'APPROVED' | 'REJECTED';
export type MemberRole = 'admin' | 'researcher' | 'research_assistant' | 'pending_setup' | 'pending';
export type FormerRole = 'RESEARCHER' | 'RESEARCH_ASSISTANT';

export interface BaseMember {
  id: number;
  first_name: string;
  second_name: string;
  contact_email: string;
  slug: string;
  created_at: string;
  role: MemberRole;
  approval_status: ApprovalStatus; 
}

export interface Profile extends BaseMember {
  role_detail?: {
    assigned_by_researcher_id?: number;
    country?: string;
    linkedin_url?: string;
    image_url?: string;
    bio?: string;
    occupation?: string;
    workplace?: string;
    approval_status?: ApprovalStatus;
    updated_at?: string;
    education?: EducationalBackground[];
    ongoing_research?: OngoingResearch[];
  }
}

export interface EducationalBackground {
  id: number;
  researcher_id: number;
  degree: string;
}

export interface OngoingResearch {
  id: number;
  researcher_id: number;
  title: string;
}

export interface Blog {
  id: number;
  title: string;
  description?: string;
  content: string;
  created_by_member_id?: number | null;
  created_by_former_member_id?: number | null;
  reviewed_by_researcher_id?: number | null;
  approval_status: ApprovalStatus;
  approved_by_admin_id?: number | null;
  created_at: string;
  updated_at: string;
  keywords?: { id: number; keyword: string }[];    // blog_keyword table rows
  images?: { id: number; image_url: string }[];     // blog_image table rows
  blog_keyword?: { id: number; keyword: string }[]; // raw Supabase key
  blog_image?: { id: number; image_url: string }[]; // raw Supabase key
}

export interface Tutorial {
  id: number;
  title: string;
  description?: string;
  content: string;
  created_by_member_id?: number | null;
  reviewed_by_researcher_id?: number | null;
  approval_status: ApprovalStatus;
  approved_by_admin_id?: number | null;
  created_at: string;
  updated_at: string;
  images?: { id: number; image_url: string }[];
}

export interface Project {
  id: number;
  title: string;
  description?: string;
  content?: string; // FIX D6
  created_by_member_id?: number | null;
  reviewed_by_researcher_id?: number | null;
  approval_status: ApprovalStatus;
  approved_by_admin_id?: number | null;
  created_at: string;
  updated_at: string;
  diagrams?: { id: number; diagram_url: string }[];
}

export interface Event {
  id: number;
  title: string;
  event_type?: string;
  description?: string;
  event_datetime: string; // FIX M2
  premises: string;
  host: string;
  created_by_researcher?: number | null;
  approval_status: ApprovalStatus;
  approved_by_admin_id?: number | null;
  created_at: string;
  updated_at: string;
  images?: { id: number; image_url: string }[];
}

export interface Grant {
  id: number;
  title: string;
  description?: string;
  passed_date?: string;
  expire_date?: string;
  created_by_researcher?: number | null;
  approval_status: ApprovalStatus;
  approved_by_admin_id?: number | null;
  created_at: string;
  updated_at: string;
  documents?: { id: number; doc_url: string; doc_label?: string }[];
}

export type PublicationType = 'CONFERENCE' | 'BOOK' | 'JOURNAL' | 'ARTICLE';

export interface Publication {
  id: number;
  title: string;
  authors?: string;
  publication_year?: number;
  created_by_member_id?: number | null;
  reviewed_by_researcher_id?: number | null;
  approval_status: ApprovalStatus;
  approved_by_admin_id?: number | null;
  created_at: string;
  updated_at: string;
  type?: PublicationType;
  conference_paper?: { paper_id: string; link?: string; description?: string };
  book?: { isbn: string; link?: string; description?: string };
  journal?: { issn: string; link?: string; description?: string };
  article?: { doi: string; link?: string; description?: string };
}
