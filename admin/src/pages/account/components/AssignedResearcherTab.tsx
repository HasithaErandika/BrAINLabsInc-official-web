import { useState, useEffect } from "react";
import { Info, Mail, Briefcase, Loader2, FlaskConical, Quote } from "lucide-react";
import { api } from "../../../api";

interface Supervisor {
  id: number;
  first_name: string;
  second_name: string;
  contact_email: string;
  image_url?: string;
  occupation?: string;
  workplace?: string;
  bio?: string;
  assigned_projects?: { id: number; title: string }[];
}

export function AssignedResearcherTab() {
  const [supervisor, setSupervisor] = useState<Supervisor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSupervisor = async () => {
      setLoading(true);
      try {
        const data = await api.me.mySupervisor();
        setSupervisor(data);
      } catch (err: any) {
        // 404 means no supervisor assigned, which is a valid state
        if (err.response?.status !== 404) {
          console.error("Failed to fetch supervisor:", err);
        }
        setSupervisor(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSupervisor();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-enter">
      <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-6 lg:p-8">
        <h2 className="text-xl font-bold text-zinc-900 mb-2">Assigned Researcher</h2>
        <p className="text-sm text-zinc-500 mb-8">
          The principal investigator or researcher you are assigned to.
        </p>

        {supervisor ? (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-start gap-6 p-6 bg-white border border-zinc-200 rounded-2xl shadow-sm">
              <div className="w-20 h-20 bg-zinc-900 text-white rounded-2xl flex items-center justify-center text-2xl font-bold shrink-0 shadow-lg">
                {supervisor.first_name[0]}{supervisor.second_name[0]}
              </div>

              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-zinc-900">{supervisor.first_name} {supervisor.second_name}</h3>
                  <div className="flex flex-wrap gap-4 mt-2">
                    <a href={`mailto:${supervisor.contact_email}`} className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
                      <Mail size={14} /> {supervisor.contact_email}
                    </a>
                    {(supervisor.occupation || supervisor.workplace) && (
                      <div className="flex items-center gap-1.5 text-sm text-zinc-500">
                        <Briefcase size={14} /> {supervisor.occupation}{supervisor.workplace ? ` at ${supervisor.workplace}` : ""}
                      </div>
                    )}
                  </div>
                </div>

                {supervisor.bio && (
                  <div className="relative p-4 bg-zinc-50 rounded-xl border border-zinc-100 italic text-zinc-600 text-sm">
                    <Quote size={12} className="absolute -top-1.5 -left-1.5 text-zinc-300" />
                    {supervisor.bio}
                  </div>
                )}
              </div>
            </div>

            {supervisor.assigned_projects && supervisor.assigned_projects.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">Assigned Research Projects</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {supervisor.assigned_projects.map(p => (
                    <div key={p.id} className="flex items-center gap-3 p-4 bg-white border border-zinc-200 rounded-xl">
                      <div className="w-8 h-8 bg-zinc-50 text-zinc-400 rounded-lg flex items-center justify-center shrink-0">
                        <FlaskConical size={16} />
                      </div>
                      <span className="text-sm font-semibold text-zinc-800 italic">"{p.title}"</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-start gap-3 bg-white p-6 rounded-2xl border border-zinc-200 border-dashed">
            <Info size={20} className="text-zinc-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-zinc-900">Not Assigned</p>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                You are not currently assigned to any specific researcher.
                Please contact an administrator if you believe this is an error.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
