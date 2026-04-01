import { useAuth } from "../../hooks/useAuth";
import { AdminDashboard } from "./AdminDashboard";
import { ResearcherDashboard } from "./ResearcherDashboard";
import { ResearchAssistantDashboard } from "./ResearchAssistantDashboard";
import { Loader2, Clock, ShieldAlert } from "lucide-react";

export default function Dashboard() {
  const { user, token, isAdmin, isResearcher, isAssistant } = useAuth();

  if (!token || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-300" />
      </div>
    );
  }

  // Handle Pending status for Researchers and Assistants
  if (user.approval_status === 'PENDING' && !isAdmin()) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-10 text-center space-y-6 animate-in fade-in duration-700">
        <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center border border-zinc-100 shadow-sm">
          <Clock className="w-10 h-10 text-zinc-400" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Account Under Review</h1>
          <p className="text-zinc-500 max-w-sm mx-auto text-sm leading-relaxed">
            Welcome, <span className="font-bold text-black">{user.first_name}</span>. Your application for a <span className="font-bold text-black capitalize">{user.role.replace('_', ' ')}</span> account is currently being reviewed by our administrators.
          </p>
        </div>
        <div className="bg-zinc-50 border border-zinc-100 px-4 py-2 rounded-full flex items-center gap-2">
          <div className="w-2 h-2 bg-zinc-400 rounded-full animate-pulse"></div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Awaiting Approval</span>
        </div>
        <p className="text-xs text-zinc-400">We'll notify you once your access is granted.</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      {isAdmin() ? (
        <AdminDashboard />
      ) : isResearcher() ? (
        <ResearcherDashboard memberId={user.id} />
      ) : isAssistant() ? (
        <ResearchAssistantDashboard memberId={user.id} />
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <ShieldAlert className="w-12 h-12 text-zinc-300" />
          <p className="text-sm font-medium text-zinc-500">Unknown role configuration. Please contact support.</p>
        </div>
      )}
    </div>
  );
}
