import { useState, useEffect } from "react";
import { Briefcase, Calendar, FileText, ArrowRight, ExternalLink } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { api } from "../../api";
import type { Grant, ApprovalStatus } from "../../types";
import { ContentPageTemplate } from "../../components/shared/ContentPageTemplate";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { AttachmentList } from "../../components/ui/AttachmentList";
import { Button } from "../../components/ui/Button";

export default function GrantsPage() {
  const { isAdmin, isResearcher } = useAuth();
  const [items, setItems] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(true);

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
    passed_date: new Date().toISOString().split('T')[0],
    expire_date: new Date(Date.now() + 31_536_000_000).toISOString().split('T')[0],
    approval_status: "DRAFT" as ApprovalStatus,
  };

  const handleSave = async (item: Partial<Grant>) => {
    if (item.id) await api.grants.update(item.id as number, item);
    else await api.grants.create(item);
    await fetchItems();
  };

  const handleSubmitForReview = async (item: Grant) => {
    await api.content.submit("grant_info", item.id);
    await fetchItems();
  };

  const handleReview = async (item: Grant, status: 'PENDING_ADMIN' | 'REJECTED') => {
    await api.content.review("grant_info", item.id, status);
    await fetchItems();
  };

  const handleToggleStatus = async (item: Grant) => {
    const newStatus = item.approval_status === "APPROVED" ? "REJECTED" : "APPROVED";
    if (newStatus === "APPROVED") await api.admin.approveContent("grant_info", item.id);
    else await api.admin.rejectContent("grant_info", item.id);
    await fetchItems();
  };

  const formatDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString(undefined, { dateStyle: "medium" }) : "—";

  return (
    <ContentPageTemplate<Grant>
      title="Grants"
      subtitle={`${items.length} grant${items.length !== 1 ? "s" : ""} recorded.`}
      icon={Briefcase}
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
                <Briefcase size={14} className="text-zinc-600" />
              </div>
              <span className="text-xs font-medium text-zinc-400">Grant</span>
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
            <span className="text-xs text-zinc-400 flex items-center gap-1">
              <Calendar size={11} /> Expires {formatDate(item.expire_date)}
            </span>
            <ArrowRight size={13} className="text-zinc-300 group-hover:text-zinc-600 group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      )}
      renderDetail={(item) => (
        <div className="space-y-8 pb-20 animate-enter">
          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
              <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1">Awarded</p>
              <p className="text-sm font-semibold text-zinc-900">{formatDate(item.passed_date)}</p>
            </div>
            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
              <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1">Expires</p>
              <p className="text-sm font-semibold text-zinc-900">{formatDate(item.expire_date)}</p>
            </div>
          </div>

          {item.description && (
            <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-100 text-sm text-zinc-900 italic leading-relaxed font-medium">
              "{item.description}"
            </div>
          )}

          {/* Documents */}
          {(item.documents ?? []).length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Documents</h4>
              <div className="flex flex-wrap gap-3">
                {item.documents!.map(doc => (
                  <Button
                    key={doc.id}
                    onClick={() => window.open(doc.doc_url, '_blank')}
                    variant="outline"
                    className="h-10 px-4 text-xs font-medium gap-2"
                  >
                    <FileText size={13} className="text-zinc-600" />
                    {doc.doc_label || 'View Document'}
                    <ExternalLink size={11} className="text-zinc-400" />
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      renderEdit={(item, setItem) => (
        <div className="space-y-8">
          <Input
            label="Grant Title"
            placeholder="Enter grant name..."
            value={item.title ?? ""}
            onChange={e => setItem({ ...item, title: e.target.value })}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Award Date"
              type="date"
              value={item.passed_date ?? ""}
              onChange={e => setItem({ ...item, passed_date: e.target.value })}
            />
            <Input
              label="Expiry Date"
              type="date"
              value={item.expire_date ?? ""}
              onChange={e => setItem({ ...item, expire_date: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Description</label>
            <textarea
              className="input-monochrome min-h-[120px] py-3"
              placeholder="Describe the grant objectives and scope..."
              value={item.description ?? ""}
              onChange={e => setItem({ ...item, description: e.target.value })}
            />
          </div>

          {/* Documents — only after creation */}
          {item.id ? (
            <AttachmentList
              label="Documents"
              icon="link"
              items={item.documents ?? []}
              displayKey="doc_url"
              secondaryKey="doc_label"
              inputPlaceholder="https://example.com/grant-doc.pdf"
              secondaryPlaceholder="Label (e.g. Grant Agreement)"
              onAdd={async (url, label) => {
                await api.grants.addDocument(item.id as number, { doc_url: url, doc_label: label });
                await fetchItems();
              }}
              onRemove={async (docId) => {
                await api.grants.removeDocument(item.id as number, docId);
                await fetchItems();
              }}
            />
          ) : (
            <p className="text-xs text-zinc-400 text-center py-4 border border-dashed border-zinc-200 rounded-xl">
              Documents can be attached after saving the grant for the first time.
            </p>
          )}
        </div>
      )}
    />
  );
}
