import { JobStatus } from '@/types/database';
import { cn } from '@/lib/utils';

const statusConfig: Record<JobStatus, { label: string; className: string }> = {
  pending: { 
    label: 'Pendiente', 
    className: 'bg-warning/15 text-warning border-warning/30' 
  },
  in_progress: { 
    label: 'En Progreso', 
    className: 'bg-info/15 text-info border-info/30' 
  },
  done: { 
    label: 'Completado', 
    className: 'bg-success/15 text-success border-success/30' 
  },
};

interface StatusBadgeProps {
  status: JobStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <span className={cn(
      'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
      config.className,
      className
    )}>
      {config.label}
    </span>
  );
}