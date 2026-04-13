import { useState, useEffect } from "react";
import { Briefcase, Calendar, ShieldCheck, FileText, ArrowRight, Info } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { api, type Grant, type ApprovalStatus } from "../../lib/api";
import { ContentPageTemplate } from "../../components/shared/ContentPageTemplate";
import { FormField, FormInput, FormTextArea, FormSelect } from "../../components/shared/FormElements";
import { Badge } from "../../components/shared/UIPrimitives";

export default function GrantsPage() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(true);
  const isUserAdmin = isAdmin();

  const fetchItems = async () => {
    try {
      const data = await api.grants.list();
      setItems(data);
    } catch (err) {
      console.error("Failed to fetch grants:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const emptyItem: Partial<Grant> = {
    title: "",
    description: "",
    legal_docs: "",
    passed_date: new Date().toISOString().split('T')[0],
    expire_date: new Date(Date.now() + 31_536_000_000).toISOString().split('T')[0],
    approval_status: "PENDING" as ApprovalStatus,
  };

  const handleSave = async (item: Partial<Grant>) => {
    if (item.id) await api.grants.update(item.id as number, item);
    else await api.grants.create(item);
    await fetchItems();
  };

  const handleToggleStatus = async (item: Grant) => {
    const newStatus = item.approval_status === "APPROVED" ? "REJECTED" : "APPROVED";
    // DB table is grant_info — must match the backend route param
    if (newStatus === "APPROVED") await api.admin.approveContent("grant_info", item.id);
    else await api.admin.rejectContent("grant_info", item.id);
    await fetchItems();
  };

  return (
    <ContentPageTemplate<Grant>
      title="Grants"
      subtitle={`${items.length} grant${items.length !== 1 ? "s" : ""} in the registry.`}
      icon={Briefcase}
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
          className="group bg-white border border-zinc-100 rounded-2xl p-6 hover:border-zinc-200 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col gap-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-zinc-900 text-white rounded-lg">
                <Briefcase size={14} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Grant</span>
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
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
              {item.passed_date} — {item.expire_date}
            </span>
            <ArrowRight size={14} className="text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </article>
      )}
      renderDetail={(item) => (
        <div className="space-y-10 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-6 bg-zinc-50 border border-zinc-100 rounded-2xl">
              <div className="flex items-center gap-2 mb-3 text-zinc-400">
                <ShieldCheck size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Status</span>
              </div>
              <Badge status={item.approval_status} />
            </div>
            <div className="p-6 bg-zinc-50 border border-zinc-100 rounded-2xl">
              <div className="flex items-center gap-2 mb-3 text-zinc-400">
                <Calendar size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Award date</span>
              </div>
              <p className="text-sm font-bold text-black">{item.passed_date}</p>
            </div>
            <div className="p-6 bg-zinc-50 border border-zinc-100 rounded-2xl">
              <div className="flex items-center gap-2 mb-3 text-zinc-400">
                <Calendar size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Expiry date</span>
              </div>
              <p className="text-sm font-bold text-black">{item.expire_date}</p>
            </div>
          </div>

          {item.description && (
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                <Info size={14} /> Description
              </h4>
              <p className="text-base text-zinc-600 font-medium leading-relaxed">{item.description}</p>
            </div>
          )}

          {item.legal_docs && (
            <div className="pt-4">
              <a
                href={item.legal_docs}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white text-[11px] font-bold uppercase tracking-widest rounded-xl hover:bg-black transition-colors"
              >
                <FileText size={14} /> View legal document
              </a>
            </div>
          )}
        </div>
      )}
      renderEdit={(item, setItem) => (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Title" full>
              <FormInput
                placeholder="Grant title..."
                value={item.title ?? ""}
                onChange={e => setItem({ ...item, title: e.target.value })}
              />
            </FormField>

            <FormField label="Award date">
              <FormInput
                type="date"
                value={item.passed_date ?? ""}
                onChange={e => setItem({ ...item, passed_date: e.target.value })}
              />
            </FormField>

            <FormField label="Expiry date">
              <FormInput
                type="date"
                value={item.expire_date ?? ""}
                onChange={e => setItem({ ...item, expire_date: e.target.value })}
              />
            </FormField>

            <FormField label="Legal document URL">
              <FormInput
                placeholder="https://..."
                value={item.legal_docs ?? ""}
                onChange={e => setItem({ ...item, legal_docs: e.target.value })}
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
                className="min-h-[180px]"
                placeholder="Grant description and scope..."
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
