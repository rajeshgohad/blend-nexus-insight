import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  BlenderParameters,
  BatchInfo,
  ComponentHealth,
  MaintenanceEvent,
  Anomaly,
  YieldData,
  ParameterRecommendation,
  QualityDetection,
  ScheduledBatch,
  Resource,
  Alert,
  SimulationState,
  Recipe,
  BlendingSequenceItem,
  ParameterHistoryPoint,
} from '@/types/manufacturing';

const generateId = () => Math.random().toString(36).substr(2, 9);

const addNoise = (value: number, variance: number) => {
  return value + (Math.random() - 0.5) * 2 * variance;
};

const availableRecipes: Recipe[] = [
  {
    id: 'RCP-001',
    name: 'Cardivex 500mg Standard',
    productId: 'PRD-CDX-500',
    ingredients: [
      { ingredient: 'Cardivex Base', quantity: 250, unit: 'kg', added: false },
      { ingredient: 'Cellulose Binder MCC', quantity: 150, unit: 'kg', added: false },
      { ingredient: 'Binding Agent PV-30', quantity: 50, unit: 'kg', added: false },
      { ingredient: 'Lubricant MgSt', quantity: 25, unit: 'kg', added: false },
      { ingredient: 'Flow Aid SiO2', quantity: 25, unit: 'kg', added: false },
    ],
  },
  {
    id: 'RCP-002',
    name: 'Renopril 10mg Tablet',
    productId: 'PRD-RNP-010',
    ingredients: [
      { ingredient: 'Renopril Compound', quantity: 50, unit: 'kg', added: false },
      { ingredient: 'Calcium Filler DCP', quantity: 200, unit: 'kg', added: false },
      { ingredient: 'Sugar Alcohol MTL', quantity: 100, unit: 'kg', added: false },
      { ingredient: 'Lubricant MgSt', quantity: 15, unit: 'kg', added: false },
    ],
  },
  {
    id: 'RCP-003',
    name: 'Gastrozol 20mg Capsule',
    productId: 'PRD-GZL-020',
    ingredients: [
      { ingredient: 'Gastrozol Active', quantity: 100, unit: 'kg', added: false },
      { ingredient: 'Lactose Filler LMH', quantity: 180, unit: 'kg', added: false },
      { ingredient: 'Surfactant SLS', quantity: 20, unit: 'kg', added: false },
      { ingredient: 'Coating Polymer HPMC', quantity: 50, unit: 'kg', added: false },
    ],
  },
];

const createInitialBlendingSequence = (): BlendingSequenceItem[] => [
  { step: 'start-delay', label: 'Start Delay', setPointMinutes: 2, actualMinutes: 0, status: 'pending' },
  { step: 'charging', label: 'Charging', setPointMinutes: 5, actualMinutes: 0, status: 'pending' },
  { step: 'pre-blend', label: 'Pre-Blend', setPointMinutes: 8, actualMinutes: 0, status: 'pending' },
  { step: 'main-blend', label: 'Main Blend', setPointMinutes: 10, actualMinutes: 0, status: 'pending' },
  { step: 'lube-pause', label: 'Lube Pause', setPointMinutes: 2, actualMinutes: 0, status: 'pending' },
  { step: 'lube-blend', label: 'Lube Blend', setPointMinutes: 3, actualMinutes: 0, status: 'pending' },
  { step: 'discharge', label: 'Discharge', setPointMinutes: 5, actualMinutes: 0, status: 'pending' },
];

const initialBatch: BatchInfo = {
  id: generateId(),
  productName: 'Cardivex HCl 500mg',
  productId: 'PRD-CDX-500',
  batchNumber: 'BN-2024-0847',
  startTime: null,
  endTime: null,
  targetQuantity: 500,
  recipe: availableRecipes[0].ingredients.map(i => ({ ...i })),
  recipeId: 'RCP-001',
  recipeName: 'Cardivex 500mg Standard',
  state: 'idle',
  operator: { id: 'OP-001', name: 'John Smith' },
  blendingSequence: createInitialBlendingSequence(),
};

const initialComponents: ComponentHealth[] = [
  { name: 'Drive Motor', health: 92, rul: 2400, trend: 'stable', lastMaintenance: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), failureProbability: 0.03, predictedFailureDate: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000) },
  { name: 'Main Bearings', health: 85, rul: 1800, trend: 'declining', lastMaintenance: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), failureProbability: 0.12, predictedFailureDate: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000) },
  { name: 'Seal Assembly', health: 78, rul: 1200, trend: 'declining', lastMaintenance: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), failureProbability: 0.18, predictedFailureDate: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000) },
  { name: 'Gear Box', health: 95, rul: 3600, trend: 'stable', lastMaintenance: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), failureProbability: 0.02, predictedFailureDate: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000) },
  { name: 'Vibration Dampers', health: 88, rul: 2000, trend: 'stable', lastMaintenance: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), failureProbability: 0.08, predictedFailureDate: new Date(Date.now() + 83 * 24 * 60 * 60 * 1000) },
];

const initialSchedule: ScheduledBatch[] = [
  { id: '1', batchNumber: 'BN-2024-0847', productName: 'Cardivex HCl 500mg', startTime: new Date(), endTime: new Date(Date.now() + 2 * 60 * 60 * 1000), status: 'in-progress', priority: 1 },
  { id: '2', batchNumber: 'BN-2024-0848', productName: 'Renopril 10mg', startTime: new Date(Date.now() + 2.5 * 60 * 60 * 1000), endTime: new Date(Date.now() + 4.5 * 60 * 60 * 1000), status: 'queued', priority: 2 },
  { id: '3', batchNumber: 'BN-2024-0849', productName: 'Gastrozol 20mg', startTime: new Date(Date.now() + 5 * 60 * 60 * 1000), endTime: new Date(Date.now() + 7 * 60 * 60 * 1000), status: 'queued', priority: 3 },
  { id: '4', batchNumber: 'BN-2024-0850', productName: 'Pressovex 5mg', startTime: new Date(Date.now() + 7.5 * 60 * 60 * 1000), endTime: new Date(Date.now() + 9.5 * 60 * 60 * 1000), status: 'queued', priority: 4 },
  { id: '5', batchNumber: 'BN-2024-0851', productName: 'Lipovex 20mg', startTime: new Date(Date.now() + 10 * 60 * 60 * 1000), endTime: new Date(Date.now() + 12 * 60 * 60 * 1000), status: 'queued', priority: 5 },
];

const initialResources: Resource[] = [
  { id: '1', name: 'V-Blender VB-500', type: 'equipment', available: true },
  { id: '2', name: 'Operator: J. Smith', type: 'operator', available: true },
  { id: '3', name: 'Operator: M. Johnson', type: 'operator', available: false, nextAvailable: new Date(Date.now() + 4 * 60 * 60 * 1000) },
  { id: '4', name: 'Blending Room B-102', type: 'room', available: true },
  { id: '5', name: 'Cardivex HCl API', type: 'material', available: true },
];

export function useSimulation() {
  const [simulation, setSimulation] = useState<SimulationState>({
    speed: 150,
    isPaused: true,
    currentTime: new Date(),
    elapsedSeconds: 0,
  });

  const [parameters, setParameters] = useState<BlenderParameters>({
    rotationSpeed: 0,
    blendTime: 0,
    motorLoad: 45,
    temperature: 22,
    vibration: 0.3,
    blendUniformity: 0,
  });

  const [batch, setBatch] = useState<BatchInfo>(initialBatch);
  const [components, setComponents] = useState<ComponentHealth[]>(initialComponents);
  const [maintenanceEvents, setMaintenanceEvents] = useState<MaintenanceEvent[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [yieldHistory, setYieldHistory] = useState<YieldData[]>([]);
  const [recommendations, setRecommendations] = useState<ParameterRecommendation[]>([]);
  const [detections, setDetections] = useState<QualityDetection[]>([]);
  const [schedule, setSchedule] = useState<ScheduledBatch[]>(initialSchedule);
  const [resources, setResources] = useState<Resource[]>(initialResources);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [rftPercentage, setRftPercentage] = useState(96.8);
  const [learningProgress, setLearningProgress] = useState({ episodes: 1247, reward: 0.87 });
  const [parameterHistory, setParameterHistory] = useState<ParameterHistoryPoint[]>([]);
  const [equipmentFailures, setEquipmentFailures] = useState<{ lineId: string; processId: string; processName: string; timestamp: Date }[]>([]);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const batchCountRef = useRef(0); // Track which batch we're on (0 = not started, 1 = first, 2 = second)
  const tabletPressStartRef = useRef<number | null>(null); // Real timestamp when tablet press became active

  const addAlert = useCallback((source: string, type: Alert['type'], message: string) => {
    const newAlert: Alert = {
      id: generateId(),
      timestamp: new Date(),
      source,
      type,
      message,
      acknowledged: false,
    };
    // Cap alerts at 7 to avoid overwhelming the supervisor
    setAlerts(prev => [newAlert, ...prev].slice(0, 7));
  }, []);

  const startBatch = useCallback(() => {
    if (batchCountRef.current === 0) batchCountRef.current = 1;
    tabletPressStartRef.current = null;
    setBatch(prev => ({ 
      ...prev, 
      state: 'loading', 
      startTime: new Date(),
      endTime: null,
      blendingSequence: createInitialBlendingSequence(),
    }));
    setParameters(prev => ({ ...prev, blendTime: 0, blendUniformity: 0 }));
    addAlert('Digital Twin', 'info', `Batch ${batch.batchNumber} (${batchCountRef.current}/2) started - Loading materials`);
  }, [batch.batchNumber, addAlert]);

  const stopBatch = useCallback(() => {
    setBatch(prev => ({ ...prev, state: 'idle', endTime: new Date() }));
    setParameters(prev => ({ ...prev, rotationSpeed: 0, vibration: 0.3 }));
    addAlert('Digital Twin', 'info', 'Batch stopped');
  }, [addAlert]);

  const selectRecipe = useCallback((recipeId: string) => {
    const recipe = availableRecipes.find(r => r.id === recipeId);
    if (recipe) {
      setBatch(prev => ({
        ...prev,
        recipeId: recipe.id,
        recipeName: recipe.name,
        productId: recipe.productId,
        productName: recipe.name.split(' ').slice(0, -1).join(' '),
        recipe: recipe.ingredients.map(i => ({ ...i })),
      }));
      addAlert('Digital Twin', 'info', `Recipe changed to: ${recipe.name}`);
    }
  }, [addAlert]);

  const suspendBatch = useCallback(() => {
    setBatch(prev => ({ ...prev, state: 'idle' }));
    setParameters(prev => ({ ...prev, rotationSpeed: 0 }));
    addAlert('Digital Twin', 'warning', 'Batch suspended');
  }, [addAlert]);

  const resumeBatch = useCallback(() => {
    setBatch(prev => ({ ...prev, state: 'blending' }));
    addAlert('Digital Twin', 'info', 'Batch resumed');
  }, [addAlert]);

  const emergencyStop = useCallback(() => {
    setBatch(prev => ({ ...prev, state: 'emergency-stop' }));
    setParameters(prev => ({ ...prev, rotationSpeed: 0, vibration: 0 }));
    addAlert('Digital Twin', 'critical', 'EMERGENCY STOP ACTIVATED');
  }, [addAlert]);

  const emergencyReset = useCallback(() => {
    setBatch(prev => ({ ...prev, state: 'idle' }));
    addAlert('Digital Twin', 'info', 'Emergency stop reset - System ready');
  }, [addAlert]);

  const setSpeed = useCallback((speed: number) => {
    setSimulation(prev => ({ ...prev, speed }));
  }, []);

  const togglePause = useCallback(() => {
    setSimulation(prev => {
      const wasPlaying = !prev.isPaused;
      // If we're about to start playing (currently paused -> will be unpaused)
      if (prev.isPaused) {
        // Auto-start batch if idle
        setBatch(currentBatch => {
          if (currentBatch.state === 'idle') {
            batchCountRef.current = 1;
            tabletPressStartRef.current = null;
            addAlert('Digital Twin', 'info', `Batch ${currentBatch.batchNumber} (1/2) started - Loading materials`);
            return { 
              ...currentBatch, 
              state: 'loading', 
              startTime: new Date(),
              endTime: null,
              blendingSequence: createInitialBlendingSequence(),
            };
          }
          return currentBatch;
        });
        setParameters(prev => ({ ...prev, blendTime: 0, blendUniformity: 0 }));
      }
      return { ...prev, isPaused: !prev.isPaused };
    });
  }, [addAlert]);

  const resetSimulation = useCallback(() => {
    setSimulation({ speed: 150, isPaused: true, currentTime: new Date(), elapsedSeconds: 0 });
    setParameters({ rotationSpeed: 0, blendTime: 0, motorLoad: 45, temperature: 22, vibration: 0.3, blendUniformity: 0 });
    setBatch(initialBatch);
    setComponents(initialComponents);
    setMaintenanceEvents([]);
    setAnomalies([]);
    setDetections([]);
    setAlerts([]);
    setSchedule(initialSchedule);
    setEquipmentFailures([]);
    batchCountRef.current = 0;
    tabletPressStartRef.current = null;
  }, []);

  const approveRecommendation = useCallback((parameter: string) => {
    setRecommendations(prev => prev.map(r => r.parameter === parameter ? { ...r, approved: true } : r));
    addAlert('Yield Optimization', 'success', `Parameter recommendation for ${parameter} approved`);
  }, [addAlert]);

  const injectScenario = useCallback((scenario: string) => {
    switch (scenario) {
      case 'equipment_failure':
        // Add equipment failure for Compression on Line 1 - batch diverts to Compression (Backup) after Blending
        const failure = {
          lineId: 'line-1',
          processId: 'l1-compression',
          processName: 'Compression',
          timestamp: new Date(),
        };
        setEquipmentFailures(prev => [...prev, failure]);
        setComponents(prev => prev.map(c => c.name === 'Main Bearings' ? { ...c, health: 35, trend: 'critical' as const } : c));
        addAlert('Process Line', 'critical', `Equipment Failure: Compression on Line 1 - Batch diverted to Compression (Backup) after Blending`);
        break;
      case 'material_delay':
        setResources(prev => prev.map(r => r.name === 'Cardivex HCl API' ? { ...r, available: false, nextAvailable: new Date(Date.now() + 2 * 60 * 60 * 1000) } : r));
        addAlert('Scheduling', 'warning', 'Material delivery delayed: Cardivex HCl API');
        break;
      case 'rush_order':
        const rushBatch: ScheduledBatch = {
          id: generateId(),
          batchNumber: 'BN-2024-RUSH',
          productName: 'Urgent: Neurolex Preparation',
          startTime: new Date(Date.now() + 1 * 60 * 60 * 1000),
          endTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
          status: 'queued',
          priority: 0,
        };
        setSchedule(prev => [rushBatch, ...prev]);
        addAlert('Scheduling', 'warning', 'Rush order inserted: Neurolex Preparation');
        break;
      case 'quality_defect':
        const defect: QualityDetection = {
          id: generateId(),
          type: 'contamination',
          severity: 'critical',
          location: 'Blending Chamber Zone A',
          timestamp: new Date(),
          recommendation: 'Halt production and perform full decontamination',
          status: 'detected',
        };
        setDetections(prev => [defect, ...prev]);
        addAlert('Quality Control', 'critical', 'Critical contamination detected in Blending Chamber');
        break;
    }
  }, [addAlert]);

  // Main simulation loop
  useEffect(() => {
    if (simulation.isPaused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      const deltaTime = simulation.speed;

      setSimulation(prev => ({
        ...prev,
        currentTime: new Date(),
        elapsedSeconds: prev.elapsedSeconds + deltaTime,
      }));

      // Update blender parameters based on batch state
      setBatch(prev => {
        if (prev.state === 'loading') {
          const updatedRecipe = prev.recipe.map((item, idx) => {
            if (!item.added && prev.recipe.slice(0, idx).every(i => i.added)) {
              // Scale probability for high speeds - ensure at least one item gets added per tick
              const addProbability = Math.min(0.1 * deltaTime, 1);
              if (Math.random() < addProbability) {
                return { ...item, added: true };
              }
            }
            return item;
          });

          if (updatedRecipe.every(i => i.added)) {
            addAlert('Digital Twin', 'success', 'All materials loaded - Starting blend cycle');
            return { ...prev, recipe: updatedRecipe, state: 'blending' };
          }
          return { ...prev, recipe: updatedRecipe };
        }
        
        // Update blending sequence when blending
        if (prev.state === 'blending') {
          const updatedSequence = [...prev.blendingSequence];
          let currentStepFound = false;
          
          for (let i = 0; i < updatedSequence.length; i++) {
            const step = updatedSequence[i];
            
            if (step.status === 'completed') {
              continue;
            }
            
            if (!currentStepFound) {
              currentStepFound = true;
              const newActual = step.actualMinutes + (deltaTime / 60);
              
              if (newActual >= step.setPointMinutes) {
                updatedSequence[i] = { ...step, actualMinutes: step.setPointMinutes, status: 'completed' };
                addAlert('Digital Twin', 'info', `Blending step "${step.label}" completed`);
                
                // Start next step if exists
                if (i + 1 < updatedSequence.length) {
                  updatedSequence[i + 1] = { ...updatedSequence[i + 1], status: 'in-progress' };
                }
              } else {
                updatedSequence[i] = { ...step, actualMinutes: newActual, status: 'in-progress' };
              }
            }
          }
          
          // Check if all steps completed
          if (updatedSequence.every(s => s.status === 'completed')) {
            addAlert('Digital Twin', 'success', 'Blending sequence completed - Batch ready for discharge');
            return { ...prev, blendingSequence: updatedSequence, state: 'complete', endTime: new Date() };
          }
          
          // Start first step if none started
          if (!updatedSequence.some(s => s.status === 'in-progress' || s.status === 'completed')) {
            updatedSequence[0] = { ...updatedSequence[0], status: 'in-progress' };
          }
          
          return { ...prev, blendingSequence: updatedSequence };
        }
        
        return prev;
      });

      // Tablet press auto-transition: after 30 real seconds of tablet press, start next batch
      setBatch(prev => {
        if (prev.state === 'complete') {
          // Start tracking tablet press time
          if (tabletPressStartRef.current === null) {
            tabletPressStartRef.current = Date.now();
          }
          
          const elapsed = (Date.now() - tabletPressStartRef.current) / 1000;
          
          if (elapsed >= 30 && batchCountRef.current < 2) {
            // Transition to batch 2
            batchCountRef.current = 2;
            tabletPressStartRef.current = null;
            const nextBatchNumber = 'BN-2024-0848';
            const nextRecipe = availableRecipes[1]; // Renopril 10mg
            addAlert('Digital Twin', 'success', `Batch 1 tablet press complete. Starting Batch 2 (${nextBatchNumber})`);
            setParameters(p => ({ ...p, blendTime: 0, blendUniformity: 0, rotationSpeed: 0 }));
            return {
              ...prev,
              id: generateId(),
              batchNumber: nextBatchNumber,
              productName: 'Renopril 10mg',
              productId: nextRecipe.productId,
              recipeId: nextRecipe.id,
              recipeName: nextRecipe.name,
              recipe: nextRecipe.ingredients.map(i => ({ ...i })),
              state: 'loading' as const,
              startTime: new Date(),
              endTime: null,
              blendingSequence: createInitialBlendingSequence(),
            };
          }
          
          if (elapsed >= 30 && batchCountRef.current >= 2) {
            // Batch 2 tablet press done — simulation complete
            if (tabletPressStartRef.current !== null) {
              tabletPressStartRef.current = null;
              addAlert('Digital Twin', 'success', 'All 2 batches completed successfully');
              setSimulation(s => ({ ...s, isPaused: true }));
              // Reset blending sequence so it doesn't show "Done" from previous batch
              return { ...prev, blendingSequence: createInitialBlendingSequence() };
            }
          }
        }
        return prev;
      });

      setParameters(prev => {
        // When batch is complete (tablet press running), freeze blending parameters at last known values
        if (batch.state === 'complete') {
          return prev;
        }
        
        if (batch.state === 'blending' || batch.state === 'loading') {
          const newBlendTime = Math.min(prev.blendTime + (deltaTime / 60), 30);
          const targetUniformity = 85 + (newBlendTime / 30) * 15;
          const newUniformity = Math.min(addNoise(targetUniformity, 2), 100);

          return {
            rotationSpeed: addNoise(18, 1),
            blendTime: newBlendTime,
            motorLoad: addNoise(65, 5),
            temperature: addNoise(23, 0.5),
            vibration: addNoise(1.2, 0.3),
            blendUniformity: newUniformity,
          };
        } else if (batch.state === 'idle' || batch.state === 'emergency-stop') {
          return { ...prev, rotationSpeed: 0, vibration: addNoise(0.3, 0.1) };
        }
        return prev;
      });

      // Update component health
      setComponents(prev => prev.map(c => ({
        ...c,
        health: Math.max(0, c.health - (Math.random() * 0.01 * deltaTime)),
        rul: Math.max(0, c.rul - deltaTime),
      })));

      // Random anomaly detection - ONLY 2 anomalies: Bearing Noise and Vibration Pattern
      setAnomalies(prev => {
        if (prev.length >= 2) return prev; // Max 2 anomalies
        
        if (Math.random() < 0.02 * deltaTime) {
          // Alternate between the two specific anomaly types
          const hasBearingNoise = prev.some(a => a.source === 'Bearing Noise');
          const hasVibrationPattern = prev.some(a => a.source === 'Vibration Pattern');
          
          let source: string;
          let description: string;
          
          if (!hasBearingNoise) {
            source = 'Bearing Noise';
            description = 'Abnormal bearing noise detected - requires inspection';
          } else if (!hasVibrationPattern) {
            source = 'Vibration Pattern';
            description = 'Excessive vibration detected - dampers may need replacement';
          } else {
            return prev; // Both anomalies already exist
          }
          
          const anomaly: Anomaly = {
            id: generateId(),
            timestamp: new Date(),
            source,
            severity: 'high', // Always high to trigger work orders
            description,
            acknowledged: false,
          };
          
          addAlert('Predictive Maintenance', 'critical', `Anomaly: ${anomaly.source} - ${anomaly.description}`);
          return [anomaly, ...prev];
        }
        return prev;
      });

      // Random CV detection
      if (Math.random() < 0.015 * deltaTime) {
        const types: QualityDetection['type'][] = ['ppe_violation', 'surface_damage', 'leak', 'contamination', 'safety_hazard'];
        const locations = ['Zone A - Entry', 'Zone B - Processing', 'Zone C - Exit', 'Ceiling Panel 4', 'Floor Section 2'];
        const detection: QualityDetection = {
          id: generateId(),
          type: types[Math.floor(Math.random() * types.length)],
          severity: Math.random() < 0.2 ? 'critical' : Math.random() < 0.5 ? 'moderate' : 'minor',
          location: locations[Math.floor(Math.random() * locations.length)],
          timestamp: new Date(),
          recommendation: 'Review camera footage and take corrective action',
          status: 'detected',
        };
        setDetections(prev => [detection, ...prev].slice(0, 15));
        addAlert('Computer Vision', detection.severity === 'critical' ? 'critical' : 'warning', `${detection.type.replace('_', ' ')} detected at ${detection.location}`);
      }

      // Update learning progress
      setLearningProgress(prev => ({
        episodes: prev.episodes + Math.floor(Math.random() * deltaTime),
        reward: Math.min(0.98, prev.reward + (Math.random() * 0.001 * deltaTime)),
      }));

      // Update parameter history (add new point every simulated 10 minutes) — freeze when tablet press is running
      if (batch.state !== 'complete') {
        setParameterHistory(prev => {
          const lastPoint = prev[prev.length - 1];
          const now = new Date();
          if (!lastPoint || (now.getTime() - lastPoint.timestamp.getTime()) >= 10000 / simulation.speed) {
            const newPoint: ParameterHistoryPoint = {
              timestamp: now,
              motorLoad: batch.state === 'blending' ? 55 + Math.random() * 20 : 45 + Math.random() * 5,
              temperature: 22 + Math.random() * 2,
              blenderSpeed: batch.state === 'blending' ? 15 + Math.random() * 8 : 0,
            };
            return [...prev.slice(-35), newPoint];
          }
          return prev;
        });
      }

    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [simulation.isPaused, simulation.speed, batch.state, addAlert]);

  // Generate yield history and parameter history on mount
  useEffect(() => {
    const history: YieldData[] = Array.from({ length: 20 }, (_, i) => ({
      batchNumber: `BN-2024-${847 - 20 + i}`.padStart(4, '0'),
      actualYield: 92 + Math.random() * 6,
      predictedYield: 94 + Math.random() * 4,
      target: 95,
    }));
    setYieldHistory(history);

    const recs: ParameterRecommendation[] = [
      { parameter: 'Rotation Speed', currentValue: 18, recommendedValue: 19.5, expectedImprovement: 1.2, approved: false },
      { parameter: 'Blend Time', currentValue: 25, recommendedValue: 27, expectedImprovement: 0.8, approved: false },
      { parameter: 'Temperature', currentValue: 22, recommendedValue: 22, expectedImprovement: 0.5, approved: false },
    ];
    setRecommendations(recs);

    // Generate 6 hours of historical parameter data (every 10 minutes = 36 points)
    const now = new Date();
    const paramHistory: ParameterHistoryPoint[] = Array.from({ length: 36 }, (_, i) => {
      const timestamp = new Date(now.getTime() - (35 - i) * 10 * 60 * 1000);
      return {
        timestamp,
        motorLoad: 55 + Math.sin(i * 0.3) * 10 + Math.random() * 8,
        temperature: 22 + Math.sin(i * 0.2) * 1.5 + Math.random() * 1,
        blenderSpeed: i % 6 === 0 ? 0 : 15 + Math.sin(i * 0.4) * 5 + Math.random() * 3,
      };
    });
    setParameterHistory(paramHistory);
  }, []);

  return {
    simulation,
    parameters,
    batch,
    components,
    maintenanceEvents,
    anomalies,
    yieldHistory,
    recommendations,
    detections,
    schedule,
    resources,
    alerts,
    rftPercentage,
    learningProgress,
    availableRecipes,
    parameterHistory,
    equipmentFailures,
    actions: {
      startBatch,
      stopBatch,
      suspendBatch,
      resumeBatch,
      emergencyStop,
      emergencyReset,
      setSpeed,
      togglePause,
      resetSimulation,
      approveRecommendation,
      injectScenario,
      selectRecipe,
    },
  };
}
