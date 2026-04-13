import { useEffect, useState } from "react";
import { BookOpen, FlaskConical, ArrowRight, ClipboardList, Fingerprint } from "lucide-react";
import { Link } from "react-router-dom";
import { api} from "../../lib/api";
import { StatCard } from "./components/StatCard";
import { MinimalCard, FunctionalButton } from "../../components/shared/UIPrimitives";

interface Stats {
  publications: number;
  projects: number;
  lastActive: string;
}

export function ResearchAssistantDashboard({ memberId }: { memberId: number }) {
  const [stats, setStats] = useState<Stats>({ publications: 0, projects: 0, lastActive: "Just now" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [pubs, projs] = await Promise.all([
          api.publications.list(),
          api.projects.list(),
        ]);
        setStats({
          publications: pubs.length,
          projects: projs.length,
          lastActive: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      } catch (err) {
        console.error("Failed to fetch assistant stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [memberId]);

  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-40">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-zinc-100 pb-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-zinc-900 rounded-full" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Research Assistant</span>
          </div>
          <h1 className="text-3xl font-black text-black tracking-tight mb-1">My Workspace</h1>
          <p className="text-sm text-zinc-500 font-medium">Support and maintain the research registry.</p>
        </div>
        <div className="hidden sm:flex flex-col items-end gap-1 text-right">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Last active</p>
          <p className="text-2xl font-black text-black tracking-tighter uppercase">{stats.lastActive}</p>
        </div>
      </div>

      {/* Grid: Support Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard label="Global Publications" value={loading ? "..." : stats.publications} icon={BookOpen} href="/publications" />
        <StatCard label="Active Initiatives" value={loading ? "..." : stats.projects} icon={FlaskConical} href="/projects" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Task shortcuts */}
        <div className="lg:col-span-8">
          <MinimalCard className="p-6">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-zinc-400 mb-4 flex items-center gap-2">
              <ClipboardList size={14} className="text-zinc-900" /> Quick access
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: "Publications",  href: "/publications", desc: "Review research output" },
                { label: "Projects",      href: "/projects",     desc: "Track active projects" },
                { label: "Blog posts",    href: "/blog",         desc: "Manage articles" },
                { label: "Events",        href: "/events",       desc: "View upcoming events" },
              ].map(action => (
                <Link
                  key={action.label}
                  to={action.href}
                  className="flex items-center justify-between p-4 bg-zinc-50 hover:bg-zinc-100 border border-zinc-100 hover:border-zinc-200 rounded-xl transition-all group"
                >
                  <div>
                    <p className="text-sm font-bold text-zinc-900">{action.label}</p>
                    <p className="text-[11px] text-zinc-400 font-medium">{action.desc}</p>
                  </div>
                  <ArrowRight size={14} className="text-zinc-300 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                </Link>
              ))}
            </div>
          </MinimalCard>
        </div>

        {/* Profile sidebar */}
        <div className="lg:col-span-4">
          <MinimalCard className="p-6 h-full flex flex-col justify-between">
            <div>
              <h3 className="text-[11px] font-black uppercase tracking-widest text-zinc-400 mb-3">Your account</h3>
              <p className="text-sm text-zinc-500 font-medium leading-relaxed mb-6">
                Manage your profile and account settings.
              </p>
            </div>
            <Link to="/account">
              <FunctionalButton className="w-full">
                <Fingerprint size={14} /> View profile
              </FunctionalButton>
            </Link>
          </MinimalCard>
        </div>
      </div>
    </div>
  );
}
