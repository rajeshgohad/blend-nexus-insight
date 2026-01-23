import { Activity, Wifi, WifiOff, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ChatBot } from './ChatBot';
import type { BatchState } from '@/types/manufacturing';

interface HeaderProps {
  productionLine: string;
  currentTime: Date;
  batchState: BatchState;
  isConnected: boolean;
}

export function Header({ productionLine, currentTime, batchState, isConnected }: HeaderProps) {
  const getStatusColor = () => {
    switch (batchState) {
      case 'blending':
      case 'loading':
        return 'bg-success animate-status-pulse';
      case 'emergency-stop':
        return 'bg-destructive animate-status-pulse';
      case 'idle':
        return 'bg-muted-foreground';
      default:
        return 'bg-warning';
    }
  };

  const getStatusText = () => {
    switch (batchState) {
      case 'blending': return 'RUNNING';
      case 'loading': return 'LOADING';
      case 'emergency-stop': return 'E-STOP';
      case 'idle': return 'IDLE';
      case 'sampling': return 'SAMPLING';
      case 'discharge': return 'DISCHARGE';
      case 'cleaning': return 'CLEANING';
      default: return 'UNKNOWN';
    }
  };

  return (
    <header className="h-16 border-b border-border gradient-header flex items-center justify-between px-6">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Activity className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">PharmaMES AI Dashboard</h1>
            <p className="text-xs text-muted-foreground">{productionLine}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span className="font-mono text-sm">
            {currentTime.toLocaleTimeString('en-US', { hour12: false })}
          </span>
          <span className="text-xs">
            {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className="w-4 h-4 text-success" />
            ) : (
              <WifiOff className="w-4 h-4 text-destructive" />
            )}
            <span className="text-xs text-muted-foreground">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          <Badge 
            variant="outline" 
            className={`${getStatusColor()} text-foreground border-0 px-3 py-1`}
          >
            {getStatusText()}
          </Badge>

          {/* AI Chatbot */}
          <ChatBot />
        </div>
      </div>
    </header>
  );
}
