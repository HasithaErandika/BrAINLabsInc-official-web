import { useState, useEffect } from "react";
import { Users, CheckCircle2, LogOut } from "lucide-react";
import { apiClient } from "../../api";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function SelectSupervisor() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [researchers, setResearchers] = useState<{ id: number; first_name: string; second_name: string }[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get("/public/researchers").then(r => setResearchers(r.data)).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    setSaving(true);
    setError(null);
    try {
      await apiClient.patch("/me/supervisor", { assigned_by_researcher_id: Number(selectedId) });
      // Update the Zustand store so the ProtectedRoute guard sees the new supervisor
      updateUser({ assigned_by_researcher_id: Number(selectedId) });
      setSaved(true);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save supervisor selection. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6 font-['Inter']">
      <div className="w-full max-w-[460px] space-y-8">
        
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-black flex items-center justify-center shrink-0">
            <img src="/logo.png" alt="BrAIN Labs" className="w-5 h-5 object-contain invert" />
          </div>
          <div>
            <p className="text-[12px] font-bold text-zinc-900 leading-none">BrAIN Labs</p>
            <p className="text-[10px] text-zinc-400 mt-0.5">Research Assistant Portal</p>
          </div>
        </div>

        {saved ? (
          <div className="space-y-6 text-center py-6">
            <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle2 size={28} className="text-emerald-500" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Supervisor Assigned</h1>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Your supervisor selection has been saved. Your account is now pending admin approval.
                You'll be notified once access is granted.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <div className="px-4 py-3 bg-zinc-100 border border-zinc-200 rounded-xl text-center">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Status</p>
                <p className="text-sm font-semibold text-zinc-900">⏳ Awaiting Administrative Approval</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors py-2"
              >
                <LogOut size={15} /> Sign out and come back later
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-4">
                <Users size={16} className="text-zinc-400" />
                <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest">One more step</span>
              </div>
              <h1 className="text-3xl font-black text-zinc-900 tracking-tight leading-tight">
                Select Your Supervisor
              </h1>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Hi <strong>{user?.first_name}</strong>, as a Research Assistant you need to be assigned
                to a principal researcher. Please choose your supervisor below.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-amber-700">
                Your account is pending admin approval. You'll be able to access the portal once an admin reviews and approves your registration.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-700 uppercase tracking-wide">
                  Supervisor Researcher
                </label>
                <div className="grid grid-cols-1 gap-2 max-h-72 overflow-y-auto pr-1">
                  {researchers.length === 0 ? (
                    <div className="h-24 bg-zinc-100 rounded-xl animate-pulse" />
                  ) : researchers.map(r => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedId(String(r.id))}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                        selectedId === String(r.id)
                          ? "border-zinc-900 bg-zinc-900 text-white"
                          : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                        selectedId === String(r.id) ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-600"
                      }`}>
                        {r.first_name[0]}{r.second_name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Dr. {r.first_name} {r.second_name}</p>
                        <p className={`text-[11px] ${selectedId === String(r.id) ? "text-zinc-300" : "text-zinc-400"}`}>
                          Researcher
                        </p>
                      </div>
                      {selectedId === String(r.id) && (
                        <CheckCircle2 size={16} className="ml-auto text-white shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-xs font-semibold text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={saving || !selectedId}
                className="w-full h-12 bg-black text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {saving ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : "Confirm Supervisor"}
              </button>
              
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 text-sm font-medium text-zinc-400 hover:text-zinc-700 transition-colors py-1"
              >
                <LogOut size={14} /> Sign out
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
