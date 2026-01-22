import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  BatchState,
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
} from '@/types/manufacturing';

const generateId = () => Math.random().toString(36).substr(2, 9);

const addNoise = (value: number, variance: number) => {
  return value + (Math.random() - 0.5) * 2 * variance;
};

const initialBatch: BatchInfo = {
  id: generateId(),
  productName: 'Metformin HCl 500mg',
  batchNumber: 'BN-2024-0847',
  startTime: new Date(),
  targetQuantity: 500,
  recipe: [
    { ingredient: 'Metformin HCl', quantity: 250, unit: 'kg', added: false },
    { ingredient: 'Microcrystalline Cellulose', quantity: 150, unit: 'kg', added: false },
    { ingredient: 'Povidone K30', quantity: 50, unit: 'kg', added: false },
    { ingredient: 'Magnesium Stearate', quantity: 25, unit: 'kg', added: false },
    { ingredient: 'Colloidal Silicon Dioxide', quantity: 25, unit: 'kg', added: false },
  ],
  state: 'idle',
};

const initialComponents: ComponentHealth[] = [
  { name: 'Drive Motor', health: 92, rul: 2400, trend: 'stable', lastMaintenance: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
  { name: 'Main Bearings', health: 85, rul: 1800, trend: 'declining', lastMaintenance: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
  { name: 'Seal Assembly', health: 78, rul: 1200, trend: 'declining', lastMaintenance: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000) },
  { name: 'Gear Box', health: 95, rul: 3600, trend: 'stable', lastMaintenance: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
  { name: 'Vibration Dampers', health: 88, rul: 2000, trend: 'stable', lastMaintenance: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
];

const initialSchedule: ScheduledBatch[] = [
  { id: '1', batchNumber: 'BN-2024-0847', productName: 'Metformin HCl 500mg', startTime: new Date(), endTime: new Date(Date.now() + 2 * 60 * 60 * 1000), status: 'in-progress', priority: 1 },
  { id: '2', batchNumber: 'BN-2024-0848', productName: 'Lisinopril 10mg', startTime: new Date(Date.now() + 2.5 * 60 * 60 * 1000), endTime: new Date(Date.now() + 4.5 * 60 * 60 * 1000), status: 'queued', priority: 2 },
  { id: '3', batchNumber: 'BN-2024-0849', productName: 'Omeprazole 20mg', startTime: new Date(Date.now() + 5 * 60 * 60 * 1000), endTime: new Date(Date.now() + 7 * 60 * 60 * 1000), status: 'queued', priority: 3 },
  { id: '4', batchNumber: 'BN-2024-0850', productName: 'Amlodipine 5mg', startTime: new Date(Date.now() + 7.5 * 60 * 60 * 1000), endTime: new Date(Date.now() + 9.5 * 60 * 60 * 1000), status: 'queued', priority: 4 },
  { id: '5', batchNumber: 'BN-2024-0851', productName: 'Atorvastatin 20mg', startTime: new Date(Date.now() + 10 * 60 * 60 * 1000), endTime: new Date(Date.now() + 12 * 60 * 60 * 1000), status: 'queued', priority: 5 },
];

const initialResources: Resource[] = [
  { id: '1', name: 'V-Blender VB-500', type: 'equipment', available: true },
  { id: '2', name: 'Operator: J. Smith', type: 'operator', available: true },
  { id: '3', name: 'Operator: M. Johnson', type: 'operator', available: false, nextAvailable: new Date(Date.now() + 4 * 60 * 60 * 1000) },
  { id: '4', name: 'Blending Room B-102', type: 'room', available: true },
  { id: '5', name: 'Metformin HCl API', type: 'material', available: true },
];

export function useSimulation() {
  const [simulation, setSimulation] = useState<SimulationState>({
    speed: 1,
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

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const addAlert = useCallback((source: string, type: Alert['type'], message: string) => {
    const newAlert: Alert = {
      id: generateId(),
      timestamp: new Date(),
      source,
      type,
      message,
      acknowledged: false,
    };
    setAlerts(prev => [newAlert, ...prev].slice(0, 50));
  }, []);

  const startBatch = useCallback(() => {
    setBatch(prev => ({ ...prev, state: 'loading', startTime: new Date() }));
    setParameters(prev => ({ ...prev, blendTime: 0, blendUniformity: 0 }));
    addAlert('Digital Twin', 'info', `Batch ${batch.batchNumber} started - Loading materials`);
  }, [batch.batchNumber, addAlert]);

  const stopBatch = useCallback(() => {
    setBatch(prev => ({ ...prev, state: 'idle' }));
    setParameters(prev => ({ ...prev, rotationSpeed: 0, vibration: 0.3 }));
    addAlert('Digital Twin', 'info', 'Batch stopped');
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
    setSimulation(prev => ({ ...prev, isPaused: !prev.isPaused }));
  }, []);

  const resetSimulation = useCallback(() => {
    setSimulation({ speed: 1, isPaused: true, currentTime: new Date(), elapsedSeconds: 0 });
    setParameters({ rotationSpeed: 0, blendTime: 0, motorLoad: 45, temperature: 22, vibration: 0.3, blendUniformity: 0 });
    setBatch(initialBatch);
    setComponents(initialComponents);
    setMaintenanceEvents([]);
    setAnomalies([]);
    setDetections([]);
    setAlerts([]);
    setSchedule(initialSchedule);
  }, []);

  const approveRecommendation = useCallback((parameter: string) => {
    setRecommendations(prev => prev.map(r => r.parameter === parameter ? { ...r, approved: true } : r));
    addAlert('Yield Optimization', 'success', `Parameter recommendation for ${parameter} approved`);
  }, [addAlert]);

  const injectScenario = useCallback((scenario: string) => {
    switch (scenario) {
      case 'equipment_failure':
        setComponents(prev => prev.map(c => c.name === 'Main Bearings' ? { ...c, health: 35, trend: 'critical' as const } : c));
        addAlert('Predictive Maintenance', 'critical', 'Critical: Main Bearings health dropped to 35%');
        break;
      case 'material_delay':
        setResources(prev => prev.map(r => r.name === 'Metformin HCl API' ? { ...r, available: false, nextAvailable: new Date(Date.now() + 2 * 60 * 60 * 1000) } : r));
        addAlert('Scheduling', 'warning', 'Material delivery delayed: Metformin HCl API');
        break;
      case 'rush_order':
        const rushBatch: ScheduledBatch = {
          id: generateId(),
          batchNumber: 'BN-2024-RUSH',
          productName: 'Urgent: Insulin Preparation',
          startTime: new Date(Date.now() + 1 * 60 * 60 * 1000),
          endTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
          status: 'queued',
          priority: 0,
        };
        setSchedule(prev => [rushBatch, ...prev]);
        addAlert('Scheduling', 'warning', 'Rush order inserted: Insulin Preparation');
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
              if (Math.random() < 0.1 * deltaTime) {
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
        return prev;
      });

      setParameters(prev => {
        if (batch.state === 'blending') {
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

      // Random anomaly detection
      if (Math.random() < 0.02 * deltaTime) {
        const sources = ['Motor Current', 'Vibration Pattern', 'Temperature Sensor', 'Bearing Noise'];
        const anomaly: Anomaly = {
          id: generateId(),
          timestamp: new Date(),
          source: sources[Math.floor(Math.random() * sources.length)],
          severity: Math.random() < 0.3 ? 'high' : Math.random() < 0.6 ? 'medium' : 'low',
          description: 'Unusual pattern detected - AI analysis in progress',
          acknowledged: false,
        };
        setAnomalies(prev => [anomaly, ...prev].slice(0, 20));
        addAlert('Predictive Maintenance', anomaly.severity === 'high' ? 'critical' : 'warning', `Anomaly: ${anomaly.source} - ${anomaly.description}`);
      }

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

    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [simulation.isPaused, simulation.speed, batch.state, addAlert]);

  // Generate yield history on mount
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
      { parameter: 'Temperature', currentValue: 23, recommendedValue: 22, expectedImprovement: 0.5, approved: false },
    ];
    setRecommendations(recs);
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
    },
  };
}
