import { useState, useEffect } from "react";
import { FlaskConical, ShieldCheck, Info, ArrowRight } from "lucide-react";
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
      subtitle={`${items.length} project${items.length !== 1 ? "s" : ""} in the registry.`}
      icon={FlaskConical}
      items={items}
      loading={loading}
      isAdmin={isUserAdmin}
      emptyItem={emptyItem}
      onSave={handleSave}
      onToggleStatus={isUserAdmin ? handleToggleStatus : undefined}
      searchFields={item => [item.title, item.description]}
      filterOptions={[
        { label: "All", value: "ALL" },
        { label: "Approved", value: "APPROVED" },
        { label: "Pending", value: "PENDING" },
      ]}
      renderListItem={(item, onClick) => (
        <article
          key={item.id}
          onClick={onClick}
          className="group bg-white border border-zinc-100 rounded-2xl p-6 hover:border-zinc-200 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col gap-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-zinc-900 text-white rounded-lg">
                <FlaskConical size={14} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Project</span>
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
      renderDetail={item => (
        <div className="space-y-10 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-6 bg-zinc-50 border border-zinc-100 rounded-2xl">
              <div className="flex items-center gap-2 mb-3 text-zinc-400">
                <ShieldCheck size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Status</span>
              </div>
              <Badge status={item.approval_status} />
            </div>
            <div className="p-6 bg-zinc-50 border border-zinc-100 rounded-2xl">
              <div className="flex items-center gap-2 mb-3 text-zinc-400">
                <Info size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Created</span>
              </div>
              <p className="text-sm font-bold text-black">
                {new Date(item.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {item.description && (
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Description</h4>
              <p className="text-base text-zinc-600 font-medium leading-relaxed">{item.description}</p>
            </div>
          )}
        </div>
      )}
      renderEdit={(item, setItem) => (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Title" full>
              <FormInput
                placeholder="Project title..."
                value={item.title ?? ""}
                onChange={e => setItem({ ...item, title: e.target.value })}
              />
            </FormField>

            <FormField label="Status" full={isUserAdmin}>
              <FormSelect
                value={item.approval_status || "PENDING"}
                onChange={e => setItem({ ...item, approval_status: e.target.value as ApprovalStatus })}
                options={[
                  { label: "Pending", value: "PENDING" },
                  ...(isUserAdmin
                    ? [{ label: "Approved", value: "APPROVED" }, { label: "Rejected", value: "REJECTED" }]
                    : []),
                ]}
              />
            </FormField>

            <FormField label="Description" full>
              <FormTextArea
                className="min-h-[200px]"
                placeholder="Project description and goals..."
                value={item.description ?? ""}
                onChange={e => setItem({ ...item, description: e.target.value })}
              />
            </FormField>
          </div>
        </div>
      )}
    />
  );
}
