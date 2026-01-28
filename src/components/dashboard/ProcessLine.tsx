import { useState } from 'react';
import { ArrowRight, AlertTriangle, CheckCircle2, Factory, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ProcessBlock {
  id: string;
  name: string;
  status: 'idle' | 'active' | 'warning' | 'error' | 'maintenance';
  isBackup?: boolean;
  canDivert?: boolean;
}

interface ProcessLineProps {
  currentBatchNumber: string;
  currentProductName: string;
}

const processSteps = ['Sieving', 'Dispensing', 'Blending', 'Compression', 'Coating', 'Polishing'];

export function ProcessLine({ currentBatchNumber, currentProductName }: ProcessLineProps) {
  const [selectedLine, setSelectedLine] = useState<string | null>(null);

  // Main production lines
  const lines: { id: string; name: string; processes: ProcessBlock[] }[] = [
    {
      id: 'line-1',
      name: 'Production Line 1',
      processes: processSteps.map((step, idx) => ({
        id: `l1-${step.toLowerCase()}`,
        name: step,
        status: idx === 2 ? 'active' : idx < 2 ? 'idle' : 'idle',
        canDivert: step === 'Blending' || step === 'Compression',
      })),
    },
    {
      id: 'line-2',
      name: 'Production Line 2',
      processes: processSteps.map((step) => ({
        id: `l2-${step.toLowerCase()}`,
        name: step,
        status: 'idle' as const,
        canDivert: step === 'Blending' || step === 'Compression',
      })),
    },
  ];

  // Backup process areas
  const backupAreas: ProcessBlock[] = [
    { id: 'backup-blending', name: 'Blending (Backup)', status: 'idle', isBackup: true },
    { id: 'backup-compression', name: 'Compression (Backup)', status: 'idle', isBackup: true },
  ];

  const getStatusColor = (status: ProcessBlock['status']) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500/20 border-emerald-500 text-emerald-400';
      case 'warning':
        return 'bg-amber-500/20 border-amber-500 text-amber-400';
      case 'error':
        return 'bg-red-500/20 border-red-500 text-red-400';
      case 'maintenance':
        return 'bg-blue-500/20 border-blue-500 text-blue-400';
      default:
        return 'bg-muted/50 border-border text-muted-foreground';
    }
  };

  const getStatusIcon = (status: ProcessBlock['status']) => {
    switch (status) {
      case 'active':
        return <Zap className="w-4 h-4 text-emerald-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'maintenance':
        return <Factory className="w-4 h-4 text-blue-400" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="h-full flex flex-col gap-4 overflow-auto p-2">
      {/* Current Order Banner */}
      <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Factory className="w-6 h-6 text-primary" />
          <div>
            <p className="text-sm text-muted-foreground">Currently Processing</p>
            <p className="text-lg font-semibold text-foreground">{currentBatchNumber}</p>
          </div>
        </div>
        <Badge variant="outline" className="text-sm px-3 py-1">
          {currentProductName}
        </Badge>
      </div>

      {/* Main Production Lines */}
      <div className="flex-1 space-y-6">
        {lines.map((line) => (
          <div
            key={line.id}
            className={cn(
              'bg-card border rounded-lg p-4 transition-all',
              selectedLine === line.id ? 'border-primary ring-1 ring-primary/50' : 'border-border'
            )}
            onClick={() => setSelectedLine(line.id === selectedLine ? null : line.id)}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-foreground">{line.name}</h3>
              <Badge
                variant={line.processes.some((p) => p.status === 'active') ? 'default' : 'secondary'}
                className="text-xs"
              >
                {line.processes.some((p) => p.status === 'active') ? 'Active' : 'Standby'}
              </Badge>
            </div>

            {/* Process Flow */}
            <div className="flex items-center gap-1 overflow-x-auto pb-2">
              {line.processes.map((process, idx) => (
                <div key={process.id} className="flex items-center">
                  {/* Process Block */}
                  <div
                    className={cn(
                      'relative flex flex-col items-center justify-center min-w-[100px] h-20 rounded-lg border-2 px-3 py-2 transition-all cursor-pointer hover:scale-105',
                      getStatusColor(process.status)
                    )}
                  >
                    {getStatusIcon(process.status)}
                    <span className="text-sm font-medium mt-1">{process.name}</span>
                    {process.status === 'active' && (
                      <span className="text-[10px] mt-0.5 text-emerald-400">{currentBatchNumber}</span>
                    )}
                    {process.canDivert && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-card" title="Can divert to backup" />
                    )}
                  </div>

                  {/* Arrow Connector */}
                  {idx < line.processes.length - 1 && (
                    <ArrowRight className="w-5 h-5 text-muted-foreground mx-1 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Backup Process Areas */}
        <div className="bg-amber-500/5 border border-amber-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-semibold text-foreground">Backup Process Areas</h3>
            <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-500">
              Failover Ready
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Critical backup equipment available for diversion in case of primary line failure. 
            Scheduling will auto-adjust when failures are detected.
          </p>

          <div className="flex items-center gap-4 flex-wrap">
            {backupAreas.map((backup) => (
              <div
                key={backup.id}
                className={cn(
                  'flex flex-col items-center justify-center min-w-[140px] h-24 rounded-lg border-2 border-dashed px-4 py-3 transition-all cursor-pointer hover:border-amber-500/60',
                  'bg-amber-500/10 border-amber-500/40 text-amber-400'
                )}
              >
                <Factory className="w-5 h-5 mb-1" />
                <span className="text-sm font-medium text-center">{backup.name}</span>
                <span className="text-[10px] text-amber-500/70 mt-1">Available</span>
              </div>
            ))}
          </div>

          {/* Diversion Paths */}
          <div className="mt-4 pt-3 border-t border-amber-500/20">
            <p className="text-xs text-muted-foreground">
              <span className="text-amber-500 font-medium">Diversion Paths:</span> Line 1/2 Blending → Backup Blending • Line 1/2 Compression → Backup Compression
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
          <span className="font-medium">Status Legend:</span>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-emerald-500/50 border border-emerald-500" />
            <span>Active</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-muted/50 border border-border" />
            <span>Idle</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-amber-500/50 border border-amber-500" />
            <span>Warning</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-500/50 border border-red-500" />
            <span>Error</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span>Divertible</span>
          </div>
        </div>
      </div>
    </div>
  );
}
