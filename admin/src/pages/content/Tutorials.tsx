import { useState, useEffect } from "react";
import { GraduationCap, ArrowRight } from "lucide-react";
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
      subtitle={`${items.length} tutorial${items.length !== 1 ? "s" : ""} in the registry.`}
      icon={GraduationCap}
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
        <article key={item.id} onClick={onClick} className="group bg-white border border-zinc-100 rounded-2xl p-6 hover:border-zinc-200 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-zinc-900 text-white rounded-lg">
                <GraduationCap size={14} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Tutorial</span>
            </div>
            <Badge status={item.approval_status} />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-black text-zinc-900 leading-snug line-clamp-2 mb-1.5">{item.title}</h3>
            {item.description && (
              <p className="text-sm text-zinc-500 font-medium line-clamp-2">{item.description}</p>
            )}
          </div>
          <div className="pt-3 border-t border-zinc-50 flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Open</span>
            <ArrowRight size={14} className="text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity" />
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
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Title" full>
              <FormInput placeholder="Tutorial title..." value={item.title ?? ""} onChange={e => setItem({...item, title: e.target.value})} />
            </FormField>

            <FormField label="Status" full={isUserAdmin}>
              <FormSelect
                value={item.approval_status || "PENDING"}
                onChange={e => setItem({ ...item, approval_status: e.target.value as ApprovalStatus })}
                options={[
                  { label: "Pending", value: "PENDING" },
                  ...(isUserAdmin ? [{ label: "Approved", value: "APPROVED" }, { label: "Rejected", value: "REJECTED" }] : [])
                ]}
              />
            </FormField>

            <FormField label="Description" full>
              <FormTextArea className="min-h-[120px]" placeholder="A short summary..." value={item.description ?? ""} onChange={e => setItem({...item, description: e.target.value})} />
            </FormField>

            <FormField label="Content (Markdown)" full>
              <FormTextArea
                className="min-h-[500px] font-mono text-sm leading-loose border-2"
                placeholder="# Start writing..."
                value={item.content ?? ""}
                onChange={e => setItem({...item, content: e.target.value})}
              />
            </FormField>
          </div>
        </div>
      )}
    />
  );
}
