import { useState, useEffect } from "react";
import { FlaskConical, Link as LinkIcon, ExternalLink, ShieldCheck, Hash, Info, ArrowRight } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { api, type Project, type ApprovalStatus } from "../../lib/api";
import { ContentPageTemplate } from "../../components/shared/ContentPageTemplate";
import { FormField, FormInput, FormTextArea, FormSelect } from "../../components/shared/FormElements";
import { Badge } from "../../components/shared/UIPrimitives";

export default function ProjectsPage() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const isUserAdmin = isAdmin();

  const fetchItems = async () => {
    try {
      const data = await api.projects.list();
      setItems(data);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const emptyItem: Partial<Project> = {
    title: "",
    description: "",
    link: "",
    approval_status: "PENDING" as ApprovalStatus,
  };

  const handleSave = async (item: Partial<Project>) => {
    if (item.id) await api.projects.update(item.id as number, item);
    else await api.projects.create(item);
    await fetchItems();
  };

  const handleToggleStatus = async (item: Project) => {
    const newStatus = item.approval_status === "APPROVED" ? "REJECTED" : "APPROVED";
    if (newStatus === "APPROVED") await api.admin.approveContent("project", item.id);
    else await api.admin.rejectContent("project", item.id);
    await fetchItems();
  };

  return (
    <ContentPageTemplate<Project>
      title="Projects"
      subtitle={`${items.length} active experimental nodes indexed in the professional registry.`}
      icon={FlaskConical}
      items={items}
      loading={loading}
      isAdmin={isUserAdmin}
      emptyItem={emptyItem}
      onSave={handleSave}
      onToggleStatus={isUserAdmin ? handleToggleStatus : undefined}
      searchFields={(item) => [item.title, item.description]}
      filterOptions={[
        { label: "ALL PROJECTS", value: "ALL" },
        { label: "ACTIVE HUB", value: "APPROVED" },
        { label: "PENDING NODE", value: "PENDING" },
      ]}
      renderListItem={(item, onClick) => (
        <article key={item.id} onClick={onClick} className="group relative bg-white border border-zinc-100 p-10 hover:shadow-2xl hover:shadow-zinc-200/50 transition-all duration-500 cursor-pointer flex flex-col gap-8 rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-700">
           <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                 <div className="p-2.5 bg-zinc-900 text-white rounded-xl shadow-lg opacity-90">
                    <FlaskConical size={18} />
                 </div>
                 <span className="text-[11px] font-black uppercase tracking-[0.25em] text-zinc-900 border-b-2 border-zinc-900 pb-0.5">
                    INITIATIVE NODE
                 </span>
              </div>
              <Badge status={item.approval_status} className="rounded-full" />
           </div>
           <div className="flex-1 min-w-0">
              <h3 className="text-2xl font-black text-zinc-900 leading-tight group-hover:text-black transition-all line-clamp-2 uppercase tracking-tighter">{item.title}</h3>
              <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-[0.2em] mt-6 flex items-center gap-3 bg-zinc-50 px-4 py-2 rounded-full w-fit border border-zinc-100 italic">
                <Hash size={13} /> PRJ-0X{item.id?.toString().slice(-4).toUpperCase()}
              </p>
           </div>
           <div className="pt-8 border-t border-zinc-50 flex items-center justify-between">
              <div className="text-[10px] font-black text-zinc-300 uppercase tracking-widest translate-x-2 group-hover:translate-x-0 transition-all opacity-0 group-hover:opacity-100 flex items-center gap-2">
                 Inspect Logic <ArrowRight size={12} />
              </div>
           </div>
        </article>
      )}
      renderDetail={(item) => (
        <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="p-10 bg-white border border-zinc-100 rounded-3xl shadow-xl shadow-zinc-200/30">
                  <div className="flex items-center gap-4 mb-6 text-zinc-300">
                     <ShieldCheck size={20} />
                     <span className="text-[11px] font-black uppercase tracking-[0.3em]">Governance State</span>
                  </div>
                  <p className="text-xl font-black text-black uppercase tracking-tighter">{item.approval_status}</p>
               </div>
               <div className="p-10 bg-white border border-zinc-100 rounded-3xl shadow-xl shadow-zinc-200/30">
                  <div className="flex items-center gap-4 mb-6 text-zinc-300">
                     <LinkIcon size={20} />
                     <span className="text-[11px] font-black uppercase tracking-[0.3em]">Deployment Status</span>
                  </div>
                  <p className="text-xl font-black text-black uppercase tracking-tighter">{item.link ? "External Dispatch" : "Internal Node"}</p>
               </div>
            </div>

            <div className="space-y-10">
               <h4 className="text-[14px] font-black text-black uppercase tracking-[0.5em] flex items-center gap-4 border-b border-zinc-100 pb-4 w-fit">
                 <Info size={20} className="text-zinc-900" /> Technical Vision
               </h4>
               <div className="p-14 bg-zinc-50/50 border border-zinc-100 text-zinc-600 leading-relaxed font-medium italic text-lg rounded-[2.5rem] shadow-inner">
                 {item.description || "No technical vision node associated with this project identity Archive cluster."}
               </div>
            </div>

            {item.link && (
               <div className="flex items-center justify-center pt-8">
                  <a href={item.link} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-6 px-12 py-6 bg-zinc-900 text-white text-[13px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-black transition-all shadow-2xl shadow-zinc-900/20 active:scale-95">
                    <ExternalLink size={20} className="group-hover:rotate-12 transition-transform" /> Execute Deployment Logic
                  </a>
               </div>
            )}
        </div>
      )}
      renderEdit={(item, setItem) => (
        <div className="space-y-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
               <FormField label="Identifier Identification" full><FormInput placeholder="Registry Title Identification node..." value={item.title} onChange={e => setItem({...item, title: e.target.value})} className="rounded-2xl" /></FormField>
               <FormField label="Remote Deployment / Source URL" full><FormInput placeholder="https://external-node-id..." value={item.link} onChange={e => setItem({...item, link: e.target.value})} className="rounded-2xl" /></FormField>
               
               <FormField label="Registry Status Hub" full={isUserAdmin}>
                  <FormSelect 
                    value={item.approval_status || "PENDING"} 
                    onChange={e => setItem({ ...item, approval_status: e.target.value as ApprovalStatus })}
                    className="rounded-2xl"
                    options={[
                      { label: "PENDING MODERATION Cluster", value: "PENDING" },
                      ...(isUserAdmin ? [{ label: "AUTHORIZE NODE Cluster", value: "APPROVED" }, { label: "INVALIDATE NODE Cluster", value: "REJECTED" }] : [])
                    ]}
                  />
               </FormField>

               <FormField label="Technical Architectural Vision" full><FormTextArea className="min-h-[220px] rounded-3xl" placeholder="Full project architectural context..." value={item.description} onChange={e => setItem({...item, description: e.target.value})} /></FormField>
            </div>
        </div>
      )}
    />
  );
}
