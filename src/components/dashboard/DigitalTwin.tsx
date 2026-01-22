import { Play, Pause, Square, AlertTriangle, RotateCcw, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { BlenderParameters, BatchInfo, BatchState } from '@/types/manufacturing';

interface DigitalTwinProps {
  parameters: BlenderParameters;
  batch: BatchInfo;
  onStart: () => void;
  onStop: () => void;
  onSuspend: () => void;
  onResume: () => void;
  onEmergencyStop: () => void;
  onEmergencyReset: () => void;
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
        <span className={`font-mono font-medium ${statusColors[status]}`}>
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
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

function BlenderVisualization({ isRunning, speed }: { isRunning: boolean; speed: number }) {
  return (
    <div className="relative w-full h-40 flex items-center justify-center">
      {/* V-Blender Shape */}
      <svg 
        viewBox="0 0 200 150" 
        className="w-full h-full max-w-[200px]"
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
        
        {/* Blender body */}
        <g className={isRunning ? 'animate-rotate-blender' : ''} style={{ transformOrigin: '100px 75px' }}>
          <path 
            d="M 50 30 L 150 30 L 130 120 L 70 120 Z" 
            fill="url(#blenderGradient)" 
            stroke="hsl(var(--primary))" 
            strokeWidth="2"
            filter={isRunning ? "url(#glow)" : "none"}
          />
          {/* Inner contents */}
          <ellipse 
            cx="100" 
            cy="75" 
            rx="35" 
            ry="25" 
            fill="hsl(var(--primary))" 
            opacity="0.2"
          />
          {/* Blend particles */}
          {isRunning && (
            <>
              <circle cx="85" cy="65" r="3" fill="hsl(var(--success))" opacity="0.7" />
              <circle cx="115" cy="70" r="4" fill="hsl(var(--warning))" opacity="0.7" />
              <circle cx="95" cy="85" r="3" fill="hsl(var(--primary))" opacity="0.7" />
              <circle cx="105" cy="60" r="2" fill="hsl(var(--success))" opacity="0.7" />
            </>
          )}
        </g>
        
        {/* Motor */}
        <rect x="90" y="5" width="20" height="20" rx="3" fill="hsl(var(--muted))" stroke="hsl(var(--border))" />
        
        {/* Speed indicator */}
        {isRunning && (
          <text x="100" y="145" textAnchor="middle" className="fill-primary text-xs font-mono">
            {speed.toFixed(1)} RPM
          </text>
        )}
      </svg>
      
      {/* Status indicator */}
      {isRunning && (
        <div className="absolute top-2 right-2 flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs text-success">ACTIVE</span>
        </div>
      )}
    </div>
  );
}

export function DigitalTwin({ 
  parameters, 
  batch, 
  onStart, 
  onStop, 
  onSuspend, 
  onResume, 
  onEmergencyStop, 
  onEmergencyReset 
}: DigitalTwinProps) {
  const isRunning = batch.state === 'blending' || batch.state === 'loading';
  const isEmergency = batch.state === 'emergency-stop';

  const getStatus = (value: number, min: number, max: number, warningThreshold: number = 0.8) => {
    const range = max - min;
    const normalizedValue = (value - min) / range;
    if (normalizedValue > 0.95 || normalizedValue < 0.05) return 'critical';
    if (normalizedValue > warningThreshold || normalizedValue < (1 - warningThreshold)) return 'warning';
    return 'normal';
  };

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Blender Visualization */}
      <BlenderVisualization isRunning={isRunning} speed={parameters.rotationSpeed} />

      {/* Batch Info */}
      {batch.state !== 'idle' && (
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Batch</span>
            <Badge variant="outline" className="text-xs">{batch.batchNumber}</Badge>
          </div>
          <div className="text-sm font-medium truncate">{batch.productName}</div>
          <div className="flex flex-wrap gap-1">
            {batch.recipe.map((item, idx) => (
              <Badge 
                key={idx} 
                variant={item.added ? "default" : "outline"}
                className="text-[10px]"
              >
                {item.ingredient.split(' ')[0]}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Parameter Gauges */}
      <div className="grid grid-cols-2 gap-3 flex-1">
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
            <span className="font-mono font-medium text-success">
              {parameters.blendUniformity.toFixed(1)}%
            </span>
          </div>
          <Progress value={parameters.blendUniformity} className="h-2" />
          <div className="text-[10px] text-muted-foreground">RSD Target: ≤5%</div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="grid grid-cols-3 gap-2">
        {batch.state === 'idle' ? (
          <Button size="sm" onClick={onStart} className="col-span-3 bg-success hover:bg-success/90">
            <Play className="w-4 h-4 mr-1" /> Start Batch
          </Button>
        ) : (
          <>
            <Button size="sm" variant="outline" onClick={onStop}>
              <Square className="w-4 h-4 mr-1" /> Stop
            </Button>
            {isRunning ? (
              <Button size="sm" variant="outline" onClick={onSuspend}>
                <Pause className="w-4 h-4 mr-1" /> Suspend
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={onResume}>
                <Play className="w-4 h-4 mr-1" /> Resume
              </Button>
            )}
            {isEmergency ? (
              <Button size="sm" variant="outline" onClick={onEmergencyReset}>
                <RotateCcw className="w-4 h-4 mr-1" /> Reset
              </Button>
            ) : (
              <Button size="sm" variant="destructive" onClick={onEmergencyStop}>
                <AlertTriangle className="w-4 h-4 mr-1" /> E-Stop
              </Button>
            )}
          </>
        )}
      </div>

      {/* Sync indicator */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Zap className="w-3 h-3 text-primary animate-pulse" />
        <span>Syncing to Maintenance, QC, Yield, Scheduling</span>
      </div>
    </div>
  );
}
