import { useEffect, useState } from "react";
import { 
  BookOpen, 
  FlaskConical, 
  CheckCircle2, 
  Briefcase,
  ArrowRight,
  PlusCircle,
  FileText
} from "lucide-react";
import { Link } from "react-router-dom";
import { api} from "../../lib/api";
import { StatCard } from "./components/StatCard";
import { MinimalCard, FunctionalButton } from "../../components/shared/UIPrimitives";

interface Stats {
  publications: number;
  projects: number;
  grants: number;
  completeness: number;
}

export function ResearcherDashboard({ memberId }: { memberId: number }) {
  const [stats, setStats] = useState<Stats>({ publications: 0, projects: 0, grants: 0, completeness: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [pubs, projs, grants, profile] = await Promise.all([
          api.publications.list(),
          api.projects.list(),
          api.grants.list(),
          api.me.get(),
        ]);

        const myPubs = pubs.filter((p: any) => p.created_by_member_id === memberId).length;
        const myProjs = projs.filter((p: any) => p.created_by_member_id === memberId).length;
        const myGrants = grants.filter((g: any) => g.created_by_researcher === memberId).length;

        const rd = profile.role_detail;
        const profileSections = [
          !!rd?.country, !!rd?.linkedin_url, !!rd?.image_url, !!rd?.bio, !!rd?.occupation, !!rd?.workplace,
        ];
        const completeness = Math.round((profileSections.filter(Boolean).length / profileSections.length) * 100);

        setStats({
          publications: myPubs,
          projects: myProjs,
          grants: myGrants,
          completeness
        });
      } catch (err) {
        console.error("Failed to fetch researcher stats:", err);
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
                <FlaskConical size={18} />
             </div>
             <span className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-400">Scientific Node Active</span>
          </div>
          <h1 className="text-4xl font-black text-black tracking-tight mb-3">Researcher Workspace</h1>
          <p className="text-sm text-zinc-500 font-medium max-w-2xl">Personal hub for scientific output, archival management, and sponsorship assets.</p>
        </div>
        <div className="hidden sm:flex flex-col items-end gap-3 text-right">
           <p className="text-[11px] font-black text-zinc-300 uppercase tracking-widest leading-none">Profile Maturity</p>
           <p className="text-2xl font-black text-black leading-none tracking-tighter">{stats.completeness}%</p>
        </div>
      </div>

      {/* Grid: Output Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Publications" value={loading ? "..." : stats.publications} icon={BookOpen} href="/publications" />
        <StatCard label="Initiatives" value={loading ? "..." : stats.projects} icon={FlaskConical} href="/projects" />
        <StatCard label="Grants" value={loading ? "..." : stats.grants} icon={Briefcase} href="/grants" trend={{ value: stats.grants.toString(), label: "Active", type: "neutral" }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Lab Actions */}
        <div className="lg:col-span-8">
          <MinimalCard className="p-14 shadow-2xl shadow-zinc-200/50">
             <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-zinc-300 mb-12 pb-5 border-b border-zinc-50 flex items-center gap-3">
                <PlusCircle size={16} className="text-zinc-900" /> Dispatch New Asset Node
             </h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "New Publication", href: "/publications", icon: BookOpen },
                  { label: "Launch Project", href: "/projects", icon: FlaskConical },
                  { label: "Write Insight", href: "/blog", icon: FileText },
                  { label: "Request Funding", href: "/grants", icon: Briefcase }
                ].map((action) => (
                  <Link key={action.label} to={action.href} className="flex items-center justify-between p-6 border border-zinc-50 hover:bg-zinc-50/50 hover:border-zinc-200 hover:shadow-xl transition-all duration-500 rounded-2xl group relative overflow-hidden">
                    <div className="flex items-center gap-6 relative z-10">
                      <div className="p-3 bg-zinc-900 text-white rounded-xl shadow-lg opacity-80 group-hover:opacity-100 transition-opacity">
                         <action.icon size={18} />
                      </div>
                      <span className="text-[12px] font-black uppercase tracking-widest text-zinc-900 group-hover:translate-x-1 transition-transform">{action.label}</span>
                    </div>
                    <ArrowRight size={16} className="text-zinc-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </Link>
                ))}
             </div>
          </MinimalCard>
        </div>

        {/* Profile Sidebar */}
        <div className="lg:col-span-4 h-full">
           <MinimalCard className="p-14 bg-zinc-50/50 border-zinc-100 h-full flex flex-col justify-between shadow-xl shadow-zinc-200/30">
              <div>
                 <h3 className="text-[12px] font-black uppercase tracking-widest text-black mb-8">Identity Control</h3>
                 <p className="text-sm text-zinc-500 leading-relaxed font-medium mb-12">
                   Synchronize your professional researcher identity, verified affiliations, and credentials within the BrAIN network.
                 </p>
                 <div className="space-y-4 mb-14 underline-offset-4">
                   {[
                     { label: "Node Connectivity", status: "Enabled" },
                     { label: "Asset Attribution", status: "Active" }
                   ].map(feat => (
                      <div key={feat.label} className="flex items-center justify-between py-4 border-b border-zinc-50 group cursor-default">
                         <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest group-hover:text-zinc-900 transition-colors">{feat.label}</span>
                         <span className="text-[10px] font-black text-zinc-900 uppercase tracking-widest bg-white px-3 py-1 rounded-full shadow-sm">{feat.status}</span>
                      </div>
                   ))}
                 </div>
              </div>
              <FunctionalButton 
                onClick={() => (window.location.href = '/account')}
                className="w-full shadow-2xl shadow-zinc-900/10 hover:shadow-zinc-900/20 rounded-2xl"
              >
                Refine Profile <CheckCircle2 size={14} className="ml-2" />
              </FunctionalButton>
           </MinimalCard>
        </div>
      </div>
    </div>
  );
}
