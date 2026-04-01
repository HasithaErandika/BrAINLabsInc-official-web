import { useEffect, useState } from "react";
import { 
  BookOpen, 
  FlaskConical, 
  Terminal, 
  User, 
  CheckCircle2, 
  ArrowUpRight,
  ClipboardList,
  Activity
} from "lucide-react";
import { Link } from "react-router-dom";
import { api} from "../../lib/api";
import { StatCard } from "./components/StatCard";

interface Stats {
  publications: number;
  projects: number;
  completeness: number;
}

export function ResearchAssistantDashboard({ memberId }: { memberId: number }) {
  const [stats, setStats] = useState<Stats>({ publications: 0, projects: 0, completeness: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [pubs, projs] = await Promise.all([
          api.publications.list(),
          api.projects.list(),
        ]);

        // Assistants view their contributed items
        const myPubs = pubs.filter((p: any) => p.created_by_member_id === memberId).length;
        const myProjs = projs.filter((p: any) => p.created_by_member_id === memberId).length;

        // Profile completeness (RAs have simpler profiles than lead researchers)
        const completeness = 85; // Placeholder for now

        setStats({
          publications: myPubs,
          projects: myProjs,
          completeness
        });
      } catch (err) {
        console.error("Failed to fetch RA stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [memberId]);

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Assistant Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-100 pb-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Activity size={18} className="text-zinc-900" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Collaboration Engine</span>
          </div>
          <h1 className="text-4xl font-black text-zinc-900 tracking-tighter">Assistant <span className="text-zinc-300">Console</span></h1>
          <p className="text-zinc-500 mt-2 font-medium">Support research initiatives and manage your assigned contributions.</p>
        </div>
        <div className="flex flex-col gap-2">
           <div className="flex items-center justify-end gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">
             <div className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
             System Integration
           </div>
           <div className="w-48 h-2.5 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200">
              <div 
                className="h-full bg-black rounded-full transition-all duration-1000" 
                style={{ width: `${stats.completeness}%` }}
              />
           </div>
           <p className="text-[11px] font-bold text-zinc-900 text-right uppercase tracking-tighter mt-1">{stats.completeness}% Active</p>
        </div>
      </div>

      {/* RA Specific Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard 
          label="My Contributions" 
          value={loading ? "..." : stats.publications} 
          icon={BookOpen} 
          href="/publications" 
          sub="Items you've collaborated on" 
        />
        <StatCard 
          label="Active Collaborations" 
          value={loading ? "..." : stats.projects} 
          icon={FlaskConical} 
          href="/projects" 
          sub="Ongoing lab initiatives" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Support Actions */}
        <div className="bg-zinc-50 border border-zinc-200 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden group">
           <div className="relative">
              <h3 className="text-2xl font-black tracking-tighter text-zinc-900 mb-6 italic flex items-center gap-2">
                <ClipboardList size={22} />
                Support <span className="text-zinc-300">Actions</span>
              </h3>
              <div className="grid grid-cols-1 gap-3">
                 {[
                   { label: "Update Publication Draft", href: "/publications" },
                   { label: "Log Lab Data", href: "/projects" },
                   { label: "Draft Technical Note", href: "/blog" }
                 ].map((action) => (
                    <Link key={action.label} to={action.href} className="flex items-center justify-between p-5 bg-white border border-zinc-200 rounded-2xl hover:bg-black hover:text-white transition-all group/btn active:scale-95 shadow-sm">
                      <div className="flex items-center gap-3">
                        <Terminal size={16} className="text-zinc-400 group-hover/btn:text-white" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{action.label}</span>
                      </div>
                      <ArrowUpRight size={14} className="opacity-0 group-hover/btn:opacity-100 transition-all -translate-x-1 group-hover/btn:translate-x-0" />
                    </Link>
                 ))}
              </div>
           </div>
        </div>

        {/* Identity Section */}
        <div className="bg-black rounded-[2.5rem] p-10 text-white shadow-xl flex flex-col justify-between">
           <div>
              <div className="flex items-center gap-3 mb-6">
                 <div className="p-2.5 bg-white/10 rounded-xl">
                    <User className="text-white" size={20} />
                 </div>
                 <h2 className="text-xl font-black tracking-tight">Personnel <span className="text-zinc-600">Verification</span></h2>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed font-medium mb-8">
                Your account is verified as a Research Assistant. All contributions are credited to your professional profile and monitored by lead researchers.
              </p>
           </div>
           <Link to="/account" className="flex items-center justify-center gap-2 w-full py-4 bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-lg hover:bg-zinc-200 transition-all active:scale-95">
             Review Credentials
             <CheckCircle2 size={14} />
           </Link>
        </div>
      </div>
    </div>
  );
}
