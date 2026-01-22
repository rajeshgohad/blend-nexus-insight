import { useState, useCallback, useEffect } from 'react';
import type {
  ComponentHealth,
  Technician,
  SparePart,
  WorkOrder,
  PurchaseOrder,
  MaintenanceDecision,
  MaintenanceLog,
  NotificationRecord,
  ScheduledBatch,
} from '@/types/manufacturing';

const generateId = () => Math.random().toString(36).substr(2, 9);

const initialTechnicians: Technician[] = [
  { id: 'tech-001', name: 'Mike Rodriguez', skill: 'specialist', available: true, currentTask: null, nextAvailable: null },
  { id: 'tech-002', name: 'Sarah Chen', skill: 'senior', available: true, currentTask: null, nextAvailable: null },
  { id: 'tech-003', name: 'James Wilson', skill: 'junior', available: false, currentTask: 'Routine Inspection', nextAvailable: new Date(Date.now() + 2 * 60 * 60 * 1000) },
  { id: 'tech-004', name: 'Emma Thompson', skill: 'senior', available: true, currentTask: null, nextAvailable: null },
];

const initialSpares: SparePart[] = [
  { id: 'sp-001', name: 'Main Bearing Set', partNumber: 'BRG-VB500-001', quantity: 2, minStock: 1, leadTimeDays: 5, vendor: 'SKF Industries', unitCost: 450 },
  { id: 'sp-002', name: 'Seal Kit Assembly', partNumber: 'SEL-VB500-003', quantity: 4, minStock: 2, leadTimeDays: 3, vendor: 'Parker Hannifin', unitCost: 180 },
  { id: 'sp-003', name: 'Drive Motor Brushes', partNumber: 'MOT-BR-220', quantity: 6, minStock: 4, leadTimeDays: 2, vendor: 'Siemens AG', unitCost: 45 },
  { id: 'sp-004', name: 'Vibration Damper Pads', partNumber: 'VIB-DP-100', quantity: 8, minStock: 4, leadTimeDays: 1, vendor: 'Lord Corp', unitCost: 75 },
  { id: 'sp-005', name: 'Gearbox Oil Filter', partNumber: 'FLT-GB-050', quantity: 3, minStock: 2, leadTimeDays: 2, vendor: 'Fluitek', unitCost: 95 },
  { id: 'sp-006', name: 'Coupling Element', partNumber: 'CPL-VB500-002', quantity: 0, minStock: 1, leadTimeDays: 7, vendor: 'Rexnord', unitCost: 320 },
];

export function useMaintenanceWorkflow(components: ComponentHealth[], schedule: ScheduledBatch[]) {
  const [technicians, setTechnicians] = useState<Technician[]>(initialTechnicians);
  const [spares, setSpares] = useState<SparePart[]>(initialSpares);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [maintenanceDecisions, setMaintenanceDecisions] = useState<MaintenanceDecision[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);

  const addLog = useCallback((action: string, details: string, actor: string = 'AI System') => {
    const log: MaintenanceLog = {
      id: generateId(),
      timestamp: new Date(),
      action,
      details,
      actor,
    };
    setMaintenanceLogs(prev => [log, ...prev].slice(0, 100));
  }, []);

  const findIdleWindow = useCallback((schedule: ScheduledBatch[], durationHours: number): { start: Date; end: Date } | null => {
    const now = new Date();
    const futureSchedule = schedule
      .filter(b => b.endTime > now)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    // Check for gap before first batch
    if (futureSchedule.length === 0) {
      return { start: now, end: new Date(now.getTime() + durationHours * 60 * 60 * 1000) };
    }

    const firstBatch = futureSchedule[0];
    const gapBeforeFirst = (firstBatch.startTime.getTime() - now.getTime()) / (60 * 60 * 1000);
    if (gapBeforeFirst >= durationHours) {
      return { start: now, end: new Date(now.getTime() + durationHours * 60 * 60 * 1000) };
    }

    // Check gaps between batches
    for (let i = 0; i < futureSchedule.length - 1; i++) {
      const gapStart = futureSchedule[i].endTime;
      const gapEnd = futureSchedule[i + 1].startTime;
      const gapHours = (gapEnd.getTime() - gapStart.getTime()) / (60 * 60 * 1000);
      if (gapHours >= durationHours) {
        return { start: gapStart, end: new Date(gapStart.getTime() + durationHours * 60 * 60 * 1000) };
      }
    }

    // After last batch
    const lastBatch = futureSchedule[futureSchedule.length - 1];
    return { start: lastBatch.endTime, end: new Date(lastBatch.endTime.getTime() + durationHours * 60 * 60 * 1000) };
  }, []);

  const analyzeComponent = useCallback((component: ComponentHealth): MaintenanceDecision => {
    const requiresMaintenance = component.health < 70 || component.rul < 500 || component.trend === 'critical';
    
    let maintenanceType: 'general' | 'spare_replacement' | null = null;
    let reasoning = '';

    if (!requiresMaintenance) {
      reasoning = `Component health at ${component.health.toFixed(0)}% with RUL of ${component.rul}h. No maintenance required.`;
    } else if (component.health < 50 || component.trend === 'critical') {
      maintenanceType = 'spare_replacement';
      reasoning = `Critical condition detected. Health: ${component.health.toFixed(0)}%, Trend: ${component.trend}. Spare replacement required.`;
    } else {
      maintenanceType = 'general';
      reasoning = `Preventive maintenance recommended. Health: ${component.health.toFixed(0)}%, RUL: ${component.rul}h. General maintenance sufficient.`;
    }

    const estimatedDuration = maintenanceType === 'spare_replacement' ? 4 : 2;
    const idleWindow = findIdleWindow(schedule, estimatedDuration);

    return {
      componentName: component.name,
      requiresMaintenance,
      maintenanceType,
      reasoning,
      suggestedTime: idleWindow?.start || null,
      machineIdleWindow: idleWindow,
    };
  }, [schedule, findIdleWindow]);

  const findAvailableTechnician = useCallback((skillRequired: 'junior' | 'senior' | 'specialist'): Technician | null => {
    const skillOrder = ['specialist', 'senior', 'junior'];
    const minSkillIndex = skillOrder.indexOf(skillRequired);
    
    for (let i = minSkillIndex; i >= 0; i--) {
      const tech = technicians.find(t => t.available && t.skill === skillOrder[i]);
      if (tech) return tech;
    }
    
    // Fallback to any available
    return technicians.find(t => t.available) || null;
  }, [technicians]);

  const getRequiredSpares = useCallback((componentName: string): { part: SparePart; quantity: number }[] => {
    const spareMap: Record<string, string[]> = {
      'Main Bearings': ['Main Bearing Set'],
      'Seal Assembly': ['Seal Kit Assembly'],
      'Drive Motor': ['Drive Motor Brushes'],
      'Vibration Dampers': ['Vibration Damper Pads'],
      'Gear Box': ['Gearbox Oil Filter', 'Coupling Element'],
    };

    const requiredNames = spareMap[componentName] || [];
    return requiredNames.map(name => {
      const part = spares.find(s => s.name === name);
      return part ? { part, quantity: 1 } : null;
    }).filter(Boolean) as { part: SparePart; quantity: number }[];
  }, [spares]);

  const createWorkOrder = useCallback((decision: MaintenanceDecision): WorkOrder | null => {
    if (!decision.requiresMaintenance || !decision.maintenanceType) return null;

    const sparesRequired = decision.maintenanceType === 'spare_replacement' 
      ? getRequiredSpares(decision.componentName)
      : [];

    const sparesAvailable = sparesRequired.every(sr => sr.part.quantity >= sr.quantity);
    const skillRequired = decision.maintenanceType === 'spare_replacement' ? 'senior' : 'junior';
    const technician = sparesAvailable ? findAvailableTechnician(skillRequired) : null;

    const status: WorkOrder['status'] = sparesAvailable 
      ? (technician ? 'scheduled' : 'pending')
      : 'waiting-spares';

    const workOrder: WorkOrder = {
      id: `WO-${Date.now().toString(36).toUpperCase()}`,
      component: decision.componentName,
      type: decision.maintenanceType,
      status,
      priority: decision.maintenanceType === 'spare_replacement' ? 'high' : 'medium',
      assignedTechnician: technician,
      scheduledTime: decision.suggestedTime,
      sparesRequired,
      estimatedDuration: decision.maintenanceType === 'spare_replacement' ? 4 : 2,
      createdAt: new Date(),
      instructions: generateInstructions(decision.componentName, decision.maintenanceType),
      notificationsSent: [],
    };

    // If technician assigned, mark them as busy
    if (technician) {
      setTechnicians(prev => prev.map(t => 
        t.id === technician.id 
          ? { ...t, available: false, currentTask: `WO: ${decision.componentName}`, nextAvailable: decision.suggestedTime ? new Date(decision.suggestedTime.getTime() + workOrder.estimatedDuration * 60 * 60 * 1000) : null }
          : t
      ));
    }

    setWorkOrders(prev => [workOrder, ...prev]);
    addLog('Work Order Created', `WO ${workOrder.id} for ${decision.componentName}. Type: ${decision.maintenanceType}, Status: ${status}`, 'AI System');

    return workOrder;
  }, [getRequiredSpares, findAvailableTechnician, addLog]);

  const createPurchaseOrder = useCallback((workOrder: WorkOrder): PurchaseOrder[] => {
    const orders: PurchaseOrder[] = [];
    
    for (const sr of workOrder.sparesRequired) {
      if (sr.part.quantity < sr.quantity) {
        const po: PurchaseOrder = {
          id: `PO-${Date.now().toString(36).toUpperCase()}-${sr.part.id}`,
          sparePart: sr.part,
          quantity: sr.quantity - sr.part.quantity + sr.part.minStock,
          vendor: sr.part.vendor,
          status: 'pending',
          createdAt: new Date(),
          expectedDelivery: new Date(Date.now() + sr.part.leadTimeDays * 24 * 60 * 60 * 1000),
          workOrderId: workOrder.id,
        };
        orders.push(po);
        addLog('Purchase Order Created', `PO ${po.id} for ${sr.part.name} (Qty: ${po.quantity}) from ${po.vendor}`, 'AI System');
      }
    }

    setPurchaseOrders(prev => [...orders, ...prev]);
    return orders;
  }, [addLog]);

  const sendNotifications = useCallback((workOrder: WorkOrder): NotificationRecord[] => {
    const notifications: NotificationRecord[] = [];
    
    // Maintenance Team
    notifications.push({
      id: generateId(),
      recipient: 'maintenance_team',
      message: `Work Order ${workOrder.id}: ${workOrder.component} requires ${workOrder.type === 'general' ? 'general maintenance' : 'spare replacement'}. Scheduled: ${workOrder.scheduledTime?.toLocaleString() || 'TBD'}`,
      sentAt: new Date(),
      acknowledged: false,
    });

    // Production Supervisor
    notifications.push({
      id: generateId(),
      recipient: 'production_supervisor',
      message: `Maintenance window required: ${workOrder.estimatedDuration}h for ${workOrder.component}. Equipment will be offline.`,
      sentAt: new Date(),
      acknowledged: false,
    });

    // Operator
    if (workOrder.assignedTechnician) {
      notifications.push({
        id: generateId(),
        recipient: 'operator',
        message: `Technician ${workOrder.assignedTechnician.name} assigned to ${workOrder.component}. Instructions: ${workOrder.instructions.substring(0, 100)}...`,
        sentAt: new Date(),
        acknowledged: false,
      });
    }

    // Stores (if spares needed)
    if (workOrder.sparesRequired.length > 0) {
      notifications.push({
        id: generateId(),
        recipient: 'stores',
        message: `Reserve spares for WO ${workOrder.id}: ${workOrder.sparesRequired.map(s => s.part.name).join(', ')}`,
        sentAt: new Date(),
        acknowledged: false,
      });
    }

    setWorkOrders(prev => prev.map(wo => 
      wo.id === workOrder.id 
        ? { ...wo, notificationsSent: [...wo.notificationsSent, ...notifications] }
        : wo
    ));

    notifications.forEach(n => {
      addLog('Notification Sent', `To: ${n.recipient} - ${n.message.substring(0, 50)}...`, 'AI System');
    });

    return notifications;
  }, [addLog]);

  const processMaintenanceDecision = useCallback((component: ComponentHealth) => {
    const decision = analyzeComponent(component);
    setMaintenanceDecisions(prev => {
      const filtered = prev.filter(d => d.componentName !== component.name);
      return [decision, ...filtered];
    });

    if (decision.requiresMaintenance) {
      const workOrder = createWorkOrder(decision);
      if (workOrder) {
        if (workOrder.status === 'waiting-spares') {
          createPurchaseOrder(workOrder);
        }
        sendNotifications(workOrder);
      }
    }

    return decision;
  }, [analyzeComponent, createWorkOrder, createPurchaseOrder, sendNotifications]);

  // Auto-analyze components when they change
  useEffect(() => {
    const criticalComponents = components.filter(c => c.health < 70 || c.trend === 'critical');
    criticalComponents.forEach(component => {
      const existingDecision = maintenanceDecisions.find(d => d.componentName === component.name);
      if (!existingDecision) {
        processMaintenanceDecision(component);
      }
    });
  }, [components, maintenanceDecisions, processMaintenanceDecision]);

  return {
    technicians,
    spares,
    workOrders,
    purchaseOrders,
    maintenanceDecisions,
    maintenanceLogs,
    processMaintenanceDecision,
    findIdleWindow,
  };
}

function generateInstructions(componentName: string, type: 'general' | 'spare_replacement'): string {
  const instructions: Record<string, { general: string; spare_replacement: string }> = {
    'Main Bearings': {
      general: '1. Lock out/tag out equipment\n2. Remove bearing housing cover\n3. Inspect bearings for wear\n4. Re-grease with approved lubricant\n5. Reassemble and test rotation',
      spare_replacement: '1. Lock out/tag out equipment\n2. Remove bearing housing\n3. Extract worn bearings using puller\n4. Clean housing thoroughly\n5. Install new bearing set\n6. Apply correct preload\n7. Test and verify',
    },
    'Seal Assembly': {
      general: '1. Inspect seals for cracks/wear\n2. Clean seal surfaces\n3. Apply silicone grease\n4. Check alignment',
      spare_replacement: '1. Remove old seal assembly\n2. Clean mating surfaces\n3. Install new seal kit\n4. Torque to specification\n5. Leak test',
    },
    'Drive Motor': {
      general: '1. Check brush wear\n2. Clean commutator\n3. Verify connections\n4. Test insulation resistance',
      spare_replacement: '1. Disconnect power\n2. Remove brush holders\n3. Install new brushes\n4. Bed in brushes\n5. Test motor current',
    },
    'Vibration Dampers': {
      general: '1. Visual inspection\n2. Check mounting bolts\n3. Clean damper surfaces',
      spare_replacement: '1. Support equipment\n2. Remove old dampers\n3. Install new pads\n4. Torque bolts\n5. Check alignment',
    },
    'Gear Box': {
      general: '1. Check oil level\n2. Replace filter\n3. Inspect for leaks\n4. Listen for unusual noise',
      spare_replacement: '1. Drain oil\n2. Remove filter housing\n3. Install new filter\n4. Replace coupling if worn\n5. Refill with approved oil\n6. Run-in period',
    },
  };

  return instructions[componentName]?.[type] || 'Refer to equipment manual for detailed instructions.';
}
