import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { cn } from "../../../lib/utils";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  href: string;
  trend?: { value: string; label: string; type?: "up" | "down" | "neutral" };
  className?: string;
}

export function StatCard({ label, value, icon: Icon, href, trend, className }: StatCardProps) {
  return (
    <Link
      to={href}
      className={cn(
        "group relative bg-white border border-zinc-100 rounded-2xl p-7 flex flex-col justify-between overflow-hidden",
        "hover:border-zinc-200 hover:shadow-lg transition-all duration-300",
        className
      )}
    >
      {/* Icon + trend */}
      <div className="flex items-center justify-between mb-5">
        <div className="w-9 h-9 bg-zinc-900 rounded-lg flex items-center justify-center text-white transition-all duration-300 group-hover:scale-110">
          <Icon size={16} />
        </div>
        {trend && (
          <span className="text-[10px] font-bold text-zinc-500 bg-zinc-50 border border-zinc-100 px-2.5 py-1 rounded-full">
            {trend.type === "up" ? "↑" : trend.type === "down" ? "↓" : "·"} {trend.value} {trend.label}
          </span>
        )}
      </div>

      {/* Value + label */}
      <div>
        <p className="text-[44px] font-black text-black tracking-tighter leading-none mb-1.5">{value}</p>
        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.18em]">{label}</p>
      </div>

      {/* Bottom accent bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-zinc-900 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
    </Link>
  );
}
