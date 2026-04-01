import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
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
  HelpCircle,
  UserCircle,
  Search,
  X,
  AlertCircle
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { cn } from "../../lib/utils";
import { MinimalCard, FunctionalButton } from "../shared/UIPrimitives";

const navItems = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard, roles: ["admin", "researcher", "research_assistant"] },
  { label: "Publications", path: "/publications", icon: BookOpen, roles: ["admin", "researcher", "research_assistant"] },
  { label: "Blog Posts", path: "/blog", icon: FileText, roles: ["admin", "researcher", "research_assistant"] },
  { label: "Projects", path: "/projects", icon: FlaskConical, roles: ["admin", "researcher", "research_assistant"] },
  { label: "Events", path: "/events", icon: CalendarDays, roles: ["admin", "researcher", "research_assistant"] },
  { label: "Grants", path: "/grants", icon: Briefcase, roles: ["admin", "researcher", "research_assistant"] },
  { label: "Tutorials", path: "/tutorials", icon: GraduationCap, roles: ["admin", "researcher", "research_assistant"] },
  { label: "Members", path: "/dashboard/members", icon: Users, roles: ["admin"] },
] as const;

const otherNavItems = [
  { label: "Account", path: "/account", icon: UserCircle, roles: ["admin", "researcher", "research_assistant"] },
  { label: "Settings", path: "/settings", icon: Settings, roles: ["admin", "researcher", "research_assistant"] },
  { label: "Help", path: "/help", icon: HelpCircle, roles: ["admin", "researcher", "research_assistant"] },
] as const;

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLogOutConfirm, setShowLogOutConfirm] = useState(false);

  useEffect(() => {
    document.title = "BrAIN Labs - Workspace";
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const filteredNav = navItems.filter((item) =>
    user ? item.roles.includes(user.role as never) : false
  );

  const filteredOtherNav = otherNavItems.filter((item) =>
    user ? item.roles.includes(user.role as never) : false
  );

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-zinc-100 shadow-2xl shadow-zinc-200/50">
      <div className="p-10 border-b border-zinc-50 bg-zinc-50/30">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center shadow-2xl shadow-zinc-900/20">
            <img src="/logo.png" alt="Logo" className="w-7 h-7 invert" />
          </div>
          <div>
            <p className="font-black text-[14px] text-zinc-900 uppercase tracking-tighter leading-none">BrAIN Labs</p>
            <p className="text-[11px] text-zinc-400 font-bold uppercase mt-1.5 opacity-60 tracking-[0.2em] leading-none">System Node</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-6 py-10 space-y-12">
        <div className="space-y-2">
          <p className="px-4 text-[11px] font-black text-zinc-300 uppercase tracking-[0.4em] mb-4">Registry Control</p>
          {filteredNav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-4 px-4 py-3 rounded-2xl text-[13px] font-bold tracking-tight transition-all duration-300",
                  isActive 
                    ? "bg-zinc-900 text-white shadow-2xl shadow-zinc-900/20 translate-x-1" 
                    : "text-zinc-500 hover:text-black hover:bg-zinc-50"
                )
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="space-y-2">
          <p className="px-4 text-[11px] font-black text-zinc-300 uppercase tracking-[0.4em] mb-4">Operations Hub</p>
          {filteredOtherNav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-4 px-4 py-3 rounded-2xl text-[13px] font-bold tracking-tight transition-all duration-300",
                  isActive 
                    ? "bg-zinc-900 text-white shadow-2xl shadow-zinc-900/20 translate-x-1" 
                    : "text-zinc-500 hover:text-black hover:bg-zinc-50"
                )
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="p-8 border-t border-zinc-50 bg-zinc-50/20">
        <div className="flex items-center gap-4 p-4 bg-white border border-zinc-100 rounded-3xl shadow-xl shadow-zinc-200/40">
          <div className="w-11 h-11 rounded-2xl bg-zinc-900 flex items-center justify-center text-[13px] font-black text-white shadow-lg shadow-zinc-900/10">
            {user?.role?.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-black text-black uppercase leading-none truncate mb-1.5">
              {user?.first_name} {user?.second_name}
            </p>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest leading-none truncate opacity-60">
              {user?.role?.replace("_", " ")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-zinc-50/50 overflow-hidden text-black antialiased font-sans">
      <aside className="hidden lg:flex flex-col w-72 flex-shrink-0 animate-in slide-in-from-left duration-700">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-80 bg-white animate-in slide-in-from-left duration-500 shadow-2xl">
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-white/70 backdrop-blur-xl border-b border-zinc-100 flex items-center justify-between px-10 flex-shrink-0 z-40 sticky top-0 shadow-sm animate-in slide-in-from-top duration-700">
          <div className="flex items-center gap-8">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden p-3 text-zinc-900 hover:bg-zinc-100 rounded-2xl transition-colors">
              <Menu size={22} />
            </button>
            <div className="hidden lg:block">
               <h1 className="text-[14px] font-black uppercase tracking-[0.2em] text-zinc-900 flex items-center gap-4">
                 System Console <span className="text-zinc-200">/</span> <span className="text-zinc-400 opacity-60 hover:text-black transition-colors cursor-pointer capitalize">Workspace Registry</span>
               </h1>
            </div>
          </div>

          <div className="flex items-center gap-10">
            <div className="hidden sm:flex items-center bg-zinc-100/50 px-6 py-2.5 border border-zinc-200 rounded-2xl group focus-within:bg-white focus-within:ring-4 focus-within:ring-black/5 transition-all shadow-inner">
               <Search size={16} className="text-zinc-400 group-focus-within:text-black transition-colors" />
               <input type="text" placeholder="Global Data Search..." className="bg-transparent border-none focus:ring-0 text-[12px] px-4 w-56 placeholder:text-zinc-400 font-bold uppercase tracking-tight" />
            </div>

            <div className="flex items-center gap-8 border-l border-zinc-200 pl-10 ml-2 h-8 relative">
               <button 
                className={cn(
                  "transition-all duration-300 relative p-2.5 rounded-xl",
                  showNotifications ? "text-orange-500 bg-orange-50 shadow-lg shadow-orange-200/50" : "text-zinc-400 hover:text-orange-500 hover:bg-orange-50/50"
                )}
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowLogOutConfirm(false);
                }}
               >
                 <Bell size={22} />
                 <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-orange-500 border-2 border-white rounded-full shadow-lg" />
               </button>

               {showNotifications && (
                 <div className="absolute top-16 right-16 w-80 animate-in fade-in slide-in-from-top-4 duration-300 z-50">
                    <MinimalCard className="p-8 shadow-2xl border-zinc-100 bg-white/90 backdrop-blur-xl">
                       <div className="flex items-center justify-between mb-6 pb-3 border-b border-zinc-100">
                          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-900">System Activity</p>
                          <button onClick={() => setShowNotifications(false)} className="p-1 hover:bg-zinc-100 rounded-lg transition-colors"><X size={14} /></button>
                       </div>
                       <div className="py-12 flex flex-col items-center gap-4 text-center">
                          <div className="p-4 bg-zinc-50 rounded-2xl"><Bell size={32} className="text-zinc-200" /></div>
                          <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.5em] leading-relaxed">No Data Nodes Found</p>
                       </div>
                    </MinimalCard>
                 </div>
               )}

               <button 
                className="text-zinc-400 hover:text-orange-500 hover:bg-orange-50/50 p-2.5 rounded-xl transition-all duration-300"
                onClick={() => {
                  setShowLogOutConfirm(true);
                  setShowNotifications(false);
                }}
               >
                 <LogOut size={22} />
               </button>
            </div>
          </div>
        </header>

        {/* Sign-out Confirmation Modal */}
        {showLogOutConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 sm:p-0">
             <div className="absolute inset-0 bg-black/40 backdrop-blur-xl animate-in fade-in duration-500" onClick={() => setShowLogOutConfirm(false)} />
             <div className="bg-white/90 border border-zinc-100 p-14 max-w-md w-full relative animate-in zoom-in-95 duration-500 shadow-2xl rounded-4xl backdrop-blur-2xl">
                <div className="flex flex-col items-center text-center gap-10">
                   <div className="p-7 bg-zinc-900 rounded-3xl shadow-2xl shadow-zinc-900/20 text-white">
                      <AlertCircle size={48} />
                   </div>
                   <div>
                      <h2 className="text-3xl font-black uppercase tracking-tighter text-black mb-4">System Disconnect</h2>
                      <p className="text-base font-medium text-zinc-500 leading-relaxed max-w-xs">Are you sure you want to invalidate your current administrative session?</p>
                   </div>
                   <div className="grid grid-cols-2 gap-4 w-full pt-4">
                      <FunctionalButton variant="white" onClick={() => setShowLogOutConfirm(false)} className="rounded-2xl">Abort</FunctionalButton>
                      <FunctionalButton onClick={handleLogout} className="rounded-2xl shadow-2xl shadow-zinc-900/10">Disconnect</FunctionalButton>
                   </div>
                </div>
             </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto bg-zinc-50/20 relative">
          <div className={cn(
            "animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-48",
            ["/dashboard", "/account", "/settings", "/help"].includes(location.pathname) 
              ? "p-10 lg:p-14 max-w-7xl mx-auto" 
              : "p-0"
          )}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
