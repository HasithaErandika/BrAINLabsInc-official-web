import { useState, useEffect } from "react";
import { BookOpen, Calendar, Globe, Users, Bookmark, FileStack, Hash, Info, ArrowRight } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { api, type Publication, type ApprovalStatus, type PublicationType } from "../../lib/api";
import { ContentPageTemplate } from "../../components/shared/ContentPageTemplate";
import { FormField, FormInput, FormTextArea, FormSelect } from "../../components/shared/FormElements";
import { Badge } from "../../components/shared/UIPrimitives";

export default function Publications() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const isUserAdmin = isAdmin();

  const fetchItems = async () => {
    try {
      const data = await api.publications.list();
      setItems(data);
    } catch (err) {
      console.error("Failed to fetch publications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const emptyItem: Partial<Publication> = {
    title: "",
    type: "ARTICLE",
    approval_status: "PENDING" as ApprovalStatus,
  };

  const handleSave = async (item: Partial<Publication>) => {
    try {
      let publicationId = item.id;
      if (publicationId) {
        await api.publications.update(publicationId, item);
      } else {
        const saved = await api.publications.create(item);
        publicationId = saved.id;
      }

      const type = item.type?.toLowerCase();
      if (publicationId && type && type !== "generic") {
        const key = type === "conference" ? "conference_paper" : type;
        const subtypeData = (item as any)[key];
        if (subtypeData) {
          await api.publications.linkSubtype(publicationId, type, subtypeData);
        }
      }
      
      await fetchItems();
    } catch (err) {
      console.error("Publication save error:", err);
      throw err;
    }
  };

  const handleToggleStatus = async (item: Publication) => {
    const newStatus = item.approval_status === "APPROVED" ? "REJECTED" : "APPROVED";
    if (newStatus === "APPROVED") await api.admin.approveContent("publication", item.id);
    else await api.admin.rejectContent("publication", item.id);
    await fetchItems();
  };

  return (
    <ContentPageTemplate<Publication>
      title="Publications"
      subtitle={`${items.length} scientific records indexed in the professional registry.`}
      icon={BookOpen}
      items={items}
      loading={loading}
      isAdmin={isUserAdmin}
      emptyItem={emptyItem}
      onSave={handleSave}
      onToggleStatus={isUserAdmin ? handleToggleStatus : undefined}
      searchFields={(item) => [item.title, item.type || "Generic"]}
      filterOptions={[
        { label: "ALL RECORDS", value: "ALL" },
        { label: "PUBLISHED", value: "APPROVED" },
        { label: "PENDING", value: "PENDING" },
      ]}
      renderListItem={(item, onClick) => (
        <article key={item.id} onClick={onClick} className="group relative bg-white border border-zinc-100 p-10 hover:shadow-2xl hover:shadow-zinc-200/50 transition-all duration-500 cursor-pointer flex flex-col gap-8 rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-start justify-between">
             <div className="flex items-center gap-4">
                <div className="p-2.5 bg-zinc-900 text-white rounded-xl shadow-lg opacity-90">
                   <BookOpen size={18} />
                </div>
                <span className="text-[11px] font-black uppercase tracking-[0.25em] text-zinc-900 border-b-2 border-zinc-900 pb-0.5">
                   {item.type || "GENERIC"}
                </span>
             </div>
             <Badge status={item.approval_status} className="rounded-full" />
          </div>
          <div className="flex-1 min-w-0">
             <h3 className="text-2xl font-black text-zinc-900 leading-tight group-hover:text-black transition-all line-clamp-2 uppercase tracking-tighter">{item.title}</h3>
             <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-[0.2em] mt-6 flex items-center gap-3 bg-zinc-50 px-4 py-2 rounded-full w-fit border border-zinc-100">
               <Hash size={14} className="text-zinc-300" /> {item.type === "BOOK" ? item.book?.isbn || "UNSET" : item.type === "ARTICLE" ? item.article?.doi || "UNSET" : `NODEID: #${item.id?.toString().slice(-6).toUpperCase()}`}
             </p>
          </div>
          <div className="pt-8 border-t border-zinc-50 flex items-center justify-between">
             <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">{new Date(item.created_at).toLocaleDateString()}</span>
             <div className="flex items-center gap-3 text-[11px] font-black text-zinc-900 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all uppercase tracking-widest">
                Examine Asset <ArrowRight size={14} />
             </div>
          </div>
        </article>
      )}
      renderDetail={(item) => {
        const type = item.type;
        const details = type === "CONFERENCE" ? item.conference_paper : type === "BOOK" ? item.book : type === "JOURNAL" ? item.journal : item.article;
        
        return (
          <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               <div className="p-10 bg-white border border-zinc-100 rounded-3xl shadow-xl shadow-zinc-200/30">
                  <div className="flex items-center gap-4 mb-6 text-zinc-300">
                     <Bookmark size={20} />
                     <span className="text-[11px] font-black uppercase tracking-[0.3em]">Specialization</span>
                  </div>
                  <p className="text-xl font-black text-black uppercase tracking-tighter">{type || "Publication"}</p>
               </div>
               <div className="p-10 bg-white border border-zinc-100 rounded-3xl shadow-xl shadow-zinc-200/30">
                  <div className="flex items-center gap-4 mb-6 text-zinc-300">
                     <Calendar size={20} />
                     <span className="text-[11px] font-black uppercase tracking-[0.3em]">Archival Date</span>
                  </div>
                  <p className="text-xl font-black text-black uppercase tracking-tighter">{new Date(item.created_at).toLocaleDateString()}</p>
               </div>
               <div className="p-10 bg-white border border-zinc-100 rounded-3xl shadow-xl shadow-zinc-200/30 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-4 mb-6 text-zinc-300">
                       <Users size={20} />
                       <span className="text-[11px] font-black uppercase tracking-[0.3em]">Status Hub</span>
                    </div>
                    <Badge status={item.approval_status} className="rounded-full" />
                  </div>
               </div>
            </div>

            {(details && details.link) && (
              <div className="p-14 bg-zinc-900 text-white flex flex-col md:flex-row items-center justify-between gap-12 rounded-[2.5rem] shadow-2xl shadow-zinc-900/20 relative overflow-hidden group">
                 <div className="flex items-center gap-10 relative z-10">
                    <div className="p-6 bg-white/10 rounded-3xl backdrop-blur-md">
                       <FileStack size={48} className="text-white opacity-80" />
                    </div>
                    <div>
                       <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-white/40 mb-3">Live Experimental Node</h4>
                       <p className="text-3xl font-black tracking-tighter uppercase leading-none">Verify Output Registry</p>
                    </div>
                 </div>
                 <a href={details.link} target="_blank" rel="noopener noreferrer" className="relative z-10 px-14 py-5 bg-white text-zinc-900 text-[12px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-zinc-100 hover:scale-105 active:scale-95 transition-all flex items-center gap-4 shadow-2xl">
                   Open document <Globe size={20} />
                 </a>
                 <div className="absolute -right-20 -bottom-20 opacity-5 group-hover:scale-110 transition-transform duration-1000 rotate-12">
                   <Bookmark size={240} />
                 </div>
              </div>
            )}

            <div className="space-y-10">
               <h4 className="text-[14px] font-black text-black uppercase tracking-[0.5em] flex items-center gap-4 border-b border-zinc-100 pb-4 w-fit">
                 <Info size={20} className="text-zinc-900" /> Registry Abstract
               </h4>
               <div className="p-14 bg-zinc-50/50 border border-zinc-100 text-zinc-600 leading-relaxed font-medium italic text-lg rounded-[2.5rem] shadow-inner">
                 {details?.description || "No technical abstract associated with this record. Review the linked primary document for baseline metadata."}
               </div>
            </div>
          </div>
        );
      }}
      renderEdit={(item, setItem) => (
        <div className="space-y-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <FormField label="Identifier Label" full>
              <FormInput placeholder="Registry Title identification..." value={item.title || ""} onChange={e => setItem({ ...item, title: e.target.value })} className="rounded-2xl" />
            </FormField>
            
            <FormField label="Asset Specialization">
              <FormSelect 
                value={item.type || ""} 
                onChange={e => setItem({ ...item, type: e.target.value as PublicationType })}
                className="rounded-2xl"
                options={[
                  { label: "SELECT TYPE Node...", value: "" },
                  { label: "JOURNAL ARTICLE", value: "ARTICLE" },
                  { label: "CONFERENCE PAPER", value: "CONFERENCE" },
                  { label: "ACADEMIC BOOK", value: "BOOK" },
                  { label: "RESEARCH JOURNAL", value: "JOURNAL" },
                ]}
              />
            </FormField>

            <FormField label="Registry Authorization" full={isUserAdmin}>
              <FormSelect 
                value={item.approval_status || "PENDING"} 
                onChange={e => setItem({ ...item, approval_status: e.target.value as ApprovalStatus })}
                className="rounded-2xl"
                options={[
                  { label: "PENDING MODERATION Cluster", value: "PENDING" },
                  ...(isUserAdmin ? [{ label: "AUTHORIZE ENTRY Node", value: "APPROVED" }, { label: "INVALITATE ENTRY Node", value: "REJECTED" }] : [])
                ]}
              />
            </FormField>
          </div>

          {item.type && (
            <div className="pt-16 border-t border-zinc-100 space-y-12 animate-in fade-in slide-in-from-top-8 duration-700">
              <div className="flex items-center gap-5">
                 <Badge status="APPROVED" children={item.type} className="rounded-full px-6" />
                 <span className="text-[11px] font-black text-zinc-300 uppercase tracking-[0.4em]">Subsystem logic initialized</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                 {item.type === "ARTICLE" && (
                    <FormField label="DOI Index Matrix" full>
                       <FormInput placeholder="10.xxxx/xxxx identification..." value={item.article?.doi || ""} onChange={e => setItem({ ...item, article: { ...item.article, doi: e.target.value } })} className="rounded-2xl" />
                    </FormField>
                 )}
                 {item.type === "BOOK" && (
                    <FormField label="ISBN Index Matrix" full>
                       <FormInput placeholder="978-x... identification..." value={item.book?.isbn || ""} onChange={e => setItem({ ...item, book: { ...item.book, isbn: e.target.value } })} className="rounded-2xl" />
                    </FormField>
                 )}
                 {item.type === "JOURNAL" && (
                    <FormField label="ISSN Index Matrix" full>
                       <FormInput placeholder="xxxx-xxxx identification..." value={item.journal?.issn || ""} onChange={e => setItem({ ...item, journal: { ...item.journal, issn: e.target.value } })} className="rounded-2xl" />
                    </FormField>
                 )}
                 {item.type === "CONFERENCE" && (
                    <FormField label="Paper Logic ID" full>
                       <FormInput placeholder="e.g. NeurIPS-2026-001 identify..." value={item.conference_paper?.paper_id || ""} onChange={e => setItem({ ...item, conference_paper: { ...item.conference_paper, paper_id: e.target.value } })} className="rounded-2xl" />
                    </FormField>
                 )}

                 <FormField label="Remote Repository Link" full>
                    <FormInput placeholder="https://external-node-id..." value={(item as any)[item.type === 'CONFERENCE' ? 'conference_paper' : item.type.toLowerCase()]?.link || ""} onChange={e => {
                       const key = item.type === 'CONFERENCE' ? 'conference_paper' : item.type?.toLowerCase();
                       if (!key) return;
                       setItem({ ...item, [key]: { ...(item as any)[key], link: e.target.value } });
                    }} className="rounded-2xl" />
                 </FormField>

                 <FormField label="Detailed Archive Abstract" full>
                    <FormTextArea className="min-h-[220px] rounded-3xl" placeholder="Full technical abstract node..." value={(item as any)[item.type === 'CONFERENCE' ? 'conference_paper' : item.type.toLowerCase()]?.description || ""} onChange={e => {
                       const key = item.type === 'CONFERENCE' ? 'conference_paper' : item.type?.toLowerCase();
                       if (!key) return;
                       setItem({ ...item, [key]: { ...(item as any)[key], description: e.target.value } });
                    }} />
                 </FormField>
              </div>
            </div>
          )}
        </div>
      )}
    />
  );
}