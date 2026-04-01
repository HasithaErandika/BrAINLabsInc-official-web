import { useState, useEffect } from "react";
import { 
  Loader2, 
  ArrowLeft, Search, 
  Mail, Eye, Users, UserCheck, Clock, ShieldCheck
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { api, type BaseMember } from "../../lib/api";
import { Badge, StatCard, ListSkeleton } from "../../components/shared/UIPrimitives";

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
      if (action === "approve") {
        await api.admin.approveMember(member.id);
      } else {
        await api.admin.rejectMember(member.id);
      }
      await fetchMembers();
    } catch (err) {
      console.error("Status update failed", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = members.filter(m => {
    const q = search.toLowerCase();
    const fullName = `${m.first_name} ${m.second_name}`.toLowerCase();
    return fullName.includes(q) || m.contact_email?.toLowerCase().includes(q);
  });

  if (loading) return <div className="p-10"><ListSkeleton count={5} /></div>;

  if (view === "detail" && selectedMember) {
    return (
      <div className="min-h-screen bg-white pb-20 animate-in fade-in slide-in-from-bottom-4">
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-200/60 bg-white/80 backdrop-blur-xl px-6 py-4">
          <button onClick={() => setView("list")} className="inline-flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-zinc-900 transition-colors group">
            <div className="p-2 rounded-xl group-hover:bg-zinc-100 transition-colors"><ArrowLeft size={16} /></div>
            Researcher Registry
          </button>
          
          <div className="flex items-center gap-2">
            {isAdmin() && selectedMember.approval_status !== "APPROVED" && (
              <button
                onClick={() => handleStatusChange(selectedMember, "approve")}
                disabled={!!updatingId}
                className="px-6 py-2.5 bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-600 transition-all shadow-xl shadow-black/10 active:scale-95"
              >
                {updatingId === selectedMember.id ? <Loader2 size={14} className="animate-spin" /> : "Authorize Identity"}
              </button>
            )}
            {isAdmin() && selectedMember.approval_status === "APPROVED" && (
              <button
                onClick={() => handleStatusChange(selectedMember, "reject")}
                disabled={!!updatingId}
                className="px-6 py-2.5 bg-white border border-zinc-200 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-50 hover:border-red-100 transition-all"
              >
                {updatingId === selectedMember.id ? <Loader2 size={14} className="animate-spin" /> : "Revoke Access"}
              </button>
            )}
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-12">
           <div className="bg-zinc-50 border border-zinc-200/60 rounded-[3.5rem] p-10 flex flex-col md:flex-row gap-10 items-center md:items-start shadow-sm">
             <div className="w-40 h-40 rounded-[2.5rem] bg-zinc-900 flex items-center justify-center text-5xl font-black text-white shadow-xl">
               {selectedMember.first_name[0]}{selectedMember.second_name[0]}
             </div>
             <div className="flex-1 space-y-4 text-center md:text-left">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                   <Badge status={selectedMember.approval_status || "PENDING"} />
                   <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-widest">ID: #{selectedMember.id?.toString()}</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-zinc-900 tracking-tighter leading-none">{selectedMember.first_name} {selectedMember.second_name}</h1>
                <p className="text-lg font-bold text-zinc-400 uppercase tracking-widest italic">{selectedMember.role.replace("_", " ")}</p>
                <div className="flex items-center justify-center md:justify-start gap-2 pt-2 text-zinc-500 font-bold text-xs uppercase tracking-widest">
                   <Mail size={14} className="text-zinc-300" /> {selectedMember.contact_email}
                </div>
             </div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-7xl mx-auto px-6 py-10">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-zinc-100 pb-10">
        <div>
           <div className="flex items-center gap-2 mb-2 text-zinc-400">
              <ShieldCheck size={16} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Governance Protocol</span>
           </div>
           <h1 className="text-4xl font-black text-zinc-900 tracking-tighter">Member <span className="text-zinc-300">Authority</span></h1>
           <p className="text-zinc-500 mt-2 font-medium">Verify credentials and manage specialized role applications.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <StatCard label="Total Nodes" value={members.length} icon={Users} />
         <StatCard label="Certified" value={members.filter(m => m.approval_status === "APPROVED").length} icon={UserCheck} />
         <StatCard label="Pending" value={members.filter(m => m.approval_status === "PENDING").length} icon={Clock} />
      </div>

      <div className="bg-white border border-zinc-200/60 rounded-[3rem] shadow-xl shadow-zinc-200/40 overflow-hidden">
        <div className="px-10 py-8 bg-zinc-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
           <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Registry Index</h3>
           <div className="relative group max-w-sm w-full">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input 
                type="text" 
                placeholder="Search registry..." 
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-zinc-200 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-black/5"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-50/50">
                <th className="px-10 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Identity</th>
                <th className="px-10 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Authorized Role</th>
                <th className="px-10 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Status</th>
                <th className="px-10 py-5 text-right text-[10px] font-black text-zinc-400 uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map(m => (
                <tr key={m.id} className="group hover:bg-zinc-50/50 transition-all">
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-xs font-black text-white">
                          {m.first_name[0]}
                       </div>
                       <div>
                          <p className="text-sm font-black text-zinc-900 tracking-tight">{m.first_name} {m.second_name}</p>
                          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{m.contact_email}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{m.role.replace("_", " ")}</span>
                  </td>
                  <td className="px-10 py-6">
                    <Badge status={m.approval_status || "PENDING"} />
                  </td>
                  <td className="px-10 py-6 text-right">
                    <button 
                       onClick={() => { setSelectedId(m.id!); setView("detail"); }}
                       className="p-2.5 bg-zinc-50 text-zinc-400 hover:text-zinc-900 border border-zinc-100 rounded-xl transition-all"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
