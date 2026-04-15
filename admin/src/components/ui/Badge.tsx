import React from 'react';
import type { ApprovalStatus } from '../../types';

interface BadgeProps {
  status?: ApprovalStatus | null;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, className = '' }) => {
  const safeStatus = status || 'APPROVED';

  const variants: Record<ApprovalStatus, string> = {
    APPROVED:           'bg-zinc-900 text-white',
    PENDING_ADMIN:      'bg-zinc-200 text-zinc-800 border border-zinc-300',
    PENDING_RESEARCHER: 'bg-zinc-100 text-zinc-700 border border-zinc-200',
    DRAFT:              'bg-white text-zinc-500 border border-zinc-200',
    REJECTED:           'bg-zinc-50 text-zinc-400 border border-zinc-200 line-through opacity-70',
  };

  const dots: Record<ApprovalStatus, string> = {
    APPROVED:           'bg-white',
    PENDING_ADMIN:      'bg-zinc-500',
    PENDING_RESEARCHER: 'bg-zinc-400',
    DRAFT:              'bg-zinc-300',
    REJECTED:           'bg-zinc-300',
  };

  const labels: Record<ApprovalStatus, string> = {
    APPROVED:           'Approved',
    PENDING_ADMIN:      'Pending Admin',
    PENDING_RESEARCHER: 'In Review',
    DRAFT:              'Draft',
    REJECTED:           'Rejected',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${variants[safeStatus]} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dots[safeStatus]}`} />
      {!status ? 'Admin' : labels[safeStatus]}
    </span>
  );
};
