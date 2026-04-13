import { cn } from "../../lib/utils";
import type { LucideIcon } from "lucide-react";

/* ─── Badge ───────────────────────────────────────────────────────────────── */
export function Badge({
  status,
  className,
  children,
}: {
  status: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const map: Record<string, string> = {
    APPROVED: "bg-zinc-900 text-white border-zinc-900",
    PENDING:  "bg-white text-zinc-500 border-zinc-300",
    REJECTED: "bg-zinc-50 text-zinc-400 border-zinc-200 line-through",
    DRAFT:    "bg-zinc-50 text-zinc-400 border-zinc-200",
  };

  const baseStatus = status.toUpperCase();
  const label = children ?? (baseStatus.charAt(0) + baseStatus.slice(1).toLowerCase());

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 border text-[10px] font-bold uppercase tracking-widest rounded-full",
        map[baseStatus] ?? map.DRAFT,
        className
      )}
    >
      <span className={cn(
        "w-1.5 h-1.5 rounded-full inline-block",
        baseStatus === "APPROVED" ? "bg-white" :
        baseStatus === "PENDING"  ? "bg-zinc-400" :
        "bg-zinc-300"
      )} />
      {label}
    </span>
  );
}

/* ─── MinimalCard ─────────────────────────────────────────────────────────── */
export function MinimalCard({
  children,
  className,
  border = true,
}: {
  children: React.ReactNode;
  className?: string;
  border?: boolean;
}) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl transition-all duration-200",
        border && "border border-zinc-100 shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}

export const GlassCard = MinimalCard;

/* ─── TrendIndicator ──────────────────────────────────────────────────────── */
export function TrendIndicator({
  value,
  label,
  type = "up",
}: {
  value: string | number;
  label: string;
  type?: "up" | "down" | "neutral";
}) {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-zinc-100 bg-zinc-50 rounded-full">
      <span className="text-[10px] font-bold text-zinc-700">
        {type === "up" ? "↑" : type === "down" ? "↓" : "·"} {value}
      </span>
      <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide">{label}</span>
    </div>
  );
}

/* ─── FunctionalButton ────────────────────────────────────────────────────── */
export function FunctionalButton({
  children,
  icon: Icon,
  onClick,
  className,
  variant = "black",
  disabled = false,
  type,
}: {
  children: React.ReactNode;
  icon?: LucideIcon;
  onClick?: () => void;
  className?: string;
  variant?: "black" | "white" | "danger";
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}) {
  return (
    <button
      type={type ?? "button"}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 px-5 py-2.5 border text-[11px] font-bold uppercase tracking-widest transition-all duration-200 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none rounded-xl",
        variant === "black"  && "bg-zinc-900 text-white border-zinc-900 hover:bg-black",
        variant === "white"  && "bg-white text-zinc-800 border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300",
        variant === "danger" && "bg-white text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300",
        className
      )}
    >
      {Icon && <Icon size={14} />}
      {children}
    </button>
  );
}

export const PremiumButton = FunctionalButton;

/* ─── StatCard ────────────────────────────────────────────────────────────── */
export function StatCard({
  label,
  value,
  icon: Icon,
  className,
  trend,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  className?: string;
  trend?: { value: string; label: string; type?: "up" | "down" };
}) {
  return (
    <div
      className={cn(
        "group relative bg-white border border-zinc-100 rounded-2xl p-7 flex flex-col justify-between overflow-hidden",
        "hover:border-zinc-200 hover:shadow-lg transition-all duration-300",
        className
      )}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-5">
        <div className="w-9 h-9 bg-zinc-900 rounded-lg flex items-center justify-center text-white transition-all duration-300 group-hover:scale-110">
          <Icon size={16} />
        </div>
        {trend && <TrendIndicator {...trend} />}
      </div>

      {/* Value */}
      <div>
        <p className="text-[44px] font-black text-black tracking-tighter leading-none mb-1.5">{value}</p>
        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.18em]">{label}</p>
      </div>

      {/* Bottom accent bar on hover */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-zinc-900 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
    </div>
  );
}

/* ─── Skeletons ───────────────────────────────────────────────────────────── */
export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-20 border border-zinc-100 bg-zinc-50 rounded-2xl animate-pulse"
        />
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="space-y-6 p-10 animate-pulse bg-white rounded-2xl border border-zinc-100">
      <div className="h-8 w-1/3 bg-zinc-50 rounded-lg" />
      <div className="h-5 w-full bg-zinc-50 rounded-lg" />
      <div className="h-40 bg-zinc-50 rounded-xl" />
    </div>
  );
}
