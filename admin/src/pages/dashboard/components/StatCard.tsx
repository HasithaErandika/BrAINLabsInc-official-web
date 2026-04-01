import { Link } from "react-router-dom";
import { type LucideIcon } from "lucide-react";
import { cn } from "../../../lib/utils";
import { TrendIndicator } from "../../../components/shared/UIPrimitives";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  href: string;
  sub?: string;
  trend?: { value: string; label: string; type?: "up" | "down" | "neutral" };
  className?: string;
}

export function StatCard({ label, value, icon: Icon, href, trend, className }: StatCardProps) {
  return (
    <Link
      to={href}
      className={cn(
        "group flex items-center justify-between p-10 bg-white border border-zinc-100 rounded-3xl hover:border-zinc-300 hover:shadow-2xl hover:shadow-zinc-300/40 transition-all duration-500",
        className
      )}
    >
      <div className="flex items-center gap-8">
        <div className="w-14 h-14 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:text-black group-hover:bg-zinc-100 transition-all duration-500">
          <Icon size={24} />
        </div>
        <div>
          <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.25em] leading-none mb-3">{label}</p>
          <p className="text-4xl font-black text-black tracking-tighter leading-none">{value}</p>
        </div>
      </div>
      
      {trend && (
        <div className="opacity-80 group-hover:opacity-100 transition-opacity">
          <TrendIndicator {...trend} />
        </div>
      )}
    </Link>
  );
}
