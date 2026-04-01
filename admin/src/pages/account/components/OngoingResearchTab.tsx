import { useState } from "react";
import { Loader2, Plus, Trash2, FlaskConical } from "lucide-react";
import { api, type Profile } from "../../../lib/api";
import { FormField, FormInput } from "../../../components/shared/FormElements";

interface Props {
  cv: Profile;
  onUpdate: () => void;
  isEditing?: boolean;
}

export function OngoingResearchTab({ cv, onUpdate, isEditing }: Props) {
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      await api.me.addOngoingResearch(newTitle);
      setNewTitle("");
      onUpdate();
    } catch (err) {
      console.error("Add research title failed:", err);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await api.me.removeOngoingResearch(id);
      onUpdate();
    } catch (err) {
      console.error("Remove research title failed:", err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-white border border-zinc-200/60 rounded-[2.5rem] p-10 shadow-sm transition-all duration-300">
      <div className="flex items-center gap-3 mb-10">
         <div className="w-10 h-10 bg-zinc-900 rounded-2xl flex items-center justify-center text-white"><FlaskConical size={20} /></div>
         <h2 className="text-lg font-black text-zinc-900 tracking-tight">Active Research Nodes</h2>
      </div>

      <div className="space-y-4 mb-10">
        {cv.role_detail?.ongoing_research?.map((res) => (
          <div key={res.id} className="group p-6 bg-zinc-50 border border-zinc-100 rounded-3xl flex items-center justify-between hover:border-zinc-300 transition-all">
             <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-900"><FlaskConical size={14} /></div>
                <span className="text-sm font-bold text-zinc-900 tracking-tight italic">"{res.title}"</span>
             </div>
             {isEditing && (
               <button onClick={() => handleDelete(res.id)} className="p-2.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                 {deletingId === res.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
               </button>
             )}
          </div>
        ))}
        {(!cv.role_detail?.ongoing_research || cv.role_detail.ongoing_research.length === 0) && (
          <div className="p-10 border-2 border-dashed border-zinc-100 rounded-3xl text-center">
             <p className="text-[10px] font-black uppercase text-zinc-300 tracking-[0.3em]">No ongoing research indexed</p>
          </div>
        )}
      </div>

      {isEditing && (
        <form onSubmit={handleAdd} className="pt-10 border-t border-zinc-100 flex flex-col md:flex-row gap-4">
          <FormField label="Index New Research Topic" full>
            <FormInput 
              placeholder="e.g., AGI Alignment via Neural Pruning" 
              value={newTitle} 
              onChange={e => setNewTitle(e.target.value)} 
            />
          </FormField>
          <button type="submit" disabled={adding || !newTitle} className="md:mt-6 px-10 py-3 bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {adding ? <Loader2 size={14} className="animate-spin" /> : <><Plus size={14} /> Link Node</>}
          </button>
        </form>
      )}
    </div>
  );
}
