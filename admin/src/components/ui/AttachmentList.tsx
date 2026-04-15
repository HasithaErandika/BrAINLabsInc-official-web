import { useState } from "react";
import { Plus, X, Link, Tag } from "lucide-react";

interface Item {
  id: number;
  [key: string]: any;
}

interface AttachmentListProps {
  label: string;
  icon?: "link" | "tag";
  items: Item[];
  displayKey: string; // e.g. "keyword", "image_url", "diagram_url"
  inputPlaceholder: string;
  secondaryKey?: string;        // e.g. "doc_label"
  secondaryPlaceholder?: string;
  onAdd: (value: string, secondary?: string) => Promise<void>;
  onRemove: (id: number) => Promise<void>;
  disabled?: boolean;
}

export function AttachmentList({
  label,
  icon = "link",
  items,
  displayKey,
  inputPlaceholder,
  secondaryKey,
  secondaryPlaceholder,
  onAdd,
  onRemove,
  disabled,
}: AttachmentListProps) {
  const [value, setValue] = useState("");
  const [secondary, setSecondary] = useState("");
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<number | null>(null);

  const Icon = icon === "tag" ? Tag : Link;

  const handleAdd = async () => {
    if (!value.trim()) return;
    setAdding(true);
    try {
      await onAdd(value.trim(), secondary.trim() || undefined);
      setValue("");
      setSecondary("");
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id: number) => {
    setRemoving(id);
    try {
      await onRemove(id);
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500 flex items-center gap-1.5">
        <span className="w-1 h-3 rounded-full bg-zinc-900 inline-block" />
        {label}
      </label>

      {/* Existing items */}
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="group flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-700 hover:border-zinc-300 transition-colors"
            >
              <Icon size={11} className="text-zinc-500 shrink-0" />
              <span className="max-w-[200px] truncate">{item[displayKey]}</span>
              {secondaryKey && item[secondaryKey] && (
                <span className="text-zinc-400 truncate max-w-[100px]">— {item[secondaryKey]}</span>
              )}
              <button
                onClick={() => handleRemove(item.id)}
                disabled={removing === item.id || disabled}
                className="ml-1 text-zinc-300 hover:text-red-500 transition-colors disabled:opacity-50"
              >
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add new */}
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder={inputPlaceholder}
          disabled={disabled || adding}
          className="input-monochrome flex-1 text-sm"
        />
        {secondaryKey && (
          <input
            type="text"
            value={secondary}
            onChange={(e) => setSecondary(e.target.value)}
            placeholder={secondaryPlaceholder ?? "Label (optional)"}
            disabled={disabled || adding}
            className="input-monochrome w-40 text-sm"
          />
        )}
        <button
          onClick={handleAdd}
          disabled={!value.trim() || adding || disabled}
          className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-700 text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          <Plus size={13} />
          Add
        </button>
      </div>
    </div>
  );
}
