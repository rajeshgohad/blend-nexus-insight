import { Wrench, AlertTriangle, TrendingDown, Clock, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ComponentHealth, Anomaly } from '@/types/manufacturing';

interface PredictiveMaintenanceProps {
  components: ComponentHealth[];
  anomalies: Anomaly[];
  vibration: number;
  motorLoad: number;
  temperature: number;
}

function ComponentHealthCard({ component }: { component: ComponentHealth }) {
  const getHealthColor = (health: number) => {
    if (health >= 80) return 'bg-success';
    if (health >= 60) return 'bg-warning';
    return 'bg-destructive';
  };

  const getTrendIcon = (trend: ComponentHealth['trend']) => {
    switch (trend) {
      case 'stable': return <CheckCircle className="w-3 h-3 text-success" />;
      case 'declining': return <TrendingDown className="w-3 h-3 text-warning" />;
      case 'critical': return <AlertTriangle className="w-3 h-3 text-destructive" />;
    }
  };

  const formatRUL = (hours: number) => {
    if (hours >= 24) return `${Math.floor(hours / 24)}d`;
    return `${hours}h`;
  };

  return (
    <div className="bg-muted/30 rounded-lg p-2 space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium truncate flex-1">{component.name}</span>
        {getTrendIcon(component.trend)}
      </div>
      <div className="flex items-center gap-2">
        <Progress value={component.health} className={`h-1.5 flex-1 ${getHealthColor(component.health)}`} />
        <span className="text-xs font-mono w-8">{component.health.toFixed(0)}%</span>
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          RUL: {formatRUL(component.rul)}
        </span>
      </div>
    </div>
  );
}

function AnomalyItem({ anomaly }: { anomaly: Anomaly }) {
  const severityColors = {
    low: 'bg-success/20 text-success border-success/30',
    medium: 'bg-warning/20 text-warning border-warning/30',
    high: 'bg-destructive/20 text-destructive border-destructive/30',
  };

  return (
    <div className={`p-2 rounded border ${severityColors[anomaly.severity]} animate-slide-in`}>
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium">{anomaly.source}</div>
          <div className="text-[10px] opacity-80 truncate">{anomaly.description}</div>
        </div>
        <Badge variant="outline" className="text-[10px] shrink-0">
          {anomaly.severity.toUpperCase()}
        </Badge>
      </div>
      <div className="text-[10px] opacity-60 mt-1">
        {anomaly.timestamp.toLocaleTimeString()}
      </div>
    </div>
  );
}

function SensorInput({ label, value, unit, icon }: { 
  label: string; 
  value: number; 
  unit: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 bg-primary/10 rounded px-2 py-1">
      {icon}
      <div className="text-[10px]">
        <div className="text-muted-foreground">{label}</div>
        <div className="font-mono font-medium">{value.toFixed(1)} {unit}</div>
      </div>
    </div>
  );
}

export function PredictiveMaintenance({ 
  components, 
  anomalies, 
  vibration, 
  motorLoad, 
  temperature 
}: PredictiveMaintenanceProps) {
  const criticalComponents = components.filter(c => c.health < 60).length;

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Data inputs from Digital Twin */}
      <div className="flex flex-wrap gap-2">
        <SensorInput 
          label="Vibration" 
          value={vibration} 
          unit="mm/s" 
          icon={<div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
        />
        <SensorInput 
          label="Motor Load" 
          value={motorLoad} 
          unit="%" 
          icon={<div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
        />
        <SensorInput 
          label="Temp" 
          value={temperature} 
          unit="°C" 
          icon={<div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
        />
      </div>

      {/* Health Overview */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Component Health</span>
        </div>
        {criticalComponents > 0 && (
          <Badge variant="destructive" className="text-[10px]">
            {criticalComponents} Critical
          </Badge>
        )}
      </div>

      {/* Component Health Grid */}
      <div className="grid grid-cols-2 gap-2">
        {components.slice(0, 4).map((component, idx) => (
          <ComponentHealthCard key={idx} component={component} />
        ))}
      </div>

      {/* Anomaly Detection */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-warning" />
          <span className="text-xs text-muted-foreground">Detected Anomalies</span>
          <Badge variant="outline" className="text-[10px] ml-auto">
            {anomalies.length}
          </Badge>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="space-y-2 pr-2">
            {anomalies.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-4">
                No anomalies detected
              </div>
            ) : (
              anomalies.slice(0, 5).map((anomaly) => (
                <AnomalyItem key={anomaly.id} anomaly={anomaly} />
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Maintenance Calendar Preview */}
      <div className="bg-muted/30 rounded-lg p-2">
        <div className="text-[10px] text-muted-foreground mb-1">Next Scheduled Maintenance</div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium">Main Bearings Inspection</span>
          <Badge variant="outline" className="text-[10px]">In 3 days</Badge>
        </div>
      </div>
    </div>
  );
}
