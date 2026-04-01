import { useEffect, useState } from "react";
import { 
  Users, 
  BookOpen, 
  FileText, 
  Inbox,
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { StatCard } from "./components/StatCard";
import { MinimalCard, FunctionalButton } from "../../components/shared/UIPrimitives";
import { cn } from "../../lib/utils";

interface Stats {
  users: number;
  publications: number;
  blog: number;
  events: number;
  pending: number;
}

interface PendingItem {
  id: string;
  title: string;
  type: 'Publication' | 'Blog' | 'Event' | 'Project';
  author: string;
  date: string;
  href: string;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ users: 0, publications: 0, blog: 0, events: 0, pending: 0 });
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [users, pubs, blogs, events, projects] = await Promise.all([
          api.admin.getMembers(),
          api.publications.list(),
          api.blogs.list(),
          api.events.list(),
          api.projects.list(),
        ]);

        const pendingPubs: PendingItem[] = pubs.filter((p: any) => p.approval_status === 'PENDING').map((p: any) => ({
          id: p.id!,
          title: p.title,
          type: 'Publication',
          author: p.authors || "Unknown",
          date: p.publication_year?.toString() ?? "N/A",
          href: '/publications'
        }));

        const pendingBlogs: PendingItem[] = blogs.filter((b: any) => b.approval_status === 'PENDING').map((b: any) => ({
          id: b.id!,
          title: b.title,
          type: 'Blog',
          author: b.author_name ?? "Unknown",
          date: b.published_date ?? "N/A",
          href: '/blog'
        }));

        const pendingEvents: PendingItem[] = events.filter((e: any) => e.approval_status === 'PENDING').map((e: any) => ({
          id: e.id!,
          title: e.title,
          type: 'Event',
          author: e.event_type ?? "General",
          date: e.event_date ?? "N/A",
          href: '/events'
        }));

        const pendingProjects: PendingItem[] = projects.filter((p: any) => p.approval_status === 'PENDING').map((p: any) => ({
          id: p.id!,
          title: p.title || p.category,
          type: 'Project',
          author: "Research Team",
          date: p.created_at?.split('T')[0] ?? "N/A",
          href: '/projects'
        }));

        const allPending = [...pendingPubs, ...pendingBlogs, ...pendingEvents, ...pendingProjects];
        setPendingItems(allPending);

        setStats({
          users: users.length,
          publications: pubs.length,
          blog: blogs.length,
          events: events.length,
          pending: allPending.length,
        });
      } catch (err) {
        console.error("Failed to fetch admin stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-40">
      {/* Premium Header */}
      <div className="border-b border-zinc-100 pb-12">
        <div className="flex items-center gap-3 mb-4">
           <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse" />
           <span className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-400">Moderation Active</span>
        </div>
        <h1 className="text-4xl font-black text-black tracking-tight mb-3">Administrative Hub</h1>
        <p className="text-sm text-zinc-500 font-medium max-w-2xl">Global system management, personnel oversight, and research output moderation.</p>
      </div>

      {/* Grid: Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Personnel" value={loading ? "..." : stats.users} icon={Users} href="/dashboard/members" />
        <StatCard label="Research Output" value={loading ? "..." : stats.publications} icon={BookOpen} href="/publications" />
        <StatCard label="Articles" value={loading ? "..." : stats.blog} icon={FileText} href="/blog" />
        <StatCard 
          label="Audit Pending" 
          value={loading ? "..." : stats.pending} 
          icon={Inbox} 
          href="/publications" 
          className={cn(stats.pending > 0 ? "border-zinc-300 ring-4 ring-black/5" : "border-zinc-100")}
          trend={{ value: stats.pending.toString(), label: "Items", type: "neutral" }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Main: Audit Feed */}
        <div className="lg:col-span-8 space-y-4">
          <MinimalCard className="p-10 shadow-2xl shadow-zinc-200/50">
            <div className="flex items-center justify-between mb-10 pb-4 border-b border-zinc-50">
              <h2 className="text-[12px] font-black text-black uppercase tracking-widest flex items-center gap-3">
                Prioritized Feed <span className="px-2.5 py-0.5 bg-zinc-900 text-white rounded-full text-[10px] tracking-normal">{pendingItems.length}</span>
              </h2>
              <Link to="/publications" className="text-[11px] font-bold text-zinc-400 hover:text-black uppercase underline underline-offset-8 transition-colors">Full Registry</Link>
            </div>

            <div className="space-y-2">
              {loading ? (
                [1, 2, 3].map(i => <div key={i} className="h-16 bg-zinc-50 rounded-2xl animate-pulse mb-3" />)
              ) : pendingItems.length > 0 ? (
                pendingItems.map((item) => (
                  <Link 
                    key={`${item.type}-${item.id}`} 
                    to={item.href}
                    className="flex items-center justify-between p-5 hover:bg-zinc-50 rounded-2xl transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-6">
                       <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
                          item.type === 'Publication' ? "bg-zinc-900 text-white" : "bg-zinc-50 text-zinc-400 group-hover:bg-zinc-200 group-hover:text-black"
                       )}>
                          <FileText size={16} />
                       </div>
                       <div>
                          <p className="text-[13px] font-black text-black leading-none mb-2 group-hover:underline transition-all cursor-pointer">{item.title}</p>
                          <p className="text-[11px] text-zinc-400 uppercase tracking-widest font-bold">
                            {item.type} <span className="mx-2 text-zinc-200">•</span> {item.author}
                          </p>
                       </div>
                    </div>
                    <ArrowRight size={16} className="text-zinc-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </Link>
                ))
              ) : (
                <div className="py-24 text-center flex flex-col items-center gap-6">
                  <div className="p-5 bg-zinc-50 rounded-2xl"><Inbox size={32} className="text-zinc-200" /></div>
                  <p className="text-zinc-300 text-[11px] font-black uppercase tracking-[0.5em]">System Archive Clean</p>
                </div>
              )}
            </div>
          </MinimalCard>
        </div>

        {/* Sidebar: Actions */}
        <div className="lg:col-span-4 space-y-8">
           <MinimalCard className="p-10 bg-zinc-50/50 border-zinc-100 shadow-xl shadow-zinc-200/30">
             <h3 className="text-[12px] font-black uppercase tracking-widest text-black mb-8">Asset Dispatch</h3>
             <div className="space-y-3">
               {[
                 { label: "Add Publication", href: "/publications" },
                 { label: "Draft Insight", href: "/blog" },
                 { label: "Schedule Event", href: "/events" },
                 { label: "Initiate Project", href: "/projects" },
               ].map((action) => (
                 <Link 
                   key={action.label} 
                   to={action.href} 
                   className="block w-full text-left p-5 text-[11px] font-black bg-white border border-zinc-100 hover:border-zinc-300 hover:shadow-lg transition-all rounded-2xl uppercase tracking-widest"
                 >
                   {action.label}
                 </Link>
               ))}
             </div>
           </MinimalCard>

           <MinimalCard className="p-10 border-zinc-100 shadow-xl shadow-zinc-200/30 overflow-hidden relative group">
             <div className="relative z-10">
               <h3 className="text-[12px] font-black uppercase tracking-widest text-zinc-400 mb-6">User Governance</h3>
               <p className="text-[12px] text-zinc-500 leading-relaxed font-medium mb-10">Manage personnel credentials and authorization nodes within the community.</p>
               <Link to="/dashboard/members">
                  <FunctionalButton className="w-full rounded-2xl shadow-2xl shadow-zinc-900/10 hover:shadow-zinc-900/20">
                    Personnel Index
                  </FunctionalButton>
               </Link>
             </div>
             <div className="absolute -right-8 -bottom-8 opacity-5 group-hover:scale-110 transition-transform duration-700 text-zinc-900">
               <Users size={160} />
             </div>
           </MinimalCard>
        </div>
      </div>
    </div>
  );
}
