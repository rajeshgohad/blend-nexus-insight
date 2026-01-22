import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine, ReferenceArea, ResponsiveContainer, Tooltip } from 'recharts';
import { AlertTriangle, Thermometer, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Anomaly } from '@/types/manufacturing';

interface AnomalyTrendChartProps {
  anomalies: Anomaly[];
  temperature: number;
  motorLoad: number;
}

interface TrendDataPoint {
  time: string;
  value: number;
  timestamp: number;
}

// Generate simulated historical data with an anomaly spike
function generateTrendData(
  currentValue: number,
  anomalyDetected: boolean,
  paramType: 'temperature' | 'motor'
): TrendDataPoint[] {
  const data: TrendDataPoint[] = [];
  const now = Date.now();
  const baseValue = paramType === 'temperature' ? 22 : 60;
  const variance = paramType === 'temperature' ? 0.5 : 3;
  
  for (let i = 29; i >= 0; i--) {
    const timestamp = now - i * 60 * 1000; // 1-minute intervals
    const date = new Date(timestamp);
    const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    
    let value: number;
    
    if (anomalyDetected && i <= 5 && i >= 2) {
      // Create anomaly spike in recent data
      const spikeIntensity = paramType === 'temperature' ? 3 + Math.random() * 2 : 15 + Math.random() * 10;
      value = baseValue + spikeIntensity + (Math.random() - 0.5) * variance;
    } else if (i === 0) {
      value = currentValue;
    } else {
      value = baseValue + (Math.random() - 0.5) * variance * 2;
    }
    
    data.push({ time: timeStr, value: Number(value.toFixed(2)), timestamp });
  }
  
  return data;
}

export function AnomalyTrendChart({ anomalies, temperature, motorLoad }: AnomalyTrendChartProps) {
  // Find the most recent high-severity anomaly
  const recentAnomaly = useMemo(() => {
    const highAnomalies = anomalies.filter(a => a.severity === 'high');
    return highAnomalies[0] || null;
  }, [anomalies]);

  // Determine which parameter to show based on anomaly source
  const { paramType, label, unit, icon, color, normalRange, currentValue } = useMemo(() => {
    if (!recentAnomaly) {
      return {
        paramType: 'temperature' as const,
        label: 'Temperature',
        unit: '°C',
        icon: <Thermometer className="w-5 h-5" />,
        color: 'hsl(var(--warning))',
        normalRange: { min: 20, max: 25 },
        currentValue: temperature,
      };
    }
    
    if (recentAnomaly.source.toLowerCase().includes('temperature')) {
      return {
        paramType: 'temperature' as const,
        label: 'Temperature Sensor',
        unit: '°C',
        icon: <Thermometer className="w-5 h-5" />,
        color: 'hsl(var(--warning))',
        normalRange: { min: 20, max: 25 },
        currentValue: temperature,
      };
    } else if (recentAnomaly.source.toLowerCase().includes('motor') || recentAnomaly.source.toLowerCase().includes('current')) {
      return {
        paramType: 'motor' as const,
        label: 'Motor Current',
        unit: '%',
        icon: <Zap className="w-5 h-5" />,
        color: 'hsl(var(--primary))',
        normalRange: { min: 55, max: 75 },
        currentValue: motorLoad,
      };
    } else if (recentAnomaly.source.toLowerCase().includes('vibration')) {
      return {
        paramType: 'motor' as const,
        label: 'Vibration Pattern',
        unit: 'mm/s',
        icon: <Zap className="w-5 h-5" />,
        color: 'hsl(var(--destructive))',
        normalRange: { min: 0.5, max: 2.0 },
        currentValue: motorLoad / 50,
      };
    } else {
      return {
        paramType: 'motor' as const,
        label: recentAnomaly.source,
        unit: '%',
        icon: <Zap className="w-5 h-5" />,
        color: 'hsl(var(--warning))',
        normalRange: { min: 55, max: 75 },
        currentValue: motorLoad,
      };
    }
  }, [recentAnomaly, temperature, motorLoad]);

  const trendData = useMemo(() => 
    generateTrendData(currentValue, !!recentAnomaly, paramType),
    [currentValue, recentAnomaly, paramType]
  );

  // Find anomaly region for highlighting
  const anomalyRegion = useMemo(() => {
    if (!recentAnomaly) return null;
    
    // Highlight the spike region (minutes 24-27 in our 30-point chart)
    const startIdx = 24;
    const endIdx = 27;
    
    return {
      x1: trendData[startIdx]?.time,
      x2: trendData[endIdx]?.time,
    };
  }, [recentAnomaly, trendData]);

  const yDomain = useMemo(() => {
    const values = trendData.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min) * 0.2;
    return [Math.floor(min - padding), Math.ceil(max + padding)];
  }, [trendData]);

  return (
    <div className="bg-muted/30 rounded-lg p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-semibold">{label} Trend</span>
        </div>
        {recentAnomaly ? (
          <Badge variant="destructive" className="text-xs px-2 py-1 flex items-center gap-1 animate-pulse">
            <AlertTriangle className="w-3 h-3" />
            Anomaly Detected
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs px-2 py-1">
            Normal
          </Badge>
        )}
      </div>

      {/* Anomaly Description */}
      {recentAnomaly && (
        <div className="text-sm text-destructive bg-destructive/10 rounded px-3 py-2 border border-destructive/20">
          <span className="font-medium">{recentAnomaly.source}:</span> {recentAnomaly.description}
        </div>
      )}

      {/* Chart */}
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            
            {/* Normal range band */}
            <ReferenceArea
              y1={normalRange.min}
              y2={normalRange.max}
              fill="hsl(var(--success))"
              fillOpacity={0.1}
              stroke="none"
            />
            
            {/* Anomaly highlight region */}
            {anomalyRegion && (
              <ReferenceArea
                x1={anomalyRegion.x1}
                x2={anomalyRegion.x2}
                fill="hsl(var(--destructive))"
                fillOpacity={0.2}
                stroke="hsl(var(--destructive))"
                strokeDasharray="4 4"
              />
            )}
            
            {/* Upper limit line */}
            <ReferenceLine
              y={normalRange.max}
              stroke="hsl(var(--warning))"
              strokeDasharray="4 4"
              label={{ value: 'Upper', position: 'right', fontSize: 10, fill: 'hsl(var(--warning))' }}
            />
            
            {/* Lower limit line */}
            <ReferenceLine
              y={normalRange.min}
              stroke="hsl(var(--warning))"
              strokeDasharray="4 4"
              label={{ value: 'Lower', position: 'right', fontSize: 10, fill: 'hsl(var(--warning))' }}
            />
            
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={false}
              interval={5}
            />
            <YAxis 
              domain={yDomain}
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={false}
              width={35}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value: number) => [`${value.toFixed(2)} ${unit}`, label]}
              labelFormatter={(label) => `Time: ${label}`}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: color }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Current Value */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Current Value:</span>
        <span className={`font-mono font-bold ${recentAnomaly ? 'text-destructive' : 'text-foreground'}`}>
          {currentValue.toFixed(2)} {unit}
        </span>
      </div>
    </div>
  );
}
