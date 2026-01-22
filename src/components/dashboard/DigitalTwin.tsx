import { useState, useEffect } from 'react';
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
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={`font-mono font-semibold ${statusColors[status]}`}>
          {value.toFixed(1)} {unit}
        </span>
      </div>
      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ${
            status === 'normal' ? 'bg-success' : 
            status === 'warning' ? 'bg-warning' : 'bg-destructive'
          }`}
          style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

function BlenderVisualization({ isRunning, speed }: { isRunning: boolean; speed: number }) {
  return (
    <div className="relative w-full h-36 flex items-center justify-center">
      <svg 
        viewBox="0 0 200 150" 
        className="w-full h-full max-w-[180px]"
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
        <div className="absolute top-2 right-2 flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
          <span className="text-sm font-medium text-success">ACTIVE</span>
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

  // Tablet press parameters state - simulates dynamically when active
  const [tabletPressParams, setTabletPressParams] = useState({
    turretSpeed: 0,
    preCompressionForce: 0,
    mainCompressionForce: 0,
    vacuumLevel: 0,
    punchLubrication: 0,
  });

  // Simulate tablet press parameters when discharge is active
  useEffect(() => {
    if (!isTabletPressActive) {
      setTabletPressParams({
        turretSpeed: 0,
        preCompressionForce: 0,
        mainCompressionForce: 0,
        vacuumLevel: 0,
        punchLubrication: 0,
      });
      return;
    }

    // Update parameters periodically to simulate real-time changes
    const interval = setInterval(() => {
      setTabletPressParams({
        turretSpeed: 45 + Math.random() * 10 - 5,
        preCompressionForce: 4 + Math.random() * 2 - 1,
        mainCompressionForce: 22 + Math.random() * 6 - 3,
        vacuumLevel: -50 + Math.random() * 10 - 5,
        punchLubrication: 75 + Math.random() * 10 - 5,
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTabletPressActive]);

  return (
    <div className="h-full flex gap-4 overflow-hidden">
      {/* Left Column - Blender Visualization & Parameters */}
      <div className="w-[280px] flex flex-col gap-4 shrink-0">
        <BlenderVisualization isRunning={isRunning} speed={parameters.rotationSpeed} />

        {/* Parameter Gauges */}
        <div className="grid grid-cols-2 gap-3">
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
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Uniformity</span>
              <span className="font-mono font-semibold text-success">
                {parameters.blendUniformity.toFixed(1)}%
              </span>
            </div>
            <Progress value={parameters.blendUniformity} className="h-2.5" />
            <div className="text-xs text-muted-foreground">RSD Target: ≤5%</div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="grid grid-cols-3 gap-2">
          {batch.state === 'idle' ? (
            <Button size="default" onClick={onStart} className="col-span-3 bg-success hover:bg-success/90 text-base">
              <Play className="w-5 h-5 mr-2" /> Start Batch
            </Button>
          ) : (
            <>
              <Button size="default" variant="outline" onClick={onStop}>
                <Square className="w-4 h-4 mr-1" /> Stop
              </Button>
              {isRunning ? (
                <Button size="default" variant="outline" onClick={onSuspend}>
                  <Pause className="w-4 h-4 mr-1" /> Suspend
                </Button>
              ) : (
                <Button size="default" variant="outline" onClick={onResume}>
                  <Play className="w-4 h-4 mr-1" /> Resume
                </Button>
              )}
              {isEmergency ? (
                <Button size="default" variant="outline" onClick={onEmergencyReset}>
                  <RotateCcw className="w-4 h-4 mr-1" /> Reset
                </Button>
              ) : (
                <Button size="default" variant="destructive" onClick={onEmergencyStop}>
                  <AlertTriangle className="w-4 h-4 mr-1" /> E-Stop
                </Button>
              )}
            </>
          )}
        </div>

        {/* Trend Chart with Parameter Selector */}
        <div className="flex-1 min-h-0 bg-muted/30 rounded-lg p-3 flex flex-col gap-2">
          <Select 
            value={selectedTrendParameter} 
            onValueChange={(value: TrendParameter) => setSelectedTrendParameter(value)}
          >
            <SelectTrigger className="w-full h-8 text-sm bg-background">
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

      {/* Right Column - Batch Details & Sequence */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        {/* Main content: Left side (Batch + Table) + Right side (Tablet Press) */}
        <div className="flex-1 flex gap-4 overflow-hidden">
          {/* Left side: Batch Details above Blending Sequence */}
          <div className="w-[750px] shrink-0 flex flex-col gap-3 overflow-hidden">
            {/* Batch Info Header - Compact */}
            <div className="bg-muted/50 rounded-lg p-3 border">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Batch:</span>
                  <Badge variant="outline" className="text-xs font-mono px-1.5 py-0">{batch.batchNumber}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Product:</span>
                  <span className="font-mono text-foreground text-xs">{batch.productId}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-foreground text-xs">{batch.operator.id} - {batch.operator.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">State:</span>
                  <Badge 
                    className={`text-xs px-1.5 py-0 ${
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
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Start:</span>
                  <span className="font-mono text-foreground text-xs">
                    {batch.startTime ? format(batch.startTime, 'HH:mm:ss') : '--'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">End:</span>
                  <span className="font-mono text-foreground text-xs">
                    {batch.endTime ? format(batch.endTime, 'HH:mm:ss') : '--'}
                  </span>
                </div>
              </div>
              
              {/* Recipe & Ingredients Row */}
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
                <span className="text-xs text-muted-foreground">Recipe:</span>
                <Select 
                  value={batch.recipeId} 
                  onValueChange={onSelectRecipe}
                  disabled={!isIdle}
                >
                  <SelectTrigger className="h-7 text-xs bg-background w-40">
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
                <div className="flex flex-wrap gap-1 ml-2">
                  {batch.recipe.slice(0, 4).map((item, idx) => (
                    <Badge 
                      key={idx} 
                      variant={item.added ? "default" : "outline"}
                      className="text-xs px-1.5 py-0"
                    >
                      {item.ingredient.split(' ')[0]}
                    </Badge>
                  ))}
                  {batch.recipe.length > 4 && (
                    <Badge variant="outline" className="text-xs px-1.5 py-0">+{batch.recipe.length - 4}</Badge>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              {batch.state !== 'idle' && (
                <div className="mt-2 pt-2 border-t border-border/50">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-mono font-semibold text-primary">{progressPercent.toFixed(1)}%</span>
                  </div>
                  <Progress value={progressPercent} className="h-2" />
                </div>
              )}
            </div>

            {/* Blending Sequence Table */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="text-sm font-semibold text-foreground mb-2">Blending Sequence Status</div>
              <div className="border rounded-lg overflow-auto flex-1">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-sm py-3 h-10 font-semibold">Step</TableHead>
                      <TableHead className="text-sm py-3 h-10 text-center font-semibold">Set Point (min)</TableHead>
                      <TableHead className="text-sm py-3 h-10 text-center font-semibold">Actual (min)</TableHead>
                      <TableHead className="text-sm py-3 h-10 text-center font-semibold">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batch.blendingSequence.map((seq, idx) => (
                      <TableRow key={seq.step} className={seq.status === 'in-progress' ? 'bg-primary/5' : ''}>
                        <TableCell className="text-sm py-3 font-medium">
                          <span className="text-muted-foreground mr-2">{idx + 1}.</span>
                          {seq.label}
                        </TableCell>
                        <TableCell className="text-sm py-3 text-center font-mono">{seq.setPointMinutes}</TableCell>
                        <TableCell className={`text-sm py-3 text-center font-mono font-semibold ${
                          seq.status === 'in-progress' ? 'text-primary' : 
                          seq.status === 'completed' ? 'text-success' : ''
                        }`}>
                          {seq.actualMinutes.toFixed(1)}
                        </TableCell>
                        <TableCell className="text-sm py-3 text-center">{getSequenceStatusBadge(seq.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          {/* Tablet Press Visualization */}
          <div className="flex-1 min-w-[340px]">
            <TabletPressVisualization 
              isActive={isTabletPressActive} 
              parameters={tabletPressParams} 
            />
          </div>
        </div>

        {/* Sync indicator */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Zap className="w-4 h-4 text-primary animate-pulse" />
          <span>Syncing to Maintenance, QC, Yield, Scheduling</span>
        </div>
      </div>

    </div>
  );
}