import { useState, useEffect, useRef, useCallback } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, BookOpen, FileText, FlaskConical,
  CalendarDays, Users, LogOut, Briefcase, GraduationCap,
  Settings, UserCircle, Menu, Bell, X, ArrowRight,
  CheckCircle2, XCircle, Clock, ChevronRight,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useSessionTimeout } from "../../hooks/useSessionTimeout";
import { api } from "../../api";
import type { BaseMember } from "../../types";
import { Link } from "react-router-dom";

// ── Nav config ────────────────────────────────────────────────────────────────

const mainNav = [
  { label: "Dashboard",    path: "/dashboard",        icon: LayoutDashboard, roles: ["admin", "researcher", "research_assistant"] },
  { label: "Publications", path: "/publications",      icon: BookOpen,        roles: ["admin", "researcher", "research_assistant"] },
  { label: "Blog",         path: "/blog",              icon: FileText,        roles: ["admin", "researcher", "research_assistant"] },
  { label: "Projects",     path: "/projects",          icon: FlaskConical,    roles: ["admin", "researcher", "research_assistant"] },
  { label: "Events",       path: "/events",            icon: CalendarDays,    roles: ["admin", "researcher"] },
  { label: "Grants",       path: "/grants",            icon: Briefcase,       roles: ["admin", "researcher"] },
  { label: "Tutorials",    path: "/tutorials",         icon: GraduationCap,   roles: ["admin", "researcher", "research_assistant"] },
  { label: "Members",      path: "/dashboard/members", icon: Users,           roles: ["admin"] },
] as const;

const settingsNav = [
  { label: "Profile",  path: "/account",  icon: UserCircle, roles: ["admin", "researcher", "research_assistant"] },
  { label: "Settings", path: "/settings", icon: Settings,   roles: ["admin", "researcher", "research_assistant"] },
] as const;

// ── Notification types ────────────────────────────────────────────────────────

interface Notification {
  id: string;
  kind: "member_request" | "pending_content";
  title: string;
  subtitle: string;
  href: string;
  memberId?: number;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Notifications
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const handleLogout = useCallback(() => {
    logout();
    navigate("/login");
  }, [logout, navigate]);

  useSessionTimeout(handleLogout);

  // ── Fetch notifications ──────────────────────────────────────────────────────

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setNotifLoading(true);
    try {
      const notifs: Notification[] = [];

      if (user.role === "admin") {
        const [members, pubs, blogs, events, projects] = await Promise.all([
          api.admin.getMembers(),
          api.publications.list(),
          api.blogs.list(),
          api.events.list(),
          api.projects.list(),
        ]);

        // Pending member registrations
        (members as BaseMember[])
          .filter(m => m.approval_status === "PENDING_ADMIN")
          .forEach(m => notifs.push({
            id: `member-${m.id}`,
            kind: "member_request",
            title: `${m.first_name} ${m.second_name}`,
            subtitle: `${m.role.replace("_", " ")} · Registration request`,
            href: "/dashboard/members",
            memberId: m.id,
          }));

        // Pending content approval
        const contentPending = [
          ...pubs.filter((p: any) => p.approval_status === "PENDING_ADMIN").map((p: any) => ({
            id: `pub-${p.id}`, kind: "pending_content" as const,
            title: p.title, subtitle: "Publication · Awaiting approval", href: "/publications",
          })),
          ...blogs.filter((b: any) => b.approval_status === "PENDING_ADMIN").map((b: any) => ({
            id: `blog-${b.id}`, kind: "pending_content" as const,
            title: b.title, subtitle: "Blog post · Awaiting approval", href: "/blog",
          })),
          ...events.filter((e: any) => e.approval_status === "PENDING_ADMIN").map((e: any) => ({
            id: `event-${e.id}`, kind: "pending_content" as const,
            title: e.title, subtitle: "Event · Awaiting approval", href: "/events",
          })),
          ...projects.filter((p: any) => p.approval_status === "PENDING_ADMIN").map((p: any) => ({
            id: `proj-${p.id}`, kind: "pending_content" as const,
            title: p.title ?? "Untitled project", subtitle: "Project · Awaiting approval", href: "/projects",
          })),
        ];
        notifs.push(...contentPending);
      }

      if (user.role === "researcher") {
        const [pubs, projects] = await Promise.all([
          api.publications.list(),
          api.projects.list(),
        ]);
        pubs.filter((p: any) => p.approval_status === "PENDING_RESEARCHER").forEach((p: any) =>
          notifs.push({ id: `rpub-${p.id}`, kind: "pending_content", title: p.title, subtitle: "Publication · Needs your review", href: "/publications" })
        );
        projects.filter((p: any) => p.approval_status === "PENDING_RESEARCHER").forEach((p: any) =>
          notifs.push({ id: `rproj-${p.id}`, kind: "pending_content", title: p.title, subtitle: "Project · Needs your review", href: "/projects" })
        );
      }

      setNotifications(notifs);
    } catch (e) {
      console.error("Failed to fetch notifications", e);
    } finally {
      setNotifLoading(false);
    }
  }, [user]);

  // Fetch on mount and every 60 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close notif panel when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Quick-approve a member from notification panel ───────────────────────────

  const handleApprove = async (memberId: number) => {
    setApprovingId(memberId);
    try {
      await api.admin.approveMember(memberId);
      await fetchNotifications();
    } catch (e) {
      console.error("Approval failed", e);
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (memberId: number) => {
    setApprovingId(memberId);
    try {
      await api.admin.rejectMember(memberId);
      await fetchNotifications();
    } catch (e) {
      console.error("Rejection failed", e);
    } finally {
      setApprovingId(null);
    }
  };

  // ── Nav helpers ───────────────────────────────────────────────────────────────

  const filteredMain = mainNav.filter(item =>
    user ? item.roles.includes(user.role as never) : false
  );
  const filteredSettings = settingsNav.filter(item =>
    user ? item.roles.includes(user.role as never) : false
  );

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
      isActive
        ? "bg-zinc-900 text-white"
        : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
    }`;

  const unreadCount = notifications.length;

  // ── Sidebar ───────────────────────────────────────────────────────────────────

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-zinc-100 px-4 py-5">
      {/* Logo */}
      <div className="flex items-center gap-3 px-2 mb-8">
        <div className="w-8 h-8 bg-zinc-900 flex items-center justify-center shrink-0">
          <img src="/logo.png" alt="" className="w-5 h-5 object-contain invert" />
        </div>
        <div>
          <p className="text-[13px] font-bold text-zinc-900 leading-none">BrAIN Labs</p>
          <p className="text-[10px] text-zinc-400 mt-0.5">
            {user?.role === "admin" ? "Admin Portal" : user?.role === "researcher" ? "Research Portal" : "Lab Portal"}
          </p>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto space-y-7">
        <div className="space-y-0.5">
          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest px-3 mb-2">Navigation</p>
          {filteredMain.map(item => (
            <NavLink key={item.path} to={item.path} onClick={() => setMobileOpen(false)} className={navClass}>
              <item.icon size={16} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
        <div className="space-y-0.5">
          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest px-3 mb-2">Account</p>
          {filteredSettings.map(item => (
            <NavLink key={item.path} to={item.path} onClick={() => setMobileOpen(false)} className={navClass}>
              <item.icon size={16} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* User footer */}
      <div className="border-t border-zinc-100 pt-4 mt-4">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
            {user?.first_name?.[0]}{user?.second_name?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-zinc-900 truncate leading-none">
              {user?.first_name} {user?.second_name}
            </p>
            <p className="text-[10px] text-zinc-400 mt-0.5 capitalize">
              {user?.role?.replace("_", " ")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Layout ────────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen bg-zinc-50 overflow-hidden font-['Inter'] antialiased">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-zinc-100 flex items-center justify-between px-5 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all"
            >
              <Menu size={18} />
            </button>
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-zinc-400">
              <ChevronRight size={12} />
              <span>BrAIN Labs</span>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1" ref={notifRef}>
            {/* Notification bell */}
            <div className="relative">
              <button
                onClick={() => { setNotifOpen(v => !v); if (!notifOpen) fetchNotifications(); }}
                className={`relative p-2 rounded-lg transition-all ${
                  notifOpen
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
                }`}
                title="Notifications"
              >
                <Bell size={17} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-zinc-900 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification dropdown */}
              {notifOpen && (
                <div className="absolute right-0 top-11 w-96 bg-white border border-zinc-200 rounded-xl shadow-lg z-50 overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
                    <div className="flex items-center gap-2">
                      <Bell size={14} className="text-zinc-500" />
                      <span className="text-sm font-semibold text-zinc-900">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 bg-zinc-900 text-white text-[10px] font-bold rounded-full">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    <button onClick={() => setNotifOpen(false)} className="p-1 text-zinc-400 hover:text-zinc-700 rounded transition-colors">
                      <X size={14} />
                    </button>
                  </div>

                  {/* Body */}
                  <div className="max-h-[420px] overflow-y-auto">
                    {notifLoading ? (
                      <div className="p-4 space-y-2">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="h-14 bg-zinc-50 rounded-lg animate-pulse" />
                        ))}
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="py-14 flex flex-col items-center gap-2 text-center px-6">
                        <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center">
                          <CheckCircle2 size={18} className="text-zinc-400" />
                        </div>
                        <p className="text-sm font-medium text-zinc-500">All clear</p>
                        <p className="text-xs text-zinc-400">No pending approvals or requests</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-zinc-50">
                        {/* Member requests first */}
                        {notifications.filter(n => n.kind === "member_request").length > 0 && (
                          <div>
                            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest px-4 py-2.5 bg-zinc-50">
                              Registration Requests
                            </p>
                            {notifications
                              .filter(n => n.kind === "member_request")
                              .map(n => (
                                <div key={n.id} className="px-4 py-3 hover:bg-zinc-50 transition-colors">
                                  <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-[11px] font-bold text-white shrink-0 mt-0.5">
                                      {n.title.split(" ").map(p => p[0]).join("").slice(0, 2)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-zinc-900 truncate">{n.title}</p>
                                      <p className="text-xs text-zinc-400 mt-0.5">{n.subtitle}</p>
                                      {n.memberId && (
                                        <div className="flex items-center gap-2 mt-2">
                                          <button
                                            onClick={() => handleApprove(n.memberId!)}
                                            disabled={approvingId === n.memberId}
                                            className="flex items-center gap-1 px-2.5 py-1 bg-zinc-900 text-white text-xs font-medium rounded-md hover:bg-zinc-700 disabled:opacity-50 transition-colors"
                                          >
                                            <CheckCircle2 size={11} />
                                            {approvingId === n.memberId ? "..." : "Approve"}
                                          </button>
                                          <button
                                            onClick={() => handleReject(n.memberId!)}
                                            disabled={approvingId === n.memberId}
                                            className="flex items-center gap-1 px-2.5 py-1 border border-zinc-200 text-zinc-600 text-xs font-medium rounded-md hover:bg-zinc-50 disabled:opacity-50 transition-colors"
                                          >
                                            <XCircle size={11} />
                                            Reject
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}

                        {/* Pending content */}
                        {notifications.filter(n => n.kind === "pending_content").length > 0 && (
                          <div>
                            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest px-4 py-2.5 bg-zinc-50">
                              Pending Approvals
                            </p>
                            {notifications
                              .filter(n => n.kind === "pending_content")
                              .map(n => (
                                <Link
                                  key={n.id}
                                  to={n.href}
                                  onClick={() => setNotifOpen(false)}
                                  className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 group transition-colors"
                                >
                                  <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                                    <Clock size={13} className="text-zinc-500" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-zinc-900 truncate">{n.title}</p>
                                    <p className="text-xs text-zinc-400 mt-0.5">{n.subtitle}</p>
                                  </div>
                                  <ArrowRight size={13} className="text-zinc-300 group-hover:text-zinc-600 shrink-0" />
                                </Link>
                              ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div className="px-4 py-3 border-t border-zinc-100 bg-zinc-50">
                      <Link
                        to="/dashboard/members"
                        onClick={() => setNotifOpen(false)}
                        className="flex items-center justify-center gap-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
                      >
                        View all in Members <ArrowRight size={12} />
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sign-out icon */}
            <button
              onClick={handleLogout}
              title="Sign out"
              className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all"
            >
              <LogOut size={17} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="w-full h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
