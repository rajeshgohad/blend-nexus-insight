import { useState, useCallback, useEffect, useRef } from 'react';
import { formatDateTimeShort } from '@/lib/dateFormat';
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
  Anomaly,
} from '@/types/manufacturing';

// Import AI Agent from backend
import { 
  analyzeComponent as aiAnalyzeComponent,
  findIdleWindow as aiFindIdleWindow,
  type ComponentHealthInput,
  type ScheduledBatchInput,
} from '@/backend/agents';

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
  { id: 'sp-004', name: 'Vibration Damper Pads', partNumber: 'VIB-DP-100', quantity: 0, minStock: 4, leadTimeDays: 3, vendor: 'Lord Corp', unitCost: 75 },
  { id: 'sp-005', name: 'Gearbox Oil Filter', partNumber: 'FLT-GB-050', quantity: 3, minStock: 2, leadTimeDays: 2, vendor: 'Fluitek', unitCost: 95 },
  { id: 'sp-006', name: 'Coupling Element', partNumber: 'CPL-VB500-002', quantity: 0, minStock: 1, leadTimeDays: 7, vendor: 'Rexnord', unitCost: 320 },
];

export function useMaintenanceWorkflow(components: ComponentHealth[], schedule: ScheduledBatch[], anomalies: Anomaly[] = []) {
  const [technicians, setTechnicians] = useState<Technician[]>(initialTechnicians);
  const [spares, setSpares] = useState<SparePart[]>(initialSpares);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [maintenanceDecisions, setMaintenanceDecisions] = useState<MaintenanceDecision[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
  const processedAnomalyIds = useRef<Set<string>>(new Set());
  const processedZeroStockIds = useRef<Set<string>>(new Set());
  const workOrderCountRef = useRef(0);

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

  // Use backend agent for idle window detection
  const findIdleWindow = useCallback((schedule: ScheduledBatch[], durationHours: number): { start: Date; end: Date } | null => {
    // Convert to backend agent input format
    const scheduleInput: ScheduledBatchInput[] = schedule.map(b => ({
      id: b.id,
      batchNumber: b.batchNumber,
      productName: b.productName,
      startTime: b.startTime,
      endTime: b.endTime,
      status: b.status,
    }));
    
    return aiFindIdleWindow(scheduleInput, durationHours);
  }, []);

  // Use backend AI agent for component analysis
  const analyzeComponent = useCallback((component: ComponentHealth): MaintenanceDecision => {
    // Convert to backend agent input format
    const componentInput: ComponentHealthInput = {
      name: component.name,
      health: component.health,
      rul: component.rul,
      trend: component.trend,
      failureProbability: component.failureProbability,
      lastMaintenance: component.lastMaintenance,
      predictedFailureDate: component.predictedFailureDate,
    };
    
    const scheduleInput: ScheduledBatchInput[] = schedule.map(b => ({
      id: b.id,
      batchNumber: b.batchNumber,
      productName: b.productName,
      startTime: b.startTime,
      endTime: b.endTime,
      status: b.status,
    }));
    
    // Call backend AI agent
    const decision = aiAnalyzeComponent(componentInput, scheduleInput);
    
    return {
      componentName: decision.componentName,
      requiresMaintenance: decision.requiresMaintenance,
      maintenanceType: decision.maintenanceType,
      reasoning: decision.reasoning,
      suggestedTime: decision.suggestedTime,
      machineIdleWindow: decision.machineIdleWindow,
    };
  }, [schedule]);

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
    // Map component names AND anomaly sources to spare parts
    const spareMap: Record<string, string[]> = {
      'Main Bearings': ['Main Bearing Set'],
      'Seal Assembly': ['Seal Kit Assembly'],
      'Drive Motor': ['Drive Motor Brushes'],
      'Vibration Dampers': ['Vibration Damper Pads'],
      'Gear Box': ['Gearbox Oil Filter', 'Coupling Element'],
      // Anomaly sources mapping
      'Bearing Noise': ['Main Bearing Set'],
      'Vibration Pattern': ['Vibration Damper Pads'],
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
      message: `Work Order ${workOrder.id}: ${workOrder.component} requires ${workOrder.type === 'general' ? 'general maintenance' : 'spare replacement'}. Scheduled: ${workOrder.scheduledTime ? formatDateTimeShort(workOrder.scheduledTime) : 'TBD'}`,
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

  // Create work order from high severity anomaly with associated spare parts
  const createWorkOrderFromAnomaly = useCallback((anomaly: Anomaly) => {
    const skillRequired = 'senior';
    const estimatedDuration = 2;
    const idleWindow = findIdleWindow(schedule, estimatedDuration);
    
    // Get spare parts required for this anomaly source
    const sparesRequired = getRequiredSpares(anomaly.source);
    const sparesAvailable = sparesRequired.every(sr => sr.part.quantity >= sr.quantity);
    
    // Only assign technician if spares are available
    const technician = sparesAvailable ? technicians.find(t => t.available) : null;
    
    const status: WorkOrder['status'] = sparesAvailable 
      ? (technician ? 'scheduled' : 'pending')
      : 'waiting-spares';

    const workOrder: WorkOrder = {
      id: `WO-${Date.now().toString(36).toUpperCase()}`,
      component: anomaly.source,
      type: 'spare_replacement',
      status,
      priority: 'high',
      assignedTechnician: technician || null,
      scheduledTime: sparesAvailable ? (idleWindow?.start || null) : null,
      sparesRequired,
      estimatedDuration,
      createdAt: new Date(),
      instructions: `HIGH PRIORITY: ${anomaly.description}. Source: ${anomaly.source}. Replace affected spare parts.`,
      notificationsSent: [],
    };

    // Mark technician as busy
    if (technician) {
      setTechnicians(prev => prev.map(t => 
        t.id === technician.id 
          ? { ...t, available: false, currentTask: `WO: ${anomaly.source} - Anomaly`, nextAvailable: idleWindow?.end || null }
          : t
      ));
    }

    setWorkOrders(prev => {
      workOrderCountRef.current = prev.length + 1;
      return [workOrder, ...prev];
    });
    
    const spareInfo = sparesRequired.map(sr => `${sr.part.name} (Qty: ${sr.part.quantity})`).join(', ');
    addLog('Work Order Created (Anomaly)', `WO ${workOrder.id} for ${anomaly.source}. Spares: ${spareInfo || 'None'}. Status: ${status}`, 'AI System');

    // Create purchase order if spares not available
    if (!sparesAvailable && sparesRequired.length > 0) {
      sparesRequired.forEach(sr => {
        if (sr.part.quantity < sr.quantity) {
          const expectedDelivery = sr.part.name === 'Coupling Element'
            ? new Date(2026, 4, 6) // May 6, 2026
            : new Date(Date.now() + sr.part.leadTimeDays * 24 * 60 * 60 * 1000);
            
          const po: PurchaseOrder = {
            id: `PO-${Date.now().toString(36).toUpperCase()}-${sr.part.id}`,
            sparePart: sr.part,
            quantity: sr.quantity,
            vendor: sr.part.vendor,
            status: 'pending',
            createdAt: new Date(),
            expectedDelivery,
            workOrderId: workOrder.id,
          };
          setPurchaseOrders(prev => [po, ...prev]);
          addLog('Purchase Order Created', `PO ${po.id} for ${sr.part.name}. ETA: ${expectedDelivery.toLocaleDateString()}`, 'AI System');
        }
      });
    }

    // Send notifications
    sendNotifications(workOrder);

    return workOrder;
  }, [technicians, findIdleWindow, schedule, addLog, sendNotifications, getRequiredSpares]);

  // Auto-create purchase order for zero stock spares
  const createPurchaseOrderForZeroStock = useCallback((spare: SparePart) => {
    // Special case: Coupling Element has fixed ETA of 06-May-2026
    const expectedDelivery = spare.name === 'Coupling Element'
      ? new Date(2026, 4, 6) // May 6, 2026
      : new Date(Date.now() + spare.leadTimeDays * 24 * 60 * 60 * 1000);

    const po: PurchaseOrder = {
      id: `PO-${Date.now().toString(36).toUpperCase()}-${spare.id}`,
      sparePart: spare,
      quantity: spare.minStock + 2, // Order minStock + buffer
      vendor: spare.vendor,
      status: 'pending',
      createdAt: new Date(),
      expectedDelivery,
      workOrderId: 'AUTO-REPLENISH',
    };

    setPurchaseOrders(prev => [po, ...prev]);
    addLog('Purchase Order Created (Zero Stock)', `PO ${po.id} for ${spare.name} (Qty: ${po.quantity}) from ${spare.vendor}. Lead time: ${spare.leadTimeDays} days.`, 'AI System');

    return po;
  }, [addLog]);

  // Auto-analyze components when they change (decisions only, NO work orders)
  useEffect(() => {
    const criticalComponents = components.filter(c => c.health < 70 || c.trend === 'critical');
    criticalComponents.forEach(component => {
      const existingDecision = maintenanceDecisions.find(d => d.componentName === component.name);
      if (!existingDecision) {
        // Only create decision record, don't create work orders from component health
        const decision = analyzeComponent(component);
        setMaintenanceDecisions(prev => {
          const filtered = prev.filter(d => d.componentName !== component.name);
          return [decision, ...filtered];
        });
      }
    });
  }, [components, maintenanceDecisions, analyzeComponent]);

  // Auto-create work orders for HIGH anomalies - ONLY 2 max
  useEffect(() => {
    const highAnomalies = anomalies.filter(a => a.severity === 'high');
    highAnomalies.forEach(anomaly => {
      // Only create if we have less than 2 work orders and haven't processed this anomaly
      if (!processedAnomalyIds.current.has(anomaly.id) && workOrderCountRef.current < 2) {
        processedAnomalyIds.current.add(anomaly.id);
        createWorkOrderFromAnomaly(anomaly);
      }
    });
  }, [anomalies, createWorkOrderFromAnomaly]);

  // NOTE: Auto PO for zero stock disabled - POs only created when linked to work orders

  return {
    technicians,
    spares,
    workOrders,
    purchaseOrders,
    maintenanceDecisions,
    maintenanceLogs,
    processMaintenanceDecision,
    findIdleWindow,
    createWorkOrderFromAnomaly,
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
