import { useState, useEffect } from "react";
import { BookOpen, Calendar, Image as ImageIcon, ExternalLink, ArrowRight } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { api, type Blog, type ApprovalStatus } from "../../lib/api";
import { ContentPageTemplate } from "../../components/shared/ContentPageTemplate";
import { FormField, FormInput, FormTextArea, FormSelect } from "../../components/shared/FormElements";
import { renderMarkdown } from "../../lib/utils/markdown";
import { Badge } from "../../components/shared/UIPrimitives";

export default function BlogPage() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const isUserAdmin = isAdmin();

  const fetchItems = async () => {
    try {
      const data = await api.blogs.list();
      setItems(data);
    } catch (err) {
      console.error("Failed to fetch blogs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const emptyItem: Partial<Blog> = {
    title: "",
    content: "",
    description: "",
    approval_status: "PENDING" as ApprovalStatus,
  };

  const handleSave = async (item: Partial<Blog>) => {
    if (item.id) await api.blogs.update(item.id as number, item);
    else await api.blogs.create(item);
    await fetchItems();
  };

  const handleToggleStatus = async (item: Blog) => {
    const newStatus = item.approval_status === "APPROVED" ? "REJECTED" : "APPROVED";
    if (newStatus === "APPROVED") await api.admin.approveContent("blog", item.id);
    else await api.admin.rejectContent("blog", item.id);
    await fetchItems();
  };

  return (
    <ContentPageTemplate<Blog>
      title="Articles"
      subtitle={`${items.length} technical insights archived in the professional registry.`}
      icon={BookOpen}
      items={items}
      loading={loading}
      isAdmin={isUserAdmin}
      emptyItem={emptyItem}
      onSave={handleSave}
      onToggleStatus={isUserAdmin ? handleToggleStatus : undefined}
      searchFields={(item) => [item.title, item.description]}
      filterOptions={[
        { label: "ALL INDEX", value: "ALL" },
        { label: "PUBLISHED", value: "APPROVED" },
        { label: "PENDING", value: "PENDING" },
      ]}
      renderListItem={(item, onClick) => (
        <article 
          key={item.id} 
          onClick={onClick}
          className="group relative bg-white border border-zinc-100 p-10 hover:shadow-2xl hover:shadow-zinc-200/50 transition-all duration-500 cursor-pointer flex flex-col gap-8 rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-700"
        >
          <div className="flex items-start justify-between">
             <div className="flex items-center gap-4">
                <div className="p-2.5 bg-zinc-900 text-white rounded-xl shadow-lg opacity-90">
                   <ImageIcon size={18} />
                </div>
                <span className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-900 border-b-2 border-zinc-900 pb-0.5">
                   TECHNICAL INSIGHT
                </span>
             </div>
             <Badge status={item.approval_status} className="rounded-full" />
          </div>
          <div className="flex-1 min-w-0">
             <div className="flex items-center gap-2 mb-6 text-[11px] font-bold text-zinc-400 uppercase tracking-widest leading-none bg-zinc-50 px-3 py-1.5 rounded-full w-fit">
                <Calendar size={13} /> {new Date(item.created_at).toLocaleDateString()}
             </div>
             <h2 className="text-2xl font-black text-zinc-900 leading-tight group-hover:text-black transition-all line-clamp-2 uppercase tracking-tighter">{item.title}</h2>
             <p className="text-[13px] font-medium text-zinc-500 leading-relaxed line-clamp-2 mt-6">{item.description || "No summary node provided for this index entry."}</p>
          </div>
          <div className="pt-10 border-t border-zinc-50 flex items-center justify-between">
             <div className="flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-zinc-900 opacity-80 group-hover:opacity-100 transition-opacity">
                Execute Read <ExternalLink size={14} />
             </div>
             <div className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.2em] translate-x-2 group-hover:translate-x-0 transition-opacity opacity-0 group-hover:opacity-100 flex items-center gap-2">
                Open node <ArrowRight size={12} />
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
            <FormField label="Internal Label" full>
              <FormInput 
                placeholder="Technical Article identification..." 
                value={item.title || ""} 
                onChange={e => setItem({ ...item, title: e.target.value })}
                className="rounded-2xl"
              />
            </FormField>
            
            <FormField label="Registry Status" full={isUserAdmin}>
              <FormSelect 
                value={item.approval_status || "PENDING"} 
                onChange={e => setItem({ ...item, approval_status: e.target.value as ApprovalStatus })}
                className="rounded-2xl"
                options={[
                  { label: "PENDING REVIEW Hub", value: "PENDING" },
                  { label: "LOCAL DRAFT Node", value: "DRAFT" },
                  ...(isUserAdmin ? [{ label: "AUTHORIZE ENTRY Node", value: "APPROVED" }, { label: "INVALIDATE ENTRY Node", value: "REJECTED" }] : [])
                ]}
              />
            </FormField>

            <FormField label="Operational Abstract" full>
               <FormTextArea 
                 placeholder="Brief hook for the insight registry node..." 
                 value={item.description || ""}
                 onChange={e => setItem({ ...item, description: e.target.value })}
                 className="rounded-3xl min-h-[160px]"
               />
            </FormField>

            <FormField label="Full Technical Payload (Markdown)" full>
              <FormTextArea 
                className="min-h-[500px] font-mono text-sm leading-loose border-2 rounded-3xl"
                placeholder="# Initialize technical narrative body..." 
                value={item.content || ""}
                onChange={e => setItem({ ...item, content: e.target.value })}
              />
            </FormField>
          </div>
        </div>
      )}
    />
  );
}