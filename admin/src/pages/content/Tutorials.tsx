import { useState, useEffect } from "react";
import { GraduationCap, Hash, ArrowRight } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { api, type Tutorial, type ApprovalStatus } from "../../lib/api";
import { ContentPageTemplate } from "../../components/shared/ContentPageTemplate";
import { FormField, FormInput, FormTextArea, FormSelect } from "../../components/shared/FormElements";
import { renderMarkdown } from "../../lib/utils/markdown";
import { Badge } from "../../components/shared/UIPrimitives";

export default function TutorialsPage() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const isUserAdmin = isAdmin();

  const fetchItems = async () => {
    try {
      const data = await api.tutorials.list();
      setItems(data);
    } catch (err) { console.error("Failed to fetch tutorials:", err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, []);

  const emptyItem: Partial<Tutorial> = {
    title: "",
    description: "",
    content: "",
    approval_status: "PENDING" as ApprovalStatus,
  };

  const handleSave = async (item: Partial<Tutorial>) => {
    if (item.id) await api.tutorials.update(item.id as number, item);
    else await api.tutorials.create(item);
    await fetchItems();
  };

  const handleToggleStatus = async (item: Tutorial) => {
    const newStatus = item.approval_status === "APPROVED" ? "REJECTED" : "APPROVED";
    if (newStatus === "APPROVED") await api.admin.approveContent("tutorial", item.id);
    else await api.admin.rejectContent("tutorial", item.id);
    await fetchItems();
  };

  return (
    <ContentPageTemplate<Tutorial>
      title="Tutorials"
      subtitle={`${items.length} learning modules indexed in the professional registry.`}
      icon={GraduationCap}
      items={items}
      loading={loading}
      isAdmin={isUserAdmin}
      emptyItem={emptyItem}
      onSave={handleSave}
      onToggleStatus={isUserAdmin ? handleToggleStatus : undefined}
      searchFields={(item) => [item.title, item.description]}
      filterOptions={[
        { label: "ALL MODULES", value: "ALL" },
        { label: "PUBLISHED HUB", value: "APPROVED" },
        { label: "PENDING NODE", value: "PENDING" },
      ]}
      renderListItem={(item, onClick) => (
        <article key={item.id} onClick={onClick} className="group relative bg-white border border-zinc-100 p-10 hover:shadow-2xl hover:shadow-zinc-200/50 transition-all duration-500 cursor-pointer flex flex-col gap-8 rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-700">
           <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                 <div className="p-2.5 bg-zinc-900 text-white rounded-xl shadow-lg opacity-90">
                    <GraduationCap size={18} />
                 </div>
                 <span className="text-[11px] font-black uppercase tracking-[0.25em] text-zinc-900 border-b-2 border-zinc-900 pb-0.5">
                    LEARNING NODE
                 </span>
              </div>
              <Badge status={item.approval_status} className="rounded-full" />
           </div>
           <div className="flex-1 min-w-0">
              <h3 className="text-2xl font-black text-zinc-900 leading-tight group-hover:text-black transition-all line-clamp-2 uppercase tracking-tighter">{item.title}</h3>
              <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-[0.2em] mt-6 flex items-center gap-3 bg-zinc-50 px-4 py-2 rounded-full w-fit border border-zinc-100 italic">
                <Hash size={13} /> MOD-0X{item.id?.toString().slice(-4).toUpperCase()}
              </p>
           </div>
           <div className="pt-8 border-t border-zinc-50 flex items-center justify-between">
              <div className="text-[10px] font-black text-zinc-300 uppercase tracking-widest translate-x-2 group-hover:translate-x-0 transition-all opacity-0 group-hover:opacity-100 flex items-center gap-2">
                 Execute Module <ArrowRight size={12} />
              </div>
           </div>
        </article>
      )}
      renderDetail={(item) => (
        <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="p-14 bg-zinc-50/50 border border-zinc-100 rounded-[2.5rem] italic text-xl text-zinc-600 leading-relaxed font-medium shadow-inner">
               "{item.description}"
            </div>
            <div className="space-y-10 md-content border-t border-zinc-100 pt-16 text-zinc-900 leading-loose">
               {renderMarkdown(item.content || "")}
            </div>
        </div>
      )}
      renderEdit={(item, setItem) => (
        <div className="space-y-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
               <FormField label="Identifier Identification" full><FormInput placeholder="Registry Title Identification node..." value={item.title} onChange={e => setItem({...item, title: e.target.value})} className="rounded-2xl" /></FormField>
               
               <FormField label="Registry Status Hub" full={isUserAdmin}>
                  <FormSelect 
                    value={item.approval_status || "PENDING"} 
                    onChange={e => setItem({ ...item, approval_status: e.target.value as ApprovalStatus })}
                    className="rounded-2xl"
                    options={[
                      { label: "PENDING MODERATION Cluster", value: "PENDING" },
                      ...(isUserAdmin ? [{ label: "AUTHORIZE MODULE Cluster", value: "APPROVED" }, { label: "INVALIDATE MODULE Cluster", value: "REJECTED" }] : [])
                    ]}
                  />
               </FormField>

               <FormField label="Operational Context Node" full><FormTextArea className="min-h-[160px] rounded-3xl" placeholder="Brief identify hook for the learning node Registry..." value={item.description} onChange={e => setItem({...item, description: e.target.value})} /></FormField>
               
               <FormField label="Full Technical Module Payload (Markdown)" full>
                  <FormTextArea 
                    className="min-h-[500px] font-mono text-sm leading-loose border-2 rounded-3xl" 
                    placeholder="# Initialize technical narrative body..." 
                    value={item.content} 
                    onChange={e => setItem({...item, content: e.target.value})} 
                  />
               </FormField>
            </div>
        </div>
      )}
    />
  );
}
