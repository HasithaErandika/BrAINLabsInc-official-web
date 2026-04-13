import { useEffect, useState } from "react";
import { Users, BookOpen, FileText, Inbox, ArrowRight, CheckSquare2 } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { StatCard } from "./components/StatCard";
import { MinimalCard, FunctionalButton, Badge } from "../../components/shared/UIPrimitives";
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
  type: "Publication" | "Blog" | "Event" | "Project";
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

        const pendingPubs: PendingItem[] = pubs
          .filter((p: any) => p.approval_status === "PENDING")
          .map((p: any) => ({
            id: String(p.id),
            title: p.title,
            type: "Publication" as const,
            author: p.authors ?? "Unknown",
            date: p.publication_year?.toString() ?? "—",
            href: "/publications",
          }));

        const pendingBlogs: PendingItem[] = blogs
          .filter((b: any) => b.approval_status === "PENDING")
          .map((b: any) => ({
            id: String(b.id),
            title: b.title,
            type: "Blog" as const,
            author: b.author_name ?? "Unknown",
            date: b.created_at?.split("T")[0] ?? "—",
            href: "/blog",
          }));

        const pendingEvents: PendingItem[] = events
          .filter((e: any) => e.approval_status === "PENDING")
          .map((e: any) => ({
            id: String(e.id),
            title: e.title,
            type: "Event" as const,
            author: e.event_type ?? "General",
            date: e.event_date ?? "—",
            href: "/events",
          }));

        const pendingProjects: PendingItem[] = projects
          .filter((p: any) => p.approval_status === "PENDING")
          .map((p: any) => ({
            id: String(p.id),
            title: p.title ?? p.category ?? "Untitled",
            type: "Project" as const,
            author: "Research Team",
            date: p.created_at?.split("T")[0] ?? "—",
            href: "/projects",
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
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
      {/* Page header */}
      <div className="border-b border-zinc-100 pb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 bg-zinc-900 rounded-full" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Admin</span>
        </div>
        <h1 className="text-3xl font-black text-black tracking-tight mb-1">Administration</h1>
        <p className="text-sm text-zinc-500 font-medium">
          Manage members, review content, and oversee research output.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Members" value={loading ? "—" : stats.users} icon={Users} href="/dashboard/members" />
        <StatCard label="Publications" value={loading ? "—" : stats.publications} icon={BookOpen} href="/publications" />
        <StatCard label="Blog posts" value={loading ? "—" : stats.blog} icon={FileText} href="/blog" />
        <StatCard
          label="Awaiting review"
          value={loading ? "—" : stats.pending}
          icon={Inbox}
          href="/publications"
          className={cn(stats.pending > 0 ? "border-zinc-300 ring-1 ring-zinc-200" : "")}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pending content feed */}
        <div className="lg:col-span-8">
          <MinimalCard className="overflow-hidden">
            <div className="flex items-center justify-between px-8 py-6 border-b border-zinc-50">
              <h2 className="text-sm font-black text-black uppercase tracking-widest flex items-center gap-2">
                Awaiting Review
                <span className="px-2 py-0.5 bg-zinc-900 text-white rounded-full text-[10px] font-bold">
                  {pendingItems.length}
                </span>
              </h2>
              <Link
                to="/publications"
                className="text-[11px] font-bold text-zinc-400 hover:text-black uppercase tracking-widest underline underline-offset-4 transition-colors"
              >
                View all
              </Link>
            </div>

            <div className="divide-y divide-zinc-50">
              {loading ? (
                [1, 2, 3].map(i => (
                  <div key={i} className="h-16 mx-6 my-3 bg-zinc-50 rounded-xl animate-pulse" />
                ))
              ) : pendingItems.length > 0 ? (
                pendingItems.map(item => (
                  <Link
                    key={`${item.type}-${item.id}`}
                    to={item.href}
                    className="flex items-center justify-between px-8 py-5 hover:bg-zinc-50 transition-colors group"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <Badge status="PENDING" className="flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-black leading-none mb-1 truncate group-hover:underline">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-zinc-400 font-medium">
                          {item.type} · {item.author} · {item.date}
                        </p>
                      </div>
                    </div>
                    <ArrowRight
                      size={14}
                      className="text-zinc-300 flex-shrink-0 ml-4 transition-transform group-hover:translate-x-0.5"
                    />
                  </Link>
                ))
              ) : (
                <div className="py-20 text-center flex flex-col items-center gap-4">
                  <CheckSquare2 size={32} className="text-zinc-200" />
                  <p className="text-sm font-medium text-zinc-300">All content is up to date</p>
                </div>
              )}
            </div>
          </MinimalCard>
        </div>

        {/* Sidebar actions */}
        <div className="lg:col-span-4 space-y-4">
          <MinimalCard className="p-6">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-zinc-400 mb-4">Quick create</h3>
            <div className="space-y-2">
              {[
                { label: "New publication", href: "/publications" },
                { label: "New blog post", href: "/blog" },
                { label: "New event", href: "/events" },
                { label: "New project", href: "/projects" },
              ].map(action => (
                <Link
                  key={action.label}
                  to={action.href}
                  className="flex items-center justify-between w-full px-4 py-3 text-sm font-semibold bg-zinc-50 hover:bg-zinc-100 border border-zinc-100 hover:border-zinc-200 rounded-xl transition-all"
                >
                  {action.label}
                  <ArrowRight size={14} className="text-zinc-300" />
                </Link>
              ))}
            </div>
          </MinimalCard>

          <MinimalCard className="p-6 relative overflow-hidden">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-zinc-400 mb-2">Members</h3>
            <p className="text-sm text-zinc-500 font-medium leading-relaxed mb-5">
              Review applications and manage member access.
            </p>
            <Link to="/dashboard/members">
              <FunctionalButton className="w-full">
                View members
              </FunctionalButton>
            </Link>
            <div className="absolute -right-6 -bottom-6 opacity-[0.04]">
              <Users size={120} />
            </div>
          </MinimalCard>
        </div>
      </div>
    </div>
  );
}
