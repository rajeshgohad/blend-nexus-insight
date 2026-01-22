export type BatchState = 'idle' | 'loading' | 'blending' | 'sampling' | 'discharge' | 'cleaning' | 'complete' | 'emergency-stop';

export type BlendingSequenceStep = 'start-delay' | 'charging' | 'pre-blend' | 'main-blend' | 'lube-pause' | 'lube-blend' | 'discharge';

export interface BlendingSequenceItem {
  step: BlendingSequenceStep;
  label: string;
  setPointMinutes: number;
  actualMinutes: number;
  status: 'pending' | 'in-progress' | 'completed';
}

export interface Operator {
  id: string;
  name: string;
}

export interface Recipe {
  id: string;
  name: string;
  productId: string;
  ingredients: RecipeItem[];
}

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
  productId: string;
  batchNumber: string;
  startTime: Date | null;
  endTime: Date | null;
  targetQuantity: number;
  recipe: RecipeItem[];
  recipeId: string;
  recipeName: string;
  state: BatchState;
  operator: Operator;
  blendingSequence: BlendingSequenceItem[];
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
  failureProbability: number;
  predictedFailureDate: Date | null;
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

export interface Technician {
  id: string;
  name: string;
  skill: 'junior' | 'senior' | 'specialist';
  available: boolean;
  currentTask: string | null;
  nextAvailable: Date | null;
}

export interface SparePart {
  id: string;
  name: string;
  partNumber: string;
  quantity: number;
  minStock: number;
  leadTimeDays: number;
  vendor: string;
  unitCost: number;
}

export interface WorkOrder {
  id: string;
  component: string;
  type: 'general' | 'spare_replacement';
  status: 'pending' | 'scheduled' | 'in-progress' | 'completed' | 'waiting-spares';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTechnician: Technician | null;
  scheduledTime: Date | null;
  sparesRequired: { part: SparePart; quantity: number }[];
  estimatedDuration: number; // hours
  createdAt: Date;
  instructions: string;
  notificationsSent: NotificationRecord[];
}

export interface PurchaseOrder {
  id: string;
  sparePart: SparePart;
  quantity: number;
  vendor: string;
  status: 'pending' | 'approved' | 'ordered' | 'shipped' | 'received';
  createdAt: Date;
  expectedDelivery: Date;
  workOrderId: string;
}

export interface NotificationRecord {
  id: string;
  recipient: 'maintenance_team' | 'production_supervisor' | 'operator' | 'stores';
  message: string;
  sentAt: Date;
  acknowledged: boolean;
}

export interface MaintenanceDecision {
  componentName: string;
  requiresMaintenance: boolean;
  maintenanceType: 'general' | 'spare_replacement' | null;
  reasoning: string;
  suggestedTime: Date | null;
  machineIdleWindow: { start: Date; end: Date } | null;
}

export interface MaintenanceLog {
  id: string;
  timestamp: Date;
  action: string;
  details: string;
  actor: string;
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

export interface ParameterHistoryPoint {
  timestamp: Date;
  motorLoad: number;
  temperature: number;
  blenderSpeed: number;
}
