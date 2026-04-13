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
      subtitle={`${items.length} blog post${items.length !== 1 ? "s" : ""} in the registry.`}
      icon={BookOpen}
      items={items}
      loading={loading}
      isAdmin={isUserAdmin}
      emptyItem={emptyItem}
      onSave={handleSave}
      onToggleStatus={isUserAdmin ? handleToggleStatus : undefined}
      searchFields={(item) => [item.title, item.description]}
      filterOptions={[
        { label: "All", value: "ALL" },
        { label: "Approved", value: "APPROVED" },
        { label: "Pending", value: "PENDING" },
      ]}
      renderListItem={(item, onClick) => (
        <article 
          key={item.id} 
          onClick={onClick}
          className="group bg-white border border-zinc-100 rounded-2xl p-6 hover:border-zinc-200 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col gap-5"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 bg-zinc-900 text-white rounded-lg flex-shrink-0">
                <ImageIcon size={14} />
              </div>
              <div className="flex items-center gap-2 text-[11px] font-medium text-zinc-400 min-w-0">
                <Calendar size={12} />
                <span>{new Date(item.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <Badge status={item.approval_status} />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-black text-zinc-900 leading-snug line-clamp-2 mb-1.5">{item.title}</h2>
            <p className="text-sm text-zinc-500 font-medium leading-relaxed line-clamp-2">
              {item.description || "No description provided."}
            </p>
          </div>
          <div className="pt-4 border-t border-zinc-50 flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
              <ExternalLink size={12} /> Read
            </span>
            <ArrowRight
              size={14}
              className="text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity group-hover:translate-x-0.5 transition-transform"
            />
          </div>
        </article>
      )}
      renderDetail={(item) => (
        <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
           {item.description && (
            <div className="p-8 bg-zinc-50 border border-zinc-100 rounded-2xl italic text-base text-zinc-600 leading-relaxed font-medium">
              "{item.description}"
            </div>
          )}
           <div className="space-y-10 md-content border-t border-zinc-100 pt-16 text-zinc-900 leading-loose">
              {renderMarkdown(item.content || "")}
           </div>
        </div>
      )}
      renderEdit={(item, setItem) => (
        <div className="space-y-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <FormField label="Title" full>
              <FormInput
                placeholder="Blog post title..."
                value={item.title || ""} 
                onChange={e => setItem({ ...item, title: e.target.value })}
                className="rounded-2xl"
              />
            </FormField>
            
            <FormField label="Status" full={isUserAdmin}>
              <FormSelect 
                value={item.approval_status || "PENDING"} 
                onChange={e => setItem({ ...item, approval_status: e.target.value as ApprovalStatus })}
                className="rounded-2xl"
                options={[
                  { label: "PENDING REVIEW", value: "PENDING" },
                  ...(isUserAdmin ? [{ label: "APPROVED", value: "APPROVED" }, { label: "REJECTED", value: "REJECTED" }] : [])
                ]}
              />
            </FormField>

            <FormField label="Description" full>
               <FormTextArea
                 placeholder="A short summary of this blog post..."
                 value={item.description || ""}
                 onChange={e => setItem({ ...item, description: e.target.value })}
                 className="rounded-3xl min-h-[160px]"
               />
            </FormField>

            <FormField label="Content (Markdown)" full>
              <FormTextArea
                className="min-h-[500px] font-mono text-sm leading-loose border-2 rounded-xl"
                placeholder="# Start writing..."
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