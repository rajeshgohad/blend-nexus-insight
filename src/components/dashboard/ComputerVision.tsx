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

// Import camera feed images
import cam01EntryGate from '@/assets/camera-feeds/cam-01-entry-gate.jpg';
import cam02NoCap from '@/assets/camera-feeds/cam-02-no-cap.jpg';
import cam03CeilingPaint from '@/assets/camera-feeds/cam-03-ceiling-paint.jpg';
import cam04Cleanroom from '@/assets/camera-feeds/cam-04-cleanroom.jpg';
import cam05NoVest from '@/assets/camera-feeds/cam-05-no-vest.jpg';
import cam06CeilingCrack from '@/assets/camera-feeds/cam-06-ceiling-crack.jpg';
import cam07NoHelmet from '@/assets/camera-feeds/cam-07-no-helmet.jpg';
import cam08LabGloves from '@/assets/camera-feeds/cam-08-lab-gloves.jpg';
import cam09FloorDamage from '@/assets/camera-feeds/cam-09-floor-damage.jpg';

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

// Compliance use case scenarios for camera tiles
const cameraScenarios = [
  { id: 'CAM-01', label: 'Entry Gate', scenario: 'PPE Check', status: 'clear', icon: Shield, image: cam01EntryGate },
  { id: 'CAM-02', label: 'Production Floor', scenario: 'No Cap Detected', status: 'violation', icon: AlertTriangle, image: cam02NoCap },
  { id: 'CAM-03', label: 'Ceiling Zone A', scenario: 'Paint Peeling', status: 'warning', icon: AlertTriangle, image: cam03CeilingPaint },
  { id: 'CAM-04', label: 'Clean Room', scenario: 'Gowning Check', status: 'clear', icon: CheckCircle, image: cam04Cleanroom },
  { id: 'CAM-05', label: 'Warehouse', scenario: 'No Safety Vest', status: 'violation', icon: XCircle, image: cam05NoVest },
  { id: 'CAM-06', label: 'Ceiling Zone B', scenario: 'Crack Detected', status: 'warning', icon: AlertTriangle, image: cam06CeilingCrack },
  { id: 'CAM-07', label: 'Loading Dock', scenario: 'Helmet Missing', status: 'violation', icon: Shield, image: cam07NoHelmet },
  { id: 'CAM-08', label: 'Lab Area', scenario: 'Gloves Check', status: 'clear', icon: CheckCircle, image: cam08LabGloves },
  { id: 'CAM-09', label: 'Epoxy Floor', scenario: 'Surface Damage', status: 'warning', icon: AlertTriangle, image: cam09FloorDamage },
];

function CameraTile({ camera, isSelected, onClick }: { 
  camera: typeof cameraScenarios[0]; 
  isSelected: boolean;
  onClick: () => void;
}) {
  const statusColors = {
    clear: 'border-success/50 bg-success/5',
    warning: 'border-warning/50 bg-warning/5',
    violation: 'border-destructive/50 bg-destructive/5',
  };

  const statusDot = {
    clear: 'bg-success',
    warning: 'bg-warning animate-pulse',
    violation: 'bg-destructive animate-pulse',
  };

  const IconComponent = camera.icon;

  return (
    <div 
      className={`relative rounded-md overflow-hidden border-2 cursor-pointer transition-all ${
        isSelected ? 'ring-2 ring-primary ring-offset-1' : ''
      } ${statusColors[camera.status as keyof typeof statusColors]}`}
      onClick={onClick}
    >
      {/* Camera feed image */}
      <div className="aspect-video bg-muted/30 relative overflow-hidden">
        <img 
          src={camera.image} 
          alt={camera.label} 
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {/* Scan line overlay effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-full h-0.5 bg-primary/30 animate-pulse" style={{ top: '30%' }} />
        </div>

        {/* Status indicator */}
        <div className="absolute top-1 left-1 flex items-center gap-1 bg-background/90 rounded px-1 py-0.5">
          <div className={`w-1.5 h-1.5 rounded-full ${statusDot[camera.status as keyof typeof statusDot]}`} />
          <span className="text-[10px] font-mono font-medium">{camera.id}</span>
        </div>

        {/* Detection overlay for violations/warnings */}
        {camera.status !== 'clear' && (
          <div className="absolute inset-2 border border-dashed border-current rounded opacity-60">
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${
              camera.status === 'violation' ? 'text-destructive' : 'text-warning'
            }`}>
              <IconComponent className="w-6 h-6" />
            </div>
          </div>
        )}

        {/* AI active indicator */}
        <div className="absolute bottom-1 right-1">
          <Eye className="w-3 h-3 text-primary animate-pulse" />
        </div>
      </div>

      {/* Label */}
      <div className="bg-background/95 px-1.5 py-1">
        <div className="text-[10px] font-medium truncate">{camera.label}</div>
        <div className={`text-[9px] truncate ${
          camera.status === 'violation' ? 'text-destructive font-medium' : 
          camera.status === 'warning' ? 'text-warning' : 'text-success'
        }`}>
          {camera.scenario}
        </div>
      </div>
    </div>
  );
}

function CameraGrid({ onSelectCamera, selectedCamera }: { 
  onSelectCamera: (id: string) => void;
  selectedCamera: string;
}) {
  return (
    <div className="bg-muted/30 rounded-lg border border-border p-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Live Compliance Monitoring</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] text-destructive border-destructive">
            3 Violations
          </Badge>
          <Badge variant="outline" className="text-[10px] text-warning border-warning">
            3 Warnings
          </Badge>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-1.5">
        {cameraScenarios.map((camera) => (
          <CameraTile 
            key={camera.id} 
            camera={camera} 
            isSelected={selectedCamera === camera.id}
            onClick={() => onSelectCamera(camera.id)}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-2 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-success" />
          <span>Clear</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-warning" />
          <span>Warning</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-destructive" />
          <span>Violation</span>
        </div>
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
  const [selectedCamera, setSelectedCamera] = useState('CAM-02');
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
        {/* Camera Grid */}
        <CameraGrid onSelectCamera={setSelectedCamera} selectedCamera={selectedCamera} />

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
