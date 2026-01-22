export type BatchState = 'idle' | 'loading' | 'blending' | 'sampling' | 'discharge' | 'cleaning' | 'complete' | 'emergency-stop';

export interface BlenderParameters {
  rotationSpeed: number;
  blendTime: number;
  motorLoad: number;
  temperature: number;
  vibration: number;
  blendUniformity: number;
}

export interface BatchInfo {
  id: string;
  productName: string;
  batchNumber: string;
  startTime: Date;
  targetQuantity: number;
  recipe: RecipeItem[];
  state: BatchState;
}

export interface RecipeItem {
  ingredient: string;
  quantity: number;
  unit: string;
  added: boolean;
}

export interface ComponentHealth {
  name: string;
  health: number;
  rul: number;
  trend: 'stable' | 'declining' | 'critical';
  lastMaintenance: Date;
}

export interface MaintenanceEvent {
  id: string;
  component: string;
  type: 'preventive' | 'predictive' | 'corrective';
  scheduledDate: Date;
  status: 'scheduled' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
}

export interface Anomaly {
  id: string;
  timestamp: Date;
  source: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  acknowledged: boolean;
}

export interface YieldData {
  batchNumber: string;
  actualYield: number;
  predictedYield: number;
  target: number;
}

export interface ParameterRecommendation {
  parameter: string;
  currentValue: number;
  recommendedValue: number;
  expectedImprovement: number;
  approved: boolean;
}

export interface QualityDetection {
  id: string;
  type: 'ppe_violation' | 'surface_damage' | 'leak' | 'contamination' | 'safety_hazard';
  severity: 'minor' | 'moderate' | 'critical';
  location: string;
  timestamp: Date;
  imageUrl?: string;
  recommendation: string;
  status: 'detected' | 'investigating' | 'resolved';
}

export interface ScheduledBatch {
  id: string;
  batchNumber: string;
  productName: string;
  startTime: Date;
  endTime: Date;
  status: 'queued' | 'in-progress' | 'completed' | 'delayed';
  priority: number;
}

export interface Resource {
  id: string;
  name: string;
  type: 'equipment' | 'operator' | 'material' | 'room';
  available: boolean;
  nextAvailable?: Date;
}

export interface Alert {
  id: string;
  timestamp: Date;
  source: string;
  type: 'info' | 'warning' | 'critical' | 'success';
  message: string;
  acknowledged: boolean;
}

export interface DataFlow {
  from: string;
  to: string;
  dataType: string;
  active: boolean;
}

export interface SimulationState {
  speed: number;
  isPaused: boolean;
  currentTime: Date;
  elapsedSeconds: number;
}
