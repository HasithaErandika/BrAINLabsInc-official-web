import { useState } from "react";
import type { ReactNode } from "react";
import { Plus, Search, Filter, ArrowLeft, Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { Badge, ListSkeleton, DetailSkeleton, FunctionalButton } from "./UIPrimitives";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ContentPageView = "list" | "detail" | "edit";

interface ContentPageTemplateProps<T> {
  title: string;
  subtitle: string;
  icon: any;
  items: T[];
  loading: boolean;
  isAdmin: boolean;

  renderListItem: (item: T, onClick: () => void) => ReactNode;
  searchFields: (item: T) => string[];
  filterOptions?: { label: string; value: string }[];

  renderDetail: (item: T) => ReactNode;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onToggleStatus?: (item: T) => void;

  renderEdit: (item: Partial<T>, setItem: (p: Partial<T>) => void, onSave: () => void) => ReactNode;
  emptyItem: Partial<T>;
  onSave: (item: Partial<T>) => Promise<void>;
}

export function ContentPageTemplate<
  T extends { id?: number | string; approval_status?: string; title?: string }
>({
  title,
  subtitle,
  icon: Icon,
  items,
  loading,
  isAdmin,
  renderListItem,
  searchFields,
  filterOptions,
  renderDetail,
  onEdit,
  onToggleStatus,
  renderEdit,
  emptyItem,
  onSave,
}: ContentPageTemplateProps<T>) {
  const [view, setView] = useState<ContentPageView>("list");
  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const [editingItem, setEditingItem] = useState<Partial<T>>(emptyItem);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  const selectedItem = items.find(i => i.id === selectedId) || null;

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleCreate = () => {
    setEditingItem(emptyItem);
    setView("edit");
  };

  const handleEdit = (item: T) => {
    setEditingItem({ ...item });
    setView("edit");
  };

  const handleSaveInternal = async () => {
    setSaving(true);
    try {
      await onSave(editingItem);
      setView("list");
      setSelectedId(null);
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const filteredItems = items.filter(item => {
    const q = search.toLowerCase();
    const values = searchFields(item).map(s => (s ?? "").toLowerCase());
    const matchesSearch = !q || values.some(v => v.includes(q));
    const matchesFilter = filter === "ALL" || item.approval_status === filter;
    return matchesSearch && matchesFilter;
  });

  // ─── List View ───────────────────────────────────────────────────────────────

  if (view === "list") {
    return (
      <div className="min-h-screen bg-zinc-50">
        {/* Page header */}
        <div className="bg-white border-b border-zinc-100 px-8 py-8">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center gap-6 justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-7 h-7 bg-zinc-900 rounded-lg flex items-center justify-center text-white">
                  <Icon size={14} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-400">{title}</span>
              </div>
              <h1 className="text-3xl font-black text-black tracking-tight leading-none">{title}</h1>
              <p className="text-sm text-zinc-500 font-medium mt-1.5">{subtitle}</p>
            </div>
            {!isAdmin && (
              <FunctionalButton onClick={handleCreate} icon={Plus}>
                New {title.replace(/s$/, "")}
              </FunctionalButton>
            )}
          </div>
        </div>

        {/* Search + filter bar */}
        <div className="bg-white border-b border-zinc-100 px-8 py-4">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            <div className="relative flex-1 max-w-md">
              <Search
                size={15}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
              />
              <input
                type="text"
                placeholder={`Search ${title.toLowerCase()}…`}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-zinc-400 font-medium placeholder:text-zinc-400 transition-all"
              />
            </div>

            {filterOptions && (
              <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-xl border border-zinc-200/50">
                {filterOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setFilter(opt.value)}
                    className={cn(
                      "px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all",
                      filter === opt.value
                        ? "bg-white text-zinc-900 shadow-sm border border-zinc-200"
                        : "text-zinc-500 hover:text-zinc-800"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Content list */}
        <div className="px-8 py-8 max-w-7xl mx-auto pb-32">
          {loading ? (
            <ListSkeleton count={4} />
          ) : filteredItems.length === 0 ? (
            <div className="py-32 flex flex-col items-center gap-5 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white border border-zinc-100 flex items-center justify-center shadow-sm">
                <Filter size={24} className="text-zinc-300" />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-400">Nothing matches your search</p>
                <p className="text-xs text-zinc-300 mt-1">Try adjusting your filters</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map(item =>
                renderListItem(item, () => {
                  setSelectedId(item.id!);
                  setView("detail");
                })
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Detail View ─────────────────────────────────────────────────────────────

  if (view === "detail" && selectedItem) {
    return (
      <div className="min-h-screen bg-white">
        {/* Detail header */}
        <div className="sticky top-0 z-30 flex items-center justify-between bg-white/90 backdrop-blur-md px-8 py-4 border-b border-zinc-100 shadow-sm">
          <button
            onClick={() => setView("list")}
            className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors group"
          >
            <div className="p-1.5 rounded-lg group-hover:bg-zinc-100 transition-colors">
              <ArrowLeft size={16} />
            </div>
            Back to {title}
          </button>

          <div className="flex items-center gap-2">
            {!isAdmin && onEdit && (
              <FunctionalButton
                onClick={() => handleEdit(selectedItem)}
                variant="white"
              >
                Edit
              </FunctionalButton>
            )}
            {isAdmin && onToggleStatus && (
              <FunctionalButton onClick={() => onToggleStatus(selectedItem)}>
                {selectedItem.approval_status === "APPROVED" ? "Reject" : "Approve"}
              </FunctionalButton>
            )}
          </div>
        </div>

        {/* Detail content */}
        <div className="max-w-4xl mx-auto px-8 py-12 space-y-10 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-wrap items-center gap-3">
            <Badge status={selectedItem.approval_status || "DRAFT"} />
            <span className="text-[10px] font-mono text-zinc-300 font-bold uppercase tracking-widest">
              ID #{selectedItem.id}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-black tracking-tight leading-tight">
            {selectedItem.title || title}
          </h1>

          <div className="pt-10 border-t border-zinc-100">
            {renderDetail(selectedItem)}
          </div>
        </div>
      </div>
    );
  }

  // ─── Edit View ───────────────────────────────────────────────────────────────

  if (view === "edit") {
    return (
      <div className="min-h-screen bg-zinc-50">
        {/* Edit header */}
        <div className="sticky top-0 z-30 flex items-center justify-between bg-white/90 backdrop-blur-md px-8 py-4 border-b border-zinc-100 shadow-sm">
          <button
            onClick={() => setView(editingItem.id ? "detail" : "list")}
            className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors group"
          >
            <div className="p-1.5 rounded-lg group-hover:bg-zinc-100 transition-colors">
              <ArrowLeft size={16} />
            </div>
            Cancel
          </button>
          <FunctionalButton
            onClick={handleSaveInternal}
            disabled={saving}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : "Save"}
          </FunctionalButton>
        </div>

        {/* Edit form */}
        <div className="max-w-4xl mx-auto px-8 py-10 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mb-8">
            <h1 className="text-2xl font-black text-black tracking-tight">
              {editingItem.id ? `Edit ${title.replace(/s$/, "")}` : `New ${title.replace(/s$/, "")}`}
            </h1>
            <p className="text-sm text-zinc-400 font-medium mt-1">
              {editingItem.id ? "Changes will be submitted for review." : "This entry will be submitted for admin review."}
            </p>
          </div>

          <div className="bg-white border border-zinc-100 rounded-2xl p-10 shadow-sm">
            {renderEdit(editingItem, setEditingItem, handleSaveInternal)}
          </div>
        </div>
      </div>
    );
  }

  return <DetailSkeleton />;
}
