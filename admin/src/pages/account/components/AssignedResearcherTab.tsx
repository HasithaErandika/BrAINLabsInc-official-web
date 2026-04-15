import { Users, Info } from "lucide-react";
import type { Profile } from "../../../types";

interface Props {
  cv: Profile;
}

export function AssignedResearcherTab({ cv }: Props) {
  const assignedId = cv.role_detail?.assigned_by_researcher_id;

  return (
    <div className="space-y-8 animate-enter">
      <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-6 lg:p-8">
        <h2 className="text-xl font-bold text-zinc-900 mb-2">Assigned Researcher</h2>
        <p className="text-sm text-zinc-500 mb-6">
          The principal investigator or researcher you are assigned to.
        </p>
        
        {assignedId ? (
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white border border-zinc-200 text-zinc-600 rounded-full flex items-center justify-center text-lg font-bold shrink-0">
              <Users size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900">Researcher ID: {assignedId}</p>
              <p className="text-xs text-zinc-500 mt-1">Please contact your admin for more details or to request a reassignment.</p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 bg-white p-4 rounded-lg border border-zinc-200">
            <Info size={18} className="text-zinc-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-zinc-900">Not Assigned</p>
              <p className="text-xs text-zinc-500 mt-0.5">You are not currently assigned to any specific researcher.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
