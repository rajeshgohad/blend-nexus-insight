import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { ParameterHistoryPoint } from '@/types/manufacturing';
import { format } from 'date-fns';

interface TrendChartProps {
  parameterHistory: ParameterHistoryPoint[];
}

interface SingleChartProps {
  data: { time: string; value: number }[];
  label: string;
  unit: string;
  color: string;
  min: number;
  max: number;
}

function SingleTrendChart({ data, label, unit, color, min, max }: SingleChartProps) {
  return (
    <div className="flex flex-col gap-2 flex-1">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">{label}</span>
        <span className="text-xs text-muted-foreground">Last 6 hours</span>
      </div>
      <div className="flex-1 min-h-[120px]">
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
              domain={[min, max]}
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
              formatter={(value: number) => [`${value.toFixed(1)} ${unit}`, label]}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              name={label}
              stroke={color}
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

export function TrendChart({ parameterHistory }: TrendChartProps) {
  const temperatureData = parameterHistory.map(point => ({
    time: format(point.timestamp, 'HH:mm'),
    value: point.temperature,
  }));

  const speedData = parameterHistory.map(point => ({
    time: format(point.timestamp, 'HH:mm'),
    value: point.blenderSpeed,
  }));

  return (
    <div className="flex flex-col gap-4 h-full">
      <SingleTrendChart 
        data={temperatureData}
        label="Temperature (°C)"
        unit="°C"
        color="hsl(var(--warning))"
        min={18}
        max={28}
      />
      <SingleTrendChart 
        data={speedData}
        label="Rotation Speed (RPM)"
        unit="RPM"
        color="hsl(var(--success))"
        min={0}
        max={30}
      />
    </div>
  );
}
