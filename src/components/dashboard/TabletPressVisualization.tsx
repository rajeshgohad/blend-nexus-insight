import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface TabletPressParameters {
  turretSpeed: number;
  preCompressionForce: number;
  mainCompressionForce: number;
  vacuumLevel: number;
  punchLubrication: number;
}

interface TabletPressVisualizationProps {
  isActive: boolean;
  parameters: TabletPressParameters;
}

function Gauge({ 
  label, 
  value, 
  unit, 
  min, 
  max,
  status = 'normal' 
}: { 
  label: string; 
  value: number; 
  unit: string;
  min: number;
  max: number;
  status?: 'normal' | 'warning' | 'critical';
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

export function TabletPressVisualization({ isActive, parameters }: TabletPressVisualizationProps) {
  if (!isActive) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-muted/30 rounded-lg p-4">
        <div className="text-muted-foreground text-sm text-center">
          Tablet Press
          <br />
          <span className="text-xs">Awaiting discharge...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-3 bg-muted/30 rounded-lg p-3 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">Tablet Press</span>
        <Badge className="bg-success/20 text-success border-success/30 text-xs animate-pulse">
          ACTIVE
        </Badge>
      </div>

      {/* Animated Tablet Press SVG */}
      <div className="relative flex items-center justify-center h-28">
        <svg 
          viewBox="0 0 200 120" 
          className="w-full h-full max-w-[160px]"
        >
          <defs>
            <linearGradient id="pressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.15" />
            </linearGradient>
            <filter id="pressGlow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Machine Base */}
          <rect x="30" y="85" width="140" height="25" rx="4" 
            fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="1.5" />
          
          {/* Turret (rotating) */}
          <g className="animate-spin" style={{ transformOrigin: '100px 70px', animationDuration: '3s' }}>
            <circle cx="100" cy="70" r="35" 
              fill="url(#pressGradient)" 
              stroke="hsl(var(--primary))" 
              strokeWidth="2"
              filter="url(#pressGlow)"
            />
            {/* Die cavities */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
              <circle 
                key={i}
                cx={100 + 25 * Math.cos((angle * Math.PI) / 180)}
                cy={70 + 25 * Math.sin((angle * Math.PI) / 180)}
                r="5"
                fill="hsl(var(--background))"
                stroke="hsl(var(--border))"
                strokeWidth="1"
              />
            ))}
          </g>
          
          {/* Upper Punch (pressing animation) */}
          <g className="animate-bounce" style={{ animationDuration: '0.8s' }}>
            <rect x="90" y="15" width="20" height="30" rx="2" 
              fill="hsl(var(--primary))" opacity="0.8" />
            <rect x="85" y="10" width="30" height="8" rx="2" 
              fill="hsl(var(--muted-foreground))" />
          </g>
          
          {/* Lower Punch */}
          <rect x="90" y="90" width="20" height="15" rx="2" 
            fill="hsl(var(--primary))" opacity="0.6" />
          
          {/* Output tablets */}
          <g>
            <ellipse cx="160" cy="95" rx="8" ry="4" fill="hsl(var(--success))" opacity="0.8">
              <animate attributeName="cx" values="160;175;160" dur="2s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="145" cy="95" rx="8" ry="4" fill="hsl(var(--success))" opacity="0.6" />
          </g>
          
          {/* Status indicator */}
          <circle cx="45" cy="95" r="5" fill="hsl(var(--success))" className="animate-pulse" />
        </svg>
      </div>

      {/* Parameters - Same style as Blender gauges */}
      <div className="grid grid-cols-2 gap-3 flex-1">
        <Gauge 
          label="Turret Speed" 
          value={parameters.turretSpeed} 
          unit="RPM"
          min={20}
          max={80}
          status={parameters.turretSpeed > 70 ? 'warning' : 'normal'}
        />
        <Gauge 
          label="Pre-Compress" 
          value={parameters.preCompressionForce} 
          unit="kN"
          min={1}
          max={10}
        />
        <Gauge 
          label="Main Compress" 
          value={parameters.mainCompressionForce} 
          unit="kN"
          min={5}
          max={40}
          status={parameters.mainCompressionForce > 35 ? 'warning' : 'normal'}
        />
        <Gauge 
          label="Vacuum" 
          value={parameters.vacuumLevel} 
          unit="mbar"
          min={-100}
          max={0}
        />
        <Gauge 
          label="Lubrication" 
          value={parameters.punchLubrication} 
          unit="%"
          min={0}
          max={100}
          status={parameters.punchLubrication < 20 ? 'warning' : 'normal'}
        />
      </div>
    </div>
  );
}