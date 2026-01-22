import { useState, useMemo } from 'react';
import { Play, Pause, Square, AlertTriangle, RotateCcw, Zap, User, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendChart, type TrendParameter } from './TrendChart';
import { TabletPressVisualization } from './TabletPressVisualization';
import type { BlenderParameters, BatchInfo, Recipe, ParameterHistoryPoint } from '@/types/manufacturing';
import { format } from 'date-fns';

interface DigitalTwinProps {
  parameters: BlenderParameters;
  batch: BatchInfo;
  availableRecipes: Recipe[];
  parameterHistory: ParameterHistoryPoint[];
  onStart: () => void;
  onStop: () => void;
  onSuspend: () => void;
  onResume: () => void;
  onEmergencyStop: () => void;
  onEmergencyReset: () => void;
  onSelectRecipe: (recipeId: string) => void;
}

function Gauge({ label, value, min, max, unit, status }: { 
  label: string; 
  value: number; 
  min: number; 
  max: number; 
  unit: string;
  status: 'normal' | 'warning' | 'critical';
}) {
  const percentage = ((value - min) / (max - min)) * 100;
  const statusColors = {
    normal: 'text-success',
    warning: 'text-warning',
    critical: 'text-destructive',
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={`font-mono font-semibold ${statusColors[status]}`}>
          {value.toFixed(1)} {unit}
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ${
            status === 'normal' ? 'bg-success' : 
            status === 'warning' ? 'bg-warning' : 'bg-destructive'
          }`}
          style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
        />
      </div>
    </div>
  );
}

function BlenderVisualization({ isRunning, speed }: { isRunning: boolean; speed: number }) {
  return (
    <div className="relative w-full h-28 flex items-center justify-center">
      <svg 
        viewBox="0 0 200 150" 
        className="w-full h-full max-w-[140px]"
        style={{ transform: isRunning ? undefined : 'none' }}
      >
        <defs>
          <linearGradient id="blenderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.1" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        <g className={isRunning ? 'animate-rotate-blender' : ''} style={{ transformOrigin: '100px 75px' }}>
          <path 
            d="M 50 30 L 150 30 L 130 120 L 70 120 Z" 
            fill="url(#blenderGradient)" 
            stroke="hsl(var(--primary))" 
            strokeWidth="2"
            filter={isRunning ? "url(#glow)" : "none"}
          />
          <ellipse 
            cx="100" 
            cy="75" 
            rx="35" 
            ry="25" 
            fill="hsl(var(--primary))" 
            opacity="0.2"
          />
          {isRunning && (
            <>
              <circle cx="85" cy="65" r="3" fill="hsl(var(--success))" opacity="0.7" />
              <circle cx="115" cy="70" r="4" fill="hsl(var(--warning))" opacity="0.7" />
              <circle cx="95" cy="85" r="3" fill="hsl(var(--primary))" opacity="0.7" />
              <circle cx="105" cy="60" r="2" fill="hsl(var(--success))" opacity="0.7" />
            </>
          )}
        </g>
        
        <rect x="90" y="5" width="20" height="20" rx="3" fill="hsl(var(--muted))" stroke="hsl(var(--border))" />
        
        {isRunning && (
          <text x="100" y="145" textAnchor="middle" className="fill-primary text-sm font-mono font-semibold">
            {speed.toFixed(1)} RPM
          </text>
        )}
      </svg>
      
      {isRunning && (
        <div className="absolute top-1 right-1 flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs font-medium text-success">ACTIVE</span>
        </div>
      )}
    </div>
  );
}

export function DigitalTwin({ 
  parameters, 
  batch,
  availableRecipes,
  parameterHistory,
  onStart, 
  onStop, 
  onSuspend, 
  onResume, 
  onEmergencyStop, 
  onEmergencyReset,
  onSelectRecipe,
}: DigitalTwinProps) {
  const [selectedTrendParameter, setSelectedTrendParameter] = useState<TrendParameter>('temperature');
  
  const isRunning = batch.state === 'blending' || batch.state === 'loading';
  const isEmergency = batch.state === 'emergency-stop';
  const isIdle = batch.state === 'idle';

  const getStatus = (value: number, min: number, max: number, warningThreshold: number = 0.8) => {
    const range = max - min;
    const normalizedValue = (value - min) / range;
    if (normalizedValue > 0.95 || normalizedValue < 0.05) return 'critical';
    if (normalizedValue > warningThreshold || normalizedValue < (1 - warningThreshold)) return 'warning';
    return 'normal';
  };

  const getSequenceStatusBadge = (status: 'pending' | 'in-progress' | 'completed') => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-success/20 text-success border-success/30 text-xs px-2 py-0.5">Done</Badge>;
      case 'in-progress':
        return <Badge className="bg-primary/20 text-primary border-primary/30 text-xs px-2 py-0.5 animate-pulse">Active</Badge>;
      default:
        return <Badge variant="outline" className="text-xs px-2 py-0.5">Pending</Badge>;
    }
  };

  // Calculate total progress
  const totalSetPoint = batch.blendingSequence.reduce((acc, s) => acc + s.setPointMinutes, 0);
  const totalActual = batch.blendingSequence.reduce((acc, s) => acc + s.actualMinutes, 0);
  const progressPercent = totalSetPoint > 0 ? (totalActual / totalSetPoint) * 100 : 0;

  // Check if discharge step (step 7) is in progress or completed
  const dischargeStep = batch.blendingSequence.find(s => s.step === 'discharge');
  const isTabletPressActive = dischargeStep?.status === 'in-progress' || dischargeStep?.status === 'completed';

  // Generate tablet press parameters with some variance
  const tabletPressParams = useMemo(() => ({
    turretSpeed: 45 + Math.random() * 10,
    preCompressionForce: 3 + Math.random() * 2,
    mainCompressionForce: 18 + Math.random() * 8,
    vacuumLevel: -60 + Math.random() * 20,
    punchLubrication: 65 + Math.random() * 20,
  }), [isTabletPressActive]);

  return (
    <div className="h-full flex flex-col gap-3 overflow-hidden">
      {/* Top Row - Blender + Tablet Press + Batch Info */}
      <div className="flex gap-3">
        {/* Blender Visualization & Parameters */}
        <div className="w-[240px] flex flex-col gap-2 shrink-0">
          <BlenderVisualization isRunning={isRunning} speed={parameters.rotationSpeed} />

          {/* Parameter Gauges */}
          <div className="grid grid-cols-2 gap-2">
            <Gauge 
              label="Rotation" 
              value={parameters.rotationSpeed} 
              min={10} max={25} 
              unit="RPM"
              status={getStatus(parameters.rotationSpeed, 10, 25)}
            />
            <Gauge 
              label="Blend Time" 
              value={parameters.blendTime} 
              min={0} max={30} 
              unit="min"
              status="normal"
            />
            <Gauge 
              label="Motor Load" 
              value={parameters.motorLoad} 
              min={40} max={85} 
              unit="%"
              status={getStatus(parameters.motorLoad, 40, 85)}
            />
            <Gauge 
              label="Temperature" 
              value={parameters.temperature} 
              min={20} max={25} 
              unit="°C"
              status={getStatus(parameters.temperature, 20, 25)}
            />
            <Gauge 
              label="Vibration" 
              value={parameters.vibration} 
              min={0.1} max={2.5} 
              unit="mm/s"
              status={getStatus(parameters.vibration, 0.1, 2.5)}
            />
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Uniformity</span>
                <span className="font-mono font-semibold text-success">
                  {parameters.blendUniformity.toFixed(1)}%
                </span>
              </div>
              <Progress value={parameters.blendUniformity} className="h-2" />
            </div>
          </div>

          {/* Control Buttons */}
          <div className="grid grid-cols-3 gap-1.5">
            {batch.state === 'idle' ? (
              <Button size="sm" onClick={onStart} className="col-span-3 bg-success hover:bg-success/90 text-xs h-8">
                <Play className="w-3 h-3 mr-1" /> Start Batch
              </Button>
            ) : (
              <>
                <Button size="sm" variant="outline" onClick={onStop} className="text-xs h-8">
                  <Square className="w-3 h-3" />
                </Button>
                {isRunning ? (
                  <Button size="sm" variant="outline" onClick={onSuspend} className="text-xs h-8">
                    <Pause className="w-3 h-3" />
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={onResume} className="text-xs h-8">
                    <Play className="w-3 h-3" />
                  </Button>
                )}
                {isEmergency ? (
                  <Button size="sm" variant="outline" onClick={onEmergencyReset} className="text-xs h-8">
                    <RotateCcw className="w-3 h-3" />
                  </Button>
                ) : (
                  <Button size="sm" variant="destructive" onClick={onEmergencyStop} className="text-xs h-8">
                    <AlertTriangle className="w-3 h-3" />
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Tablet Press Visualization */}
        <div className="w-[200px] shrink-0">
          <TabletPressVisualization 
            isActive={isTabletPressActive} 
            parameters={tabletPressParams} 
          />
        </div>

        {/* Batch Info - Compact */}
        <div className="flex-1 bg-muted/50 rounded-lg p-2 space-y-2">
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Batch:</span>
              <Badge variant="outline" className="text-[10px] font-mono px-1 py-0">{batch.batchNumber}</Badge>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className="font-mono text-foreground text-[10px]">
                {batch.startTime ? format(batch.startTime, 'HH:mm:ss') : '--'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Product:</span>
              <span className="font-mono text-foreground text-[10px]">{batch.productId}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <User className="w-3 h-3 text-muted-foreground" />
              <span className="text-foreground text-[10px]">{batch.operator.name}</span>
            </div>
            <div className="flex items-center gap-1.5 col-span-2">
              <span className="text-muted-foreground">State:</span>
              <Badge 
                className={`text-[10px] px-1 py-0 ${
                  batch.state === 'blending' ? 'bg-success/20 text-success' :
                  batch.state === 'emergency-stop' ? 'bg-destructive/20 text-destructive' :
                  batch.state === 'loading' ? 'bg-primary/20 text-primary' :
                  batch.state === 'complete' ? 'bg-success/20 text-success' :
                  'bg-muted text-muted-foreground'
                }`}
              >
                {batch.state.toUpperCase()}
              </Badge>
            </div>
          </div>

          {/* Recipe Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">Recipe:</span>
            <Select 
              value={batch.recipeId} 
              onValueChange={onSelectRecipe}
              disabled={!isIdle}
            >
              <SelectTrigger className="flex-1 h-6 text-[10px] bg-background">
                <SelectValue placeholder="Select recipe" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border z-50">
                {availableRecipes.map(recipe => (
                  <SelectItem key={recipe.id} value={recipe.id} className="text-xs">
                    {recipe.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Ingredients */}
          <div className="flex flex-wrap gap-1">
            {batch.recipe.map((item, idx) => (
              <Badge 
                key={idx} 
                variant={item.added ? "default" : "outline"}
                className="text-[9px] px-1 py-0"
              >
                {item.ingredient.split(' ')[0]} ({item.quantity}{item.unit})
              </Badge>
            ))}
          </div>

          {/* Progress Bar */}
          {batch.state !== 'idle' && (
            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-mono font-semibold text-primary">{progressPercent.toFixed(0)}%</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
          )}
        </div>

        {/* Trend Chart */}
        <div className="w-[200px] shrink-0 bg-muted/30 rounded-lg p-2 flex flex-col gap-1">
          <Select 
            value={selectedTrendParameter} 
            onValueChange={(value: TrendParameter) => setSelectedTrendParameter(value)}
          >
            <SelectTrigger className="w-full h-6 text-[10px] bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border z-50">
              <SelectItem value="temperature">Temperature</SelectItem>
              <SelectItem value="blenderSpeed">Rotation Speed</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex-1 min-h-0">
            <TrendChart parameterHistory={parameterHistory} selectedParameter={selectedTrendParameter} />
          </div>
        </div>
      </div>

      {/* Bottom - Blending Sequence Table */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="text-sm font-semibold text-foreground mb-1">Blending Sequence Status</div>
        <div className="border rounded-lg overflow-auto flex-1">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-sm py-2 h-8 font-semibold">Step</TableHead>
                <TableHead className="text-sm py-2 h-8 text-center font-semibold">Set Point (min)</TableHead>
                <TableHead className="text-sm py-2 h-8 text-center font-semibold">Actual (min)</TableHead>
                <TableHead className="text-sm py-2 h-8 text-center font-semibold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batch.blendingSequence.map((seq, idx) => (
                <TableRow key={seq.step} className={seq.status === 'in-progress' ? 'bg-primary/5' : ''}>
                  <TableCell className="text-sm py-2 font-medium">
                    <span className="text-muted-foreground mr-2">{idx + 1}.</span>
                    {seq.label}
                  </TableCell>
                  <TableCell className="text-sm py-2 text-center font-mono">{seq.setPointMinutes}</TableCell>
                  <TableCell className={`text-sm py-2 text-center font-mono font-semibold ${
                    seq.status === 'in-progress' ? 'text-primary' : 
                    seq.status === 'completed' ? 'text-success' : ''
                  }`}>
                    {seq.actualMinutes.toFixed(1)}
                  </TableCell>
                  <TableCell className="text-sm py-2 text-center">{getSequenceStatusBadge(seq.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Sync indicator */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Zap className="w-3 h-3 text-primary animate-pulse" />
        <span>Syncing to Maintenance, QC, Yield, Scheduling</span>
      </div>
    </div>
  );
}