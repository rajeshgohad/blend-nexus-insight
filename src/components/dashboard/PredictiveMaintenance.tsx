import { Wrench, AlertTriangle, TrendingDown, Clock, CheckCircle, User, Package, FileText, Bell, ClipboardList, ShoppingCart, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { formatDate, formatTime, formatDateTimeShort } from '@/lib/dateFormat';
import type { 
  ComponentHealth, 
  Anomaly, 
  Technician, 
  SparePart, 
  WorkOrder, 
  PurchaseOrder,
  MaintenanceDecision,
  MaintenanceLog,
} from '@/types/manufacturing';

interface PredictiveMaintenanceProps {
  components: ComponentHealth[];
  anomalies: Anomaly[];
  vibration: number;
  motorLoad: number;
  temperature: number;
  technicians: Technician[];
  spares: SparePart[];
  workOrders: WorkOrder[];
  purchaseOrders: PurchaseOrder[];
  maintenanceDecisions: MaintenanceDecision[];
  maintenanceLogs: MaintenanceLog[];
  onTriggerAnalysis?: (component: ComponentHealth) => void;
}

function ComponentHealthCard({ 
  component, 
  decision,
  onAnalyze 
}: { 
  component: ComponentHealth; 
  decision?: MaintenanceDecision;
  onAnalyze?: () => void;
}) {
  const getHealthColor = (health: number) => {
    if (health >= 80) return 'bg-success';
    if (health >= 60) return 'bg-warning';
    return 'bg-destructive';
  };

  const getTrendIcon = (trend: ComponentHealth['trend']) => {
    switch (trend) {
      case 'stable': return <CheckCircle className="w-4 h-4 text-success" />;
      case 'declining': return <TrendingDown className="w-4 h-4 text-warning" />;
      case 'critical': return <AlertTriangle className="w-4 h-4 text-destructive" />;
    }
  };

  const formatRUL = (hours: number) => {
    if (hours >= 24) return `${Math.floor(hours / 24)}d`;
    return `${hours}h`;
  };

  return (
    <div className="bg-muted/30 rounded-lg p-3 space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-semibold truncate flex-1">{component.name}</span>
        {getTrendIcon(component.trend)}
      </div>
      <div className="flex items-center gap-3">
        <Progress value={component.health} className={`h-2 flex-1 ${getHealthColor(component.health)}`} />
        <span className="text-base font-mono font-bold w-12">{component.health.toFixed(0)}%</span>
      </div>
      <div className="flex justify-between text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          RUL: {formatRUL(component.rul)}
        </span>
        <span className="text-destructive/80 font-medium">
          P(fail): {(component.failureProbability * 100).toFixed(0)}%
        </span>
      </div>
      {component.predictedFailureDate && (
        <div className="text-sm text-muted-foreground">
          Est. failure: {formatDate(component.predictedFailureDate)}
        </div>
      )}
      {decision?.requiresMaintenance && (
        <Badge variant="outline" className="text-xs w-full justify-center py-1">
          {decision.maintenanceType === 'general' ? 'General Maint.' : 'Spare Replacement'}
        </Badge>
      )}
    </div>
  );
}

function TechnicianCard({ technician }: { technician: Technician }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
      <User className="w-5 h-5 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold truncate">{technician.name}</div>
        <div className="text-sm text-muted-foreground capitalize">{technician.skill}</div>
      </div>
      <Badge variant={technician.available ? 'default' : 'secondary'} className="text-xs px-2 py-1">
        {technician.available ? 'Available' : 'Busy'}
      </Badge>
    </div>
  );
}

function SparePartCard({ spare }: { spare: SparePart }) {
  const isLow = spare.quantity <= spare.minStock;
  
  return (
    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
      <Package className="w-5 h-5 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold truncate">{spare.name}</div>
        <div className="text-sm text-muted-foreground">{spare.partNumber}</div>
      </div>
      <Badge variant={isLow ? 'destructive' : 'outline'} className="text-xs px-2 py-1">
        Qty: {spare.quantity}
      </Badge>
    </div>
  );
}

function WorkOrderCard({ workOrder }: { workOrder: WorkOrder }) {
  const statusColors: Record<WorkOrder['status'], string> = {
    'pending': 'bg-muted text-muted-foreground',
    'scheduled': 'bg-primary/20 text-primary',
    'in-progress': 'bg-warning/20 text-warning',
    'completed': 'bg-success/20 text-success',
    'waiting-spares': 'bg-destructive/20 text-destructive',
  };

  return (
    <div className="p-3 bg-muted/30 rounded-lg space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-mono font-semibold">{workOrder.id}</span>
        <Badge className={`text-xs px-2 py-1 ${statusColors[workOrder.status]}`}>
          {workOrder.status.replace('-', ' ')}
        </Badge>
      </div>
      <div className="text-base font-semibold">{workOrder.component}</div>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{workOrder.type === 'general' ? 'General' : 'Spare Replacement'}</span>
        <span className="font-medium">{workOrder.estimatedDuration}h</span>
      </div>
      {workOrder.assignedTechnician && (
        <div className="text-sm flex items-center gap-2">
          <User className="w-4 h-4" />
          {workOrder.assignedTechnician.name}
        </div>
      )}
      {workOrder.scheduledTime && (
        <div className="text-sm text-muted-foreground">
          Scheduled: {formatDateTimeShort(workOrder.scheduledTime)}
        </div>
      )}
      {workOrder.notificationsSent.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-success">
          <Bell className="w-4 h-4" />
          {workOrder.notificationsSent.length} notifications sent
        </div>
      )}
    </div>
  );
}

function PurchaseOrderCard({ po }: { po: PurchaseOrder }) {
  const statusColors: Record<PurchaseOrder['status'], string> = {
    'pending': 'bg-muted text-muted-foreground',
    'approved': 'bg-primary/20 text-primary',
    'ordered': 'bg-warning/20 text-warning',
    'shipped': 'bg-info/20 text-info',
    'received': 'bg-success/20 text-success',
  };

  return (
    <div className="p-3 bg-muted/30 rounded-lg space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-mono font-semibold">{po.id}</span>
        <Badge className={`text-xs px-2 py-1 ${statusColors[po.status]}`}>
          {po.status}
        </Badge>
      </div>
      <div className="text-base font-semibold">{po.sparePart.name}</div>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Qty: {po.quantity}</span>
        <span>{po.vendor}</span>
      </div>
      <div className="text-sm text-muted-foreground">
        ETA: {formatDate(po.expectedDelivery)}
      </div>
    </div>
  );
}

function MaintenanceLogItem({ log }: { log: MaintenanceLog }) {
  return (
    <div className="p-3 border-l-3 border-primary/30 bg-muted/20 rounded-r-lg">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">{log.action}</span>
        <span className="text-sm text-muted-foreground">
          {formatTime(log.timestamp)}
        </span>
      </div>
      <div className="text-sm text-muted-foreground mt-1">{log.details}</div>
      <div className="text-sm text-primary/70 mt-1">{log.actor}</div>
    </div>
  );
}

function SensorInput({ label, value, unit, icon }: { 
  label: string; 
  value: number; 
  unit: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 bg-primary/10 rounded-lg px-3 py-2">
      {icon}
      <div>
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="text-base font-mono font-semibold">{value.toFixed(1)} {unit}</div>
      </div>
    </div>
  );
}

function AnomalyItem({ anomaly }: { anomaly: Anomaly }) {
  const severityColors = {
    low: 'bg-success/20 text-success border-success/30',
    medium: 'bg-warning/20 text-warning border-warning/30',
    high: 'bg-destructive/20 text-destructive border-destructive/30',
  };

  return (
    <div className={`p-3 rounded-lg border ${severityColors[anomaly.severity]} animate-slide-in`}>
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold">{anomaly.source}</div>
          <div className="text-sm opacity-80">{anomaly.description}</div>
        </div>
        <Badge variant="outline" className="text-xs px-2 py-1 shrink-0">
          {anomaly.severity.toUpperCase()}
        </Badge>
      </div>
      <div className="text-sm opacity-60 mt-2">
        {formatTime(anomaly.timestamp)}
      </div>
    </div>
  );
}

export function PredictiveMaintenance({ 
  components, 
  anomalies, 
  vibration, 
  motorLoad, 
  temperature,
  technicians,
  spares,
  workOrders,
  purchaseOrders,
  maintenanceDecisions,
  maintenanceLogs,
  onTriggerAnalysis,
}: PredictiveMaintenanceProps) {
  const criticalComponents = components.filter(c => c.health < 60).length;
  const availableTechnicians = technicians.filter(t => t.available).length;
  const lowStockSpares = spares.filter(s => s.quantity <= s.minStock).length;
  const activeWorkOrders = workOrders.filter(wo => wo.status !== 'completed').length;
  const pendingPOs = purchaseOrders.filter(po => po.status !== 'received').length;

  return (
    <div className="h-full flex flex-col gap-2">
      {/* Sensor Inputs */}
      <div className="flex flex-wrap gap-3">
        <SensorInput 
          label="Vibration" 
          value={vibration} 
          unit="mm/s" 
          icon={<Activity className="w-4 h-4 text-primary" />}
        />
        <SensorInput 
          label="Motor Load" 
          value={motorLoad} 
          unit="%" 
          icon={<Activity className="w-4 h-4 text-primary" />}
        />
        <SensorInput 
          label="Temp" 
          value={temperature} 
          unit="°C" 
          icon={<Activity className="w-4 h-4 text-primary" />}
        />
      </div>

      {/* Summary Badges */}
      <div className="flex flex-wrap gap-2">
        {criticalComponents > 0 && (
          <Badge variant="destructive" className="text-xs px-2 py-1">
            {criticalComponents} Critical
          </Badge>
        )}
        <Badge variant="outline" className="text-xs px-2 py-1">
          {availableTechnicians}/{technicians.length} Techs
        </Badge>
        {lowStockSpares > 0 && (
          <Badge variant="secondary" className="text-xs px-2 py-1">
            {lowStockSpares} Low Stock
          </Badge>
        )}
        <Badge variant="outline" className="text-xs px-2 py-1">
          {activeWorkOrders} WOs
        </Badge>
        {pendingPOs > 0 && (
          <Badge variant="secondary" className="text-xs px-2 py-1">
            {pendingPOs} POs
          </Badge>
        )}
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="health" className="flex-1 flex flex-col min-h-0">
        <TabsList className="grid grid-cols-5 h-10">
          <TabsTrigger value="health" className="px-2">
            <Wrench className="w-5 h-5" />
          </TabsTrigger>
          <TabsTrigger value="workorders" className="px-2">
            <ClipboardList className="w-5 h-5" />
          </TabsTrigger>
          <TabsTrigger value="resources" className="px-2">
            <User className="w-5 h-5" />
          </TabsTrigger>
          <TabsTrigger value="spares" className="px-2">
            <Package className="w-5 h-5" />
          </TabsTrigger>
          <TabsTrigger value="logs" className="px-2">
            <FileText className="w-5 h-5" />
          </TabsTrigger>
        </TabsList>

        {/* Health Tab */}
        <TabsContent value="health" className="flex-1 min-h-0 mt-3">
          <ScrollArea className="h-full">
            <div className="space-y-4 pr-2">
              {/* Component Health Grid */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Wrench className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">RUL Prediction</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {components.map((component, idx) => (
                    <ComponentHealthCard 
                      key={idx} 
                      component={component}
                      decision={maintenanceDecisions.find(d => d.componentName === component.name)}
                      onAnalyze={onTriggerAnalysis ? () => onTriggerAnalysis(component) : undefined}
                    />
                  ))}
                </div>
              </div>

              {/* Anomaly Detection - Only HIGH severity */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  <span className="text-sm font-medium text-muted-foreground">High Priority Anomalies</span>
                  <Badge variant="destructive" className="text-xs px-2 py-1 ml-auto">
                    {anomalies.filter(a => a.severity === 'high').length}
                  </Badge>
                </div>
                <div className="space-y-3">
                  {anomalies.filter(a => a.severity === 'high').length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-4">
                      No high priority anomalies
                    </div>
                  ) : (
                    anomalies.filter(a => a.severity === 'high').slice(0, 2).map((anomaly) => (
                      <AnomalyItem key={anomaly.id} anomaly={anomaly} />
                    ))
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Work Orders Tab */}
        <TabsContent value="workorders" className="flex-1 min-h-0 mt-3">
          <ScrollArea className="h-full">
            <div className="space-y-3 pr-2">
              {workOrders.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-6">
                  No active work orders
                </div>
              ) : (
                workOrders.slice(0, 5).map(wo => (
                  <WorkOrderCard key={wo.id} workOrder={wo} />
                ))
              )}
              
              {purchaseOrders.length > 0 && (
                <>
                  <div className="flex items-center gap-2 mt-4 mb-3">
                    <ShoppingCart className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Purchase Orders</span>
                  </div>
                  {purchaseOrders.slice(0, 3).map(po => (
                    <PurchaseOrderCard key={po.id} po={po} />
                  ))}
                </>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="flex-1 min-h-0 mt-3">
          <ScrollArea className="h-full">
            <div className="space-y-3 pr-2">
              <div className="text-sm font-medium text-muted-foreground mb-3">Technician Availability</div>
              {technicians.map(tech => (
                <TechnicianCard key={tech.id} technician={tech} />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Spares Tab */}
        <TabsContent value="spares" className="flex-1 min-h-0 mt-3">
          <ScrollArea className="h-full">
            <div className="space-y-3 pr-2">
              <div className="text-sm font-medium text-muted-foreground mb-3">Spare Parts Inventory</div>
              {spares.map(spare => (
                <SparePartCard key={spare.id} spare={spare} />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="flex-1 min-h-0 mt-3">
          <ScrollArea className="h-full">
            <div className="space-y-3 pr-2">
              {maintenanceLogs.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-6">
                  No maintenance logs
                </div>
              ) : (
                maintenanceLogs.slice(0, 10).map(log => (
                  <MaintenanceLogItem key={log.id} log={log} />
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Next Scheduled Maintenance */}
      <div className="bg-muted/30 rounded-lg p-3">
        <div className="text-sm text-muted-foreground mb-1">AI Decision Engine</div>
        <div className="text-base font-medium">
          {maintenanceDecisions.filter(d => d.requiresMaintenance).length > 0 ? (
            <span className="text-warning">
              {maintenanceDecisions.filter(d => d.requiresMaintenance).length} components need attention
            </span>
          ) : (
            <span className="text-success">All systems nominal</span>
          )}
        </div>
      </div>
    </div>
  );
}
