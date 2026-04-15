import { useState } from "react";
import type { ReactNode } from "react";
import { Plus, Search, ArrowLeft, SlidersHorizontal } from "lucide-react";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

export type ContentPageView = "list" | "detail" | "edit";

interface ContentPageTemplateProps<T> {
  title: string;
  subtitle: string;
  icon: any;
  items: T[];
  loading: boolean;
  isAdmin: boolean;
  isResearcher?: boolean;
  renderListItem: (item: T, onClick: () => void) => ReactNode;
  searchFields: (item: T) => string[];
  filterOptions?: { label: string; value: string }[];
  renderDetail: (item: T) => ReactNode;
  onSubmitForReview?: (item: T) => void;
  onReview?: (item: T, status: 'PENDING_ADMIN' | 'REJECTED') => void;
  onToggleStatus?: (item: T) => void;
  renderEdit: (item: Partial<T>, setItem: (p: Partial<T>) => void, onSave: () => void) => ReactNode;
  emptyItem: Partial<T>;
  onSave: (item: Partial<T>) => Promise<void>;
}

export function ContentPageTemplate<
  T extends { id?: number | string; approval_status?: any; title?: string }
>({
  title, subtitle, icon: Icon, items, loading, isAdmin, isResearcher,
  renderListItem, searchFields, filterOptions,
  renderDetail, renderEdit, emptyItem, onSave,
  onSubmitForReview, onReview, onToggleStatus,
}: ContentPageTemplateProps<T>) {
  const [view, setView] = useState<ContentPageView>("list");
  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const [editingItem, setEditingItem] = useState<Partial<T>>(emptyItem);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  const selectedItem = items.find(i => i.id === selectedId) || null;

  const handleCreate = () => { setEditingItem(emptyItem); setView("edit"); };
  const handleEdit = (item: T) => { setEditingItem({ ...item }); setView("edit"); };

  const handleSaveInternal = async () => {
    setSaving(true);
    try { await onSave(editingItem); setView("list"); setSelectedId(null); }
    catch (err) { console.error("Save failed:", err); }
    finally { setSaving(false); }
  };

  const filteredItems = items.filter(item => {
    const q = search.toLowerCase();
    const matchesSearch = !q || searchFields(item).some(s => (s ?? "").toLowerCase().includes(q));
    const matchesFilter = filter === "ALL" || item.approval_status === filter;
    return matchesSearch && matchesFilter;
  });

  // ── List view ─────────────────────────────────────────────────────────────────
  if (view === "list") {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Icon size={14} className="text-zinc-400" />
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest">{title}</span>
            </div>
            <h1 className="text-2xl font-bold text-zinc-900">{title}</h1>
            <p className="text-sm text-zinc-500 mt-0.5">{subtitle}</p>
          </div>
          {!isAdmin && (
            <button
              onClick={handleCreate}
              className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-700 text-white text-xs font-semibold rounded-xl transition-all shrink-0"
            >
              <Plus size={13} /> New
            </button>
          )}
        </div>

        {/* Search + filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              placeholder={`Search ${title.toLowerCase()}...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-monochrome pl-9 text-sm"
            />
          </div>
          {filterOptions && filterOptions.length > 0 && (
            <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl">
              {filterOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setFilter(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    filter === opt.value
                      ? "bg-white text-zinc-900 shadow-sm font-semibold"
                      : "text-zinc-500 hover:text-zinc-700"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-44 skeleton rounded-2xl" />
            ))
          ) : filteredItems.length === 0 ? (
            <div className="col-span-full py-24 text-center flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center">
                <SlidersHorizontal size={20} className="text-zinc-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-500">No {title.toLowerCase()} found</p>
                {search && (
                  <button onClick={() => setSearch("")} className="text-xs text-zinc-500 hover:text-zinc-900 mt-1 underline">
                    Clear search
                  </button>
                )}
              </div>
            </div>
          ) : (
            filteredItems.map(item =>
              renderListItem(item, () => { setSelectedId(item.id!); setView("detail"); })
            )
          )}
        </div>
      </div>
    );
  }

  // ── Detail view ───────────────────────────────────────────────────────────────
  if (view === "detail" && selectedItem) {
    const status = selectedItem.approval_status;
    return (
      <div className="space-y-6">
        {/* Action bar */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
          <button
            onClick={() => setView("list")}
            className="flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft size={15} /> Back to {title}
          </button>
          <div className="flex items-center gap-2">
            {status === "DRAFT" && !isAdmin && (
              <Button variant="outline" onClick={() => handleEdit(selectedItem)} className="h-8 px-3 text-xs">
                Edit
              </Button>
            )}
            {status === "DRAFT" && onSubmitForReview && !isAdmin && (
              <Button onClick={() => onSubmitForReview(selectedItem)} className="h-8 px-3 text-xs">
                Submit for review
              </Button>
            )}
            {isResearcher && status === "PENDING_RESEARCHER" && !isAdmin && onReview && (
              <>
                <Button variant="outline" onClick={() => onReview(selectedItem, 'REJECTED')}
                  className="h-8 px-3 text-xs border-red-200 text-red-600 hover:bg-red-50">
                  Reject
                </Button>
                <Button onClick={() => onReview(selectedItem, 'PENDING_ADMIN')} className="h-8 px-3 text-xs">
                  Forward to admin
                </Button>
              </>
            )}
            {isAdmin && onToggleStatus && (
              status === "APPROVED" ? (
                <Button variant="outline" onClick={() => onToggleStatus(selectedItem)}
                  className="h-8 px-3 text-xs border-red-200 text-red-600 hover:bg-red-50">
                  Revoke
                </Button>
              ) : status === "PENDING_ADMIN" ? (
                <Button onClick={() => onToggleStatus(selectedItem)} className="h-8 px-3 text-xs">
                  Approve
                </Button>
              ) : null
            )}
          </div>
        </div>

        <div className="max-w-3xl space-y-6 pb-16">
          <div className="flex items-center gap-3">
            <Badge status={selectedItem.approval_status} />
            <span className="text-xs text-zinc-400">#{selectedItem.id}</span>
          </div>
          <h1 className="text-3xl font-bold text-zinc-900 leading-tight">
            {selectedItem.title || "Untitled"}
          </h1>
          <div className="border-t border-zinc-100 pt-6">
            {renderDetail(selectedItem)}
          </div>
        </div>
      </div>
    );
  }

  // ── Edit view ─────────────────────────────────────────────────────────────────
  if (view === "edit") {
    const isNew = !editingItem.id;
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
          <button
            onClick={() => setView(editingItem.id ? "detail" : "list")}
            className="flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft size={15} /> Cancel
          </button>
          <Button onClick={handleSaveInternal} isLoading={saving} className="h-9 px-5 text-xs font-semibold">
            {isNew ? "Save draft" : "Save changes"}
          </Button>
        </div>

        <div className="max-w-2xl mx-auto space-y-6 pb-16">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">
              {isNew ? `New ${title.replace(/s$/, "")}` : `Edit ${title.replace(/s$/, "")}`}
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              {isNew ? "Saved as a draft. Submit for review when ready." : "Changes reset approval status to draft."}
            </p>
          </div>
          <div className="space-y-5">
            {renderEdit(editingItem, setEditingItem, handleSaveInternal)}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
