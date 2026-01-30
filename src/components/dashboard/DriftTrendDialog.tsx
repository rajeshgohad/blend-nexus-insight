import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine, ReferenceDot, CartesianGrid, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatTime } from '@/lib/dateFormat';
import type { DriftDetection, ParameterTrendPoint } from '@/types/tablet-press-yield';

interface DriftTrendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  drift: DriftDetection | null;
  trendData: ParameterTrendPoint[];
}

const PARAMETER_CONFIG: Record<string, { label: string; unit: string; color: string; target?: number; min?: number; max?: number }> = {
  weight: { label: 'Weight', unit: 'mg', color: 'hsl(var(--primary))', target: 500, min: 475, max: 525 },
  thickness: { label: 'Thickness', unit: 'mm', color: 'hsl(var(--chart-2))', target: 4.5, min: 4.3, max: 4.7 },
  hardness: { label: 'Hardness', unit: 'kP', color: 'hsl(var(--chart-3))', target: 12, min: 8, max: 16 },
  feederSpeed: { label: 'Feeder Speed', unit: 'rpm', color: 'hsl(var(--chart-4))', target: 28, min: 20, max: 35 },
  turretSpeed: { label: 'Turret Speed', unit: 'rpm', color: 'hsl(var(--chart-5))', target: 45, min: 40, max: 55 },
};

export function DriftTrendDialog({ open, onOpenChange, drift, trendData }: DriftTrendDialogProps) {
  if (!drift) return null;

  const config = PARAMETER_CONFIG[drift.parameter] || { label: drift.parameter, unit: '', color: 'hsl(var(--primary))' };
  
  // Filter trend data for this parameter
  const parameterData = trendData
    .map(point => ({
      timestamp: point.timestamp,
      value: point[drift.parameter as keyof ParameterTrendPoint] as number,
      formattedTime: formatTime(new Date(point.timestamp)),
    }))
    .filter(d => typeof d.value === 'number');

  // Find the anomaly point (closest to drift detection time)
  const anomalyTime = new Date(drift.detectedAt).getTime();
  const anomalyPoint = parameterData.reduce((closest, point) => {
    const pointTime = new Date(point.timestamp).getTime();
    const closestTime = closest ? new Date(closest.timestamp).getTime() : Infinity;
    return Math.abs(pointTime - anomalyTime) < Math.abs(closestTime - anomalyTime) ? point : closest;
  }, parameterData[parameterData.length - 1]);

  // Calculate Y-axis domain
  const values = parameterData.map(d => d.value);
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const padding = (dataMax - dataMin) * 0.15 || 5;
  const yMin = Math.floor(dataMin - padding);
  const yMax = Math.ceil(dataMax + padding);

  const severityColors = {
    low: 'bg-muted text-muted-foreground',
    medium: 'bg-warning/20 text-warning',
    high: 'bg-destructive/20 text-destructive',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-warning" />
            <span>{config.label} Drift Trend</span>
            <Badge className={`ml-2 ${severityColors[drift.severity]}`}>
              {drift.severity} severity
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Drift Summary */}
          <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-2">
              {drift.direction === 'increasing' ? (
                <TrendingUp className="w-5 h-5 text-warning" />
              ) : (
                <TrendingDown className="w-5 h-5 text-warning" />
              )}
              <span className="font-medium capitalize">{drift.direction}</span>
            </div>
            <Badge variant="outline">
              {drift.magnitude.toFixed(1)}% magnitude
            </Badge>
            <span className="text-sm text-muted-foreground">
              Detected at {formatTime(new Date(drift.detectedAt))}
            </span>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground">{drift.description}</p>

          {/* Trend Chart */}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={parameterData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                <XAxis 
                  dataKey="formattedTime" 
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  domain={[yMin, yMax]}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  width={45}
                  tickFormatter={(val) => val.toFixed(1)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => [`${value.toFixed(2)} ${config.unit}`, config.label]}
                  labelFormatter={(label) => `Time: ${label}`}
                />
                
                {/* Target line */}
                {config.target && (
                  <ReferenceLine 
                    y={config.target} 
                    stroke="hsl(var(--success))" 
                    strokeDasharray="5 5" 
                    label={{ 
                      value: `Target: ${config.target}`, 
                      fill: 'hsl(var(--success))', 
                      fontSize: 10,
                      position: 'right'
                    }} 
                  />
                )}
                
                {/* Spec limits */}
                {config.min && (
                  <ReferenceLine 
                    y={config.min} 
                    stroke="hsl(var(--warning))" 
                    strokeDasharray="3 3"
                    label={{ 
                      value: `Min: ${config.min}`, 
                      fill: 'hsl(var(--warning))', 
                      fontSize: 10,
                      position: 'left'
                    }}
                  />
                )}
                {config.max && (
                  <ReferenceLine 
                    y={config.max} 
                    stroke="hsl(var(--warning))" 
                    strokeDasharray="3 3"
                    label={{ 
                      value: `Max: ${config.max}`, 
                      fill: 'hsl(var(--warning))', 
                      fontSize: 10,
                      position: 'left'
                    }}
                  />
                )}
                
                {/* Main trend line */}
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={config.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: config.color }}
                />
                
                {/* Highlight anomaly point */}
                {anomalyPoint && (
                  <ReferenceDot 
                    x={anomalyPoint.formattedTime} 
                    y={anomalyPoint.value} 
                    r={8}
                    fill="hsl(var(--destructive))"
                    stroke="hsl(var(--background))"
                    strokeWidth={3}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: config.color }} />
              <span>{config.label} ({config.unit})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-destructive" />
              <span>Anomaly Point</span>
            </div>
            {config.target && (
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-success" style={{ borderStyle: 'dashed' }} />
                <span>Target</span>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
