import { useState } from 'react';
import { 
  Camera, Eye, AlertTriangle, Shield, CheckCircle, XCircle, Zap, 
  Bell, ClipboardList, Database, Brain, Users, Wrench, FileText,
  TrendingUp, Activity, MapPin, Clock, Send
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  { role: 'Supervisor', name: 'John Smith', status: 'online' },
  { role: 'Maintenance', name: 'Sarah Chen', status: 'online' },
  { role: 'QA Inspector', name: 'Mike Johnson', status: 'away' },
  { role: 'Security', name: 'Lisa Davis', status: 'online' },
];

// Simulated audit log entries
interface AuditLogEntry {
  id: string;
  timestamp: Date;
  event: string;
  location: string;
  severity: 'minor' | 'moderate' | 'critical';
  status: 'detected' | 'notified' | 'investigating' | 'resolved';
  imageRef: string;
}

function CameraFeed({ isActive, cameraId = 'CAM-01' }: { isActive: boolean; cameraId?: string }) {
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
      <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-background/90 rounded px-2 py-1">
        <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-success animate-pulse' : 'bg-muted-foreground'}`} />
        <span className="text-xs font-mono font-medium">{cameraId}</span>
      </div>
      
      {/* Timestamp */}
      <div className="absolute bottom-2 right-2 bg-background/90 rounded px-2 py-1">
        <span className="text-xs font-mono">
          {new Date().toLocaleTimeString('en-US', { hour12: false })}
        </span>
      </div>
      
      {/* Detection zone indicator */}
      <div className="absolute top-1/4 left-1/4 right-1/4 bottom-1/4 border-2 border-dashed border-primary/40 rounded">
        <span className="absolute -top-4 left-0 text-[10px] text-primary bg-background px-1 py-0.5 rounded">
          AI Detection Zone
        </span>
      </div>
      
      {/* AI scanning indicator */}
      {isActive && (
        <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-background/90 rounded px-2 py-1">
          <Eye className="w-3 h-3 text-primary animate-pulse" />
          <span className="text-xs text-primary font-medium">AI Active</span>
        </div>
      )}

      {/* Baseline learning indicator */}
      <div className="absolute top-2 right-2 flex items-center gap-1 bg-primary/20 rounded px-2 py-1">
        <Brain className="w-3 h-3 text-primary" />
        <span className="text-[10px] text-primary">Baseline Learned</span>
      </div>
    </div>
  );
}

function DetectionCard({ detection, onNotify }: { detection: QualityDetection; onNotify?: () => void }) {
  const severityColors = {
    minor: 'border-success/30 bg-success/10',
    moderate: 'border-warning/30 bg-warning/10',
    critical: 'border-destructive/30 bg-destructive/10',
  };

  const severityTextColors = {
    minor: 'text-success',
    moderate: 'text-warning',
    critical: 'text-destructive',
  };

  const statusIcons = {
    detected: <AlertTriangle className="w-3 h-3" />,
    investigating: <Eye className="w-3 h-3" />,
    resolved: <CheckCircle className="w-3 h-3" />,
  };

  return (
    <div className={`p-3 rounded-lg border ${severityColors[detection.severity]} animate-slide-in`}>
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
      
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
        <MapPin className="w-3 h-3" />
        <span>{detection.location}</span>
      </div>

      {/* Recommendation */}
      <div className="bg-background/50 rounded p-2 mb-2">
        <div className="text-[10px] text-muted-foreground mb-1">AI Recommendation:</div>
        <div className="text-xs">{detection.recommendation}</div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>{detection.timestamp.toLocaleTimeString()}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 text-xs ${severityTextColors[detection.severity]}`}>
            {statusIcons[detection.status]}
            <span className="capitalize">{detection.status}</span>
          </div>
          {detection.status === 'detected' && onNotify && (
            <Button size="sm" variant="outline" className="h-6 text-xs px-2" onClick={onNotify}>
              <Send className="w-3 h-3 mr-1" />
              Notify
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon, status, showDeviation = false, deviation = 0 }: { 
  label: string; 
  value: string; 
  icon: React.ReactNode;
  status: 'good' | 'warning' | 'critical';
  showDeviation?: boolean;
  deviation?: number;
}) {
  const statusColors = {
    good: 'text-success',
    warning: 'text-warning',
    critical: 'text-destructive',
  };

  return (
    <div className="bg-muted/30 rounded-lg p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
        {icon}
        {label}
      </div>
      <div className={`text-xl font-bold ${statusColors[status]}`}>{value}</div>
      {showDeviation && (
        <div className={`text-[10px] ${deviation > 0 ? 'text-destructive' : 'text-success'}`}>
          {deviation > 0 ? `+${deviation.toFixed(1)}% deviation` : 'Within baseline'}
        </div>
      )}
    </div>
  );
}

function BaselineMonitor() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Activity className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">Baseline & Deviation Detection</span>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-muted/30 rounded-lg p-2">
          <div className="text-xs text-muted-foreground mb-1">PPE Compliance</div>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-success">{baselineMetrics.ppeCompliance}%</span>
            <Badge variant="outline" className="text-[10px] text-success border-success">Normal</Badge>
          </div>
          <Progress value={baselineMetrics.ppeCompliance} className="h-1 mt-1" />
        </div>
        
        <div className="bg-muted/30 rounded-lg p-2">
          <div className="text-xs text-muted-foreground mb-1">Surface Condition</div>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-success">{baselineMetrics.surfaceCondition}%</span>
            <Badge variant="outline" className="text-[10px] text-success border-success">Normal</Badge>
          </div>
          <Progress value={baselineMetrics.surfaceCondition} className="h-1 mt-1" />
        </div>
        
        <div className="bg-muted/30 rounded-lg p-2">
          <div className="text-xs text-muted-foreground mb-1">Environmental</div>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-success">{baselineMetrics.environmentalNorm}%</span>
            <Badge variant="outline" className="text-[10px] text-success border-success">Normal</Badge>
          </div>
          <Progress value={baselineMetrics.environmentalNorm} className="h-1 mt-1" />
        </div>
        
        <div className="bg-muted/30 rounded-lg p-2">
          <div className="text-xs text-muted-foreground mb-1">Safety Score</div>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-success">{baselineMetrics.safetyScore}%</span>
            <Badge variant="outline" className="text-[10px] text-success border-success">Normal</Badge>
          </div>
          <Progress value={baselineMetrics.safetyScore} className="h-1 mt-1" />
        </div>
      </div>
    </div>
  );
}

function AlertingPanel({ detections }: { detections: QualityDetection[] }) {
  const unresolvedCount = detections.filter(d => d.status !== 'resolved').length;
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-warning" />
          <span className="text-sm font-medium">Immediate Alerting</span>
        </div>
        <Badge variant="outline" className="text-xs">
          {unresolvedCount} pending
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {notificationRecipients.map((recipient) => (
          <div key={recipient.role} className="bg-muted/30 rounded-lg p-2 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              recipient.status === 'online' ? 'bg-success' : 'bg-warning'
            }`} />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate">{recipient.role}</div>
              <div className="text-[10px] text-muted-foreground truncate">{recipient.name}</div>
            </div>
            <Users className="w-3 h-3 text-muted-foreground" />
          </div>
        ))}
      </div>
      
      <div className="bg-primary/10 rounded-lg p-2 border border-primary/20">
        <div className="flex items-center gap-2 text-xs text-primary">
          <Zap className="w-3 h-3" />
          <span>Auto-notify enabled for critical detections</span>
        </div>
      </div>
    </div>
  );
}

function WorkflowIntegration() {
  const integrations = [
    { system: 'MES', status: 'connected', lastSync: '2s ago' },
    { system: 'CMMS', status: 'connected', lastSync: '5s ago' },
    { system: 'Incident Mgmt', status: 'connected', lastSync: '3s ago' },
    { system: 'ERP', status: 'connected', lastSync: '10s ago' },
  ];
  
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Database className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">Workflow Integration</span>
      </div>
      
      <div className="space-y-2">
        {integrations.map((int) => (
          <div key={int.system} className="bg-muted/30 rounded-lg p-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-sm font-medium">{int.system}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground">Synced {int.lastSync}</span>
              <CheckCircle className="w-3 h-3 text-success" />
            </div>
          </div>
        ))}
      </div>
      
      <div className="text-[10px] text-muted-foreground text-center">
        Incidents auto-synced to maintenance & scheduling systems
      </div>
    </div>
  );
}

function AuditLog({ detections }: { detections: QualityDetection[] }) {
  const auditEntries: AuditLogEntry[] = detections.map((d, i) => ({
    id: d.id,
    timestamp: d.timestamp,
    event: detectionTypeLabels[d.type],
    location: d.location,
    severity: d.severity,
    status: d.status,
    imageRef: `IMG-${String(i + 1).padStart(4, '0')}`,
  }));
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Audit Ready Logging</span>
        </div>
        <Badge variant="outline" className="text-xs">
          {auditEntries.length} records
        </Badge>
      </div>
      
      <ScrollArea className="h-[180px]">
        <div className="space-y-2 pr-2">
          {auditEntries.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-4">
              No audit entries
            </div>
          ) : (
            auditEntries.map((entry) => (
              <div key={entry.id} className="bg-muted/30 rounded-lg p-2 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{entry.event}</span>
                  <Badge 
                    variant="outline" 
                    className={`text-[10px] capitalize ${
                      entry.severity === 'critical' ? 'text-destructive border-destructive' :
                      entry.severity === 'moderate' ? 'text-warning border-warning' :
                      'text-success border-success'
                    }`}
                  >
                    {entry.severity}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  <span>{entry.location}</span>
                  <span>•</span>
                  <Clock className="w-3 h-3" />
                  <span>{entry.timestamp.toLocaleTimeString()}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-muted-foreground">Ref: {entry.imageRef}</span>
                  <Badge variant="outline" className="text-[10px] capitalize">{entry.status}</Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function AILearning() {
  const learningMetrics = {
    accuracy: 97.8,
    falsePositiveRate: 1.2,
    feedbackProcessed: 1247,
    modelVersion: 'v3.2.1',
    lastUpdate: '2 hours ago',
  };
  
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Brain className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">Learning & Improvement</span>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-muted/30 rounded-lg p-2">
          <div className="text-xs text-muted-foreground">Detection Accuracy</div>
          <div className="text-lg font-bold text-success">{learningMetrics.accuracy}%</div>
          <Progress value={learningMetrics.accuracy} className="h-1 mt-1" />
        </div>
        
        <div className="bg-muted/30 rounded-lg p-2">
          <div className="text-xs text-muted-foreground">False Positive Rate</div>
          <div className="text-lg font-bold text-success">{learningMetrics.falsePositiveRate}%</div>
          <Progress value={learningMetrics.falsePositiveRate} max={10} className="h-1 mt-1" />
        </div>
      </div>
      
      <div className="bg-muted/30 rounded-lg p-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">Feedback Processed</span>
          <span className="text-sm font-bold">{learningMetrics.feedbackProcessed}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Model Version</span>
          <Badge variant="outline" className="text-xs">{learningMetrics.modelVersion}</Badge>
        </div>
      </div>
      
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <TrendingUp className="w-3 h-3 text-success" />
        <span>Model accuracy improved +2.3% from feedback</span>
      </div>
    </div>
  );
}

export function ComputerVision({ detections, rftPercentage }: ComputerVisionProps) {
  const [activeTab, setActiveTab] = useState('monitoring');
  
  const totalDetections = detections.length;
  const criticalCount = detections.filter(d => d.severity === 'critical').length;
  const unresolvedCount = detections.filter(d => d.status !== 'resolved').length;

  const handleNotify = () => {
    // Simulated notification action
    console.log('Notification sent to relevant personnel');
  };

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Camera Feed */}
      <CameraFeed isActive={true} />

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-2">
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
        <MetricCard 
          label="Unresolved"
          value={unresolvedCount.toString()}
          icon={<ClipboardList className="w-3 h-3" />}
          status={unresolvedCount <= 2 ? 'good' : unresolvedCount <= 5 ? 'warning' : 'critical'}
        />
      </div>

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-full justify-start gap-1 bg-muted/30 p-1 h-auto flex-wrap">
          <TabsTrigger value="monitoring" className="text-xs px-3 py-1.5">
            <Camera className="w-3 h-3 mr-1" />
            Monitoring
          </TabsTrigger>
          <TabsTrigger value="baseline" className="text-xs px-3 py-1.5">
            <Activity className="w-3 h-3 mr-1" />
            Baseline
          </TabsTrigger>
          <TabsTrigger value="alerts" className="text-xs px-3 py-1.5">
            <Bell className="w-3 h-3 mr-1" />
            Alerts
          </TabsTrigger>
          <TabsTrigger value="workflow" className="text-xs px-3 py-1.5">
            <Database className="w-3 h-3 mr-1" />
            Workflow
          </TabsTrigger>
          <TabsTrigger value="audit" className="text-xs px-3 py-1.5">
            <FileText className="w-3 h-3 mr-1" />
            Audit
          </TabsTrigger>
          <TabsTrigger value="learning" className="text-xs px-3 py-1.5">
            <Brain className="w-3 h-3 mr-1" />
            AI
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-hidden mt-3">
          <TabsContent value="monitoring" className="h-full m-0">
            <div className="flex-1 min-h-0 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Active Detections</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {unresolvedCount} unresolved
                </Badge>
              </div>
              
              <ScrollArea className="flex-1">
                <div className="space-y-2 pr-2">
                  {detections.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-8">
                      <CheckCircle className="w-10 h-10 mx-auto mb-3 text-success" />
                      <div className="font-medium">All Clear</div>
                      <div className="text-xs">No active detections</div>
                    </div>
                  ) : (
                    detections.slice(0, 5).map((detection) => (
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
          </TabsContent>

          <TabsContent value="baseline" className="h-full m-0">
            <ScrollArea className="h-full">
              <BaselineMonitor />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="alerts" className="h-full m-0">
            <ScrollArea className="h-full">
              <AlertingPanel detections={detections} />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="workflow" className="h-full m-0">
            <ScrollArea className="h-full">
              <WorkflowIntegration />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="audit" className="h-full m-0">
            <AuditLog detections={detections} />
          </TabsContent>

          <TabsContent value="learning" className="h-full m-0">
            <ScrollArea className="h-full">
              <AILearning />
            </ScrollArea>
          </TabsContent>
        </div>
      </Tabs>

      {/* AI Capabilities Summary */}
      <div className="bg-muted/30 rounded-lg p-2">
        <div className="flex items-center gap-2 mb-2">
          <Eye className="w-3 h-3 text-primary" />
          <span className="text-xs font-medium">Active Capabilities</span>
        </div>
        <div className="grid grid-cols-3 gap-1 text-[10px]">
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
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-success" />
            <span>Rule Compliance</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-success" />
            <span>Auto-Learning</span>
          </div>
        </div>
      </div>

      {/* Data flow indicator */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Zap className="w-3 h-3 text-warning animate-pulse" />
        <span>Syncing with MES, Maintenance & Scheduling</span>
      </div>
    </div>
  );
}
