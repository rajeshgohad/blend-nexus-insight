import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { ParameterHistoryPoint } from '@/types/manufacturing';
import { format } from 'date-fns';

export type TrendParameter = 'temperature' | 'blenderSpeed';

interface TrendChartProps {
  parameterHistory: ParameterHistoryPoint[];
  selectedParameter: TrendParameter;
}

interface ChartConfig {
  label: string;
  unit: string;
  color: string;
  min: number;
  max: number;
  dataKey: keyof ParameterHistoryPoint;
}

const parameterConfigs: Record<TrendParameter, ChartConfig> = {
  temperature: {
    label: 'Temperature',
    unit: '°C',
    color: 'hsl(var(--warning))',
    min: 18,
    max: 28,
    dataKey: 'temperature',
  },
  blenderSpeed: {
    label: 'Rotation Speed',
    unit: 'RPM',
    color: 'hsl(var(--success))',
    min: 0,
    max: 30,
    dataKey: 'blenderSpeed',
  },
};

export function TrendChart({ parameterHistory, selectedParameter }: TrendChartProps) {
  const config = parameterConfigs[selectedParameter];
  
  const data = parameterHistory.map(point => ({
    time: format(point.timestamp, 'HH:mm'),
    value: point[config.dataKey] as number,
  }));

  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">{config.label} ({config.unit})</span>
        <span className="text-xs text-muted-foreground">Last 6 hours</span>
      </div>
      <div className="flex-1 min-h-[100px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
            <XAxis 
              dataKey="time" 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
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
  );
}
