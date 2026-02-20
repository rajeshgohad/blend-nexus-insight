import { ArrowRight, AlertTriangle, CheckCircle2, Factory, Zap, XCircle, Gauge, Activity, Settings, Shield, Wrench, TrendingUp, Clock, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { EquipmentFailure } from './ProcessLine';
import { useMemo } from 'react';

interface ProcessBlock {
  id: string;
  name: string;
  status: 'idle' | 'active' | 'warning' | 'error' | 'maintenance' | 'restoring';
  batchNumber?: string;
}

interface LineOverviewProps {
  currentBatchNumber: string;
  currentProductName: string;
  equipmentFailures?: EquipmentFailure[];
  activeStage?: 'blending' | 'compression' | 'idle';
  bufferCompression?: { isActive: boolean; remainingBatches: number; currentBatchDiverted: boolean };
}

const processSteps = ['Sieving', 'Dispensing', 'Blending', 'Compression', 'Coating', 'Polishing', 'Packing'];

// Product-specific parameter profiles
function getProductParameters(productName: string) {
  const name = productName.toLowerCase();

  // Base profiles keyed by product
  if (name.includes('product a 500mg')) {
    return {
      efficiency: { overallEfficiency: 87.4, availability: 92.1, performance: 94.8, utilization: 89.3, throughput: '1,240 tablets/hr', cycleTime: '2.9s' },
      production: [
        { label: 'Batch Size', value: '100,000 tablets', status: 'normal' as const },
        { label: 'Turret Speed', value: '45 RPM', status: 'normal' as const },
        { label: 'Compression Force', value: '18.5 kN', status: 'normal' as const },
        { label: 'Coating Temp', value: '42°C', status: 'normal' as const },
        { label: 'Blend Time', value: '22 min', status: 'normal' as const },
        { label: 'Drying Temp', value: '55°C', status: 'normal' as const },
      ],
      quality: [
        { label: 'Weight Variation', value: '±1.2%', target: '±2.0%', status: 'pass' as const },
        { label: 'Hardness', value: '8.2 kP', target: '7-10 kP', status: 'pass' as const },
        { label: 'Thickness', value: '4.1 mm', target: '3.9-4.3 mm', status: 'pass' as const },
        { label: 'Friability', value: '0.3%', target: '<1.0%', status: 'pass' as const },
        { label: 'Dissolution', value: '95.2%', target: '>85%', status: 'pass' as const },
        { label: 'Content Uniformity', value: '99.1%', target: '95-105%', status: 'pass' as const },
      ],
    };
  }
  if (name.includes('product a 850mg')) {
    return {
      efficiency: { overallEfficiency: 85.1, availability: 90.5, performance: 93.2, utilization: 87.8, throughput: '1,050 tablets/hr', cycleTime: '3.4s' },
      production: [
        { label: 'Batch Size', value: '80,000 tablets', status: 'normal' as const },
        { label: 'Turret Speed', value: '38 RPM', status: 'normal' as const },
        { label: 'Compression Force', value: '22.0 kN', status: 'normal' as const },
        { label: 'Coating Temp', value: '44°C', status: 'warning' as const },
        { label: 'Blend Time', value: '25 min', status: 'normal' as const },
        { label: 'Drying Temp', value: '58°C', status: 'normal' as const },
      ],
      quality: [
        { label: 'Weight Variation', value: '±1.5%', target: '±2.5%', status: 'pass' as const },
        { label: 'Hardness', value: '9.1 kP', target: '8-11 kP', status: 'pass' as const },
        { label: 'Thickness', value: '5.2 mm', target: '5.0-5.5 mm', status: 'pass' as const },
        { label: 'Friability', value: '0.4%', target: '<1.0%', status: 'pass' as const },
        { label: 'Dissolution', value: '93.8%', target: '>85%', status: 'pass' as const },
        { label: 'Content Uniformity', value: '98.7%', target: '95-105%', status: 'pass' as const },
      ],
    };
  }
  if (name.includes('product a 1000mg')) {
    return {
      efficiency: { overallEfficiency: 82.6, availability: 88.3, performance: 91.5, utilization: 85.9, throughput: '920 tablets/hr', cycleTime: '3.9s' },
      production: [
        { label: 'Batch Size', value: '60,000 tablets', status: 'normal' as const },
        { label: 'Turret Speed', value: '32 RPM', status: 'normal' as const },
        { label: 'Compression Force', value: '25.0 kN', status: 'warning' as const },
        { label: 'Coating Temp', value: '46°C', status: 'normal' as const },
        { label: 'Blend Time', value: '28 min', status: 'normal' as const },
        { label: 'Drying Temp', value: '60°C', status: 'normal' as const },
      ],
      quality: [
        { label: 'Weight Variation', value: '±1.8%', target: '±3.0%', status: 'pass' as const },
        { label: 'Hardness', value: '10.5 kP', target: '9-12 kP', status: 'pass' as const },
        { label: 'Thickness', value: '6.0 mm', target: '5.8-6.3 mm', status: 'pass' as const },
        { label: 'Friability', value: '0.5%', target: '<1.0%', status: 'pass' as const },
        { label: 'Dissolution', value: '91.5%', target: '>85%', status: 'pass' as const },
        { label: 'Content Uniformity', value: '98.2%', target: '95-105%', status: 'pass' as const },
      ],
    };
  }
  if (name.includes('product b 20mg')) {
    return {
      efficiency: { overallEfficiency: 89.2, availability: 93.5, performance: 95.1, utilization: 90.8, throughput: '1,580 tablets/hr', cycleTime: '2.3s' },
      production: [
        { label: 'Batch Size', value: '120,000 tablets', status: 'normal' as const },
        { label: 'Turret Speed', value: '52 RPM', status: 'normal' as const },
        { label: 'Compression Force', value: '12.0 kN', status: 'normal' as const },
        { label: 'Coating Temp', value: '40°C', status: 'normal' as const },
        { label: 'Blend Time', value: '18 min', status: 'normal' as const },
        { label: 'Drying Temp', value: '50°C', status: 'normal' as const },
      ],
      quality: [
        { label: 'Weight Variation', value: '±0.8%', target: '±2.0%', status: 'pass' as const },
        { label: 'Hardness', value: '6.5 kP', target: '5-8 kP', status: 'pass' as const },
        { label: 'Thickness', value: '3.2 mm', target: '3.0-3.5 mm', status: 'pass' as const },
        { label: 'Friability', value: '0.2%', target: '<1.0%', status: 'pass' as const },
        { label: 'Dissolution', value: '97.1%', target: '>85%', status: 'pass' as const },
        { label: 'Content Uniformity', value: '99.5%', target: '95-105%', status: 'pass' as const },
      ],
    };
  }
  if (name.includes('product b 40mg')) {
    return {
      efficiency: { overallEfficiency: 88.0, availability: 92.8, performance: 94.5, utilization: 89.9, throughput: '1,420 tablets/hr', cycleTime: '2.5s' },
      production: [
        { label: 'Batch Size', value: '90,000 tablets', status: 'normal' as const },
        { label: 'Turret Speed', value: '48 RPM', status: 'normal' as const },
        { label: 'Compression Force', value: '14.5 kN', status: 'normal' as const },
        { label: 'Coating Temp', value: '41°C', status: 'normal' as const },
        { label: 'Blend Time', value: '20 min', status: 'normal' as const },
        { label: 'Drying Temp', value: '52°C', status: 'normal' as const },
      ],
      quality: [
        { label: 'Weight Variation', value: '±1.0%', target: '±2.0%', status: 'pass' as const },
        { label: 'Hardness', value: '7.3 kP', target: '6-9 kP', status: 'pass' as const },
        { label: 'Thickness', value: '3.8 mm', target: '3.5-4.1 mm', status: 'pass' as const },
        { label: 'Friability', value: '0.3%', target: '<1.0%', status: 'pass' as const },
        { label: 'Dissolution', value: '96.0%', target: '>85%', status: 'pass' as const },
        { label: 'Content Uniformity', value: '99.3%', target: '95-105%', status: 'pass' as const },
      ],
    };
  }
  if (name.includes('product c')) {
    return {
      efficiency: { overallEfficiency: 91.0, availability: 95.2, performance: 96.0, utilization: 92.1, throughput: '1,800 tablets/hr', cycleTime: '2.0s' },
      production: [
        { label: 'Batch Size', value: '150,000 tablets', status: 'normal' as const },
        { label: 'Turret Speed', value: '58 RPM', status: 'normal' as const },
        { label: 'Compression Force', value: '10.0 kN', status: 'normal' as const },
        { label: 'Coating Temp', value: '38°C', status: 'normal' as const },
        { label: 'Blend Time', value: '15 min', status: 'normal' as const },
        { label: 'Drying Temp', value: '48°C', status: 'normal' as const },
      ],
      quality: [
        { label: 'Weight Variation', value: '±0.6%', target: '±1.5%', status: 'pass' as const },
        { label: 'Hardness', value: '5.8 kP', target: '4-7 kP', status: 'pass' as const },
        { label: 'Thickness', value: '2.8 mm', target: '2.5-3.1 mm', status: 'pass' as const },
        { label: 'Friability', value: '0.2%', target: '<1.0%', status: 'pass' as const },
        { label: 'Dissolution', value: '98.0%', target: '>85%', status: 'pass' as const },
        { label: 'Content Uniformity', value: '99.7%', target: '95-105%', status: 'pass' as const },
      ],
    };
  }
  if (name.includes('product d')) {
    return {
      efficiency: { overallEfficiency: 84.5, availability: 89.8, performance: 92.3, utilization: 86.7, throughput: '980 capsules/hr', cycleTime: '3.7s' },
      production: [
        { label: 'Batch Size', value: '100,000 capsules', status: 'normal' as const },
        { label: 'Turret Speed', value: '35 RPM', status: 'normal' as const },
        { label: 'Fill Weight', value: '350 mg', status: 'normal' as const },
        { label: 'Sealing Temp', value: '52°C', status: 'normal' as const },
        { label: 'Blend Time', value: '24 min', status: 'normal' as const },
        { label: 'Drying Temp', value: '45°C', status: 'warning' as const },
      ],
      quality: [
        { label: 'Weight Variation', value: '±1.4%', target: '±2.5%', status: 'pass' as const },
        { label: 'Disintegration', value: '12 min', target: '<15 min', status: 'pass' as const },
        { label: 'Cap Seal', value: 'Pass', target: 'No leak', status: 'pass' as const },
        { label: 'Moisture', value: '2.1%', target: '<3.0%', status: 'pass' as const },
        { label: 'Dissolution', value: '94.5%', target: '>85%', status: 'pass' as const },
        { label: 'Content Uniformity', value: '98.9%', target: '95-105%', status: 'pass' as const },
      ],
    };
  }
  if (name.includes('product e 5mg')) {
    return {
      efficiency: { overallEfficiency: 90.3, availability: 94.0, performance: 95.5, utilization: 91.5, throughput: '1,650 tablets/hr', cycleTime: '2.2s' },
      production: [
        { label: 'Batch Size', value: '200,000 tablets', status: 'normal' as const },
        { label: 'Turret Speed', value: '55 RPM', status: 'normal' as const },
        { label: 'Compression Force', value: '9.0 kN', status: 'normal' as const },
        { label: 'Coating Temp', value: '39°C', status: 'normal' as const },
        { label: 'Blend Time', value: '16 min', status: 'normal' as const },
        { label: 'Drying Temp', value: '50°C', status: 'normal' as const },
      ],
      quality: [
        { label: 'Weight Variation', value: '±0.7%', target: '±1.5%', status: 'pass' as const },
        { label: 'Hardness', value: '5.5 kP', target: '4-7 kP', status: 'pass' as const },
        { label: 'Thickness', value: '2.6 mm', target: '2.4-2.9 mm', status: 'pass' as const },
        { label: 'Friability', value: '0.2%', target: '<1.0%', status: 'pass' as const },
        { label: 'Dissolution', value: '97.8%', target: '>85%', status: 'pass' as const },
        { label: 'Content Uniformity', value: '99.6%', target: '95-105%', status: 'pass' as const },
      ],
    };
  }
  // Product E 10mg or fallback
  return {
    efficiency: { overallEfficiency: 89.5, availability: 93.2, performance: 95.0, utilization: 90.5, throughput: '1,500 tablets/hr', cycleTime: '2.4s' },
    production: [
      { label: 'Batch Size', value: '180,000 tablets', status: 'normal' as const },
      { label: 'Turret Speed', value: '50 RPM', status: 'normal' as const },
      { label: 'Compression Force', value: '11.0 kN', status: 'normal' as const },
      { label: 'Coating Temp', value: '40°C', status: 'normal' as const },
      { label: 'Blend Time', value: '18 min', status: 'normal' as const },
      { label: 'Drying Temp', value: '52°C', status: 'normal' as const },
    ],
    quality: [
      { label: 'Weight Variation', value: '±0.9%', target: '±2.0%', status: 'pass' as const },
      { label: 'Hardness', value: '6.0 kP', target: '5-8 kP', status: 'pass' as const },
      { label: 'Thickness', value: '3.0 mm', target: '2.8-3.3 mm', status: 'pass' as const },
      { label: 'Friability', value: '0.3%', target: '<1.0%', status: 'pass' as const },
      { label: 'Dissolution', value: '96.5%', target: '>85%', status: 'pass' as const },
      { label: 'Content Uniformity', value: '99.4%', target: '95-105%', status: 'pass' as const },
    ],
  };
}

const equipmentOEE = [
  { name: 'Sieving', oee: 94.2, availability: 97.1, performance: 96.8, quality: 100 },
  { name: 'Dispensing', oee: 91.5, availability: 95.0, performance: 96.3, quality: 100 },
  { name: 'Blending', oee: 88.7, availability: 92.3, performance: 96.1, quality: 99.8 },
  { name: 'Compression', oee: 85.3, availability: 89.5, performance: 95.3, quality: 99.9 },
  { name: 'Coating', oee: 90.1, availability: 93.8, performance: 96.0, quality: 100 },
  { name: 'Polishing', oee: 92.8, availability: 96.2, performance: 96.5, quality: 100 },
  { name: 'Packing', oee: 93.6, availability: 97.0, performance: 96.5, quality: 100 },
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
      <div className="flex items-center gap-2 text-base text-muted-foreground mb-1">
        {icon}
        <span>{label}</span>
      </div>
      <div className={`text-3xl font-bold ${colors[status]}`}>{value}</div>
      {subtext && <div className="text-sm text-muted-foreground mt-0.5">{subtext}</div>}
    </div>
  );
}

function OEEBar({ equipment }: { equipment: typeof equipmentOEE[0] }) {
  const color = equipment.oee >= 90 ? 'text-success' : equipment.oee >= 80 ? 'text-warning' : 'text-destructive';
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="text-base w-28 truncate">{equipment.name}</span>
      <div className="flex-1 h-4 bg-muted/50 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            equipment.oee >= 90 ? 'bg-success' : equipment.oee >= 80 ? 'bg-warning' : 'bg-destructive'
          )}
          style={{ width: `${equipment.oee}%` }}
        />
      </div>
      <span className={`text-base font-semibold w-16 text-right ${color}`}>{equipment.oee}%</span>
    </div>
  );
}

export function LineOverview({
  currentBatchNumber,
  currentProductName,
  equipmentFailures = [],
  activeStage = 'idle',
  bufferCompression = { isActive: false, remainingBatches: 0, currentBatchDiverted: false },
}: LineOverviewProps) {
  const isProcessFailed = (processName: string) =>
    equipmentFailures.some(f => f.lineId === 'line-1' && f.processName === processName);

  const isCompressionFailed = bufferCompression.isActive;
  // When only 1 batch remains in buffer, main compression is being restored
  const isCompressionRestoring = bufferCompression.isActive && bufferCompression.remainingBatches <= 1;

  const getProcessStatus = (step: string): ProcessBlock['status'] => {
    if (step === 'Compression' && isCompressionFailed) {
      return isCompressionRestoring ? 'restoring' : 'error';
    }
    if (isProcessFailed(step) && step !== 'Compression') return 'error';
    if (activeStage === 'blending' && step === 'Blending') return 'active';
    if (activeStage === 'compression' && step === 'Compression' && !isCompressionFailed) return 'active';
    return 'idle';
  };

  const processes: ProcessBlock[] = processSteps.map((step) => ({
    id: `lo-${step.toLowerCase()}`,
    name: step,
    status: getProcessStatus(step),
    batchNumber: getProcessStatus(step) === 'active' ? currentBatchNumber : undefined,
  }));

  const getStatusColor = (status: ProcessBlock['status']) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/20 border-emerald-500 text-emerald-400';
      case 'warning': return 'bg-amber-500/20 border-amber-500 text-amber-400';
      case 'error': return 'bg-red-500/20 border-red-500 text-red-400';
      case 'restoring': return 'bg-blue-500/20 border-blue-500 text-blue-400';
      case 'maintenance': return 'bg-blue-500/20 border-blue-500 text-blue-400';
      default: return 'bg-muted/50 border-border text-muted-foreground';
    }
  };

  const getStatusIcon = (status: ProcessBlock['status']) => {
    switch (status) {
      case 'active': return <Zap className="w-4 h-4 text-emerald-400" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'restoring': return <Wrench className="w-4 h-4 text-blue-400" />;
      case 'maintenance': return <Factory className="w-4 h-4 text-blue-400" />;
      default: return <CheckCircle2 className="w-4 h-4 text-muted-foreground" />;
    }
  };

  // Dynamic parameters based on current product
  const productParams = useMemo(() => getProductParameters(currentProductName), [currentProductName]);

  return (
    <div className="h-full flex flex-col gap-4 overflow-auto p-2">
      {/* Line Header + Process Flow */}
      <div className="bg-card border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Factory className="w-6 h-6 text-primary" />
            <div>
              <h3 className="text-lg font-semibold">Production Line 1</h3>
              <p className="text-base text-muted-foreground">{currentBatchNumber} • {currentProductName}</p>
            </div>
          </div>
          <Badge variant="default" className="text-xs">Active</Badge>
        </div>

        {/* Main Process Flow */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {processes.map((process, idx) => (
            <div key={process.id} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                {/* Main process block */}
                <div className={cn(
                  'relative flex flex-col items-center justify-center min-w-[100px] h-20 rounded-lg border-2 px-3 py-2 transition-all',
                  getStatusColor(process.status)
                )}>
                  {getStatusIcon(process.status)}
                  <span className="text-base font-medium mt-1">{process.name}</span>
                  {process.status === 'active' && process.batchNumber && (
                    <span className="text-[10px] mt-0.5 text-emerald-400">{process.batchNumber}</span>
                  )}
                  {process.status === 'error' && (
                    <span className="text-[10px] mt-0.5 text-destructive">FAILED</span>
                  )}
                  {process.status === 'restoring' && (
                    <span className="text-[10px] mt-0.5 text-blue-400 font-semibold animate-pulse">READY SOON</span>
                  )}
                </div>

                {/* Buffer area below Blending and Compression */}
                {(process.name === 'Blending' || process.name === 'Compression') && (
                  <div className={cn(
                    'relative flex flex-col items-center justify-center min-w-[100px] h-20 rounded-lg border-2 px-3 py-2 transition-all border-dashed',
                    process.name === 'Compression' && bufferCompression.isActive && activeStage === 'compression'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                      : process.name === 'Compression' && bufferCompression.isActive
                        ? 'bg-amber-500/10 border-amber-500/50 text-amber-400'
                        : 'bg-muted/30 border-border/50 text-muted-foreground'
                  )}>
                    {process.name === 'Compression' && bufferCompression.isActive && activeStage === 'compression' ? (
                      <Zap className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Factory className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className="text-[11px] font-medium mt-1">{process.name}</span>
                    <span className="text-[9px] text-muted-foreground">(Buffer)</span>
                    {process.name === 'Compression' && bufferCompression.isActive && activeStage === 'compression' && (
                      <span className="text-[10px] mt-0.5 text-emerald-400">{currentBatchNumber}</span>
                    )}
                    {process.name === 'Compression' && bufferCompression.isActive && bufferCompression.remainingBatches > 0 && activeStage !== 'compression' && (
                      <span className="text-[9px] mt-0.5 text-amber-400">{bufferCompression.remainingBatches} batches left</span>
                    )}
                  </div>
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
        <KPICard label="Line Efficiency" value={`${productParams.efficiency.overallEfficiency}%`} icon={<Gauge className="w-4 h-4" />} status={productParams.efficiency.overallEfficiency >= 85 ? 'good' : 'warning'} />
        <KPICard label="Availability" value={`${productParams.efficiency.availability}%`} icon={<Activity className="w-4 h-4" />} status="good" />
        <KPICard label="Performance" value={`${productParams.efficiency.performance}%`} icon={<TrendingUp className="w-4 h-4" />} status="good" />
        <KPICard label="Utilization" value={`${productParams.efficiency.utilization}%`} icon={<BarChart3 className="w-4 h-4" />} status="good" />
        <KPICard label="Throughput" value={productParams.efficiency.throughput} icon={<Zap className="w-4 h-4" />} status="good" subtext="per hour" />
        <KPICard label="Cycle Time" value={productParams.efficiency.cycleTime} icon={<Clock className="w-4 h-4" />} status="good" subtext="per tablet" />
      </div>

      {/* Three KPI Panels */}
      <div className="grid grid-cols-3 gap-4 flex-1 min-h-0">
        {/* Equipment OEE */}
        <div className="bg-muted/20 rounded-lg border border-border/50 p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <Settings className="w-5 h-5 text-primary" />
            <span className="text-lg font-medium">Equipment OEE</span>
          </div>
          <div className="flex-1 space-y-1">
            {equipmentOEE.map((eq) => (
              <OEEBar key={eq.name} equipment={eq} />
            ))}
          </div>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50 text-sm text-muted-foreground">
            <span>Avg OEE: <strong className="text-success">90.9%</strong></span>
            <span>Target: <strong>≥85%</strong></span>
          </div>
        </div>

        {/* Production Parameters */}
        <div className="bg-muted/20 rounded-lg border border-border/50 p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-5 h-5 text-primary" />
            <span className="text-lg font-medium">Production Parameters</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {productParams.production.map((p) => (
              <div key={p.label} className="bg-muted/30 rounded-lg p-2">
                <div className="text-sm text-muted-foreground">{p.label}</div>
                <div className={cn(
                  "text-base font-semibold",
                  p.status === 'normal' ? 'text-foreground' : 'text-warning'
                )}>
                  {p.value}
                  {p.status === 'warning' && <AlertTriangle className="w-3.5 h-3.5 inline ml-1 text-warning" />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quality Parameters */}
        <div className="bg-muted/20 rounded-lg border border-border/50 p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-5 h-5 text-primary" />
            <span className="text-lg font-medium">Quality Parameters</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {productParams.quality.map((q) => (
              <div key={q.label} className="bg-muted/30 rounded-lg p-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{q.label}</span>
                  <Badge variant="outline" className="text-xs text-success border-success h-5 px-1.5">PASS</Badge>
                </div>
                <div className="text-base font-semibold">{q.value}</div>
                <div className="text-xs text-muted-foreground">Target: {q.target}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
