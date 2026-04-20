// src/api/index.ts

import axios from 'axios';
import type {
  Profile, Blog, Tutorial, Project, Event, Grant, Publication,
  BaseMember, EducationalBackground, OngoingResearch
} from '../types';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ── Single source of truth for the auth token ───────────────────────────────
// useAuth.ts calls setAuthToken on login / logout / rehydration.
// The interceptor below always reads this in-memory value so there is no
// second localStorage key that can fall out of sync.

let _authToken: string | null = null;

export function setAuthToken(token: string | null) {
  _authToken = token;
}

// ── Request interceptor — attach Bearer token ────────────────────────────────
apiClient.interceptors.request.use((config) => {
  let token = _authToken;
  
  // Hard fallback to localStorage to survive Vite HMR clearing module variables
  // seamlessly avoiding circular dependencies with useAuth.ts
  if (!token) {
    try {
      const persisted = localStorage.getItem("brain_labs_auth");
      if (persisted) {
        token = JSON.parse(persisted).state?.token;
      }
    } catch (e) {
      // ignore parse errors
    }
  }

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor — handle session expiry ─────────────────────────────
let _handling401 = false;

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url ?? '';
    const isAuthRoute = url.includes('/auth/login') || url.includes('/auth/register');

    if (error.response?.status === 401 && !isAuthRoute && !_handling401) {
      _handling401 = true;
      window.dispatchEvent(new CustomEvent('brain:session-expired'));
      setTimeout(() => { _handling401 = false; }, 5_000);
    }
    return Promise.reject(error);
  }
);

// ── Data helper ───────────────────────────────────────────────────────────────
const data = <T>(res: { data: T }) => res.data;

// ── API surface ───────────────────────────────────────────────────────────────
export const api = {
  me: {
    get: () => apiClient.get<Profile>('/me').then(data),
    update: (payload: any) => apiClient.put('/me', payload).then(data),
    addEducation: (degree: string) => apiClient.post<EducationalBackground>('/me/education', { degree }).then(data),
    removeEducation: (id: number) => apiClient.delete(`/me/education/${id}`).then(data),
    addOngoingResearch: (title: string) => apiClient.post<OngoingResearch>('/me/ongoing-research', { title }).then(data),
    removeOngoingResearch: (id: number) => apiClient.delete(`/me/ongoing-research/${id}`).then(data),
    changePassword: (payload: any) => apiClient.post('/me/change-password', payload).then(data),
    updateSupervisor: (assigned_by_researcher_id: number) =>
      apiClient.patch('/me/supervisor', { assigned_by_researcher_id }).then(data),
    mySupervisor: () => apiClient.get('/me/my-supervisor').then(data),
    myAssistants: () => apiClient.get<any[]>('/me/my-assistants').then(data),
    removeAssistant: (raId: number) => apiClient.delete(`/me/my-assistants/${raId}`).then(data),
    availableAssistants: (q?: string) => apiClient.get<any[]>(`/me/available-assistants${q ? `?q=${encodeURIComponent(q)}` : ''}`).then(data),
    assignAssistant: (ra_member_id: number, research_id?: number) => 
      apiClient.post('/me/my-assistants', { ra_member_id, research_id }).then(data),
  },
  admin: {
    getMembers: () => apiClient.get<BaseMember[]>('/admin/members').then(data),
    getMemberDetails: (id: number) => apiClient.get<Profile>(`/admin/members/${id}`).then(data),
    approveMember: (id: number) => apiClient.patch(`/admin/members/${id}/approve`).then(data),
    rejectMember: (id: number) => apiClient.patch(`/admin/members/${id}/reject`).then(data),
    getPendingContent: () => apiClient.get<Record<string, any[]>>('/admin/content/pending').then(data),
    approveContent: (table: string, id: number) => apiClient.patch(`/admin/content/${table}/${id}/approve`).then(data),
    rejectContent: (table: string, id: number) => apiClient.patch(`/admin/content/${table}/${id}/reject`).then(data),
  },
  content: {
    submit: (table: string, id: number) => apiClient.patch(`/content/${table}/${id}/submit`).then(data),
    review: (table: string, id: number, status: 'PENDING_ADMIN' | 'REJECTED') =>
      apiClient.patch(`/content/${table}/${id}/review`, { status }).then(data),
    getResearcherReviews: () => apiClient.get<Record<string, any[]>>('/content/researcher/reviews').then(data),
  },
  blogs: {
    list: () => apiClient.get<Blog[]>('/blogs').then(data),
    get: (id: number) => apiClient.get<Blog>(`/blogs/${id}`).then(data),
    create: (payload: Partial<Blog>) => apiClient.post<Blog>('/blogs', payload).then(data),
    update: (id: number, payload: Partial<Blog>) => apiClient.put<Blog>(`/blogs/${id}`, payload).then(data),
    delete: (id: number) => apiClient.delete(`/blogs/${id}`).then(data),
    addKeyword: (id: number, keyword: string) =>
      apiClient.post(`/blogs/${id}/keywords`, { keyword }).then(data),
    removeKeyword: (id: number, kwId: number) =>
      apiClient.delete(`/blogs/${id}/keywords/${kwId}`).then(data),
    addImage: (id: number, image_url: string) =>
      apiClient.post(`/blogs/${id}/images`, { image_url }).then(data),
    removeImage: (id: number, imgId: number) =>
      apiClient.delete(`/blogs/${id}/images/${imgId}`).then(data),
  },
  events: {
    list: () => apiClient.get<Event[]>('/events').then(data),
    get: (id: number) => apiClient.get<Event>(`/events/${id}`).then(data),
    create: (payload: Partial<Event>) => apiClient.post<Event>('/events', payload).then(data),
    update: (id: number, payload: Partial<Event>) => apiClient.put<Event>(`/events/${id}`, payload).then(data),
    delete: (id: number) => apiClient.delete(`/events/${id}`).then(data),
  },
  grants: {
    list: () => apiClient.get<Grant[]>('/grants').then(data),
    get: (id: number) => apiClient.get<Grant>(`/grants/${id}`).then(data),
    create: (payload: Partial<Grant>) => apiClient.post<Grant>('/grants', payload).then(data),
    update: (id: number, payload: Partial<Grant>) => apiClient.put<Grant>(`/grants/${id}`, payload).then(data),
    delete: (id: number) => apiClient.delete(`/grants/${id}`).then(data),
    addDocument: (grantId: number, doc: { doc_url: string; doc_label?: string }) =>
      apiClient.post(`/grants/${grantId}/documents`, doc).then(data),
    removeDocument: (grantId: number, docId: number) =>
      apiClient.delete(`/grants/${grantId}/documents/${docId}`).then(data),
  },
  projects: {
    list: () => apiClient.get<Project[]>('/projects').then(data),
    get: (id: number) => apiClient.get<Project>(`/projects/${id}`).then(data),
    create: (payload: Partial<Project>) => apiClient.post<Project>('/projects', payload).then(data),
    update: (id: number, payload: Partial<Project>) => apiClient.put<Project>(`/projects/${id}`, payload).then(data),
    delete: (id: number) => apiClient.delete(`/projects/${id}`).then(data),
    addDiagram: (id: number, diagram_url: string) =>
      apiClient.post(`/projects/${id}/diagrams`, { diagram_url }).then(data),
    removeDiagram: (id: number, diagId: number) =>
      apiClient.delete(`/projects/${id}/diagrams/${diagId}`).then(data),
  },
  tutorials: {
    list: () => apiClient.get<Tutorial[]>('/tutorials').then(data),
    get: (id: number) => apiClient.get<Tutorial>(`/tutorials/${id}`).then(data),
    create: (payload: Partial<Tutorial>) => apiClient.post<Tutorial>('/tutorials', payload).then(data),
    update: (id: number, payload: Partial<Tutorial>) => apiClient.put<Tutorial>(`/tutorials/${id}`, payload).then(data),
    delete: (id: number) => apiClient.delete(`/tutorials/${id}`).then(data),
    addImage: (id: number, image_url: string) =>
      apiClient.post(`/tutorials/${id}/images`, { image_url }).then(data),
    removeImage: (id: number, imgId: number) =>
      apiClient.delete(`/tutorials/${id}/images/${imgId}`).then(data),
  },
  publications: {
    list: () => apiClient.get<Publication[]>('/publications').then(data),
    get: (id: number) => apiClient.get<Publication>(`/publications/${id}`).then(data),
    create: (payload: Partial<Publication>) => apiClient.post<Publication>('/publications', payload).then(data),
    update: (id: number, payload: Partial<Publication>) => apiClient.put<Publication>(`/publications/${id}`, payload).then(data),
    delete: (id: number) => apiClient.delete(`/publications/${id}`).then(data),
    linkSubtype: (id: number, subtype: 'conference-paper' | 'book' | 'journal' | 'article', subtypeData: any) =>
      apiClient.post(`/publications/${id}/${subtype}`, subtypeData).then(data),
  },
};
