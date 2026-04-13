import { useState, useEffect } from "react";
import { Loader2, ArrowLeft, Search, Mail, Eye, Users, UserCheck, Clock, ShieldCheck } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { api, type BaseMember } from "../../lib/api";
import { Badge, ListSkeleton } from "../../components/shared/UIPrimitives";
import { StatCard } from "./components/StatCard";

export default function MemberManagement() {
  const { isAdmin } = useAuth();
  const [members, setMembers] = useState<BaseMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [view, setView] = useState<"list" | "detail">("list");
  const [search, setSearch] = useState("");

  const fetchMembers = async () => {
    try {
      const data = await api.admin.getMembers();
      setMembers(data);
    } catch (err) {
      console.error("Failed to fetch members:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMembers(); }, []);

  const selectedMember = members.find(m => m.id === selectedId);

  const handleStatusChange = async (member: BaseMember, action: "approve" | "reject") => {
    if (!member.id) return;
    setUpdatingId(member.id);
    try {
      if (action === "approve") await api.admin.approveMember(member.id);
      else await api.admin.rejectMember(member.id);
      await fetchMembers();
    } catch (err) {
      console.error("Status update failed", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = members.filter(m => {
    const q = search.toLowerCase();
    return (
      `${m.first_name} ${m.second_name}`.toLowerCase().includes(q) ||
      m.contact_email?.toLowerCase().includes(q)
    );
  });

  if (loading) return <div className="p-8"><ListSkeleton count={5} /></div>;

  // ─── Detail view ──────────────────────────────────────────────────────────

  if (view === "detail" && selectedMember) {
    return (
      <div className="min-h-screen bg-white pb-20 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-100 bg-white/90 backdrop-blur-md px-8 py-4">
          <button
            onClick={() => setView("list")}
            className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors group"
          >
            <div className="p-1.5 rounded-lg group-hover:bg-zinc-100 transition-colors">
              <ArrowLeft size={16} />
            </div>
            Back to members
          </button>

          {isAdmin() && (
            <div className="flex items-center gap-2">
              {selectedMember.approval_status !== "APPROVED" && (
                <button
                  onClick={() => handleStatusChange(selectedMember, "approve")}
                  disabled={!!updatingId}
                  className="px-5 py-2.5 bg-zinc-900 text-white text-[11px] font-bold uppercase tracking-widest rounded-xl hover:bg-black transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {updatingId === selectedMember.id ? <Loader2 size={13} className="animate-spin" /> : "Approve"}
                </button>
              )}
              {selectedMember.approval_status === "APPROVED" && (
                <button
                  onClick={() => handleStatusChange(selectedMember, "reject")}
                  disabled={!!updatingId}
                  className="px-5 py-2.5 bg-white border border-red-200 text-red-600 text-[11px] font-bold uppercase tracking-widest rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {updatingId === selectedMember.id ? <Loader2 size={13} className="animate-spin" /> : "Revoke"}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="max-w-3xl mx-auto px-8 py-12">
          <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-8 flex flex-col sm:flex-row gap-8 items-center sm:items-start">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-2xl bg-zinc-900 flex items-center justify-center text-2xl font-black text-white flex-shrink-0">
              {selectedMember.first_name[0]}{selectedMember.second_name[0]}
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left space-y-3">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <Badge status={selectedMember.approval_status ?? "PENDING"} />
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
                  ID #{selectedMember.id}
                </span>
              </div>
              <h1 className="text-3xl font-black text-zinc-900 tracking-tight leading-none">
                {selectedMember.first_name} {selectedMember.second_name}
              </h1>
              <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">
                {selectedMember.role.replace("_", " ")}
              </p>
              <p className="flex items-center justify-center sm:justify-start gap-2 text-sm text-zinc-500 font-medium pt-1">
                <Mail size={14} className="text-zinc-300" />
                {selectedMember.contact_email}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── List view ────────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto px-8 py-8 space-y-8 pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-zinc-100 pb-8">
        <div>
          <div className="flex items-center gap-2 mb-2 text-zinc-400">
            <ShieldCheck size={14} />
            <span className="text-[10px] font-bold uppercase tracking-[0.25em]">Admin</span>
          </div>
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Members</h1>
          <p className="text-sm text-zinc-500 font-medium mt-1">
            Manage member applications and role access.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total" value={members.length} icon={Users} href="#" />
        <StatCard label="Approved" value={members.filter(m => m.approval_status === "APPROVED").length} icon={UserCheck} href="#" />
        <StatCard label="Pending" value={members.filter(m => m.approval_status === "PENDING").length} icon={Clock} href="#" />
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-100 rounded-2xl overflow-hidden shadow-sm">
        {/* Table header */}
        <div className="px-6 py-4 bg-zinc-50/50 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">All members ({filtered.length})</p>
          <div className="relative max-w-xs w-full">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-zinc-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Name</th>
                <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Role</th>
                <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {filtered.map(m => (
                <tr key={m.id} className="group hover:bg-zinc-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-zinc-900 flex items-center justify-center text-[11px] font-black text-white flex-shrink-0">
                        {m.first_name[0]}{m.second_name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-zinc-900">{m.first_name} {m.second_name}</p>
                        <p className="text-[11px] text-zinc-400 font-medium">{m.contact_email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                      {m.role.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge status={m.approval_status ?? "PENDING"} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {isAdmin() && m.approval_status !== "APPROVED" && (
                        <button
                          onClick={() => handleStatusChange(m, "approve")}
                          disabled={updatingId === m.id}
                          className="px-3 py-1.5 bg-zinc-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-black transition-colors disabled:opacity-50 flex items-center gap-1.5"
                        >
                          {updatingId === m.id ? <Loader2 size={11} className="animate-spin" /> : "Approve"}
                        </button>
                      )}
                      {isAdmin() && m.approval_status === "APPROVED" && (
                        <button
                          onClick={() => handleStatusChange(m, "reject")}
                          disabled={updatingId === m.id}
                          className="px-3 py-1.5 bg-white border border-red-200 text-red-500 text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                        >
                          {updatingId === m.id ? <Loader2 size={11} className="animate-spin" /> : "Revoke"}
                        </button>
                      )}
                      <button
                        onClick={() => { setSelectedId(m.id!); setView("detail"); }}
                        className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                        title="View details"
                      >
                        <Eye size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-sm font-medium text-zinc-400">No members match your search</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
