import { useState, useEffect } from "react";
import { GraduationCap, BookOpen, Calendar } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { api } from "../../api";
import type { Tutorial, ApprovalStatus } from "../../types";
import { ContentPageTemplate } from "../../components/shared/ContentPageTemplate";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { MarkdownEditor } from "../../components/ui/MarkdownEditor";
import { renderMarkdown } from "../../lib/utils/markdown";

export default function TutorialsPage() {
  const { isAdmin, isResearcher } = useAuth();
  const [items, setItems] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    try {
      const data = await api.tutorials.list();
      setItems(data);
    } catch (err) {
      console.error("Failed to fetch tutorials:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const emptyItem: Partial<Tutorial> = {
    title: "",
    description: "",
    content: "",
    approval_status: "DRAFT" as ApprovalStatus,
  };

  const handleSave = async (item: Partial<Tutorial>) => {
    if (item.id) await api.tutorials.update(item.id as number, item);
    else await api.tutorials.create(item);
    await fetchItems();
  };

  const handleSubmitForReview = async (item: Tutorial) => {
    await api.content.submit("tutorial", item.id);
    await fetchItems();
  };

  const handleReview = async (item: Tutorial, status: 'PENDING_ADMIN' | 'REJECTED') => {
    await api.content.review("tutorial", item.id, status);
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
      subtitle={`${items.length} tutorial${items.length !== 1 ? "s" : ""} available.`}
      icon={GraduationCap}
      items={items}
      loading={loading}
      isAdmin={isAdmin()}
      isResearcher={isResearcher()}
      emptyItem={emptyItem}
      onSave={handleSave}
      onSubmitForReview={handleSubmitForReview}
      onReview={handleReview}
      onToggleStatus={isAdmin() ? handleToggleStatus : undefined}
      searchFields={(item) => [item.title, item.description || ""]}
      filterOptions={[
        { label: "All", value: "ALL" },
        { label: "Published", value: "APPROVED" },
        { label: "Pending", value: "PENDING_ADMIN" },
        { label: "Draft", value: "DRAFT" },
      ]}
      renderListItem={(item, onClick) => (
        <div
          key={item.id}
          onClick={onClick}
          className="group bg-white border border-zinc-200 hover:border-zinc-300 hover:shadow-lg hover:shadow-zinc-100 rounded-2xl p-5 cursor-pointer flex flex-col gap-3 transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center">
                <GraduationCap size={14} className="text-zinc-600" />
              </div>
              <span className="text-xs font-medium text-zinc-400">Tutorial</span>
            </div>
            <Badge status={item.approval_status} />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-sm font-semibold text-zinc-900 leading-snug line-clamp-2">{item.title}</h3>
            {item.description && (
              <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">{item.description}</p>
            )}
          </div>

          <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 flex items-center gap-1.5">
              <BookOpen size={11} /> View tutorial
            </span>
            <span className="text-xs text-zinc-400 flex items-center gap-1">
              <Calendar size={11} /> {new Date(item.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      )}
      renderDetail={(item) => (
        <div className="space-y-8 pb-20 animate-enter">
          {item.description && (
            <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-100 text-sm text-zinc-900 italic font-medium leading-relaxed">
              "{item.description}"
            </div>
          )}
          <div className="prose max-w-none">
            <div className="markdown-monochrome">{renderMarkdown(item.content || "")}</div>
          </div>
        </div>
      )}
      renderEdit={(item, setItem) => (
        <div className="space-y-8">
          <Input
            label="Title"
            placeholder="Enter tutorial title..."
            value={item.title ?? ""}
            onChange={e => setItem({ ...item, title: e.target.value })}
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Summary</label>
            <textarea
              className="input-monochrome min-h-[80px] py-3"
              placeholder="What will learners learn or achieve?"
              value={item.description ?? ""}
              onChange={e => setItem({ ...item, description: e.target.value })}
            />
          </div>

          <MarkdownEditor
            label="Content"
            value={item.content ?? ""}
            onChange={val => setItem({ ...item, content: val })}
          />
        </div>
      )}
    />
  );
}
