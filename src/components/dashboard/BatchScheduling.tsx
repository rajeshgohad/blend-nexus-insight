import { useState } from 'react';
import { 
  Calendar, Clock, Users, Package, Box, Zap, ArrowRight, 
  CheckCircle2, AlertTriangle, XCircle, Sparkles, Layers,
  Thermometer, Droplets, Wrench, Shield, ClipboardCheck,
  Cpu, FlaskConical, Tablet, Paintbrush, Filter, Scale
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import type { ScheduledBatch, Resource } from '@/types/manufacturing';

interface BatchSchedulingProps {
  schedule: ScheduledBatch[];
  resources: Resource[];
}

// Production unit types
type ProductionUnit = 'sieving' | 'dispensing' | 'blending' | 'compression' | 'coating' | 'polishing';

interface ProductionCondition {
  id: string;
  unit: ProductionUnit;
  name: string;
  status: 'ready' | 'warning' | 'blocked';
  detail: string;
  icon: React.ReactNode;
}

interface BatchGroup {
  id: string;
  type: 'same-drug-same-density' | 'same-drug-diff-density' | 'diff-drug-diff-density';
  label: string;
  batches: GroupedBatch[];
  cleaningRequired: 'none' | 'partial' | 'full';
  estimatedSavings: number; // minutes saved
  color: string;
}

interface GroupedBatch {
  id: string;
  batchNumber: string;
  productName: string;
  drug: string;
  density: 'low' | 'medium' | 'high';
  status: 'queued' | 'in-progress' | 'completed';
  startTime: Date;
  endTime: Date;
}

// Generate simulated production conditions
const generateProductionConditions = (): ProductionCondition[] => [
  { id: '1', unit: 'sieving', name: 'Equipment Cleaning', status: 'ready', detail: 'Sieve S-01 cleaned & verified', icon: <Filter className="w-3.5 h-3.5" /> },
  { id: '2', unit: 'dispensing', name: 'Room Clearance', status: 'ready', detail: 'QA approved - Room D-102', icon: <ClipboardCheck className="w-3.5 h-3.5" /> },
  { id: '3', unit: 'blending', name: 'Contact Status', status: 'warning', detail: 'V-Blender requires partial clean', icon: <FlaskConical className="w-3.5 h-3.5" /> },
  { id: '4', unit: 'compression', name: 'Tooling Available', status: 'ready', detail: '8mm round dies ready', icon: <Tablet className="w-3.5 h-3.5" /> },
  { id: '5', unit: 'compression', name: 'Machine Wear', status: 'warning', detail: 'Press P-02: 82% capacity', icon: <Wrench className="w-3.5 h-3.5" /> },
  { id: '6', unit: 'coating', name: 'Environmental', status: 'ready', detail: 'Temp: 23°C, RH: 45%', icon: <Thermometer className="w-3.5 h-3.5" /> },
  { id: '7', unit: 'polishing', name: 'Operator Skill', status: 'ready', detail: '3 certified operators', icon: <Users className="w-3.5 h-3.5" /> },
  { id: '8', unit: 'blending', name: 'Density Compatible', status: 'ready', detail: 'Flow properties aligned', icon: <Scale className="w-3.5 h-3.5" /> },
];

// Generate simulated batch groups (20 batches/day example)
const generateBatchGroups = (): BatchGroup[] => {
  const now = new Date();
  const baseTime = new Date(now);
  baseTime.setHours(6, 0, 0, 0);

  return [
    {
      id: 'group-1',
      type: 'same-drug-same-density',
      label: 'Same Drug + Same Density',
      cleaningRequired: 'none',
      estimatedSavings: 120,
      color: 'bg-emerald-500',
      batches: Array.from({ length: 8 }, (_, i) => ({
        id: `batch-1-${i}`,
        batchNumber: `B-${String(101 + i).padStart(3, '0')}`,
        productName: 'Metformin 500mg',
        drug: 'Metformin HCl',
        density: 'medium' as const,
        status: i < 2 ? 'completed' : i === 2 ? 'in-progress' : 'queued',
        startTime: new Date(baseTime.getTime() + i * 45 * 60000),
        endTime: new Date(baseTime.getTime() + (i + 1) * 45 * 60000),
      })),
    },
    {
      id: 'group-2',
      type: 'same-drug-diff-density',
      label: 'Same Drug + Different Density',
      cleaningRequired: 'partial',
      estimatedSavings: 60,
      color: 'bg-amber-500',
      batches: Array.from({ length: 8 }, (_, i) => ({
        id: `batch-2-${i}`,
        batchNumber: `B-${String(109 + i).padStart(3, '0')}`,
        productName: i < 4 ? 'Metformin 850mg' : 'Metformin 1000mg',
        drug: 'Metformin HCl',
        density: i < 4 ? 'high' as const : 'low' as const,
        status: 'queued' as const,
        startTime: new Date(baseTime.getTime() + (8 + i) * 45 * 60000 + 15 * 60000),
        endTime: new Date(baseTime.getTime() + (9 + i) * 45 * 60000 + 15 * 60000),
      })),
    },
    {
      id: 'group-3',
      type: 'diff-drug-diff-density',
      label: 'Different Drug + Different Density',
      cleaningRequired: 'full',
      estimatedSavings: 30,
      color: 'bg-rose-500',
      batches: Array.from({ length: 4 }, (_, i) => ({
        id: `batch-3-${i}`,
        batchNumber: `B-${String(117 + i).padStart(3, '0')}`,
        productName: i < 2 ? 'Atorvastatin 20mg' : 'Lisinopril 10mg',
        drug: i < 2 ? 'Atorvastatin Calcium' : 'Lisinopril',
        density: i % 2 === 0 ? 'high' as const : 'low' as const,
        status: 'queued' as const,
        startTime: new Date(baseTime.getTime() + (16 + i) * 45 * 60000 + 45 * 60000),
        endTime: new Date(baseTime.getTime() + (17 + i) * 45 * 60000 + 45 * 60000),
      })),
    },
  ];
};

function ConditionIndicator({ condition }: { condition: ProductionCondition }) {
  const statusColors = {
    ready: 'text-emerald-500 bg-emerald-500/10',
    warning: 'text-amber-500 bg-amber-500/10',
    blocked: 'text-rose-500 bg-rose-500/10',
  };

  const statusIcons = {
    ready: <CheckCircle2 className="w-3 h-3" />,
    warning: <AlertTriangle className="w-3 h-3" />,
    blocked: <XCircle className="w-3 h-3" />,
  };

  return (
    <div className={`flex items-center gap-2 p-2 rounded-lg ${statusColors[condition.status]}`}>
      <div className="shrink-0">{condition.icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium truncate">{condition.name}</div>
        <div className="text-[10px] opacity-75 truncate">{condition.detail}</div>
      </div>
      <div className="shrink-0">{statusIcons[condition.status]}</div>
    </div>
  );
}

function BatchGroupCard({ group, isExpanded, onToggle }: { group: BatchGroup; isExpanded: boolean; onToggle: () => void }) {
  const cleaningLabels = {
    none: { text: 'No Cleaning', color: 'bg-emerald-500/20 text-emerald-400' },
    partial: { text: 'Partial Clean', color: 'bg-amber-500/20 text-amber-400' },
    full: { text: 'Full Clean + QA', color: 'bg-rose-500/20 text-rose-400' },
  };

  const completedCount = group.batches.filter(b => b.status === 'completed').length;
  const inProgressCount = group.batches.filter(b => b.status === 'in-progress').length;
  const progress = ((completedCount + inProgressCount * 0.5) / group.batches.length) * 100;

  return (
    <div className="bg-card/50 rounded-lg border border-border/50 overflow-hidden">
      {/* Header */}
      <button 
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors"
      >
        <div className={`w-1.5 h-10 rounded-full ${group.color}`} />
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{group.batches.length} Batches</span>
            <Badge variant="outline" className={`text-[10px] ${cleaningLabels[group.cleaningRequired].color}`}>
              {cleaningLabels[group.cleaningRequired].text}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">{group.label}</div>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-emerald-400">+{group.estimatedSavings}min</div>
          <div className="text-[10px] text-muted-foreground">saved</div>
        </div>
      </button>

      {/* Progress bar */}
      <div className="px-3 pb-2">
        <Progress value={progress} className="h-1.5" />
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>{completedCount}/{group.batches.length} completed</span>
          {inProgressCount > 0 && <span className="text-primary">1 in progress</span>}
        </div>
      </div>

      {/* Expanded batch list */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-1.5 border-t border-border/30 pt-2">
          {group.batches.map((batch, idx) => (
            <div 
              key={batch.id}
              className={`flex items-center gap-2 p-2 rounded text-xs ${
                batch.status === 'completed' ? 'bg-muted/30 opacity-60' :
                batch.status === 'in-progress' ? 'bg-primary/20 ring-1 ring-primary/50' :
                'bg-muted/20'
              }`}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium ${
                batch.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                batch.status === 'in-progress' ? 'bg-primary text-primary-foreground' :
                'bg-muted text-muted-foreground'
              }`}>
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{batch.batchNumber}</div>
                <div className="text-[10px] text-muted-foreground truncate">{batch.productName}</div>
              </div>
              <Badge variant="outline" className="text-[9px] shrink-0">
                {batch.density}
              </Badge>
              {batch.status === 'in-progress' && (
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductionUnitStatus({ unit, conditions }: { unit: ProductionUnit; conditions: ProductionCondition[] }) {
  const unitConditions = conditions.filter(c => c.unit === unit);
  const allReady = unitConditions.every(c => c.status === 'ready');
  const hasBlocked = unitConditions.some(c => c.status === 'blocked');

  const unitLabels: Record<ProductionUnit, { label: string; icon: React.ReactNode }> = {
    sieving: { label: 'Sieving', icon: <Filter className="w-3.5 h-3.5" /> },
    dispensing: { label: 'Dispensing', icon: <Scale className="w-3.5 h-3.5" /> },
    blending: { label: 'Blending', icon: <FlaskConical className="w-3.5 h-3.5" /> },
    compression: { label: 'Compression', icon: <Tablet className="w-3.5 h-3.5" /> },
    coating: { label: 'Coating', icon: <Paintbrush className="w-3.5 h-3.5" /> },
    polishing: { label: 'Polishing', icon: <Sparkles className="w-3.5 h-3.5" /> },
  };

  return (
    <div className={`flex items-center gap-2 p-2 rounded-lg border ${
      allReady ? 'border-emerald-500/30 bg-emerald-500/5' :
      hasBlocked ? 'border-rose-500/30 bg-rose-500/5' :
      'border-amber-500/30 bg-amber-500/5'
    }`}>
      <div className={`${
        allReady ? 'text-emerald-500' :
        hasBlocked ? 'text-rose-500' :
        'text-amber-500'
      }`}>
        {unitLabels[unit].icon}
      </div>
      <span className="text-xs font-medium">{unitLabels[unit].label}</span>
      <div className={`ml-auto w-2 h-2 rounded-full ${
        allReady ? 'bg-emerald-500' :
        hasBlocked ? 'bg-rose-500' :
        'bg-amber-500 animate-pulse'
      }`} />
    </div>
  );
}

export function BatchScheduling({ schedule, resources }: BatchSchedulingProps) {
  const [expandedGroup, setExpandedGroup] = useState<string | null>('group-1');
  const [conditions] = useState<ProductionCondition[]>(generateProductionConditions);
  const [batchGroups] = useState<BatchGroup[]>(generateBatchGroups);

  const totalBatches = batchGroups.reduce((sum, g) => sum + g.batches.length, 0);
  const totalSavings = batchGroups.reduce((sum, g) => sum + g.estimatedSavings, 0);
  const completedBatches = batchGroups.reduce(
    (sum, g) => sum + g.batches.filter(b => b.status === 'completed').length, 
    0
  );

  const productionUnits: ProductionUnit[] = ['sieving', 'dispensing', 'blending', 'compression', 'coating', 'polishing'];

  return (
    <div className="h-full flex gap-4">
      {/* Left Panel - Batch Grouping */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Stats */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="bg-card/50 rounded-lg p-3 border border-border/50">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Total Batches</div>
            <div className="text-2xl font-bold mt-1">{totalBatches}</div>
          </div>
          <div className="bg-card/50 rounded-lg p-3 border border-border/50">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Completed</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{completedBatches}</div>
          </div>
          <div className="bg-card/50 rounded-lg p-3 border border-border/50">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Time Saved</div>
            <div className="text-2xl font-bold text-primary mt-1">{totalSavings}m</div>
          </div>
          <div className="bg-card/50 rounded-lg p-3 border border-border/50">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Efficiency</div>
            <div className="text-2xl font-bold text-amber-400 mt-1">+42%</div>
          </div>
        </div>

        {/* AI Insight Banner */}
        <div className="bg-gradient-to-r from-primary/20 to-primary/5 rounded-lg p-3 mb-4 border border-primary/30">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Cpu className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-primary">Agentic AI Optimization</span>
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Batches intelligently grouped by drug + density compatibility. 
                <span className="text-emerald-400 font-medium"> Cleaning time reduced by 42%</span> through optimal sequencing.
              </p>
            </div>
          </div>
        </div>

        {/* Batch Groups */}
        <div className="flex-1 min-h-0">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Intelligent Batch Grouping</span>
          </div>
          <ScrollArea className="h-[calc(100%-2rem)]">
            <div className="space-y-3 pr-2">
              {batchGroups.map((group) => (
                <BatchGroupCard 
                  key={group.id}
                  group={group}
                  isExpanded={expandedGroup === group.id}
                  onToggle={() => setExpandedGroup(expandedGroup === group.id ? null : group.id)}
                />
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Right Panel - Live Monitoring */}
      <div className="w-80 shrink-0 flex flex-col gap-4">
        {/* Production Units Pipeline */}
        <div className="bg-card/30 rounded-lg p-3 border border-border/50">
          <div className="flex items-center gap-2 mb-3">
            <Box className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Production Pipeline</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {productionUnits.map((unit) => (
              <ProductionUnitStatus key={unit} unit={unit} conditions={conditions} />
            ))}
          </div>
        </div>

        {/* Live Conditions Monitoring */}
        <div className="flex-1 min-h-0 flex flex-col bg-card/30 rounded-lg p-3 border border-border/50">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Live Conditions</span>
            <div className="ml-auto flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-muted-foreground">Monitoring</span>
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="space-y-2 pr-2">
              {conditions.map((condition) => (
                <ConditionIndicator key={condition.id} condition={condition} />
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Grouping Legend */}
        <div className="bg-card/30 rounded-lg p-3 border border-border/50">
          <div className="text-xs font-medium mb-2">Grouping Strategy</div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[11px]">
              <div className="w-3 h-3 rounded bg-emerald-500" />
              <span className="text-muted-foreground">Same drug + density = No cleaning</span>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <div className="w-3 h-3 rounded bg-amber-500" />
              <span className="text-muted-foreground">Same drug + diff density = Partial clean</span>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <div className="w-3 h-3 rounded bg-rose-500" />
              <span className="text-muted-foreground">Different drug = Full clean + QA</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
