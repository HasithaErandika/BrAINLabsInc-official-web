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
      {/* Header */}
      <div className="flex items-end justify-between border-b border-zinc-100 pb-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-zinc-900 rounded-full" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Researcher</span>
          </div>
          <h1 className="text-3xl font-black text-black tracking-tight mb-1">My Workspace</h1>
          <p className="text-sm text-zinc-500 font-medium">Your research output, projects, and grants.</p>
        </div>
        <div className="hidden sm:flex flex-col items-end gap-1 text-right">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Profile completion</p>
          <p className="text-3xl font-black text-black tracking-tighter">{stats.completeness}%</p>
        </div>
      </div>

      {/* Grid: Output Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Publications" value={loading ? "..." : stats.publications} icon={BookOpen} href="/publications" />
        <StatCard label="Initiatives" value={loading ? "..." : stats.projects} icon={FlaskConical} href="/projects" />
        <StatCard label="Grants" value={loading ? "..." : stats.grants} icon={Briefcase} href="/grants" trend={{ value: stats.grants.toString(), label: "Active", type: "neutral" }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Quick create */}
        <div className="lg:col-span-8">
          <MinimalCard className="p-6">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-zinc-400 mb-4 flex items-center gap-2">
              <PlusCircle size={14} className="text-zinc-900" /> Create new
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: "New publication", href: "/publications", icon: BookOpen },
                { label: "New project",     href: "/projects",    icon: FlaskConical },
                { label: "New blog post",   href: "/blog",        icon: FileText },
                { label: "New grant",       href: "/grants",      icon: Briefcase },
              ].map(action => (
                <Link
                  key={action.label}
                  to={action.href}
                  className="flex items-center justify-between p-4 bg-zinc-50 hover:bg-zinc-100 border border-zinc-100 hover:border-zinc-200 rounded-xl transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-zinc-900 text-white rounded-lg">
                      <action.icon size={14} />
                    </div>
                    <span className="text-sm font-semibold text-zinc-900">{action.label}</span>
                  </div>
                  <ArrowRight size={14} className="text-zinc-300 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              ))}
            </div>
          </MinimalCard>
        </div>

        {/* Profile sidebar */}
        <div className="lg:col-span-4">
          <MinimalCard className="p-6 h-full flex flex-col justify-between">
            <div>
              <h3 className="text-[11px] font-black uppercase tracking-widest text-zinc-400 mb-3">Your profile</h3>
              <p className="text-sm text-zinc-500 font-medium leading-relaxed mb-6">
                Keep your profile up to date to improve discoverability and attribution.
              </p>
            </div>
            <FunctionalButton
              onClick={() => (window.location.href = "/account")}
              className="w-full"
            >
              <CheckCircle2 size={14} /> Edit profile
            </FunctionalButton>
          </MinimalCard>
        </div>
      </div>
    </div>
  );
}
