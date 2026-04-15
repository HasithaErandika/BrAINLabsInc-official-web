import { useEffect, useState, useCallback } from "react";
import {
  BookOpen, FlaskConical, CheckCircle2, Briefcase, ArrowRight, FileText,
  Microscope, Clock, Inbox, Users, Mail, Trash2, UserX,
  UserPlus, Search, X, UserCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { useAuth } from "../../hooks/useAuth";
import { Badge } from "../../components/ui/Badge";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

interface Stats {
  publications: number;
  projects: number;
  grants: number;
  completeness: number;
  pendingReview: number;
}

interface RA {
  id: number;
  member_id: number;
  first_name: string;
  second_name: string;
  contact_email: string;
  approval_status: string;
  already_mine?: boolean;
  assigned_by_researcher_id?: number | null;
}

export function ResearcherDashboard({ memberId }: { memberId: number }) {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    publications: 0, projects: 0, grants: 0, completeness: 0, pendingReview: 0,
  });
  const [loading, setLoading] = useState(true);

  // My assistants
  const [assistants, setAssistants]           = useState<RA[]>([]);
  const [assistantsLoading, setAssistantsLoading] = useState(true);
  const [removingId, setRemovingId]           = useState<number | null>(null);

  // Find & assign panel
  const [showAssignPanel, setShowAssignPanel] = useState(false);
  const [searchQ, setSearchQ]                 = useState("");
  const [searchResults, setSearchResults]     = useState<RA[]>([]);
  const [searchLoading, setSearchLoading]     = useState(false);
  const [assigningId, setAssigningId]         = useState<number | null>(null);

  // ── Stats
  useEffect(() => {
    (async () => {
      try {
        const [pubs, projs, grants, profile] = await Promise.all([
          api.publications.list(),
          api.projects.list(),
          api.grants.list(),
          api.me.get(),
        ]);
        const rd = profile.role_detail;
        const sections = [
          !!rd?.country, !!rd?.linkedin_url, !!rd?.image_url,
          !!rd?.bio, !!rd?.occupation, !!rd?.workplace,
        ];
        setStats({
          publications: pubs.filter((p: any) => p.created_by_member_id === memberId).length,
          projects:     projs.filter((p: any) => p.created_by_member_id === memberId).length,
          grants:       grants.filter((g: any) => g.created_by_researcher === memberId).length,
          completeness: Math.round((sections.filter(Boolean).length / sections.length) * 100),
          pendingReview:
            pubs.filter((p: any) => p.approval_status === "PENDING_RESEARCHER").length +
            projs.filter((p: any) => p.approval_status === "PENDING_RESEARCHER").length,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [memberId]);

  // ── My assistants
  const fetchAssistants = useCallback(() => {
    setAssistantsLoading(true);
    api.me.myAssistants()
      .then((list: any) => setAssistants(Array.isArray(list) ? list : []))
      .catch(() => setAssistants([]))
      .finally(() => setAssistantsLoading(false));
  }, []);

  useEffect(() => { fetchAssistants(); }, [fetchAssistants]);

  // ── Search available RAs
  useEffect(() => {
    if (!showAssignPanel) return;
    setSearchLoading(true);
    const timeout = setTimeout(() => {
      api.me.availableAssistants(searchQ || undefined)
        .then((list: any) => setSearchResults(Array.isArray(list) ? list : []))
        .catch(() => setSearchResults([]))
        .finally(() => setSearchLoading(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQ, showAssignPanel]);

  // ── Handlers
  const handleUnassign = async (ra: RA) => {
    if (!confirm(`Unassign ${ra.first_name} ${ra.second_name}? They will remain a research assistant but without a supervisor.`)) return;
    setRemovingId(ra.id);
    try {
      await api.me.removeAssistant(ra.id);
      setAssistants(prev => prev.filter(a => a.id !== ra.id));
    } catch (e: any) {
      alert(e?.response?.data?.error ?? "Failed to unassign");
    } finally {
      setRemovingId(null);
    }
  };

  const handleAssign = async (ra: RA) => {
    setAssigningId(ra.id);
    try {
      await api.me.assignAssistant(ra.member_id);
      // Refresh both lists
      fetchAssistants();
      setSearchResults(prev => prev.map(r =>
        r.id === ra.id ? { ...r, already_mine: true, assigned_by_researcher_id: memberId } : r
      ));
    } catch (e: any) {
      alert(e?.response?.data?.error ?? "Failed to assign");
    } finally {
      setAssigningId(null);
    }
  };

  return (
    <div className="space-y-6">

      {/* ── Hero banner ──────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-zinc-900 px-8 py-10 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-950" />
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/[0.04] blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-40 h-40 rounded-full bg-white/[0.03] blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <p className="text-zinc-400 text-sm mb-1.5">{greeting()},</p>
            <h1 className="text-3xl font-bold tracking-tight leading-none">
              {user?.first_name} {user?.second_name}
            </h1>
            <div className="mt-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/10 rounded-full text-[11px] font-medium text-zinc-300">
                <Microscope size={11} /> Researcher
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3 shrink-0">
            <div className="relative w-10 h-10">
              <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
                <circle cx="20" cy="20" r="15" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="3.5" />
                <circle cx="20" cy="20" r="15" fill="none" stroke="white" strokeWidth="3.5"
                  strokeDasharray={`${(stats.completeness / 100) * 94.2} 94.2`}
                  strokeLinecap="round" className="transition-all duration-700" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[9px] font-bold text-white">{stats.completeness}%</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-none">{stats.completeness}%</p>
              <p className="text-xs text-zinc-400 mt-0.5">Profile complete</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Pending review alert ─────────────────────────────────────────── */}
      {!loading && stats.pendingReview > 0 && (
        <div className="flex items-center justify-between px-5 py-4 bg-zinc-900 text-white rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              <Clock size={14} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold">
                {stats.pendingReview} submission{stats.pendingReview !== 1 ? "s" : ""} awaiting your review
              </p>
              <p className="text-xs text-zinc-400 mt-0.5">Review and forward to admin, or reject</p>
            </div>
          </div>
          <Link to="/publications" className="flex items-center gap-1 text-xs font-semibold text-zinc-300 hover:text-white transition-colors shrink-0">
            Review <ArrowRight size={12} />
          </Link>
        </div>
      )}

      {/* ── Stats ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 bg-zinc-100 rounded-xl animate-pulse" />)
          : [
              { label: "Publications",   value: stats.publications,  icon: BookOpen,    dark: false },
              { label: "Projects",       value: stats.projects,      icon: FlaskConical, dark: false },
              { label: "Grants",         value: stats.grants,        icon: Briefcase,   dark: false },
              { label: "Pending Reviews",value: stats.pendingReview, icon: Inbox,       dark: stats.pendingReview > 0 },
            ].map(s => (
              <div key={s.label} className={`rounded-xl p-5 border transition-all ${s.dark ? "bg-zinc-900 border-zinc-900" : "bg-white border-zinc-200 hover:border-zinc-300"}`}>
                <div className="mb-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.dark ? "bg-white/10" : "bg-zinc-100"}`}>
                    <s.icon size={15} className={s.dark ? "text-white" : "text-zinc-500"} />
                  </div>
                </div>
                <p className={`text-3xl font-bold tabular-nums leading-none ${s.dark ? "text-white" : "text-zinc-900"}`}>{s.value}</p>
                <p className={`text-xs mt-1.5 ${s.dark ? "text-zinc-400" : "text-zinc-500"}`}>{s.label}</p>
              </div>
            ))}
      </div>

      {/* ── Research Assistants ───────────────────────────────────────────── */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        {/* Section header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <Users size={14} className="text-zinc-400" />
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Research Assistants</p>
            {!assistantsLoading && assistants.length > 0 && (
              <span className="px-2 py-0.5 bg-zinc-900 text-white text-[10px] font-bold rounded-full">
                {assistants.length}
              </span>
            )}
          </div>
          <button
            onClick={() => { setShowAssignPanel(p => !p); setSearchQ(""); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              showAssignPanel
                ? "bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
            }`}
          >
            {showAssignPanel ? <><X size={12} /> Close</> : <><UserPlus size={12} /> Assign Assistant</>}
          </button>
        </div>

        {/* ── Find & Assign panel ──────────────────────────────────────────── */}
        {showAssignPanel && (
          <div className="border-b border-zinc-100 bg-zinc-50 p-4 space-y-3">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              <input
                autoFocus
                type="text"
                placeholder="Search by name or email..."
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                className="input-monochrome pl-9 text-sm"
              />
            </div>

            <div className="max-h-60 overflow-y-auto rounded-xl border border-zinc-200 bg-white divide-y divide-zinc-50">
              {searchLoading ? (
                <div className="p-3 space-y-2">
                  {[1, 2, 3].map(i => <div key={i} className="h-12 bg-zinc-100 rounded-lg skeleton" />)}
                </div>
              ) : searchResults.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-zinc-400">
                    {searchQ ? "No research assistants found." : "No research assistants registered yet."}
                  </p>
                </div>
              ) : searchResults.map(ra => {
                const isAlreadyMine = ra.already_mine || assistants.some(a => a.id === ra.id);
                const hasOtherSupervisor = !isAlreadyMine && ra.assigned_by_researcher_id !== null && ra.assigned_by_researcher_id !== undefined;
                return (
                  <div key={ra.id} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                      {ra.first_name?.[0]}{ra.second_name?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-zinc-900 leading-none">
                        {ra.first_name} {ra.second_name}
                        {hasOtherSupervisor && (
                          <span className="ml-2 text-[10px] font-normal text-zinc-400">(has supervisor)</span>
                        )}
                      </p>
                      {ra.contact_email && (
                        <p className="text-[11px] text-zinc-400 mt-0.5 truncate">{ra.contact_email}</p>
                      )}
                    </div>
                    <Badge status={ra.approval_status as any} />
                    {isAlreadyMine ? (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-zinc-400 shrink-0">
                        <UserCheck size={13} /> Assigned
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAssign(ra)}
                        disabled={assigningId === ra.id}
                        className="flex items-center gap-1 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-700 text-white text-[11px] font-semibold rounded-lg transition-all disabled:opacity-40 shrink-0"
                      >
                        {assigningId === ra.id
                          ? <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                          : <><UserPlus size={11} /> Assign</>}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="text-[10px] text-zinc-400 text-center">
              An assistant can be reassigned from another supervisor. They keep their RA role even without a supervisor.
            </p>
          </div>
        )}

        {/* ── Current assistants list ───────────────────────────────────────── */}
        {assistantsLoading ? (
          <div className="p-4 space-y-2">
            {[1, 2].map(i => <div key={i} className="h-16 bg-zinc-50 rounded-xl skeleton" />)}
          </div>
        ) : assistants.length === 0 ? (
          <div className="py-10 flex flex-col items-center gap-3 text-center">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center">
              <UserX size={18} className="text-zinc-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-700">No assistants assigned yet</p>
              <p className="text-xs text-zinc-400 mt-0.5">Use "Assign Assistant" to find and add research assistants</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-zinc-50">
            {assistants.map(ra => (
              <div key={ra.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-zinc-50 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-zinc-900 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                  {ra.first_name?.[0]}{ra.second_name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-900 leading-none">{ra.first_name} {ra.second_name}</p>
                  {ra.contact_email && (
                    <a href={`mailto:${ra.contact_email}`} className="text-[11px] text-zinc-400 hover:text-zinc-700 mt-0.5 flex items-center gap-1 transition-colors">
                      <Mail size={10} /> {ra.contact_email}
                    </a>
                  )}
                </div>
                <Badge status={ra.approval_status as any} />
                <button
                  onClick={() => handleUnassign(ra)}
                  disabled={removingId === ra.id}
                  title="Unassign from supervision"
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-40 shrink-0"
                >
                  {removingId === ra.id
                    ? <span className="w-3.5 h-3.5 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
                    : <Trash2 size={14} />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Main grid ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-xl p-5 space-y-4">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Quick Actions</p>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: "New Publication", href: "/publications", icon: BookOpen,    desc: "Submit research work" },
              { label: "New Project",     href: "/projects",     icon: FlaskConical, desc: "Start a project" },
              { label: "New Blog Post",   href: "/blog",         icon: FileText,    desc: "Write an article" },
              { label: "New Grant",       href: "/grants",       icon: Briefcase,   desc: "Log a grant" },
            ].map(a => (
              <Link key={a.href} to={a.href}
                className="flex items-center justify-between p-4 border border-zinc-100 hover:border-zinc-300 hover:bg-zinc-50 rounded-xl transition-all group">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                    <a.icon size={14} className="text-zinc-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-800 leading-none">{a.label}</p>
                    <p className="text-[11px] text-zinc-400 mt-1">{a.desc}</p>
                  </div>
                </div>
                <ArrowRight size={13} className="text-zinc-300 group-hover:text-zinc-600 shrink-0" />
              </Link>
            ))}
          </div>
        </div>

        <Link to="/account" className="block">
          <div className="relative overflow-hidden bg-zinc-900 rounded-xl p-5 h-full group cursor-pointer min-h-[200px] flex flex-col justify-between">
            <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/[0.05] blur-xl pointer-events-none" />
            <div className="relative z-10">
              <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center mb-4">
                <CheckCircle2 size={16} className="text-white" />
              </div>
              <p className="text-white font-semibold text-sm">Your Profile</p>
              <p className="text-zinc-400 text-xs mt-1.5 leading-relaxed">
                Keep your details accurate for correct publication attribution.
              </p>
              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between text-[10px] text-zinc-500">
                  <span>Completeness</span>
                  <span className="text-white font-semibold">{stats.completeness}%</span>
                </div>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${stats.completeness}%` }} />
                </div>
              </div>
            </div>
            <div className="relative z-10 flex items-center gap-1.5 mt-4 text-xs font-semibold text-zinc-300 group-hover:text-white transition-colors">
              Edit Profile <ArrowRight size={12} />
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
