import { Package, FileText, Thermometer, Droplets, Wrench, AlertCircle, CheckCircle2, Clock, Loader2, GitBranch } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { BATCH_ORDERS, type BatchOrder } from '@/data/batchMasterData';

const lineColors = {
  'Line 1': 'bg-primary/20 text-primary',
  'Line 2': 'bg-violet-500/20 text-violet-400',
};

const priorityColors = {
  normal: 'bg-muted text-muted-foreground',
  high: 'bg-amber-500/20 text-amber-400',
  urgent: 'bg-rose-500/20 text-rose-400',
};

const statusConfig: Record<BatchOrder['status'], { label: string; icon: typeof Clock; color: string; animate?: boolean }> = {
  pending: { label: 'Pending', icon: Clock, color: 'text-muted-foreground bg-muted' },
  scheduled: { label: 'Scheduled', icon: FileText, color: 'text-blue-400 bg-blue-500/20' },
  'in-progress': { label: 'In Progress', icon: Loader2, color: 'text-primary bg-primary/20', animate: true },
  completed: { label: 'Completed', icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-500/20' },
};

const cleaningColors = {
  none: 'bg-emerald-500/20 text-emerald-400',
  partial: 'bg-amber-500/20 text-amber-400',
  full: 'bg-rose-500/20 text-rose-400',
};

const densityColors = {
  low: 'bg-sky-500/20 text-sky-400',
  medium: 'bg-violet-500/20 text-violet-400',
  high: 'bg-orange-500/20 text-orange-400',
};

function BatchStatusBadge({ status }: { status: BatchOrder['status'] }) {
  const config = statusConfig[status];
  const Icon = config.icon;
  
  return (
    <Badge variant="outline" className={`${config.color} gap-1`}>
      <Icon className={`w-3 h-3 ${config.animate ? 'animate-spin' : ''}`} />
      {config.label}
    </Badge>
  );
}

function BatchRow({ batch }: { batch: BatchOrder }) {
  return (
    <TableRow className={batch.status === 'in-progress' ? 'bg-primary/5 ring-1 ring-primary/20' : ''}>
      <TableCell className="font-mono font-medium">
        <div className="flex items-center gap-2">
          {batch.status === 'in-progress' && (
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          )}
          {batch.batchNumber}
        </div>
      </TableCell>
      <TableCell>
        <div>
          <div className="font-medium">{batch.productName}</div>
          <div className="text-xs text-muted-foreground">{batch.drug}</div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={densityColors[batch.density]}>
          {batch.density}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={cleaningColors[batch.cleaningRule]}>
          {batch.cleaningRule === 'none' ? 'No Clean' : batch.cleaningRule === 'partial' ? 'Partial' : 'Full + QA'}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="text-xs">
          <div>{batch.tabletSize} {batch.tabletShape}</div>
          <div className="text-muted-foreground">{batch.toolingRequired}</div>
        </div>
      </TableCell>
      <TableCell>
        <Tooltip>
          <TooltipTrigger>
            <div className="flex items-center gap-1 text-xs">
              <Thermometer className="w-3 h-3 text-muted-foreground" />
              {batch.requiredTemp.min}-{batch.requiredTemp.max}°C
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs">
              <div>Temp: {batch.requiredTemp.min}-{batch.requiredTemp.max}°C</div>
              <div>RH: {batch.requiredHumidity.min}-{batch.requiredHumidity.max}%</div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TableCell>
      <TableCell>
        <div className="text-xs">
          <div className="font-medium">{batch.targetQuantity.toLocaleString()}</div>
          <div className="text-muted-foreground">{batch.unit}</div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={priorityColors[batch.priority]}>
          {batch.priority}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={lineColors[batch.productionLine]}>
          <GitBranch className="w-3 h-3 mr-1" />
          {batch.productionLine}
        </Badge>
      </TableCell>
      <TableCell>
        <BatchStatusBadge status={batch.status} />
      </TableCell>
      <TableCell>
        {batch.specialInstructions && (
          <Tooltip>
            <TooltipTrigger>
              <AlertCircle className="w-4 h-4 text-amber-400" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-xs">{batch.specialInstructions}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </TableCell>
    </TableRow>
  );
}

export function BatchOrders() {
  const inProgressCount = BATCH_ORDERS.filter(b => b.status === 'in-progress').length;
  const scheduledCount = BATCH_ORDERS.filter(b => b.status === 'scheduled').length;
  const pendingCount = BATCH_ORDERS.filter(b => b.status === 'pending').length;
  const totalQuantity = BATCH_ORDERS.reduce((sum, b) => sum + b.targetQuantity, 0);

  return (
    <div className="h-full flex flex-col">
      {/* Header Stats */}
      <div className="grid grid-cols-5 gap-3 mb-4">
        <div className="bg-card/50 rounded-lg p-3 border border-border/50">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Total Orders</div>
          <div className="text-2xl font-bold mt-1">{BATCH_ORDERS.length}</div>
        </div>
        <div className="bg-card/50 rounded-lg p-3 border border-border/50">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">In Progress</div>
          <div className="text-2xl font-bold text-primary mt-1">{inProgressCount}</div>
        </div>
        <div className="bg-card/50 rounded-lg p-3 border border-border/50">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Scheduled</div>
          <div className="text-2xl font-bold text-blue-400 mt-1">{scheduledCount}</div>
        </div>
        <div className="bg-card/50 rounded-lg p-3 border border-border/50">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Pending</div>
          <div className="text-2xl font-bold text-muted-foreground mt-1">{pendingCount}</div>
        </div>
        <div className="bg-card/50 rounded-lg p-3 border border-border/50">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Total Units</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{(totalQuantity / 1000).toFixed(0)}K</div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 p-3 bg-card/30 rounded-lg border border-border/50">
        <div className="text-xs font-medium text-muted-foreground">Cleaning Rules:</div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded bg-emerald-500" />
          <span className="text-xs text-muted-foreground">None</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded bg-amber-500" />
          <span className="text-xs text-muted-foreground">Partial</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded bg-rose-500" />
          <span className="text-xs text-muted-foreground">Full + QA</span>
        </div>
        <div className="ml-4 text-xs font-medium text-muted-foreground">Density:</div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded bg-sky-500" />
          <span className="text-xs text-muted-foreground">Low</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded bg-violet-500" />
          <span className="text-xs text-muted-foreground">Medium</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded bg-orange-500" />
          <span className="text-xs text-muted-foreground">High</span>
        </div>
      </div>

      {/* Batch Table */}
      <div className="flex-1 min-h-0 bg-card/30 rounded-lg border border-border/50">
        <ScrollArea className="h-full">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[130px]">Batch #</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="w-[80px]">Density</TableHead>
                <TableHead className="w-[100px]">Cleaning</TableHead>
                <TableHead className="w-[150px]">Tooling</TableHead>
                <TableHead className="w-[80px]">Env.</TableHead>
                <TableHead className="w-[100px]">Quantity</TableHead>
                <TableHead className="w-[80px]">Priority</TableHead>
                <TableHead className="w-[90px]">Prod. Line</TableHead>
                <TableHead className="w-[110px]">Status</TableHead>
                <TableHead className="w-[40px]">Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {BATCH_ORDERS.map(batch => (
                <BatchRow key={batch.id} batch={batch} />
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    </div>
  );
}
