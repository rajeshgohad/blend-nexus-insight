import { ArrowRight, AlertTriangle, CheckCircle2, Factory, Zap, XCircle, Gauge, Activity, Settings, Shield, Wrench, TrendingUp, Clock, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { EquipmentFailure } from './ProcessLine';

interface ProcessBlock {
  id: string;
  name: string;
  status: 'idle' | 'active' | 'warning' | 'error' | 'maintenance';
  batchNumber?: string;
}

interface LineOverviewProps {
  currentBatchNumber: string;
  currentProductName: string;
  equipmentFailures?: EquipmentFailure[];
}

const processSteps = ['Sieving', 'Dispensing', 'Blending', 'Compression', 'Coating', 'Polishing', 'Packing'];

// Simulated KPI data
const lineEfficiencyKPIs = {
  overallEfficiency: 87.4,
  availability: 92.1,
  performance: 94.8,
  utilization: 89.3,
  throughput: '1,240 tablets/hr',
  cycleTime: '2.9s',
};

const equipmentOEE = [
  { name: 'Sieving', oee: 94.2, availability: 97.1, performance: 96.8, quality: 100 },
  { name: 'Dispensing', oee: 91.5, availability: 95.0, performance: 96.3, quality: 100 },
  { name: 'Blending', oee: 88.7, availability: 92.3, performance: 96.1, quality: 99.8 },
  { name: 'Compression', oee: 85.3, availability: 89.5, performance: 95.3, quality: 99.9 },
  { name: 'Coating', oee: 90.1, availability: 93.8, performance: 96.0, quality: 100 },
  { name: 'Polishing', oee: 92.8, availability: 96.2, performance: 96.5, quality: 100 },
  { name: 'Packing', oee: 93.6, availability: 97.0, performance: 96.5, quality: 100 },
];

const productionParams = [
  { label: 'Batch Size', value: '50,000 tablets', status: 'normal' as const },
  { label: 'Turret Speed', value: '45 RPM', status: 'normal' as const },
  { label: 'Compression Force', value: '18.5 kN', status: 'normal' as const },
  { label: 'Coating Temp', value: '42°C', status: 'warning' as const },
  { label: 'Blend Time', value: '22 min', status: 'normal' as const },
  { label: 'Drying Temp', value: '55°C', status: 'normal' as const },
];

const qualityParams = [
  { label: 'Weight Variation', value: '±1.2%', target: '±2.0%', status: 'pass' as const },
  { label: 'Hardness', value: '8.2 kP', target: '7-10 kP', status: 'pass' as const },
  { label: 'Thickness', value: '4.1 mm', target: '3.9-4.3 mm', status: 'pass' as const },
  { label: 'Friability', value: '0.3%', target: '<1.0%', status: 'pass' as const },
  { label: 'Dissolution', value: '95.2%', target: '>85%', status: 'pass' as const },
  { label: 'Content Uniformity', value: '99.1%', target: '95-105%', status: 'pass' as const },
];

const maintenanceParams = [
  { label: 'Blender Motor', health: 92, nextPM: '12 days', status: 'healthy' as const },
  { label: 'Compression Tooling', health: 78, nextPM: '3 days', status: 'attention' as const },
  { label: 'Coating Pan Drive', health: 95, nextPM: '28 days', status: 'healthy' as const },
  { label: 'Sieve Mesh', health: 85, nextPM: '8 days', status: 'healthy' as const },
  { label: 'Vacuum System', health: 70, nextPM: '2 days', status: 'attention' as const },
  { label: 'Dust Collector', health: 88, nextPM: '15 days', status: 'healthy' as const },
];

function KPICard({ label, value, icon, status = 'good', subtext }: {
  label: string;
  value: string;
  icon: React.ReactNode;
  status?: 'good' | 'warning' | 'critical';
  subtext?: string;
}) {
  const colors = { good: 'text-success', warning: 'text-warning', critical: 'text-destructive' };
  return (
    <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
        {icon}
        <span>{label}</span>
      </div>
      <div className={`text-2xl font-bold ${colors[status]}`}>{value}</div>
      {subtext && <div className="text-xs text-muted-foreground mt-0.5">{subtext}</div>}
    </div>
  );
}

function OEEBar({ equipment }: { equipment: typeof equipmentOEE[0] }) {
  const color = equipment.oee >= 90 ? 'text-success' : equipment.oee >= 80 ? 'text-warning' : 'text-destructive';
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="text-sm w-24 truncate">{equipment.name}</span>
      <div className="flex-1 h-3 bg-muted/50 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            equipment.oee >= 90 ? 'bg-success' : equipment.oee >= 80 ? 'bg-warning' : 'bg-destructive'
          )}
          style={{ width: `${equipment.oee}%` }}
        />
      </div>
      <span className={`text-sm font-semibold w-14 text-right ${color}`}>{equipment.oee}%</span>
    </div>
  );
}

export function LineOverview({
  currentBatchNumber,
  currentProductName,
  equipmentFailures = [],
}: LineOverviewProps) {
  const isProcessFailed = (processName: string) =>
    equipmentFailures.some(f => f.lineId === 'line-1' && f.processName === processName);

  const processes: ProcessBlock[] = processSteps.map((step, idx) => ({
    id: `lo-${step.toLowerCase()}`,
    name: step,
    status: isProcessFailed(step) ? 'error' : idx === 2 ? 'active' : 'idle',
    batchNumber: idx === 2 ? currentBatchNumber : undefined,
  }));

  const getStatusColor = (status: ProcessBlock['status']) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/20 border-emerald-500 text-emerald-400';
      case 'warning': return 'bg-amber-500/20 border-amber-500 text-amber-400';
      case 'error': return 'bg-red-500/20 border-red-500 text-red-400';
      case 'maintenance': return 'bg-blue-500/20 border-blue-500 text-blue-400';
      default: return 'bg-muted/50 border-border text-muted-foreground';
    }
  };

  const getStatusIcon = (status: ProcessBlock['status']) => {
    switch (status) {
      case 'active': return <Zap className="w-4 h-4 text-emerald-400" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'maintenance': return <Factory className="w-4 h-4 text-blue-400" />;
      default: return <CheckCircle2 className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="h-full flex flex-col gap-4 overflow-auto p-2">
      {/* Line Header + Process Flow */}
      <div className="bg-card border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Factory className="w-6 h-6 text-primary" />
            <div>
              <h3 className="text-base font-semibold">Production Line 1</h3>
              <p className="text-sm text-muted-foreground">{currentBatchNumber} • {currentProductName}</p>
            </div>
          </div>
          <Badge variant="default" className="text-xs">Active</Badge>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {processes.map((process, idx) => (
            <div key={process.id} className="flex items-center">
              <div className={cn(
                'relative flex flex-col items-center justify-center min-w-[100px] h-20 rounded-lg border-2 px-3 py-2 transition-all',
                getStatusColor(process.status)
              )}>
                {getStatusIcon(process.status)}
                <span className="text-sm font-medium mt-1">{process.name}</span>
                {process.status === 'active' && process.batchNumber && (
                  <span className="text-[10px] mt-0.5 text-emerald-400">{process.batchNumber}</span>
                )}
                {process.status === 'error' && (
                  <span className="text-[10px] mt-0.5 text-destructive">FAILED</span>
                )}
              </div>
              {idx < processes.length - 1 && (
                <ArrowRight className={cn(
                  "w-5 h-5 mx-1 flex-shrink-0",
                  process.status === 'error' ? 'text-destructive' : 'text-muted-foreground'
                )} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* KPI Summary Row */}
      <div className="grid grid-cols-6 gap-3">
        <KPICard label="Line Efficiency" value={`${lineEfficiencyKPIs.overallEfficiency}%`} icon={<Gauge className="w-4 h-4" />} status={lineEfficiencyKPIs.overallEfficiency >= 85 ? 'good' : 'warning'} />
        <KPICard label="Availability" value={`${lineEfficiencyKPIs.availability}%`} icon={<Activity className="w-4 h-4" />} status="good" />
        <KPICard label="Performance" value={`${lineEfficiencyKPIs.performance}%`} icon={<TrendingUp className="w-4 h-4" />} status="good" />
        <KPICard label="Utilization" value={`${lineEfficiencyKPIs.utilization}%`} icon={<BarChart3 className="w-4 h-4" />} status="good" />
        <KPICard label="Throughput" value={lineEfficiencyKPIs.throughput} icon={<Zap className="w-4 h-4" />} status="good" subtext="tablets/hour" />
        <KPICard label="Cycle Time" value={lineEfficiencyKPIs.cycleTime} icon={<Clock className="w-4 h-4" />} status="good" subtext="per tablet" />
      </div>

      {/* Three KPI Panels */}
      <div className="grid grid-cols-3 gap-4 flex-1 min-h-0">
        {/* Equipment OEE */}
        <div className="bg-muted/20 rounded-lg border border-border/50 p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <Settings className="w-5 h-5 text-primary" />
            <span className="text-base font-medium">Equipment OEE</span>
          </div>
          <div className="flex-1 space-y-1">
            {equipmentOEE.map((eq) => (
              <OEEBar key={eq.name} equipment={eq} />
            ))}
          </div>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">
            <span>Avg OEE: <strong className="text-success">90.9%</strong></span>
            <span>Target: <strong>≥85%</strong></span>
          </div>
        </div>

        {/* Production & Quality Parameters */}
        <div className="flex flex-col gap-4">
          {/* Production */}
          <div className="bg-muted/20 rounded-lg border border-border/50 p-4 flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-5 h-5 text-primary" />
              <span className="text-base font-medium">Production Parameters</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {productionParams.map((p) => (
                <div key={p.label} className="bg-muted/30 rounded-lg p-2">
                  <div className="text-xs text-muted-foreground">{p.label}</div>
                  <div className={cn(
                    "text-sm font-semibold",
                    p.status === 'normal' ? 'text-foreground' : 'text-warning'
                  )}>
                    {p.value}
                    {p.status === 'warning' && <AlertTriangle className="w-3 h-3 inline ml-1 text-warning" />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quality */}
          <div className="bg-muted/20 rounded-lg border border-border/50 p-4 flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-primary" />
              <span className="text-base font-medium">Quality Parameters</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {qualityParams.map((q) => (
                <div key={q.label} className="bg-muted/30 rounded-lg p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{q.label}</span>
                    <Badge variant="outline" className="text-[10px] text-success border-success h-4 px-1">PASS</Badge>
                  </div>
                  <div className="text-sm font-semibold">{q.value}</div>
                  <div className="text-[10px] text-muted-foreground">Target: {q.target}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Maintenance */}
        <div className="bg-muted/20 rounded-lg border border-border/50 p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <Wrench className="w-5 h-5 text-primary" />
            <span className="text-base font-medium">Maintenance Status</span>
          </div>
          <div className="flex-1 space-y-2">
            {maintenanceParams.map((m) => (
              <div key={m.label} className="bg-muted/30 rounded-lg p-2.5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium">{m.label}</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] h-4 px-1",
                      m.status === 'healthy' ? 'text-success border-success' : 'text-warning border-warning'
                    )}
                  >
                    {m.status === 'healthy' ? 'Healthy' : 'Attention'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={m.health} className="flex-1 h-2" />
                  <span className={cn(
                    "text-xs font-semibold w-10 text-right",
                    m.health >= 85 ? 'text-success' : m.health >= 70 ? 'text-warning' : 'text-destructive'
                  )}>
                    {m.health}%
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>Next PM: {m.nextPM}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">
            <span>Open Work Orders: <strong className="text-warning">2</strong></span>
            <span className="ml-4">Overdue: <strong className="text-destructive">0</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
