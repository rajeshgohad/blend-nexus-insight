import { useState, useEffect, useRef } from 'react';
import { Square, Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

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

type TrendParameter = 'turretSpeed' | 'mainCompressionForce';

interface HistoryPoint {
  timestamp: Date;
  turretSpeed: number;
  mainCompressionForce: number;
}

const trendConfigs: Record<TrendParameter, { label: string; unit: string; color: string; min: number; max: number }> = {
  turretSpeed: {
    label: 'Turret Speed',
    unit: 'RPM',
    color: 'hsl(var(--primary))',
    min: 20,
    max: 80,
  },
  mainCompressionForce: {
    label: 'Main Compression',
    unit: 'kN',
    color: 'hsl(var(--warning))',
    min: 5,
    max: 40,
  },
};

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
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-sm">
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
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

export function TabletPressVisualization({ isActive, parameters }: TabletPressVisualizationProps) {
  const [selectedTrend, setSelectedTrend] = useState<TrendParameter>('turretSpeed');
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [isStopped, setIsStopped] = useState(false);
  const [lastParams, setLastParams] = useState<TabletPressParameters>({
    turretSpeed: 0,
    preCompressionForce: 0,
    mainCompressionForce: 0,
    vacuumLevel: 0,
    punchLubrication: 0,
  });
  const lastUpdateRef = useRef<Date>(new Date());

  // Reset stopped state when tablet press becomes inactive
  useEffect(() => {
    if (!isActive) {
      setIsStopped(false);
      setLastParams({
        turretSpeed: 0,
        preCompressionForce: 0,
        mainCompressionForce: 0,
        vacuumLevel: 0,
        punchLubrication: 0,
      });
    }
  }, [isActive]);

  // Store last params when running
  useEffect(() => {
    if (isActive && !isStopped) {
      setLastParams(parameters);
    }
  }, [isActive, isStopped, parameters]);

  // Determine if running (active and not stopped)
  const isRunning = isActive && !isStopped;

  // Build history when running
  useEffect(() => {
    if (!isRunning) {
      setHistory([]);
      return;
    }

    // Initialize with some seed data
    if (history.length === 0) {
      const now = new Date();
      const seedData: HistoryPoint[] = [];
      for (let i = 35; i >= 0; i--) {
        seedData.push({
          timestamp: new Date(now.getTime() - i * 10 * 60 * 1000),
          turretSpeed: 45 + Math.random() * 10 - 5,
          mainCompressionForce: 22 + Math.random() * 6 - 3,
        });
      }
      setHistory(seedData);
      return;
    }

    // Add new data points periodically
    const interval = setInterval(() => {
      const now = new Date();
      if (now.getTime() - lastUpdateRef.current.getTime() >= 10000) {
        lastUpdateRef.current = now;
        setHistory(prev => {
          const newPoint: HistoryPoint = {
            timestamp: now,
            turretSpeed: parameters.turretSpeed,
            mainCompressionForce: parameters.mainCompressionForce,
          };
          const updated = [...prev, newPoint];
          // Keep last 36 points (6 hours at 10-min intervals)
          return updated.slice(-36);
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, parameters, history.length]);

  // Use current values when running, last values when stopped, zero when inactive
  const displayParams = isRunning 
    ? parameters 
    : isStopped 
      ? lastParams 
      : {
          turretSpeed: 0,
          preCompressionForce: 0,
          mainCompressionForce: 0,
          vacuumLevel: 0,
          punchLubrication: 0,
        };

  const config = trendConfigs[selectedTrend];
  const chartData = history.map(point => ({
    time: format(point.timestamp, 'HH:mm'),
    value: point[selectedTrend],
  }));

  // Static SVG for inactive state
  const StaticTabletPress = () => (
    <svg viewBox="0 0 200 120" className="w-full h-full max-w-[140px]">
      <defs>
        <linearGradient id="pressGradientStatic" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.3" />
          <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      
      {/* Machine Base */}
      <rect x="30" y="85" width="140" height="25" rx="4" 
        fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="1.5" />
      
      {/* Turret (static) */}
      <g>
        <circle cx="100" cy="70" r="35" 
          fill="url(#pressGradientStatic)" 
          stroke="hsl(var(--muted-foreground))" 
          strokeWidth="2"
          opacity="0.5"
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
            opacity="0.5"
          />
        ))}
      </g>
      
      {/* Upper Punch (static) */}
      <g>
        <rect x="90" y="15" width="20" height="30" rx="2" 
          fill="hsl(var(--muted-foreground))" opacity="0.4" />
        <rect x="85" y="10" width="30" height="8" rx="2" 
          fill="hsl(var(--muted-foreground))" opacity="0.3" />
      </g>
      
      {/* Lower Punch */}
      <rect x="90" y="90" width="20" height="15" rx="2" 
        fill="hsl(var(--muted-foreground))" opacity="0.3" />
      
      {/* Status indicator (inactive) */}
      <circle cx="45" cy="95" r="5" fill="hsl(var(--muted-foreground))" opacity="0.4" />
    </svg>
  );

  // Animated SVG for active state
  const AnimatedTabletPress = () => (
    <svg viewBox="0 0 200 120" className="w-full h-full max-w-[140px]">
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
  );

  return (
    <div className="h-full flex flex-col gap-3 bg-muted/30 rounded-lg p-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">Tablet Press</span>
        {isRunning ? (
          <Badge className="bg-success/20 text-success border-success/30 text-xs animate-pulse">
            RUNNING
          </Badge>
        ) : isActive && isStopped ? (
          <Badge className="bg-warning/20 text-warning border-warning/30 text-xs">
            STOPPED
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs text-muted-foreground">
            STANDBY
          </Badge>
        )}
      </div>

      {/* Tablet Press SVG - Static or Animated based on state */}
      <div className="relative flex items-center justify-center h-24">
        {isRunning ? <AnimatedTabletPress /> : <StaticTabletPress />}
      </div>

      {/* Parameters - Compact grid with abbreviations */}
      <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
        <Gauge 
          label="Turret Speed" 
          value={displayParams.turretSpeed} 
          unit="RPM"
          min={0}
          max={80}
          status={isRunning && displayParams.turretSpeed > 70 ? 'warning' : 'normal'}
        />
        <Gauge 
          label="Pre Compression Force" 
          value={displayParams.preCompressionForce} 
          unit="kN"
          min={0}
          max={10}
        />
        <Gauge 
          label="Main Compression Force" 
          value={displayParams.mainCompressionForce} 
          unit="kN"
          min={0}
          max={40}
          status={isRunning && displayParams.mainCompressionForce > 35 ? 'warning' : 'normal'}
        />
        <Gauge 
          label="Vacuum" 
          value={displayParams.vacuumLevel} 
          unit="mbar"
          min={-100}
          max={0}
        />
        <Gauge 
          label="LUB" 
          value={displayParams.punchLubrication} 
          unit="%"
          min={0}
          max={100}
          status={isRunning && displayParams.punchLubrication < 20 ? 'warning' : 'normal'}
        />
      </div>

      {/* Stop/Start Button */}
      {isActive && (
        <Button 
          size="sm" 
          variant={isStopped ? "default" : "destructive"}
          onClick={() => setIsStopped(!isStopped)}
          className="w-full"
        >
          {isStopped ? (
            <>
              <Play className="w-4 h-4 mr-2" /> Start
            </>
          ) : (
            <>
              <Square className="w-4 h-4 mr-2" /> Stop
            </>
          )}
        </Button>
      )}

      {/* Trend Chart - Same style as Temperature chart */}
      <div className="flex-1 min-h-0 bg-background/50 rounded-lg p-2 flex flex-col gap-2">
        <Select value={selectedTrend} onValueChange={(v) => setSelectedTrend(v as TrendParameter)}>
          <SelectTrigger className="w-full h-8 text-sm bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border z-50">
            <SelectItem value="turretSpeed">Turret Speed</SelectItem>
            <SelectItem value="mainCompressionForce">Main Compression</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex-1 min-h-[80px]">
          <div className="flex flex-col gap-2 h-full">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">{config.label} ({config.unit})</span>
              <span className="text-xs text-muted-foreground">Last 6 hours</span>
            </div>
            <div className="flex-1 min-h-[60px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis 
                    dataKey="time" 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    domain={[config.min, config.max]}
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    width={35}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: number) => [`${value.toFixed(1)} ${config.unit}`, config.label]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    name={config.label}
                    stroke={config.color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}