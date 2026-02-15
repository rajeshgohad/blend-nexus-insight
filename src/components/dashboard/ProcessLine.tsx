import { ArrowRight, AlertTriangle, CheckCircle2, Factory, Zap, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ProcessBlock {
  id: string;
  name: string;
  status: 'idle' | 'active' | 'warning' | 'error' | 'maintenance';
  isBackup?: boolean;
  canDivert?: boolean;
  batchNumber?: string;
}

export interface EquipmentFailure {
  lineId: string;
  processId: string;
  processName: string;
  timestamp: Date;
}

interface ProcessLineProps {
  currentBatchNumber: string;
  currentProductName: string;
  secondaryBatchNumber?: string;
  secondaryProductName?: string;
  equipmentFailures?: EquipmentFailure[];
}

const processSteps = ['Sieving', 'Dispensing', 'Blending', 'Compression', 'Coating', 'Polishing', 'Packing'];

export function ProcessLine({ 
  currentBatchNumber, 
  currentProductName,
  secondaryBatchNumber = 'BN-2024-0848',
  secondaryProductName = 'Renopril 10mg',
  equipmentFailures = [],
}: ProcessLineProps) {
  const isProcessFailed = (lineId: string, processName: string) => 
    equipmentFailures.some(f => f.lineId === lineId && f.processName === processName);

  // Main production lines - Line 1 is active on Blending, Line 2 on Compression
  const lines: { id: string; name: string; batchNumber: string; productName: string; activeStep: number; processes: ProcessBlock[] }[] = [
    {
      id: 'line-1',
      name: 'Production Line 1',
      batchNumber: currentBatchNumber,
      productName: currentProductName,
      activeStep: 2, // Blending
      processes: processSteps.map((step, idx) => ({
        id: `l1-${step.toLowerCase()}`,
        name: step,
        status: isProcessFailed('line-1', step) ? 'error' : idx === 2 ? 'active' : 'idle',
        canDivert: step === 'Blending' || step === 'Compression',
        batchNumber: idx === 2 ? currentBatchNumber : undefined,
      })),
    },
    {
      id: 'line-2',
      name: 'Production Line 2',
      batchNumber: secondaryBatchNumber,
      productName: secondaryProductName,
      activeStep: 3, // Compression
      processes: processSteps.map((step, idx) => ({
        id: `l2-${step.toLowerCase()}`,
        name: step,
        status: isProcessFailed('line-2', step) ? 'error' : idx === 3 ? 'active' : 'idle',
        canDivert: step === 'Blending' || step === 'Compression',
        batchNumber: idx === 3 ? secondaryBatchNumber : undefined,
      })),
    },
  ];

  // Backup process areas - activate if main is failed and show diverted batch
  const blendingFailed = isProcessFailed('line-1', 'Blending') || isProcessFailed('line-2', 'Blending');
  const compressionFailed = isProcessFailed('line-1', 'Compression') || isProcessFailed('line-2', 'Compression');

  // Get the batch number that was diverted to backup
  const divertedToBlendingBackup = isProcessFailed('line-1', 'Blending') ? currentBatchNumber : isProcessFailed('line-2', 'Blending') ? secondaryBatchNumber : undefined;
  const divertedToCompressionBackup = isProcessFailed('line-1', 'Compression') ? currentBatchNumber : isProcessFailed('line-2', 'Compression') ? secondaryBatchNumber : undefined;

  const backupAreas: (ProcessBlock & { divertedBatch?: string })[] = [
    { id: 'backup-blending', name: 'Blending (Backup)', status: blendingFailed ? 'active' : 'idle', isBackup: true, divertedBatch: divertedToBlendingBackup },
    { id: 'backup-compression', name: 'Compression (Backup)', status: compressionFailed ? 'active' : 'idle', isBackup: true, divertedBatch: divertedToCompressionBackup },
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
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'maintenance':
        return <Factory className="w-4 h-4 text-blue-400" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="h-full flex flex-col gap-4 overflow-auto p-2">
      {/* Equipment Failure Alert */}
      {equipmentFailures.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-5 h-5 text-destructive" />
            <span className="font-semibold text-destructive">Equipment Failure Detected</span>
          </div>
          <div className="space-y-1">
            {equipmentFailures.map((failure, idx) => (
              <div key={idx} className="text-sm text-muted-foreground">
                <span className="font-medium">{failure.processName}</span> on {failure.lineId === 'line-1' ? 'Line 1' : 'Line 2'} 
                <span className="text-destructive ml-2">• Batch diverted to backup</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current Orders Banner */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Factory className="w-6 h-6 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Line 1 - Blending</p>
              <p className="text-lg font-semibold text-foreground">{currentBatchNumber}</p>
            </div>
          </div>
          <Badge variant="outline" className="text-sm px-3 py-1">
            {currentProductName}
          </Badge>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Factory className="w-6 h-6 text-emerald-500" />
            <div>
              <p className="text-sm text-muted-foreground">Line 2 - Compression</p>
              <p className="text-lg font-semibold text-foreground">{secondaryBatchNumber}</p>
            </div>
          </div>
          <Badge variant="outline" className="text-sm px-3 py-1 border-emerald-500/50 text-emerald-400">
            {secondaryProductName}
          </Badge>
        </div>
      </div>

      {/* Main Production Lines */}
      <div className="flex-1 space-y-6">
        {lines.map((line) => {
          const hasError = line.processes.some(p => p.status === 'error');
          const isActive = line.processes.some(p => p.status === 'active');
          
          return (
            <div
              key={line.id}
              className={cn(
                'bg-card border rounded-lg p-4 transition-all',
                hasError ? 'border-destructive/50 bg-destructive/5' : 'border-border'
              )}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-foreground">{line.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {line.batchNumber} • {line.productName}
                  </p>
                </div>
                <Badge
                  variant={hasError ? 'destructive' : isActive ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {hasError ? 'Error' : isActive ? 'Active' : 'Standby'}
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
                      {process.status === 'active' && process.batchNumber && (
                        <span className="text-[10px] mt-0.5 text-emerald-400">{process.batchNumber}</span>
                      )}
                      {process.status === 'error' && (
                        <span className="text-[10px] mt-0.5 text-destructive">FAILED</span>
                      )}
                      {process.canDivert && process.status !== 'error' && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-card" title="Can divert to backup" />
                      )}
                    </div>

                    {/* Arrow Connector */}
                    {idx < line.processes.length - 1 && (
                      <ArrowRight className={cn(
                        "w-5 h-5 mx-1 flex-shrink-0",
                        process.status === 'error' ? 'text-destructive' : 'text-muted-foreground'
                      )} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Backup Process Areas */}
        <div className={cn(
          "border rounded-lg p-4",
          (blendingFailed || compressionFailed) 
            ? "bg-emerald-500/10 border-emerald-500/50" 
            : "bg-amber-500/5 border-amber-500/30"
        )}>
          <div className="flex items-center gap-2 mb-4">
            {(blendingFailed || compressionFailed) ? (
              <Zap className="w-5 h-5 text-emerald-500" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            )}
            <h3 className="text-base font-semibold text-foreground">Backup Process Areas</h3>
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs",
                (blendingFailed || compressionFailed) 
                  ? "border-emerald-500/50 text-emerald-400" 
                  : "border-amber-500/50 text-amber-500"
              )}
            >
              {(blendingFailed || compressionFailed) ? 'Diversion Active' : 'Failover Ready'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {(blendingFailed || compressionFailed) 
              ? 'Batch has been automatically diverted to backup equipment. Work order raised for maintenance.'
              : 'Critical backup equipment available for diversion in case of primary line failure.'
            }
          </p>

          <div className="flex items-center gap-4 flex-wrap">
            {backupAreas.map((backup) => (
              <div
                key={backup.id}
                className={cn(
                  'flex flex-col items-center justify-center min-w-[140px] h-24 rounded-lg border-2 px-4 py-3 transition-all',
                  backup.status === 'active' 
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                    : 'bg-amber-500/10 border-amber-500/40 border-dashed text-amber-400'
                )}
              >
                {backup.status === 'active' ? (
                  <Zap className="w-5 h-5 mb-1 animate-pulse" />
                ) : (
                  <Factory className="w-5 h-5 mb-1" />
                )}
                <span className="text-sm font-medium text-center">{backup.name}</span>
                {backup.status === 'active' && backup.divertedBatch ? (
                  <span className="text-[11px] mt-1 text-emerald-300 font-medium">{backup.divertedBatch}</span>
                ) : (
                  <span className={cn(
                    "text-[10px] mt-1",
                    backup.status === 'active' ? 'text-emerald-400' : 'text-amber-500/70'
                  )}>
                    {backup.status === 'active' ? 'Processing' : 'Available'}
                  </span>
                )}
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
