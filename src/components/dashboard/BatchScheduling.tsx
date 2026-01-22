import { Calendar, Clock, Users, Package, Box, Zap, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ScheduledBatch, Resource } from '@/types/manufacturing';

interface BatchSchedulingProps {
  schedule: ScheduledBatch[];
  resources: Resource[];
}

function GanttChart({ schedule }: { schedule: ScheduledBatch[] }) {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  
  const totalHours = 24;
  const currentHourProgress = (now.getHours() + now.getMinutes() / 60) / totalHours * 100;

  const getPositionStyle = (batch: ScheduledBatch) => {
    const start = new Date(batch.startTime);
    const end = new Date(batch.endTime);
    
    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;
    
    const left = (startHour / totalHours) * 100;
    const width = ((endHour - startHour) / totalHours) * 100;
    
    return { left: `${left}%`, width: `${Math.max(width, 2)}%` };
  };

  const statusColors = {
    'queued': 'bg-muted-foreground',
    'in-progress': 'bg-primary',
    'completed': 'bg-success',
    'delayed': 'bg-warning',
  };

  return (
    <div className="relative h-32 bg-muted/30 rounded-lg overflow-hidden">
      {/* Hour markers */}
      <div className="absolute inset-0 flex">
        {Array.from({ length: 25 }).map((_, i) => (
          <div 
            key={i} 
            className="flex-1 border-r border-border/30 relative"
          >
            {i % 4 === 0 && i < 24 && (
              <span className="absolute top-1 left-1 text-[8px] text-muted-foreground">
                {String(i).padStart(2, '0')}:00
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Current time indicator */}
      <div 
        className="absolute top-0 bottom-0 w-0.5 bg-destructive z-10"
        style={{ left: `${currentHourProgress}%` }}
      >
        <div className="absolute -top-1 -left-1 w-2 h-2 rounded-full bg-destructive" />
      </div>

      {/* Batch bars */}
      <div className="absolute inset-0 pt-6 px-1">
        {schedule.slice(0, 5).map((batch, idx) => (
          <div
            key={batch.id}
            className={`absolute h-5 ${statusColors[batch.status]} rounded text-[8px] text-white flex items-center px-1 overflow-hidden whitespace-nowrap group cursor-pointer transition-all hover:h-6 hover:z-10`}
            style={{
              ...getPositionStyle(batch),
              top: `${20 + idx * 22}px`,
            }}
          >
            <span className="truncate">{batch.batchNumber}</span>
            {/* Tooltip */}
            <div className="absolute bottom-full mb-1 left-0 bg-popover border border-border rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
              <div className="font-medium">{batch.productName}</div>
              <div className="text-muted-foreground">
                {new Date(batch.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                {new Date(batch.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResourceItem({ resource }: { resource: Resource }) {
  const typeIcons = {
    equipment: <Box className="w-3 h-3" />,
    operator: <Users className="w-3 h-3" />,
    material: <Package className="w-3 h-3" />,
    room: <Calendar className="w-3 h-3" />,
  };

  return (
    <div className={`flex items-center justify-between p-1.5 rounded ${resource.available ? 'bg-success/10' : 'bg-warning/10'}`}>
      <div className="flex items-center gap-1.5">
        <span className={resource.available ? 'text-success' : 'text-warning'}>
          {typeIcons[resource.type]}
        </span>
        <span className="text-[10px] truncate max-w-[100px]">{resource.name}</span>
      </div>
      <Badge 
        variant="outline" 
        className={`text-[8px] ${resource.available ? 'text-success' : 'text-warning'}`}
      >
        {resource.available ? 'Available' : 'Busy'}
      </Badge>
    </div>
  );
}

function QueueItem({ batch, index }: { batch: ScheduledBatch; index: number }) {
  return (
    <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-medium">
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium truncate">{batch.batchNumber}</div>
        <div className="text-[10px] text-muted-foreground truncate">{batch.productName}</div>
      </div>
      <div className="text-[10px] text-muted-foreground">
        {new Date(batch.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  );
}

export function BatchScheduling({ schedule, resources }: BatchSchedulingProps) {
  const inProgress = schedule.find(b => b.status === 'in-progress');
  const queued = schedule.filter(b => b.status === 'queued');
  const avgWaitTime = 15; // Simulated

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Gantt Chart */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Production Timeline</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded bg-primary" />
              <span className="text-[10px] text-muted-foreground">Active</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded bg-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Queued</span>
            </div>
          </div>
        </div>
        <GanttChart schedule={schedule} />
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-muted/30 rounded-lg p-2">
          <div className="text-[10px] text-muted-foreground">Throughput</div>
          <div className="text-lg font-bold text-primary">4.2/hr</div>
        </div>
        <div className="bg-muted/30 rounded-lg p-2">
          <div className="text-[10px] text-muted-foreground">Avg Wait</div>
          <div className="text-lg font-bold">{avgWaitTime}min</div>
        </div>
        <div className="bg-muted/30 rounded-lg p-2">
          <div className="text-[10px] text-muted-foreground">Queue</div>
          <div className="text-lg font-bold">{queued.length}</div>
        </div>
      </div>

      {/* Resource Matrix */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Package className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Resource Availability</span>
        </div>
        <div className="grid grid-cols-2 gap-1">
          {resources.slice(0, 4).map((resource) => (
            <ResourceItem key={resource.id} resource={resource} />
          ))}
        </div>
      </div>

      {/* Priority Queue */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Priority Queue</span>
        </div>
        <ScrollArea className="flex-1">
          <div className="space-y-1.5 pr-2">
            {queued.slice(0, 4).map((batch, idx) => (
              <QueueItem key={batch.id} batch={batch} index={idx} />
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* AI Decision indicator */}
      <div className="bg-primary/10 rounded-lg p-2">
        <div className="flex items-center gap-2 text-[10px]">
          <Zap className="w-3 h-3 text-primary" />
          <span className="text-primary font-medium">AI Optimization Active</span>
        </div>
        <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
          <span>Receiving from: Maintenance, QC, Yield</span>
          <ArrowRight className="w-3 h-3" />
          <span>Schedule adjustments</span>
        </div>
      </div>
    </div>
  );
}
