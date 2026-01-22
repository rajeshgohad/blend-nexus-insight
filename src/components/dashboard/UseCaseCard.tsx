import { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface UseCaseCardProps {
  title: string;
  subtitle: string;
  icon: ReactNode;
  status: 'active' | 'idle' | 'warning' | 'error';
  children: ReactNode;
  className?: string;
}

const statusStyles = {
  active: 'border-success/30 shadow-[0_0_15px_-3px_hsl(var(--success)/0.3)]',
  idle: 'border-border',
  warning: 'border-warning/30 shadow-[0_0_15px_-3px_hsl(var(--warning)/0.3)]',
  error: 'border-destructive/30 shadow-[0_0_15px_-3px_hsl(var(--destructive)/0.3)]',
};

const statusBadgeStyles = {
  active: 'bg-success/20 text-success border-success/30',
  idle: 'bg-muted text-muted-foreground border-muted',
  warning: 'bg-warning/20 text-warning border-warning/30',
  error: 'bg-destructive/20 text-destructive border-destructive/30',
};

export function UseCaseCard({ 
  title, 
  subtitle, 
  icon, 
  status, 
  children,
  className 
}: UseCaseCardProps) {
  return (
    <div className={cn(
      "bg-card rounded-xl border transition-all duration-300 flex flex-col overflow-hidden",
      statusStyles[status],
      className
    )}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            <p className="text-[10px] text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <Badge variant="outline" className={cn("text-[10px]", statusBadgeStyles[status])}>
          {status.toUpperCase()}
        </Badge>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
