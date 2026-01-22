import { Camera, Eye, AlertTriangle, Shield, CheckCircle, XCircle, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import type { QualityDetection } from '@/types/manufacturing';

interface ComputerVisionProps {
  detections: QualityDetection[];
  rftPercentage: number;
}

const detectionTypeLabels: Record<QualityDetection['type'], string> = {
  ppe_violation: 'PPE Violation',
  surface_damage: 'Surface Damage',
  leak: 'Leak Detected',
  contamination: 'Contamination',
  safety_hazard: 'Safety Hazard',
};

const detectionTypeIcons: Record<QualityDetection['type'], React.ReactNode> = {
  ppe_violation: <Shield className="w-3 h-3" />,
  surface_damage: <AlertTriangle className="w-3 h-3" />,
  leak: <AlertTriangle className="w-3 h-3" />,
  contamination: <XCircle className="w-3 h-3" />,
  safety_hazard: <AlertTriangle className="w-3 h-3" />,
};

function CameraFeed({ isActive }: { isActive: boolean }) {
  return (
    <div className="relative aspect-video bg-muted/50 rounded-lg overflow-hidden border border-border">
      {/* Simulated camera feed with scan lines */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent animate-pulse" />
      
      {/* Grid overlay */}
      <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="border border-primary/10" />
        ))}
      </div>
      
      {/* Camera info overlay */}
      <div className="absolute top-2 left-2 flex items-center gap-1 bg-background/80 rounded px-1.5 py-0.5">
        <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-success animate-pulse' : 'bg-muted-foreground'}`} />
        <span className="text-[10px] font-mono">CAM-01</span>
      </div>
      
      {/* Timestamp */}
      <div className="absolute bottom-2 right-2 bg-background/80 rounded px-1.5 py-0.5">
        <span className="text-[10px] font-mono">
          {new Date().toLocaleTimeString('en-US', { hour12: false })}
        </span>
      </div>
      
      {/* Detection zone indicator */}
      <div className="absolute top-1/4 left-1/4 right-1/4 bottom-1/4 border-2 border-dashed border-primary/40 rounded">
        <span className="absolute -top-3 left-0 text-[8px] text-primary bg-background px-1">
          Detection Zone
        </span>
      </div>
      
      {/* AI scanning indicator */}
      {isActive && (
        <div className="absolute bottom-2 left-2 flex items-center gap-1">
          <Eye className="w-3 h-3 text-primary animate-pulse" />
          <span className="text-[10px] text-primary">AI Scanning...</span>
        </div>
      )}
    </div>
  );
}

function DetectionCard({ detection }: { detection: QualityDetection }) {
  const severityColors = {
    minor: 'border-success/30 bg-success/10 text-success',
    moderate: 'border-warning/30 bg-warning/10 text-warning',
    critical: 'border-destructive/30 bg-destructive/10 text-destructive',
  };

  const statusIcons = {
    detected: <AlertTriangle className="w-3 h-3" />,
    investigating: <Eye className="w-3 h-3" />,
    resolved: <CheckCircle className="w-3 h-3" />,
  };

  return (
    <div className={`p-2 rounded border ${severityColors[detection.severity]} animate-slide-in`}>
      <div className="flex justify-between items-start gap-2 mb-1">
        <div className="flex items-center gap-1.5">
          {detectionTypeIcons[detection.type]}
          <span className="text-xs font-medium">{detectionTypeLabels[detection.type]}</span>
        </div>
        <Badge variant="outline" className="text-[10px] capitalize">
          {detection.severity}
        </Badge>
      </div>
      <div className="text-[10px] opacity-80 mb-1">{detection.location}</div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] opacity-60">
          {detection.timestamp.toLocaleTimeString()}
        </span>
        <div className="flex items-center gap-1 text-[10px]">
          {statusIcons[detection.status]}
          <span className="capitalize">{detection.status}</span>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon, status }: { 
  label: string; 
  value: string; 
  icon: React.ReactNode;
  status: 'good' | 'warning' | 'critical';
}) {
  const statusColors = {
    good: 'text-success',
    warning: 'text-warning',
    critical: 'text-destructive',
  };

  return (
    <div className="bg-muted/30 rounded-lg p-2">
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1">
        {icon}
        {label}
      </div>
      <div className={`text-lg font-bold ${statusColors[status]}`}>{value}</div>
    </div>
  );
}

export function ComputerVision({ detections, rftPercentage }: ComputerVisionProps) {
  const totalDetections = detections.length;
  const criticalCount = detections.filter(d => d.severity === 'critical').length;
  const unresolvedCount = detections.filter(d => d.status !== 'resolved').length;

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Camera Feed */}
      <CameraFeed isActive={true} />

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2">
        <MetricCard 
          label="RFT Rate"
          value={`${rftPercentage.toFixed(1)}%`}
          icon={<CheckCircle className="w-3 h-3" />}
          status={rftPercentage >= 95 ? 'good' : rftPercentage >= 90 ? 'warning' : 'critical'}
        />
        <MetricCard 
          label="Detections"
          value={totalDetections.toString()}
          icon={<Eye className="w-3 h-3" />}
          status={totalDetections <= 5 ? 'good' : totalDetections <= 10 ? 'warning' : 'critical'}
        />
        <MetricCard 
          label="Critical"
          value={criticalCount.toString()}
          icon={<AlertTriangle className="w-3 h-3" />}
          status={criticalCount === 0 ? 'good' : 'critical'}
        />
      </div>

      {/* Detection List */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Active Detections</span>
          </div>
          <Badge variant="outline" className="text-[10px]">
            {unresolvedCount} unresolved
          </Badge>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="space-y-2 pr-2">
            {detections.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-4">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-success" />
                No active detections
              </div>
            ) : (
              detections.slice(0, 5).map((detection) => (
                <DetectionCard key={detection.id} detection={detection} />
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* AI Capabilities */}
      <div className="bg-muted/30 rounded-lg p-2">
        <div className="grid grid-cols-2 gap-1 text-[10px]">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-success" />
            <span>PPE Monitoring</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-success" />
            <span>Surface Inspection</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-success" />
            <span>Leak Detection</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-success" />
            <span>Hazard Alert</span>
          </div>
        </div>
      </div>

      {/* Data flow indicator */}
      <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
        <Zap className="w-3 h-3 text-warning animate-pulse" />
        <span>Sending anomalies to Yield Optimization & Scheduling</span>
      </div>
    </div>
  );
}
