import { Activity, Wifi, WifiOff, Clock, Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ChatBot } from './ChatBot';
import { formatHeaderDateTime, formatTime } from '@/lib/dateFormat';
import type { BatchState, Alert } from '@/types/manufacturing';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';

interface HeaderProps {
  productionLine: string;
  currentTime: Date;
  batchState: BatchState;
  isConnected: boolean;
  alerts: Alert[];
}

export function Header({ productionLine, currentTime, batchState, isConnected, alerts }: HeaderProps) {
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

  const criticalCount = alerts.filter(a => a.type === 'critical').length;
  const warningCount = alerts.filter(a => a.type === 'warning').length;

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
            {formatHeaderDateTime(currentTime).time}
          </span>
          <span className="text-xs">
            {formatHeaderDateTime(currentTime).date}
          </span>
        </div>

        {/* Alerts Bell */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="relative p-2 rounded-md hover:bg-muted/50 transition-colors">
              <Bell className="w-5 h-5 text-muted-foreground" />
              {(criticalCount > 0 || warningCount > 0) && (
                <span className={`absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center ${
                  criticalCount > 0 ? 'bg-destructive text-destructive-foreground' : 'bg-warning text-warning-foreground'
                }`}>
                  {criticalCount + warningCount}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="p-3 border-b border-border">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">Alerts</h4>
                <div className="flex gap-2 text-xs">
                  {criticalCount > 0 && (
                    <span className="text-destructive font-medium">{criticalCount} Critical</span>
                  )}
                  {warningCount > 0 && (
                    <span className="text-warning font-medium">{warningCount} Warning</span>
                  )}
                </div>
              </div>
            </div>
            <ScrollArea className="h-64">
              {alerts.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No alerts
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {alerts.slice(0, 20).map((alert) => (
                    <div key={alert.id} className="p-3 hover:bg-muted/50">
                      <div className="flex items-start gap-2">
                        <div className={`w-2 h-2 rounded-full mt-1.5 ${
                          alert.type === 'critical' ? 'bg-destructive' :
                          alert.type === 'warning' ? 'bg-warning' :
                          alert.type === 'success' ? 'bg-success' : 'bg-primary'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium">{alert.source}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {formatTime(alert.timestamp)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{alert.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>

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
