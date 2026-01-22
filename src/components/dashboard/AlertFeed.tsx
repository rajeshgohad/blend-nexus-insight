import { Bell, Info, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';
import type { Alert } from '@/types/manufacturing';

interface AlertFeedProps {
  alerts: Alert[];
}

const alertIcons = {
  info: <Info className="w-3 h-3 text-primary" />,
  warning: <AlertTriangle className="w-3 h-3 text-warning" />,
  critical: <XCircle className="w-3 h-3 text-destructive" />,
  success: <CheckCircle className="w-3 h-3 text-success" />,
};

const alertColors = {
  info: 'border-primary/30 bg-primary/10',
  warning: 'border-warning/30 bg-warning/10',
  critical: 'border-destructive/30 bg-destructive/10',
  success: 'border-success/30 bg-success/10',
};

export function AlertFeed({ alerts }: AlertFeedProps) {
  const recentAlerts = alerts.slice(0, 10);

  return (
    <div className="h-12 border-t border-border bg-card flex items-center px-4 gap-4 overflow-hidden">
      {/* Label */}
      <div className="flex items-center gap-2 shrink-0">
        <Bell className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">ALERTS</span>
      </div>

      {/* Ticker */}
      <div className="flex-1 overflow-hidden relative">
        {recentAlerts.length === 0 ? (
          <div className="text-xs text-muted-foreground">No recent alerts</div>
        ) : (
          <div className="flex gap-4 animate-ticker hover:pause">
            {/* Duplicate for seamless loop */}
            {[...recentAlerts, ...recentAlerts].map((alert, idx) => (
              <div
                key={`${alert.id}-${idx}`}
                className={`flex items-center gap-2 px-3 py-1 rounded border ${alertColors[alert.type]} shrink-0`}
              >
                {alertIcons[alert.type]}
                <span className="text-[10px] font-medium whitespace-nowrap">{alert.source}</span>
                <span className="text-[10px] whitespace-nowrap">{alert.message}</span>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {alert.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Count badge */}
      <div className="shrink-0 flex items-center gap-2">
        <div className="text-xs text-muted-foreground">
          {alerts.filter(a => a.type === 'critical').length > 0 && (
            <span className="text-destructive font-medium mr-2">
              {alerts.filter(a => a.type === 'critical').length} Critical
            </span>
          )}
          {alerts.length} total
        </div>
      </div>
    </div>
  );
}
