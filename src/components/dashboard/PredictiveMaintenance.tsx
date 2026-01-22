import { Wrench, AlertTriangle, TrendingDown, Clock, CheckCircle, User, Package, FileText, Bell, ClipboardList, ShoppingCart, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
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
      case 'stable': return <CheckCircle className="w-3 h-3 text-success" />;
      case 'declining': return <TrendingDown className="w-3 h-3 text-warning" />;
      case 'critical': return <AlertTriangle className="w-3 h-3 text-destructive" />;
    }
  };

  const formatRUL = (hours: number) => {
    if (hours >= 24) return `${Math.floor(hours / 24)}d`;
    return `${hours}h`;
  };

  return (
    <div className="bg-muted/30 rounded-lg p-2 space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium truncate flex-1">{component.name}</span>
        {getTrendIcon(component.trend)}
      </div>
      <div className="flex items-center gap-2">
        <Progress value={component.health} className={`h-1.5 flex-1 ${getHealthColor(component.health)}`} />
        <span className="text-xs font-mono w-8">{component.health.toFixed(0)}%</span>
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          RUL: {formatRUL(component.rul)}
        </span>
        <span className="text-destructive/80">
          P(fail): {(component.failureProbability * 100).toFixed(0)}%
        </span>
      </div>
      {component.predictedFailureDate && (
        <div className="text-[10px] text-muted-foreground">
          Est. failure: {component.predictedFailureDate.toLocaleDateString()}
        </div>
      )}
      {decision?.requiresMaintenance && (
        <Badge variant="outline" className="text-[9px] w-full justify-center">
          {decision.maintenanceType === 'general' ? 'General Maint.' : 'Spare Replacement'}
        </Badge>
      )}
    </div>
  );
}

function TechnicianCard({ technician }: { technician: Technician }) {
  return (
    <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
      <User className="w-4 h-4 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium truncate">{technician.name}</div>
        <div className="text-[10px] text-muted-foreground capitalize">{technician.skill}</div>
      </div>
      <Badge variant={technician.available ? 'default' : 'secondary'} className="text-[9px]">
        {technician.available ? 'Available' : 'Busy'}
      </Badge>
    </div>
  );
}

function SparePartCard({ spare }: { spare: SparePart }) {
  const isLow = spare.quantity <= spare.minStock;
  
  return (
    <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
      <Package className="w-4 h-4 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium truncate">{spare.name}</div>
        <div className="text-[10px] text-muted-foreground">{spare.partNumber}</div>
      </div>
      <Badge variant={isLow ? 'destructive' : 'outline'} className="text-[9px]">
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
    <div className="p-2 bg-muted/30 rounded-lg space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono">{workOrder.id}</span>
        <Badge className={`text-[9px] ${statusColors[workOrder.status]}`}>
          {workOrder.status.replace('-', ' ')}
        </Badge>
      </div>
      <div className="text-xs font-medium">{workOrder.component}</div>
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{workOrder.type === 'general' ? 'General' : 'Spare Replacement'}</span>
        <span>{workOrder.estimatedDuration}h</span>
      </div>
      {workOrder.assignedTechnician && (
        <div className="text-[10px] flex items-center gap-1">
          <User className="w-3 h-3" />
          {workOrder.assignedTechnician.name}
        </div>
      )}
      {workOrder.scheduledTime && (
        <div className="text-[10px] text-muted-foreground">
          Scheduled: {workOrder.scheduledTime.toLocaleString()}
        </div>
      )}
      {workOrder.notificationsSent.length > 0 && (
        <div className="flex items-center gap-1 text-[10px] text-success">
          <Bell className="w-3 h-3" />
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
    <div className="p-2 bg-muted/30 rounded-lg space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono">{po.id}</span>
        <Badge className={`text-[9px] ${statusColors[po.status]}`}>
          {po.status}
        </Badge>
      </div>
      <div className="text-xs font-medium">{po.sparePart.name}</div>
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>Qty: {po.quantity}</span>
        <span>{po.vendor}</span>
      </div>
      <div className="text-[10px] text-muted-foreground">
        ETA: {po.expectedDelivery.toLocaleDateString()}
      </div>
    </div>
  );
}

function MaintenanceLogItem({ log }: { log: MaintenanceLog }) {
  return (
    <div className="p-2 border-l-2 border-primary/30 bg-muted/20 rounded-r-lg">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">{log.action}</span>
        <span className="text-[10px] text-muted-foreground">
          {log.timestamp.toLocaleTimeString()}
        </span>
      </div>
      <div className="text-[10px] text-muted-foreground">{log.details}</div>
      <div className="text-[10px] text-primary/70">{log.actor}</div>
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
    <div className="flex items-center gap-2 bg-primary/10 rounded px-2 py-1">
      {icon}
      <div className="text-[10px]">
        <div className="text-muted-foreground">{label}</div>
        <div className="font-mono font-medium">{value.toFixed(1)} {unit}</div>
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
    <div className={`p-2 rounded border ${severityColors[anomaly.severity]} animate-slide-in`}>
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium">{anomaly.source}</div>
          <div className="text-[10px] opacity-80 truncate">{anomaly.description}</div>
        </div>
        <Badge variant="outline" className="text-[10px] shrink-0">
          {anomaly.severity.toUpperCase()}
        </Badge>
      </div>
      <div className="text-[10px] opacity-60 mt-1">
        {anomaly.timestamp.toLocaleTimeString()}
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
      <div className="flex flex-wrap gap-2">
        <SensorInput 
          label="Vibration" 
          value={vibration} 
          unit="mm/s" 
          icon={<Activity className="w-3 h-3 text-primary" />}
        />
        <SensorInput 
          label="Motor Load" 
          value={motorLoad} 
          unit="%" 
          icon={<Activity className="w-3 h-3 text-primary" />}
        />
        <SensorInput 
          label="Temp" 
          value={temperature} 
          unit="°C" 
          icon={<Activity className="w-3 h-3 text-primary" />}
        />
      </div>

      {/* Summary Badges */}
      <div className="flex flex-wrap gap-1">
        {criticalComponents > 0 && (
          <Badge variant="destructive" className="text-[9px]">
            {criticalComponents} Critical
          </Badge>
        )}
        <Badge variant="outline" className="text-[9px]">
          {availableTechnicians}/{technicians.length} Techs
        </Badge>
        {lowStockSpares > 0 && (
          <Badge variant="secondary" className="text-[9px]">
            {lowStockSpares} Low Stock
          </Badge>
        )}
        <Badge variant="outline" className="text-[9px]">
          {activeWorkOrders} WOs
        </Badge>
        {pendingPOs > 0 && (
          <Badge variant="secondary" className="text-[9px]">
            {pendingPOs} POs
          </Badge>
        )}
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="health" className="flex-1 flex flex-col min-h-0">
        <TabsList className="grid grid-cols-5 h-7">
          <TabsTrigger value="health" className="text-[10px] px-1">
            <Wrench className="w-3 h-3" />
          </TabsTrigger>
          <TabsTrigger value="workorders" className="text-[10px] px-1">
            <ClipboardList className="w-3 h-3" />
          </TabsTrigger>
          <TabsTrigger value="resources" className="text-[10px] px-1">
            <User className="w-3 h-3" />
          </TabsTrigger>
          <TabsTrigger value="spares" className="text-[10px] px-1">
            <Package className="w-3 h-3" />
          </TabsTrigger>
          <TabsTrigger value="logs" className="text-[10px] px-1">
            <FileText className="w-3 h-3" />
          </TabsTrigger>
        </TabsList>

        {/* Health Tab */}
        <TabsContent value="health" className="flex-1 min-h-0 mt-2">
          <ScrollArea className="h-full">
            <div className="space-y-3 pr-2">
              {/* Component Health Grid */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Wrench className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">RUL Prediction</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
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

              {/* Anomaly Detection */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  <span className="text-xs text-muted-foreground">Anomalies</span>
                  <Badge variant="outline" className="text-[10px] ml-auto">
                    {anomalies.length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {anomalies.length === 0 ? (
                    <div className="text-xs text-muted-foreground text-center py-2">
                      No anomalies detected
                    </div>
                  ) : (
                    anomalies.slice(0, 3).map((anomaly) => (
                      <AnomalyItem key={anomaly.id} anomaly={anomaly} />
                    ))
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Work Orders Tab */}
        <TabsContent value="workorders" className="flex-1 min-h-0 mt-2">
          <ScrollArea className="h-full">
            <div className="space-y-2 pr-2">
              {workOrders.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-4">
                  No active work orders
                </div>
              ) : (
                workOrders.slice(0, 5).map(wo => (
                  <WorkOrderCard key={wo.id} workOrder={wo} />
                ))
              )}
              
              {purchaseOrders.length > 0 && (
                <>
                  <div className="flex items-center gap-2 mt-3 mb-2">
                    <ShoppingCart className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Purchase Orders</span>
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
        <TabsContent value="resources" className="flex-1 min-h-0 mt-2">
          <ScrollArea className="h-full">
            <div className="space-y-2 pr-2">
              <div className="text-xs text-muted-foreground mb-2">Technician Availability</div>
              {technicians.map(tech => (
                <TechnicianCard key={tech.id} technician={tech} />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Spares Tab */}
        <TabsContent value="spares" className="flex-1 min-h-0 mt-2">
          <ScrollArea className="h-full">
            <div className="space-y-2 pr-2">
              <div className="text-xs text-muted-foreground mb-2">Spare Parts Inventory</div>
              {spares.map(spare => (
                <SparePartCard key={spare.id} spare={spare} />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="flex-1 min-h-0 mt-2">
          <ScrollArea className="h-full">
            <div className="space-y-2 pr-2">
              {maintenanceLogs.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-4">
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
      <div className="bg-muted/30 rounded-lg p-2">
        <div className="text-[10px] text-muted-foreground mb-1">AI Decision Engine</div>
        <div className="text-xs">
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
