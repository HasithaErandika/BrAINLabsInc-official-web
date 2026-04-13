import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  FlaskConical,
  CalendarDays,
  Users,
  LogOut,
  Menu,
  Bell,
  Briefcase,
  GraduationCap,
  Settings,
  UserCircle,
  X,
  LogOutIcon,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useSessionTimeout } from "../../hooks/useSessionTimeout";
import { cn } from "../../lib/utils";

const mainNav = [
  { label: "Dashboard",    path: "/dashboard",         icon: LayoutDashboard, roles: ["admin", "researcher", "research_assistant"] },
  { label: "Publications", path: "/publications",       icon: BookOpen,        roles: ["admin", "researcher", "research_assistant"] },
  { label: "Blog Posts",   path: "/blog",               icon: FileText,        roles: ["admin", "researcher", "research_assistant"] },
  { label: "Projects",     path: "/projects",           icon: FlaskConical,    roles: ["admin", "researcher", "research_assistant"] },
  { label: "Events",       path: "/events",             icon: CalendarDays,    roles: ["admin", "researcher", "research_assistant"] },
  { label: "Grants",       path: "/grants",             icon: Briefcase,       roles: ["admin", "researcher", "research_assistant"] },
  { label: "Tutorials",    path: "/tutorials",          icon: GraduationCap,   roles: ["admin", "researcher", "research_assistant"] },
  { label: "Members",      path: "/dashboard/members",  icon: Users,           roles: ["admin"] },
] as const;

const settingsNav = [
  { label: "Account",  path: "/account",  icon: UserCircle, roles: ["admin", "researcher", "research_assistant"] },
  { label: "Settings", path: "/settings", icon: Settings,   roles: ["admin", "researcher", "research_assistant"] },
] as const;

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Auto-logout after 30 min of inactivity
  useSessionTimeout(handleLogout);

  const filteredMain = mainNav.filter(item =>
    user ? item.roles.includes(user.role as never) : false
  );
  const filteredSettings = settingsNav.filter(item =>
    user ? item.roles.includes(user.role as never) : false
  );

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold tracking-tight transition-all duration-200",
      isActive
        ? "bg-zinc-900 text-white"
        : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
    );

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-zinc-100">
      {/* Brand */}
      <div className="px-6 py-6 border-b border-zinc-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-zinc-900 rounded-xl flex items-center justify-center flex-shrink-0">
            <img
              src="/logo.png"
              alt=""
              className="w-5 h-5 object-contain invert"
              onError={e => { e.currentTarget.style.display = "none"; }}
            />
          </div>
          <div>
            <p className="font-black text-[13px] text-zinc-900 tracking-tight leading-none">BrAIN Labs</p>
            <p className="text-[10px] text-zinc-400 font-medium mt-0.5">Research Admin</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
        {/* Main links */}
        <div className="space-y-0.5">
          <p className="px-3 text-[9px] font-black text-zinc-300 uppercase tracking-[0.25em] mb-2">Workspace</p>
          {filteredMain.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={navLinkClass}
            >
              <item.icon size={16} />
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* Settings links */}
        <div className="space-y-0.5">
          <p className="px-3 text-[9px] font-black text-zinc-300 uppercase tracking-[0.25em] mb-2">Settings</p>
          {filteredSettings.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={navLinkClass}
            >
              <item.icon size={16} />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* User card + sign out */}
      <div className="px-4 py-4 border-t border-zinc-100">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-[11px] font-black text-white flex-shrink-0">
            {user?.first_name?.[0]?.toUpperCase()}{user?.second_name?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-bold text-zinc-900 leading-none truncate">
              {user?.first_name} {user?.second_name}
            </p>
            <p className="text-[10px] text-zinc-400 font-medium mt-0.5 truncate capitalize">
              {user?.role?.replace("_", " ")}
            </p>
          </div>
          <button
            onClick={() => setShowSignOutConfirm(true)}
            className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors flex-shrink-0"
            title="Sign out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-zinc-50 overflow-hidden text-black antialiased">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-72 animate-in slide-in-from-left duration-300 shadow-2xl">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="h-16 bg-white border-b border-zinc-100 flex items-center justify-between px-6 flex-shrink-0 z-30 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors"
            >
              <Menu size={20} />
            </button>
            <div className="hidden lg:block">
              <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
                BrAIN Labs — Research Administration
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(v => !v);
                }}
                className={cn(
                  "relative p-2 rounded-xl transition-colors",
                  showNotifications
                    ? "bg-zinc-100 text-zinc-900"
                    : "text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50"
                )}
              >
                <Bell size={18} />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-zinc-900 rounded-full" />
              </button>

              {showNotifications && (
                <div className="absolute top-12 right-0 w-72 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="bg-white border border-zinc-100 rounded-2xl shadow-xl overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-50">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-900">Notifications</p>
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="p-1 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-400"
                      >
                        <X size={13} />
                      </button>
                    </div>
                    <div className="py-10 flex flex-col items-center gap-3 text-center px-5">
                      <Bell size={24} className="text-zinc-200" />
                      <p className="text-[11px] font-medium text-zinc-400">No notifications yet</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sign out */}
            <button
              onClick={() => setShowSignOutConfirm(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-2 text-[11px] font-bold text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 rounded-xl transition-colors uppercase tracking-widest"
            >
              <LogOutIcon size={14} />
              Sign out
            </button>
          </div>
        </header>

        {/* Sign-out confirmation */}
        {showSignOutConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
              onClick={() => setShowSignOutConfirm(false)}
            />
            <div className="relative bg-white border border-zinc-100 rounded-2xl p-10 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 text-center">
              <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center text-white mx-auto mb-6">
                <LogOut size={22} />
              </div>
              <h2 className="text-xl font-black text-black tracking-tight mb-2">Sign out?</h2>
              <p className="text-sm text-zinc-500 font-medium mb-8">
                You'll be returned to the login page.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowSignOutConfirm(false)}
                  className="px-4 py-3 border border-zinc-200 text-zinc-700 text-[11px] font-bold uppercase tracking-widest rounded-xl hover:bg-zinc-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-3 bg-zinc-900 text-white text-[11px] font-bold uppercase tracking-widest rounded-xl hover:bg-black transition-colors"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-zinc-50">
          <div className="animate-in fade-in duration-300">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
