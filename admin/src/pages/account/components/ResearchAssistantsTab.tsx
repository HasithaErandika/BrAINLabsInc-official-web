import { Users } from "lucide-react";
import type { Profile } from "../../../types";

interface Props {
  cv: Profile;
}

export function ResearchAssistantsTab({ cv }: Props) {
  // Normally you'd fetch this from the backend if not included in the profile
  return (
    <div className="space-y-8 animate-enter">
      <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-6 lg:p-8">
        <h2 className="text-xl font-bold text-zinc-900 mb-2">Research Assistants</h2>
        <p className="text-sm text-zinc-500 mb-6">
          Research assistants currently assigned to work under your supervision.
        </p>

        <div className="flex flex-col items-center justify-center p-8 bg-white border border-zinc-200 border-dashed rounded-xl">
          <div className="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center mb-3">
            <Users size={20} className="text-zinc-400" />
          </div>
          <p className="text-sm font-semibold text-zinc-900">No Assistants Found</p>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm text-center">
            You do not currently have any research assistants assigned. Admins will assign assistants to you when required.
          </p>
        </div>
      </div>
    </div>
  );
}
