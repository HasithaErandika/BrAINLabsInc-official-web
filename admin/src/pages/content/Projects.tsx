import { useState, useEffect } from "react";
import { FlaskConical, ArrowRight, ImageIcon } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { api } from "../../api";
import type { Project, ApprovalStatus } from "../../types";
import { ContentPageTemplate } from "../../components/shared/ContentPageTemplate";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { MarkdownEditor } from "../../components/ui/MarkdownEditor";
import { AttachmentList } from "../../components/ui/AttachmentList";
import { renderMarkdown } from "../../lib/utils/markdown";

export default function ProjectsPage() {
  const { isAdmin, isResearcher } = useAuth();
  const [items, setItems] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

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
    content: "",
    approval_status: "DRAFT" as ApprovalStatus,
  };

  const handleSave = async (item: Partial<Project>) => {
    if (item.id) await api.projects.update(item.id as number, item);
    else await api.projects.create(item);
    await fetchItems();
  };

  const handleSubmitForReview = async (item: Project) => {
    await api.content.submit("project", item.id);
    await fetchItems();
  };

  const handleReview = async (item: Project, status: 'PENDING_ADMIN' | 'REJECTED') => {
    await api.content.review("project", item.id, status);
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
      subtitle={`${items.length} project${items.length !== 1 ? "s" : ""}.`}
      icon={FlaskConical}
      items={items}
      loading={loading}
      isAdmin={isAdmin()}
      isResearcher={isResearcher()}
      emptyItem={emptyItem}
      onSave={handleSave}
      onSubmitForReview={handleSubmitForReview}
      onReview={handleReview}
      onToggleStatus={isAdmin() ? handleToggleStatus : undefined}
      searchFields={item => [item.title, item.description || ""]}
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
                <FlaskConical size={14} className="text-zinc-600" />
              </div>
              <span className="text-xs font-medium text-zinc-400">Project</span>
            </div>
            <Badge status={item.approval_status} />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-sm font-semibold text-zinc-900 leading-snug line-clamp-2">{item.title}</h3>
            {item.description && (
              <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">{item.description}</p>
            )}
          </div>

          {(item.diagrams ?? []).length > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-zinc-400">
              <ImageIcon size={10} />
              <span>{item.diagrams!.length} diagram{item.diagrams!.length !== 1 ? "s" : ""}</span>
            </div>
          )}

          <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 flex items-center gap-1.5">
              View project
            </span>
            <ArrowRight size={13} className="text-zinc-300 group-hover:text-zinc-600 group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      )}
      renderDetail={item => (
        <div className="space-y-8 pb-20 animate-enter">
          {item.description && (
            <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-100 text-sm text-zinc-900 italic font-medium leading-relaxed">
              "{item.description}"
            </div>
          )}

          {(item.diagrams ?? []).length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Diagrams</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {item.diagrams!.map(d => (
                  <a
                    key={d.id}
                    href={d.diagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-700 hover:border-zinc-200 hover:bg-zinc-50 transition-all"
                  >
                    <ImageIcon size={12} className="text-zinc-500 shrink-0" />
                    <span className="truncate">{d.diagram_url}</span>
                  </a>
                ))}
              </div>
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
            label="Project Title"
            placeholder="Enter project title..."
            value={item.title ?? ""}
            onChange={e => setItem({ ...item, title: e.target.value })}
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Summary</label>
            <textarea
              className="input-monochrome min-h-[80px] py-3"
              placeholder="Describe the project goals and scope..."
              value={item.description ?? ""}
              onChange={e => setItem({ ...item, description: e.target.value })}
            />
          </div>

          <MarkdownEditor
            label="Content"
            value={item.content ?? ""}
            onChange={val => setItem({ ...item, content: val })}
          />

          {item.id && (
            <AttachmentList
              label="Diagrams"
              icon="link"
              items={item.diagrams ?? []}
              displayKey="diagram_url"
              inputPlaceholder="https://example.com/diagram.png"
              onAdd={async (url) => {
                await api.projects.addDiagram(item.id as number, url);
                await fetchItems();
              }}
              onRemove={async (diagId) => {
                await api.projects.removeDiagram(item.id as number, diagId);
                await fetchItems();
              }}
            />
          )}
        </div>
      )}
    />
  );
}
