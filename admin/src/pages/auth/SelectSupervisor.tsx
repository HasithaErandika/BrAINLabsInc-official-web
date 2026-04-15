import { useState, useEffect } from "react";
import { Users, CheckCircle2, LogOut, Search } from "lucide-react";
import { apiClient } from "../../api";
import { api } from "../../api";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function SelectSupervisor() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [researchers, setResearchers] = useState<{ id: number; first_name: string; second_name: string }[]>([]);
  const [filteredResearchers, setFilteredResearchers] = useState<typeof researchers>([]);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get("/me/supervisors")
      .then(r => {
        const list = Array.isArray(r.data) ? r.data : [];
        setResearchers(list);
        setFilteredResearchers(list);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFilteredResearchers(researchers);
    } else {
      const q = search.toLowerCase();
      setFilteredResearchers(researchers.filter(r =>
        `${r.first_name} ${r.second_name}`.toLowerCase().includes(q)
      ));
    }
  }, [search, researchers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    setSaving(true);
    setError(null);
    try {
      await api.me.updateSupervisor(Number(selectedId));
      // Update the Zustand store so the ProtectedRoute guard clears pending_setup
      updateUser({
        assigned_by_researcher_id: Number(selectedId),
        role: "research_assistant" as any,
      });
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
      <div className="w-full max-w-[480px] space-y-8">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-zinc-900">
            <img src="/logo.png" alt="BrAIN Labs" className="w-5 h-5 object-contain invert" />
          </div>
          <div>
            <p className="text-sm font-bold text-zinc-900 leading-none">BrAIN Labs</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">Research Assistant Portal</p>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm shadow-zinc-100">
          {saved ? (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 bg-zinc-100 border border-zinc-200 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle2 size={28} className="text-zinc-900" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Supervisor Assigned!</h1>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  Your supervisor selection has been saved. Your account is now pending admin approval.
                  You'll be notified once access is granted.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <div className="px-4 py-4 bg-zinc-100 border border-zinc-200 rounded-xl text-center">
                  <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest mb-1.5">Account Status</p>
                  <p className="text-sm font-semibold text-zinc-800">⏳ Awaiting Administrative Approval</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 text-sm font-medium text-zinc-400 hover:text-zinc-700 transition-colors py-2"
                >
                  <LogOut size={14} /> Sign out and come back later
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-lg bg-zinc-100 flex items-center justify-center">
                    <Users size={12} className="text-zinc-700" />
                  </div>
                  <span className="text-xs font-semibold text-zinc-700 uppercase tracking-widest">One more step</span>
                </div>
                <h1 className="text-2xl font-bold text-zinc-900 tracking-tight leading-tight">
                  Select Your Supervisor
                </h1>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  Hi <strong className="text-zinc-700">{user?.first_name}</strong>, as a Research Assistant
                  you need to be assigned to a principal researcher.
                </p>
              </div>

              <div className="mb-5 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                <p className="text-xs text-zinc-700 font-medium">
                  Your account is pending admin approval after you select a supervisor.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Search */}
                <div className="relative">
                  <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search researchers..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="input-monochrome pl-9 text-sm"
                  />
                </div>

                {/* Researcher list */}
                <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                  {researchers.length === 0 ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-14 bg-zinc-100 rounded-xl skeleton" />
                    ))
                  ) : filteredResearchers.length === 0 ? (
                    <p className="text-center text-sm text-zinc-400 py-6">No researchers found.</p>
                  ) : filteredResearchers.map(r => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedId(String(r.id))}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                        selectedId === String(r.id)
                          ? "border-zinc-900 bg-zinc-50"
                          : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                        selectedId === String(r.id)
                          ? "bg-zinc-900 text-white"
                          : "bg-zinc-100 text-zinc-600"
                      }`}>
                        {r.first_name?.[0] ?? "?"}{r.second_name?.[0] ?? ""}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-semibold ${selectedId === String(r.id) ? "text-zinc-900" : "text-zinc-900"}`}>
                          Dr. {r.first_name} {r.second_name}
                        </p>
                        <p className="text-[11px] text-zinc-400">Principal Researcher</p>
                      </div>
                      {selectedId === String(r.id) && (
                        <CheckCircle2 size={16} className="text-zinc-700 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>

                {error && (
                  <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-xs font-semibold text-red-600">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={saving || !selectedId}
                  className="w-full h-12 bg-zinc-900 hover:bg-zinc-700 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all "
                >
                  {saving ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : "Confirm Supervisor"}
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 text-xs font-medium text-zinc-400 hover:text-zinc-700 transition-colors py-1"
                >
                  <LogOut size={13} /> Sign out
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
