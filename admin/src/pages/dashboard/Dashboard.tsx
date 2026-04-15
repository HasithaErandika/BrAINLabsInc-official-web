import { useAuth } from "../../hooks/useAuth";
import { AdminDashboard } from "./AdminDashboard";
import { ResearcherDashboard } from "./ResearcherDashboard";
import { ResearchAssistantDashboard } from "./ResearchAssistantDashboard";
import { Clock, ShieldAlert } from "lucide-react";

export default function Dashboard() {
  const { user, token, isAdmin, isResearcher, isAssistant } = useAuth();

  if (!token || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
      </div>
    );
  }

  // Handle Pending status for Researchers and Assistants
  if (user.approval_status === 'PENDING_ADMIN' && !isAdmin()) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-10 text-center space-y-8 animate-enter">
        <div className="w-20 h-20 rounded-3xl bg-zinc-100 border border-zinc-200 flex items-center justify-center ">
          <Clock className="w-10 h-10 text-zinc-600" />
        </div>

        <div className="space-y-3 max-w-md">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-100 border border-zinc-200 text-zinc-700 rounded-full text-[11px] font-semibold uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse" />
            Pending Approval
          </span>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight mt-3">
            Account Under Review
          </h1>
          <p className="text-sm text-zinc-500 leading-relaxed">
            Hi <strong className="text-zinc-700">{user.first_name}</strong>, your account is currently in the
            verification queue. Access to the portal will be granted once an admin reviews your registration.
          </p>
        </div>

        <div className="flex items-center gap-3 px-5 py-3 bg-white border border-zinc-200 rounded-2xl shadow-sm">
          <div className="w-2 h-2 bg-zinc-400 rounded-full animate-pulse" />
          <span className="text-xs font-semibold text-zinc-600">Awaiting administrative approval</span>
        </div>

        <p className="text-[10px] text-zinc-300 font-medium tracking-widest uppercase">
          Ref: BRN-{user.id}-IDENT
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-enter">
      {isAdmin() ? (
        <AdminDashboard />
      ) : isResearcher() ? (
        <ResearcherDashboard memberId={user.id} />
      ) : isAssistant() ? (
        <ResearchAssistantDashboard memberId={user.id} />
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
          <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center">
            <ShieldAlert size={24} className="text-red-500" />
          </div>
          <div className="text-center space-y-1.5">
            <p className="text-sm font-semibold text-zinc-900">Role configuration error</p>
            <p className="text-xs text-zinc-500">Contact your administrator. (Ref: BRN-{user.id})</p>
          </div>
        </div>
      )}
    </div>
  );
}
