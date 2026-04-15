import { useState, useEffect } from "react";
import { BookOpen, Calendar, Tag, ArrowRight } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { api } from "../../api";
import type { Blog, ApprovalStatus } from "../../types";
import { ContentPageTemplate } from "../../components/shared/ContentPageTemplate";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { AttachmentList } from "../../components/ui/AttachmentList";
import { MarkdownEditor } from "../../components/ui/MarkdownEditor";
import { renderMarkdown } from "../../lib/utils/markdown";

export default function BlogPage() {
  const { isAdmin, isResearcher } = useAuth();
  const [items, setItems] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

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
    approval_status: "DRAFT" as ApprovalStatus,
  };

  const handleSave = async (item: Partial<Blog>) => {
    if (item.id) await api.blogs.update(item.id as number, item);
    else await api.blogs.create(item);
    await fetchItems();
  };

  const handleSubmitForReview = async (item: Blog) => {
    await api.content.submit("blog", item.id);
    await fetchItems();
  };

  const handleReview = async (item: Blog, status: 'PENDING_ADMIN' | 'REJECTED') => {
    await api.content.review("blog", item.id, status);
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
      subtitle={`${items.length} article${items.length !== 1 ? "s" : ""}.`}
      icon={BookOpen}
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
        { label: "Approved", value: "APPROVED" },
        { label: "Pending", value: "PENDING_ADMIN" },
        { label: "Draft", value: "DRAFT" },
      ]}
      renderListItem={(item, onClick) => (
        <div
          key={item.id}
          onClick={onClick}
          className="group bg-white border border-zinc-200 hover:border-zinc-300 hover:shadow-lg hover:shadow-zinc-100 rounded-2xl p-5 cursor-pointer flex flex-col gap-3 transition-all duration-200"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Calendar size={12} />
              <span>{new Date(item.created_at).toLocaleDateString(undefined, { dateStyle: "medium" })}</span>
            </div>
            <Badge status={item.approval_status} />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-sm font-semibold text-zinc-900 leading-snug line-clamp-2">{item.title}</h2>
            {item.description && (
              <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">{item.description}</p>
            )}
          </div>

          {/* Keywords */}
          {(item.blog_keyword ?? item.keywords ?? []).length > 0 && (
            <div className="flex flex-wrap gap-1">
              {(item.blog_keyword ?? item.keywords ?? []).slice(0, 3).map(k => (
                <span key={k.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-50 text-zinc-700 rounded-full text-[10px] font-medium">
                  <Tag size={8} />
                  {k.keyword}
                </span>
              ))}
            </div>
          )}

          <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 flex items-center gap-1.5">
              <BookOpen size={11} /> Read article
            </span>
            <ArrowRight size={13} className="text-zinc-300 group-hover:text-zinc-600 group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      )}
      renderDetail={(item) => (
        <div className="space-y-8 pb-20 animate-enter">
          {item.description && (
            <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-100 text-sm text-zinc-900 leading-relaxed italic font-medium">
              "{item.description}"
            </div>
          )}

          {/* Keywords */}
          {(item.blog_keyword ?? item.keywords ?? []).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {(item.blog_keyword ?? item.keywords ?? []).map(k => (
                <span key={k.id} className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-50 text-zinc-700 border border-zinc-100 rounded-full text-xs font-medium">
                  <Tag size={10} /> {k.keyword}
                </span>
              ))}
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
            placeholder="Enter article title..."
            value={item.title || ""}
            onChange={e => setItem({ ...item, title: e.target.value })}
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Description</label>
            <textarea
              placeholder="Brief summary of the article..."
              value={item.description || ""}
              onChange={e => setItem({ ...item, description: e.target.value })}
              className="input-monochrome min-h-[80px] py-3"
            />
          </div>

          <MarkdownEditor
            label="Content"
            value={item.content || ""}
            onChange={val => setItem({ ...item, content: val })}
          />

          {/* Keywords (only available for saved blogs) */}
          {item.id && (
            <AttachmentList
              label="Keywords"
              icon="tag"
              items={item.blog_keyword ?? item.keywords ?? []}
              displayKey="keyword"
              inputPlaceholder="Add a keyword..."
              onAdd={async (kw) => {
                await api.blogs.addKeyword(item.id as number, kw);
                await fetchItems();
              }}
              onRemove={async (kwId) => {
                await api.blogs.removeKeyword(item.id as number, kwId);
                await fetchItems();
              }}
            />
          )}
        </div>
      )}
    />
  );
}