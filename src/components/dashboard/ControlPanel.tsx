import { Settings, Play, Pause, RotateCcw, Download, Zap, AlertTriangle, Clock, Package, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import type { SimulationState } from '@/types/manufacturing';

interface ControlPanelProps {
  simulation: SimulationState;
  onSpeedChange: (speed: number) => void;
  onTogglePause: () => void;
  onReset: () => void;
  onInjectScenario: (scenario: string) => void;
}

const speedOptions = [
  { value: 1, label: '1x' },
  { value: 5, label: '5x' },
  { value: 10, label: '10x' },
  { value: 50, label: '50x' },
];

const scenarios = [
  { id: 'equipment_failure', label: 'Equipment Failure', icon: AlertTriangle, description: 'Simulate bearing failure' },
  { id: 'material_delay', label: 'Material Delay', icon: Truck, description: 'Delay API delivery' },
  { id: 'rush_order', label: 'Rush Order', icon: Clock, description: 'Insert priority batch' },
  { id: 'quality_defect', label: 'Quality Defect', icon: Package, description: 'Inject contamination' },
];

export function ControlPanel({ 
  simulation, 
  onSpeedChange, 
  onTogglePause, 
  onReset,
  onInjectScenario 
}: ControlPanelProps) {
  const handleExport = () => {
    const data = {
      timestamp: new Date().toISOString(),
      simulation,
      // Add more state data as needed
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mes-snapshot-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col p-4 bg-sidebar border-l border-border">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Settings className="w-5 h-5 text-primary" />
        <h2 className="text-sm font-semibold">Control Panel</h2>
      </div>

      {/* Batch Selector */}
      <div className="space-y-2 mb-6">
        <Label className="text-xs text-muted-foreground">Batch Selection</Label>
        <Select defaultValue="current">
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Select batch" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current">BN-2024-0847 (Current)</SelectItem>
            <SelectItem value="previous1">BN-2024-0846</SelectItem>
            <SelectItem value="previous2">BN-2024-0845</SelectItem>
            <SelectItem value="simulate">Simulate Future</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator className="mb-6" />

      {/* Simulation Controls */}
      <div className="space-y-4 mb-6">
        <Label className="text-xs text-muted-foreground">Simulation Speed</Label>
        
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant={simulation.isPaused ? "default" : "outline"}
            onClick={onTogglePause}
            className="flex-1"
          >
            {simulation.isPaused ? (
              <>
                <Play className="w-4 h-4 mr-1" /> Play
              </>
            ) : (
              <>
                <Pause className="w-4 h-4 mr-1" /> Pause
              </>
            )}
          </Button>
          <Button size="sm" variant="outline" onClick={onReset}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-1">
          {speedOptions.map(opt => (
            <Button
              key={opt.value}
              size="sm"
              variant={simulation.speed === opt.value ? "default" : "outline"}
              onClick={() => onSpeedChange(opt.value)}
              className="text-xs"
            >
              {opt.label}
            </Button>
          ))}
        </div>

        <div className="text-xs text-muted-foreground text-center">
          Elapsed: {Math.floor(simulation.elapsedSeconds / 60)}m {Math.floor(simulation.elapsedSeconds % 60)}s
        </div>
      </div>

      <Separator className="mb-6" />

      {/* Scenario Injection */}
      <div className="space-y-3 mb-6">
        <Label className="text-xs text-muted-foreground">Scenario Injection</Label>
        
        <div className="grid gap-2">
          {scenarios.map(scenario => (
            <Button
              key={scenario.id}
              size="sm"
              variant="outline"
              className="justify-start h-auto py-2 px-3"
              onClick={() => onInjectScenario(scenario.id)}
            >
              <scenario.icon className="w-4 h-4 mr-2 text-warning" />
              <div className="text-left">
                <div className="text-xs font-medium">{scenario.label}</div>
                <div className="text-[10px] text-muted-foreground">{scenario.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </div>

      <Separator className="mb-6" />

      {/* System Override */}
      <div className="space-y-3 mb-6">
        <Label className="text-xs text-muted-foreground">System Override</Label>
        
        <div className="flex items-center justify-between">
          <div className="text-xs">Require Manual Approval</div>
          <Switch id="manual-approval" />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-xs">Pause AI Automation</div>
          <Switch id="pause-ai" />
        </div>
      </div>

      <div className="mt-auto">
        <Button 
          size="sm" 
          variant="outline" 
          className="w-full"
          onClick={handleExport}
        >
          <Download className="w-4 h-4 mr-2" />
          Export State
        </Button>
      </div>
    </div>
  );
}
