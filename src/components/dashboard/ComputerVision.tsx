import { useState } from 'react';
import { 
  Camera, Eye, AlertTriangle, Shield, CheckCircle, XCircle, Zap, 
  Bell, ClipboardList, Database, Brain, Users, Wrench, FileText,
  TrendingUp, Activity, MapPin, Clock, Send, ChevronRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
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
  ppe_violation: <Shield className="w-4 h-4" />,
  surface_damage: <AlertTriangle className="w-4 h-4" />,
  leak: <AlertTriangle className="w-4 h-4" />,
  contamination: <XCircle className="w-4 h-4" />,
  safety_hazard: <AlertTriangle className="w-4 h-4" />,
};

// Simulated baseline metrics
const baselineMetrics = {
  ppeCompliance: 98.5,
  surfaceCondition: 97.2,
  environmentalNorm: 99.1,
  safetyScore: 96.8,
};

// Simulated notification recipients
const notificationRecipients = [
  { role: 'Supervisor', name: 'J. Smith', status: 'online' },
  { role: 'Maintenance', name: 'S. Chen', status: 'online' },
  { role: 'QA Inspector', name: 'M. Johnson', status: 'away' },
  { role: 'Security', name: 'L. Davis', status: 'online' },
];

// Workflow integrations
const integrations = [
  { system: 'MES', status: 'connected', lastSync: '2s' },
  { system: 'CMMS', status: 'connected', lastSync: '5s' },
  { system: 'Incident Mgmt', status: 'connected', lastSync: '3s' },
];

function CameraFeed({ isActive }: { isActive: boolean }) {
  return (
    <div className="relative aspect-[16/9] bg-muted/50 rounded-lg overflow-hidden border border-border">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent animate-pulse" />
      
      <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="border border-primary/10" />
        ))}
      </div>
      
      <div className="absolute top-2 left-2 flex items-center gap-2 bg-background/90 rounded px-2 py-1">
        <div className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-success animate-pulse' : 'bg-muted-foreground'}`} />
        <span className="text-sm font-mono font-medium">CAM-01</span>
      </div>
      
      <div className="absolute bottom-2 right-2 bg-background/90 rounded px-2 py-1">
        <span className="text-sm font-mono">
          {new Date().toLocaleTimeString('en-US', { hour12: false })}
        </span>
      </div>
      
      <div className="absolute top-1/4 left-1/4 right-1/4 bottom-1/4 border-2 border-dashed border-primary/40 rounded">
        <span className="absolute -top-5 left-0 text-xs text-primary bg-background px-1.5 py-0.5 rounded">
          AI Detection Zone
        </span>
      </div>
      
      {isActive && (
        <div className="absolute bottom-2 left-2 flex items-center gap-2 bg-background/90 rounded px-2 py-1">
          <Eye className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-sm text-primary font-medium">AI Active</span>
        </div>
      )}

      <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-primary/20 rounded px-2 py-1">
        <Brain className="w-4 h-4 text-primary" />
        <span className="text-xs text-primary font-medium">Baseline Learned</span>
      </div>
    </div>
  );
}

function DetectionCard({ detection, onNotify }: { detection: QualityDetection; onNotify?: () => void }) {
  const severityColors = {
    minor: 'border-success/40 bg-success/10',
    moderate: 'border-warning/40 bg-warning/10',
    critical: 'border-destructive/40 bg-destructive/10',
  };

  const severityTextColors = {
    minor: 'text-success',
    moderate: 'text-warning',
    critical: 'text-destructive',
  };

  return (
    <div className={`p-3 rounded-lg border ${severityColors[detection.severity]}`}>
      <div className="flex justify-between items-start gap-2 mb-2">
        <div className={`flex items-center gap-2 ${severityTextColors[detection.severity]}`}>
          {detectionTypeIcons[detection.type]}
          <span className="text-sm font-semibold">{detectionTypeLabels[detection.type]}</span>
        </div>
        <Badge 
          variant="outline" 
          className={`text-xs capitalize ${severityTextColors[detection.severity]} border-current`}
        >
          {detection.severity}
        </Badge>
      </div>
      
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <MapPin className="w-3.5 h-3.5" />
        <span>{detection.location}</span>
      </div>

      <div className="bg-background/60 rounded p-2 mb-2">
        <div className="text-xs text-muted-foreground mb-0.5">Recommendation:</div>
        <div className="text-sm">{detection.recommendation}</div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          <span>{detection.timestamp.toLocaleTimeString()}</span>
        </div>
        <div className="flex items-center gap-2">
          {detection.status === 'detected' && onNotify && (
            <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={onNotify}>
              <Send className="w-3.5 h-3.5 mr-1" />
              Notify
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, status }: { 
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
    <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
        {icon}
        <span>{label}</span>
      </div>
      <div className={`text-2xl font-bold ${statusColors[status]}`}>{value}</div>
    </div>
  );
}

function BaselineCard({ label, value, status }: { label: string; value: number; status: 'normal' | 'warning' }) {
  return (
    <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Badge variant="outline" className={`text-xs ${status === 'normal' ? 'text-success border-success' : 'text-warning border-warning'}`}>
          {status === 'normal' ? 'Normal' : 'Deviation'}
        </Badge>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xl font-bold text-success">{value}%</span>
        <Progress value={value} className="flex-1 h-2" />
      </div>
    </div>
  );
}

export function ComputerVision({ detections, rftPercentage }: ComputerVisionProps) {
  const totalDetections = detections.length;
  const criticalCount = detections.filter(d => d.severity === 'critical').length;
  const unresolvedCount = detections.filter(d => d.status !== 'resolved').length;

  const handleNotify = () => {
    console.log('Notification sent to relevant personnel');
  };

  return (
    <div className="h-full flex gap-4">
      {/* Left Column - Camera & Detections */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        {/* Camera Feed */}
        <CameraFeed isActive={true} />

        {/* Quick Stats Row */}
        <div className="grid grid-cols-4 gap-3">
          <StatCard 
            label="RFT Rate"
            value={`${rftPercentage.toFixed(1)}%`}
            icon={<CheckCircle className="w-4 h-4" />}
            status={rftPercentage >= 95 ? 'good' : rftPercentage >= 90 ? 'warning' : 'critical'}
          />
          <StatCard 
            label="Detections"
            value={totalDetections.toString()}
            icon={<Eye className="w-4 h-4" />}
            status={totalDetections <= 5 ? 'good' : totalDetections <= 10 ? 'warning' : 'critical'}
          />
          <StatCard 
            label="Critical"
            value={criticalCount.toString()}
            icon={<AlertTriangle className="w-4 h-4" />}
            status={criticalCount === 0 ? 'good' : 'critical'}
          />
          <StatCard 
            label="Unresolved"
            value={unresolvedCount.toString()}
            icon={<ClipboardList className="w-4 h-4" />}
            status={unresolvedCount <= 2 ? 'good' : unresolvedCount <= 5 ? 'warning' : 'critical'}
          />
        </div>

        {/* Active Detections */}
        <div className="flex-1 min-h-0 flex flex-col bg-muted/20 rounded-lg border border-border/50 p-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              <span className="text-base font-medium">Active Detections</span>
            </div>
            <Badge variant="outline" className="text-sm">
              {unresolvedCount} unresolved
            </Badge>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="space-y-3 pr-2">
              {detections.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-success" />
                  <div className="text-lg font-medium">All Clear</div>
                  <div className="text-sm text-muted-foreground">No active detections</div>
                </div>
              ) : (
                detections.slice(0, 4).map((detection) => (
                  <DetectionCard 
                    key={detection.id} 
                    detection={detection} 
                    onNotify={handleNotify}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Right Column - AI Capabilities */}
      <div className="w-80 flex flex-col gap-4">
        {/* Baseline & Deviation Detection */}
        <div className="bg-muted/20 rounded-lg border border-border/50 p-3">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-5 h-5 text-primary" />
            <span className="text-base font-medium">Baseline Monitoring</span>
          </div>
          <div className="space-y-2">
            <BaselineCard label="PPE Compliance" value={baselineMetrics.ppeCompliance} status="normal" />
            <BaselineCard label="Surface Condition" value={baselineMetrics.surfaceCondition} status="normal" />
            <BaselineCard label="Environmental" value={baselineMetrics.environmentalNorm} status="normal" />
            <BaselineCard label="Safety Score" value={baselineMetrics.safetyScore} status="normal" />
          </div>
        </div>

        {/* Immediate Alerting */}
        <div className="bg-muted/20 rounded-lg border border-border/50 p-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-warning" />
              <span className="text-base font-medium">Alert Recipients</span>
            </div>
            <Badge variant="outline" className="text-xs text-success border-success">Auto-notify ON</Badge>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {notificationRecipients.map((recipient) => (
              <div key={recipient.role} className="bg-muted/30 rounded-lg p-2 flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${
                  recipient.status === 'online' ? 'bg-success' : 'bg-warning'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{recipient.role}</div>
                  <div className="text-xs text-muted-foreground truncate">{recipient.name}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Workflow Integration */}
        <div className="bg-muted/20 rounded-lg border border-border/50 p-3">
          <div className="flex items-center gap-2 mb-3">
            <Database className="w-5 h-5 text-primary" />
            <span className="text-base font-medium">System Integration</span>
          </div>
          <div className="space-y-2">
            {integrations.map((int) => (
              <div key={int.system} className="flex items-center justify-between bg-muted/30 rounded-lg p-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <span className="text-sm font-medium">{int.system}</span>
                </div>
                <span className="text-xs text-muted-foreground">Synced {int.lastSync}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Learning */}
        <div className="bg-muted/20 rounded-lg border border-border/50 p-3">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-5 h-5 text-primary" />
            <span className="text-base font-medium">AI Learning</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-muted/30 rounded-lg p-2 text-center">
              <div className="text-xl font-bold text-success">97.8%</div>
              <div className="text-xs text-muted-foreground">Accuracy</div>
            </div>
            <div className="bg-muted/30 rounded-lg p-2 text-center">
              <div className="text-xl font-bold text-success">1.2%</div>
              <div className="text-xs text-muted-foreground">False Positive</div>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
            <TrendingUp className="w-4 h-4 text-success" />
            <span>+2.3% accuracy from feedback</span>
          </div>
        </div>

        {/* Active Capabilities */}
        <div className="bg-primary/10 rounded-lg border border-primary/20 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Active Capabilities</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            {['PPE Monitoring', 'Surface Inspection', 'Leak Detection', 'Hazard Alert', 'Rule Compliance', 'Auto-Learning'].map((cap) => (
              <div key={cap} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-success" />
                <span>{cap}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Data Flow */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Zap className="w-4 h-4 text-warning animate-pulse" />
          <span>Syncing with MES & Scheduling</span>
        </div>
      </div>
    </div>
  );
}
