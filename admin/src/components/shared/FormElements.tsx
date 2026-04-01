import { cn } from "../../lib/utils";
import type { LucideIcon } from "lucide-react";
import { ChevronDown } from "lucide-react";

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  full?: boolean;
  className?: string;
}

export function FormField({ label, children, full = false, className }: FormFieldProps) {
  return (
    <div className={cn("flex flex-col gap-2", full ? "col-span-1 md:col-span-2" : "", className)}>
      <label className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400 ml-1">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-5 py-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-zinc-900/5 focus:border-zinc-400 transition-all text-sm font-medium text-zinc-900 placeholder:text-zinc-400 shadow-sm hover:border-zinc-300";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: LucideIcon;
}

export function FormInput({ icon: Icon, className, ...props }: FormInputProps) {
  return (
    <div className="relative group">
      {Icon && (
        <Icon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" />
      )}
      <input 
        className={cn(inputCls, Icon && "pl-11", className)} 
        {...props} 
      />
    </div>
  );
}

export function FormTextArea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea 
      className={cn(inputCls, "min-h-[140px] resize-none", className)} 
      {...props} 
    />
  );
}

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  icon?: LucideIcon;
  options: { label: string; value: string }[];
}

export function FormSelect({ icon: Icon, options, className, ...props }: FormSelectProps) {
  return (
    <div className="relative group">
      {Icon && (
        <Icon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" />
      )}
      <select 
        className={cn(inputCls, "appearance-none", Icon && "pl-11", "pr-11", className)} 
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
    </div>
  );
}
