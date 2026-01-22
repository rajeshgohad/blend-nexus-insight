import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ParameterHistoryPoint } from '@/types/manufacturing';
import { format } from 'date-fns';

interface TrendChartProps {
  parameterHistory: ParameterHistoryPoint[];
}

type ParameterType = 'motorLoad' | 'temperature' | 'blenderSpeed';

const parameterConfig: Record<ParameterType, { label: string; unit: string; color: string; min: number; max: number }> = {
  motorLoad: { label: 'Motor Load', unit: '%', color: 'hsl(var(--primary))', min: 40, max: 85 },
  temperature: { label: 'Temperature', unit: '°C', color: 'hsl(var(--warning))', min: 18, max: 28 },
  blenderSpeed: { label: 'Blender Speed', unit: 'RPM', color: 'hsl(var(--success))', min: 0, max: 30 },
};

export function TrendChart({ parameterHistory }: TrendChartProps) {
  const [selectedParameter, setSelectedParameter] = useState<ParameterType>('motorLoad');
  
  const config = parameterConfig[selectedParameter];
  
  const chartData = parameterHistory.map(point => ({
    time: format(point.timestamp, 'HH:mm'),
    value: point[selectedParameter],
    timestamp: point.timestamp,
  }));

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between gap-4">
        <span className="text-base font-semibold text-foreground">Parameter Trend (Last 6 Hours)</span>
        <Select value={selectedParameter} onValueChange={(v) => setSelectedParameter(v as ParameterType)}>
          <SelectTrigger className="w-48 h-10 text-sm bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border z-50">
            <SelectItem value="motorLoad" className="text-sm">Motor Load (%)</SelectItem>
            <SelectItem value="temperature" className="text-sm">Temperature (°C)</SelectItem>
            <SelectItem value="blenderSpeed" className="text-sm">Blender Speed (RPM)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex-1 min-h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
            <XAxis 
              dataKey="time" 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              domain={[config.min, config.max]}
              stroke="hsl(var(--muted-foreground))"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              unit={config.unit}
              width={50}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '13px',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              formatter={(value: number) => [`${value.toFixed(1)} ${config.unit}`, config.label]}
            />
            <Legend 
              verticalAlign="top" 
              height={24}
              formatter={() => `${config.label} (${config.unit})`}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              name={config.label}
              stroke={config.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
