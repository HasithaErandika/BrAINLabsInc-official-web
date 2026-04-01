import { useEffect, useState } from "react";
import { 
  BookOpen, 
  FlaskConical, 
  Terminal, 
  ArrowRight,
  ClipboardList,
  Fingerprint
} from "lucide-react";
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
      {/* Premium Header */}
      <div className="flex items-end justify-between border-b border-zinc-100 pb-12">
        <div>
          <div className="flex items-center gap-3 mb-4">
             <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center text-white shadow-2xl shadow-zinc-900/10">
                <Terminal size={18} />
             </div>
             <span className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-400">Assistant Hub Active</span>
          </div>
          <h1 className="text-4xl font-black text-black tracking-tight mb-3">Support Workspace</h1>
          <p className="text-sm text-zinc-500 font-medium max-w-2xl">Collaborative support interface for scientific registry maintenance and asset oversight.</p>
        </div>
        <div className="hidden sm:flex flex-col items-end gap-3 text-right">
           <p className="text-[11px] font-black text-zinc-300 uppercase tracking-widest leading-none">Last Synchronization</p>
           <p className="text-2xl font-black text-black leading-none tracking-tighter uppercase">{stats.lastActive}</p>
        </div>
      </div>

      {/* Grid: Support Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard label="Global Publications" value={loading ? "..." : stats.publications} icon={BookOpen} href="/publications" />
        <StatCard label="Active Initiatives" value={loading ? "..." : stats.projects} icon={FlaskConical} href="/projects" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Task Assistance */}
        <div className="lg:col-span-8">
          <MinimalCard className="p-14 shadow-2xl shadow-zinc-200/50">
             <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-zinc-300 mb-12 pb-5 border-b border-zinc-50 flex items-center gap-3">
                <ClipboardList size={16} className="text-zinc-900" /> Operational Task queue
             </h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "Audit Registry", href: "/publications", desc: "Verify scientific data nodes" },
                  { label: "Update Projects", href: "/projects", desc: "Synchronize initiative logic" },
                  { label: "Dispatch Blog", href: "/blog", desc: "Moderate insight payloads" },
                  { label: "Schedule Events", href: "/events", desc: "Manage research summits" }
                ].map((action) => (
                  <Link key={action.label} to={action.href} className="flex flex-col gap-4 p-8 border border-zinc-50 hover:bg-zinc-50/50 hover:border-zinc-200 hover:shadow-xl transition-all duration-500 rounded-3xl group">
                    <div className="flex items-center justify-between">
                       <div className="p-3 bg-zinc-900 text-white rounded-xl shadow-lg opacity-80 group-hover:opacity-100 transition-opacity">
                          <Terminal size={18} />
                       </div>
                       <ArrowRight size={16} className="text-zinc-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </div>
                    <div>
                       <span className="text-[13px] font-black uppercase tracking-widest text-zinc-900 group-hover:underline transition-all">{action.label}</span>
                       <p className="text-[11px] text-zinc-400 font-medium mt-1.5">{action.desc}</p>
                    </div>
                  </Link>
                ))}
             </div>
          </MinimalCard>
        </div>

        {/* Support Sidebar */}
        <div className="lg:col-span-4 h-full">
           <MinimalCard className="p-14 bg-zinc-50/50 border-zinc-100 h-full flex flex-col justify-between shadow-xl shadow-zinc-200/30">
              <div>
                 <h3 className="text-[12px] font-black uppercase tracking-widest text-black mb-8">Role Identity</h3>
                 <p className="text-sm text-zinc-500 leading-relaxed font-medium mb-12">
                   Authenticated support node with permissions for global research registry maintenance and assistant oversight.
                 </p>
                 <div className="space-y-4 mb-14 underline-offset-4">
                   {[
                     { label: "Support Auth", status: "Verified" },
                     { label: "Data Integrity", status: "Safe" }
                   ].map(feat => (
                      <div key={feat.label} className="flex items-center justify-between py-4 border-b border-zinc-50 group cursor-default">
                         <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest group-hover:text-zinc-900 transition-colors">{feat.label}</span>
                         <span className="text-[10px] font-black text-zinc-900 uppercase tracking-widest bg-white px-3 py-1 rounded-full shadow-sm">{feat.status}</span>
                      </div>
                   ))}
                 </div>
              </div>
              <Link to="/account">
                <FunctionalButton 
                  className="w-full shadow-2xl shadow-zinc-900/10 hover:shadow-zinc-900/20 rounded-2xl"
                >
                  Identitiy Hub <Fingerprint size={14} className="ml-2" />
                </FunctionalButton>
              </Link>
           </MinimalCard>
        </div>
      </div>
    </div>
  );
}
