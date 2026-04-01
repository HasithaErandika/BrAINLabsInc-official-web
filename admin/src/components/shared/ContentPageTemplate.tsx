import { useState } from "react";
import type { ReactNode } from "react";
import { Plus, Search, Filter, ArrowLeft, Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { Badge, ListSkeleton, DetailSkeleton, FunctionalButton } from "./UIPrimitives";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ContentPageView = "list" | "detail" | "edit";

interface ContentPageTemplateProps<T> {
  title: string;
  subtitle: string;
  icon: any;
  items: T[];
  loading: boolean;
  isAdmin: boolean;
  
  // List Configuration
  renderListItem: (item: T, onClick: () => void) => ReactNode;
  searchFields: (item: T) => string[];
  filterOptions?: { label: string; value: string }[];
  
  // Detail Configuration
  renderDetail: (item: T) => ReactNode;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onToggleStatus?: (item: T) => void;
  
  // Edit Configuration
  renderEdit: (item: Partial<T>, setItem: (p: Partial<T>) => void, onSave: () => void) => ReactNode;
  emptyItem: Partial<T>;
  onSave: (item: Partial<T>) => Promise<void>;
}

export function ContentPageTemplate<T extends { id?: number | string; approval_status?: string; title?: string }>({
  title, subtitle, icon: Icon, items, loading, isAdmin,
  renderListItem, searchFields, filterOptions,
  renderDetail, onEdit, onToggleStatus,
  renderEdit, emptyItem, onSave
}: ContentPageTemplateProps<T>) {
  
  const [view, setView] = useState<ContentPageView>("list");
  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const [editingItem, setEditingItem] = useState<Partial<T>>(emptyItem);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  const selectedItem = items.find(i => i.id === selectedId) || null;

  // ─── Logic ──────────────────────────────────────────────────────────────────

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
    const searchValues = searchFields(item).map(s => s.toLowerCase());
    const matchesSearch = !q || searchValues.some(v => v.includes(q));
    const matchesFilter = filter === "ALL" || item.approval_status === filter;
    return matchesSearch && matchesFilter;
  });

  // ─── Render List ────────────────────────────────────────────────────────────

  if (view === "list") {
    return (
      <div className="min-h-screen bg-zinc-50/30">
        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl px-8 py-10 border-b border-zinc-100 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center gap-8 justify-between max-w-7xl mx-auto">
            <div className="animate-in fade-in slide-in-from-left duration-500">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-zinc-900 rounded-xl text-white">
                  <Icon size={18} />
                </div>
                <span className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-400 leading-none">Archival Console</span>
              </div>
              <h1 className="text-4xl font-black text-black tracking-tight mb-2">{title}</h1>
              <p className="text-sm text-zinc-500 font-medium max-w-2xl">{subtitle}</p>
            </div>
            {!isAdmin && (
              <FunctionalButton onClick={handleCreate} icon={Plus} className="shadow-2xl shadow-zinc-900/10">Instantiate Entry</FunctionalButton>
            )}
          </div>
        </div>

        <div className="bg-white/40 border-b border-zinc-100 px-8 py-6 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row gap-6 items-stretch sm:items-center max-w-7xl mx-auto">
            <div className="relative flex-1 max-w-lg group">
              <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors" />
              <input 
                type="text" 
                placeholder="Synchronize registry search..." 
                className="w-full pl-14 pr-7 py-4 text-[13px] bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-zinc-400 transition-all font-medium shadow-sm"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            {filterOptions && (
              <div className="flex items-center gap-2 p-2 bg-zinc-100/50 rounded-2xl w-fit border border-zinc-200/50 shadow-inner">
                {filterOptions.map(opt => (
                  <button 
                    key={opt.value} 
                    onClick={() => setFilter(opt.value)}
                    className={cn(
                      "px-6 py-2.5 text-[11px] font-bold uppercase tracking-widest rounded-[1.2rem] transition-all",
                      filter === opt.value ? "bg-white text-zinc-900 shadow-xl" : "text-zinc-500 hover:text-black hover:bg-zinc-100"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-8 py-14 max-w-7xl mx-auto pb-48">
          {loading ? (
             <ListSkeleton count={4} />
          ) : filteredItems.length === 0 ? (
            <div className="py-48 flex flex-col items-center gap-8 text-center animate-in fade-in duration-700">
              <div className="w-28 h-28 rounded-4xl bg-white border border-zinc-100 flex items-center justify-center shadow-2xl shadow-zinc-200/50">
                <Filter size={36} className="text-zinc-200" />
              </div>
              <p className="text-zinc-400 font-bold text-sm uppercase tracking-[0.4em] leading-relaxed max-w-xs">No experimental nodes match current filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {filteredItems.map(item => renderListItem(item, () => {
                setSelectedId(item.id!);
                setView("detail");
              }))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Render Detail ──────────────────────────────────────────────────────────

  if (view === "detail" && selectedItem) {
    return (
      <div className="min-h-screen bg-white">
        <div className="sticky top-0 z-30 flex items-center justify-between bg-white/80 backdrop-blur-xl px-8 py-6 border-b border-zinc-100 shadow-sm">
          <button onClick={() => setView("list")} className="inline-flex items-center gap-4 text-[13px] font-bold text-zinc-500 hover:text-black transition-all group">
            <div className="p-2.5 rounded-xl group-hover:bg-zinc-100 transition-colors"><ArrowLeft size={18} /></div>
            Index Overview
          </button>
          
          <div className="flex items-center gap-4">
            {!isAdmin && onEdit && (
              <FunctionalButton onClick={() => handleEdit(selectedItem)} variant="white" className="rounded-2xl">Modify Entry</FunctionalButton>
            )}
            {isAdmin && onToggleStatus && (
              <FunctionalButton onClick={() => onToggleStatus(selectedItem)} className="rounded-2xl shadow-2xl shadow-zinc-900/10">Authorize Node</FunctionalButton>
            )}
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-8 py-20 space-y-16 pb-64 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="flex flex-wrap items-center gap-6">
             <Badge status={selectedItem.approval_status || "DRAFT"} className="rounded-full px-6" />
             <span className="text-[12px] font-mono text-zinc-300 font-bold uppercase tracking-widest bg-zinc-50 px-4 py-1.5 rounded-full border border-zinc-100">NODE ID: #{selectedItem.id?.toString().slice(-8).toUpperCase()}</span>
          </div>

          <div className="space-y-8">
            <h1 className="text-5xl md:text-6xl font-black text-black tracking-tight leading-[1.05]">{selectedItem.title || title}</h1>
          </div>

          <div className="pt-16 border-t border-zinc-100">
             {renderDetail(selectedItem)}
          </div>
        </div>
      </div>
    );
  }

  // ─── Render Edit ────────────────────────────────────────────────────────────

  if (view === "edit") {
    return (
      <div className="min-h-screen bg-zinc-50/50">
        <div className="sticky top-0 z-30 flex items-center justify-between bg-white/80 backdrop-blur-xl px-8 py-6 border-b border-zinc-100 shadow-sm">
          <button 
             onClick={() => setView(editingItem.id ? "detail" : "list")} 
             className="inline-flex items-center gap-4 text-[13px] font-bold text-zinc-500 hover:text-black transition-all group"
          >
            <div className="p-2.5 rounded-xl group-hover:bg-zinc-100 transition-colors"><ArrowLeft size={18} /></div>
            Discard Changes
          </button>
          <FunctionalButton onClick={handleSaveInternal} disabled={saving} className="rounded-2xl shadow-2xl shadow-zinc-900/10">
            {saving ? <Loader2 size={18} className="animate-spin" /> : "Commit Modification"}
          </FunctionalButton>
        </div>

        <div className="max-w-4xl mx-auto px-8 py-20 space-y-14 pb-64 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div>
            <h1 className="text-4xl font-black text-black tracking-tight mb-4">{editingItem.id ? "Refine Logic Hub" : "Instantiate Archive node"}</h1>
            <p className="text-base text-zinc-400 font-medium italic leading-relaxed">System updating... Experimental nodes entering moderation queue.</p>
          </div>

          <div className="bg-white border border-zinc-100 rounded-4xl p-16 shadow-2xl shadow-zinc-200/50">
             {renderEdit(editingItem, setEditingItem, handleSaveInternal)}
          </div>
        </div>
      </div>
    );
  }

  return <DetailSkeleton />;
}
