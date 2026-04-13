// ─────────────────────────────────────────────────────────────────────────────
// api.ts — Custom Axios instance for BrAIN Labs frontend-to-backend API calls.
// Defines new types aligned with schema(2).sql and Express API endpoints.
// ─────────────────────────────────────────────────────────────────────────────
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject Bearer token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('brain_labs_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Guard to prevent multiple concurrent 401 handling (avoids infinite redirect loop)
let is401Handling = false;

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const url: string = error.config?.url ?? '';
    const isAuthRoute = url.includes('/auth/login') || url.includes('/auth/register');

    if (error.response?.status === 401 && !isAuthRoute && !is401Handling) {
      is401Handling = true;
      localStorage.removeItem('brain_labs_token');
      localStorage.removeItem('brain_labs_auth');
      // Use a DOM event so React Router handles navigation (no full-page reload)
      window.dispatchEvent(new CustomEvent('brain:session-expired'));
      setTimeout(() => { is401Handling = false; }, 5_000);
    }
    return Promise.reject(error);
  }
);

// ─── Types (aligned to schema(2).sql) ────────────────────────────────────────

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type MemberRole = 'admin' | 'researcher' | 'research_assistant' | 'pending';

export interface BaseMember {
  id: number;
  first_name: string;
  second_name: string;
  contact_email: string;
  slug: string;
  created_at: string;
  role: MemberRole;
  approval_status: ApprovalStatus | null; // Only for researchers and research assistants; null for admins
}

export interface Profile extends BaseMember {
  role_detail?: {
    country?: string;
    linkedin_url?: string;
    image_url?: string;
    bio?: string;
    occupation?: string;
    workplace?: string;
    approval_status?: ApprovalStatus;
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
  description: string;
  content: string;
  approval_status: ApprovalStatus;
  created_at: string;
  updated_at: string;
  created_by_member_id: number | null;
  created_by_former_member_id: number | null;
  blog_keyword?: { keyword: string }[];
  blog_image?: { image_url: string }[];
}

export interface Tutorial {
  id: number;
  title: string;
  content: string;
  description: string;
  approval_status: ApprovalStatus;
  created_at: string;
  updated_at: string;
  tutorial_image?: { image_url: string }[];
}

export interface Project {
  id: number;
  title: string;
  description: string;
  approval_status: ApprovalStatus;
  created_at: string;
  updated_at: string;
  project_diagram?: { diagram_url: string }[];
}

export interface Event {
  id: number;
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  premises: string;
  host: string;
  approval_status: ApprovalStatus;
  created_at: string;
  event_image?: { image_url: string }[];
}

export interface Grant {
  id: number;
  title: string;
  description: string;
  legal_docs: string;
  passed_date: string;
  expire_date: string;
  approval_status: ApprovalStatus;
  created_at: string;
}

export type PublicationType = 'CONFERENCE' | 'BOOK' | 'JOURNAL' | 'ARTICLE';

export interface Publication {
  id: number;
  title: string;
  authors?: string;
  publication_year?: number;
  approval_status: ApprovalStatus;
  created_at: string;
  type?: PublicationType;
  conference_paper?: { paper_id: string; link?: string; description?: string };
  book?: { isbn: string; link?: string; description?: string };
  journal?: { issn: string; link?: string; description?: string };
  article?: { doi: string; link?: string; description?: string };
}

// ─── API Methods ──────────────────────────────────────────────────────────────

export const api = {
  me: {
    get: () => apiClient.get<Profile>('/me').then(res => res.data),
    update: (data: Partial<Profile['role_detail']> & Pick<Profile, 'first_name' | 'second_name'>) => apiClient.put('/me', data).then(res => res.data),
    addEducation: (degree: string) => apiClient.post<EducationalBackground>('/me/education', { degree }).then(res => res.data),
    removeEducation: (id: number) => apiClient.delete(`/me/education/${id}`).then(res => res.data),
    addOngoingResearch: (title: string) => apiClient.post<OngoingResearch>('/me/ongoing-research', { title }).then(res => res.data),
    removeOngoingResearch: (id: number) => apiClient.delete(`/me/ongoing-research/${id}`).then(res => res.data),
    changePassword: (data: any) => apiClient.post('/me/change-password', data).then(res => res.data),
  },
  admin: {
    getMembers: () => apiClient.get<BaseMember[]>('/admin/members').then(res => res.data),
    getMemberDetails: (id: number) => apiClient.get<Profile>(`/admin/members/${id}`).then(res => res.data),
    approveMember: (id: number) => apiClient.patch(`/admin/members/${id}/approve`).then(res => res.data),
    rejectMember: (id: number) => apiClient.patch(`/admin/members/${id}/reject`).then(res => res.data),
    getPendingContent: () => apiClient.get<Record<string, any[]>>('/admin/content/pending').then(res => res.data),
    approveContent: (table: string, id: number) => apiClient.patch(`/admin/content/${table}/${id}/approve`).then(res => res.data),
    rejectContent: (table: string, id: number) => apiClient.patch(`/admin/content/${table}/${id}/reject`).then(res => res.data),
  },
  blogs: {
    list: () => apiClient.get<Blog[]>('/blogs').then(res => res.data),
    get: (id: number) => apiClient.get<Blog>(`/blogs/${id}`).then(res => res.data),
    create: (data: Partial<Blog>) => apiClient.post<Blog>('/blogs', data).then(res => res.data),
    update: (id: number, data: Partial<Blog>) => apiClient.put<Blog>(`/blogs/${id}`, data).then(res => res.data),
    delete: (id: number) => apiClient.delete(`/blogs/${id}`).then(res => res.data),
  },
  events: {
    list: () => apiClient.get<Event[]>('/events').then(res => res.data),
    get: (id: number) => apiClient.get<Event>(`/events/${id}`).then(res => res.data),
    create: (data: Partial<Event>) => apiClient.post<Event>('/events', data).then(res => res.data),
    update: (id: number, data: Partial<Event>) => apiClient.put<Event>(`/events/${id}`, data).then(res => res.data),
    delete: (id: number) => apiClient.delete(`/events/${id}`).then(res => res.data),
  },
  grants: {
    list: () => apiClient.get<Grant[]>('/grants').then(res => res.data),
    get: (id: number) => apiClient.get<Grant>(`/grants/${id}`).then(res => res.data),
    create: (data: Partial<Grant>) => apiClient.post<Grant>('/grants', data).then(res => res.data),
    update: (id: number, data: Partial<Grant>) => apiClient.put<Grant>(`/grants/${id}`, data).then(res => res.data),
    delete: (id: number) => apiClient.delete(`/grants/${id}`).then(res => res.data),
  },
  projects: {
    list: () => apiClient.get<Project[]>('/projects').then(res => res.data),
    get: (id: number) => apiClient.get<Project>(`/projects/${id}`).then(res => res.data),
    create: (data: Partial<Project>) => apiClient.post<Project>('/projects', data).then(res => res.data),
    update: (id: number, data: Partial<Project>) => apiClient.put<Project>(`/projects/${id}`, data).then(res => res.data),
    delete: (id: number) => apiClient.delete(`/projects/${id}`).then(res => res.data),
  },
  tutorials: {
    list: () => apiClient.get<Tutorial[]>('/tutorials').then(res => res.data),
    get: (id: number) => apiClient.get<Tutorial>(`/tutorials/${id}`).then(res => res.data),
    create: (data: Partial<Tutorial>) => apiClient.post<Tutorial>('/tutorials', data).then(res => res.data),
    update: (id: number, data: Partial<Tutorial>) => apiClient.put<Tutorial>(`/tutorials/${id}`, data).then(res => res.data),
    delete: (id: number) => apiClient.delete(`/tutorials/${id}`).then(res => res.data),
  },
  publications: {
    list: () => apiClient.get<Publication[]>('/publications').then(res => res.data),
    get: (id: number) => apiClient.get<Publication>(`/publications/${id}`).then(res => res.data),
    create: (data: Partial<Publication>) => apiClient.post<Publication>('/publications', data).then(res => res.data),
    update: (id: number, data: Partial<Publication>) => apiClient.put<Publication>(`/publications/${id}`, data).then(res => res.data),
    delete: (id: number) => apiClient.delete(`/publications/${id}`).then(res => res.data),
    linkSubtype: (id: number, subtype: string, data: any) => apiClient.post(`/publications/${id}/${subtype}`, data).then(res => res.data),
  }
};
