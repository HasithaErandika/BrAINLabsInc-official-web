import { cn } from "../../lib/utils";
import type { LucideIcon } from "lucide-react";

/* ─── Badge ───────────────────────────────────────────────────────────────── */
export function Badge({ status, className, children }: { status: string; className?: string; children?: React.ReactNode }) {
  const map: Record<string, string> = {
    PUBLISHED: "bg-emerald-50 text-emerald-700 border-emerald-100",
    APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-100",
    PENDING: "bg-amber-50 text-amber-700 border-amber-100 italic",
    PENDING_REVIEW: "bg-amber-50 text-amber-700 border-amber-100 italic",
    REJECTED: "bg-rose-50 text-rose-700 border-rose-100",
    DRAFT: "bg-zinc-50 text-zinc-400 border-zinc-200",
  };
  
  const label = children || status.replace("_", " ");
  const baseStatus = status.toUpperCase();

  return (
    <span className={cn(
      "inline-flex items-center px-4 py-1.5 border text-[11px] font-bold uppercase tracking-widest rounded-full", 
      map[baseStatus] ?? map.DRAFT,
      className
    )}>
      {label}
    </span>
  );
}

/* ─── MinimalCard ─────────────────────────────────────────────────────────── */
export function MinimalCard({ children, className, border = true }: { children: React.ReactNode; className?: string; border?: boolean }) {
  return (
    <div className={cn(
      "bg-white rounded-3xl transition-all duration-500",
      border && "border border-zinc-100 shadow-xl shadow-zinc-200/40", // Premium Soft Shadow
      className
    )}>
      {children}
    </div>
  );
}

// Keep GlassCard for compatibility
export const GlassCard = MinimalCard;

/* ─── TrendIndicator ──────────────────────────────────────────────────────── */
export function TrendIndicator({ value, label, type = "up" }: { value: string | number; label: string; type?: "up" | "down" | "neutral" }) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-1.5 border border-zinc-100 bg-zinc-50/50 rounded-full">
      <span className={cn(
        "text-[10px] font-black text-black",
        type === "down" && "text-rose-500"
      )}>
        {type === "up" ? "↑" : type === "down" ? "↓" : "•"} {value}
      </span>
      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{label}</span>
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
  disabled = false 
}: { 
  children: React.ReactNode; 
  icon?: LucideIcon; 
  onClick?: () => void; 
  className?: string; 
  variant?: "black" | "white"; 
  disabled?: boolean 
}) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center justify-center gap-3 px-8 py-4 border text-[12px] font-bold uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none rounded-2xl",
        variant === "black" && "bg-zinc-900 text-white border-zinc-900 hover:bg-black hover:shadow-2xl hover:shadow-zinc-900/10",
        variant === "white" && "bg-white text-zinc-900 border-zinc-200 hover:bg-zinc-50 hover:shadow-lg",
        className
      )}
    >
      {children}
      {Icon && <Icon size={16} />}
    </button>
  );
}

// Compatibility export
export const PremiumButton = FunctionalButton;

/* ─── StatCard ────────────────────────────────────────────────────────────── */
export function StatCard({ label, value, icon: Icon, className, trend }: { label: string; value: string | number; icon: LucideIcon; className?: string; trend?: { value: string; label: string; type?: "up" | "down" } }) {
  return (
    <div className={cn("bg-white border border-zinc-100 rounded-3xl p-10 flex flex-col justify-between h-full shadow-xl shadow-zinc-200/30 hover:shadow-2xl hover:shadow-zinc-300/40 transition-all duration-500 group", className)}>
      <div className="flex items-center justify-between mb-10">
         <div className="w-14 h-14 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:text-black group-hover:bg-zinc-100 transition-all duration-500">
            <Icon size={24} />
         </div>
         {trend && <TrendIndicator {...trend} />}
      </div>
      <div>
         <p className="text-4xl font-black text-black tracking-tighter leading-none mb-3">{value}</p>
         <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest leading-none">{label}</p>
      </div>
    </div>
  );
}

/* ─── Skeletons ───────────────────────────────────────────────────────────── */
export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-24 border border-zinc-100 bg-zinc-50/50 rounded-3xl animate-pulse" />
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="space-y-10 p-14 animate-pulse bg-white rounded-3xl border border-zinc-100">
      <div className="h-14 w-1/3 bg-zinc-50 rounded-2xl" />
      <div className="h-8 w-full bg-zinc-50 rounded-2xl" />
      <div className="h-64 bg-zinc-50/50 rounded-3xl" />
    </div>
  );
}
