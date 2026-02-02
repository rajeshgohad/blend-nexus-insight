/**
 * Backend AI Agent Types
 * These types define the interfaces for AI agent services
 * that can be deployed as standalone Node.js services
 */

// ============================================================
// MAINTENANCE AI AGENT TYPES
// ============================================================

export interface ComponentHealthInput {
  name: string;
  health: number;          // 0-100 percentage
  rul: number;             // Remaining Useful Life in hours
  trend: 'stable' | 'declining' | 'critical';
  // Optional fields for extended analysis
  failureProbability?: number;  // 0-1 probability
  lastMaintenance?: Date;
  predictedFailureDate?: Date | null;
}

export interface SensorData {
  vibration: number;       // mm/s
  motorLoad: number;       // percentage
  temperature: number;     // °C
  timestamp: Date;
}

export interface MaintenanceDecisionOutput {
  componentName: string;
  requiresMaintenance: boolean;
  maintenanceType: 'general' | 'spare_replacement' | null;
  reasoning: string;
  suggestedTime: Date | null;
  machineIdleWindow: { start: Date; end: Date } | null;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedDuration: number;  // hours
}

export interface AnomalyInput {
  id: string;
  timestamp: Date;
  source: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export interface RULPredictionInput {
  componentName: string;
  currentHealth: number;
  operatingHours: number;
  vibrationLevel: number;
  temperatureDelta: number;
  motorLoadAvg: number;
}

export interface RULPredictionOutput {
  componentName: string;
  predictedRUL: number;      // hours
  confidenceLevel: number;   // 0-1
  degradationRate: number;   // % per hour
  failureProbability: number;
  predictedFailureDate: Date;
}

export interface ScheduledBatchInput {
  batchId?: string;
  id?: string;
  batchNumber?: string;
  productName?: string;
  startTime: Date;
  endTime: Date;
  status?: 'queued' | 'in-progress' | 'completed' | 'delayed';
}

// ============================================================
// YIELD OPTIMIZATION AI AGENT TYPES
// ============================================================

export interface TabletPressSignalsInput {
  weight: number;           // mg
  thickness: number;        // mm
  hardness: number;         // kP (kiloponds)
  feederSpeed: number;      // rpm
  turretSpeed: number;      // rpm
  vacuum: number;           // mbar
  preCompressionForce: number;   // kN
  mainCompressionForce: number;  // kN
  timestamp: Date;
}

export interface BatchProfileInput {
  batchNumber: string;
  avgWeight: number;
  weightRSD: number;        // % RSD
  avgThickness: number;
  avgHardness: number;
  rejectRate: number;
  tabletsProduced: number;
  tabletsPerMinute: number;
  inSpecPercentage: number;
}

export interface DriftDetectionOutput {
  id: string;
  parameter: 'weight' | 'thickness' | 'hardness' | 'feederSpeed' | 'turretSpeed';
  direction: 'increasing' | 'decreasing';
  magnitude: number;        // % change
  severity: 'low' | 'medium' | 'high';
  detectedAt: Date;
  description: string;
  recommendedAction: string;
}

export interface YieldPredictionInput {
  signals: TabletPressSignalsInput;
  batchProfile: BatchProfileInput;
  historicalYields: number[];
  activeRecommendations: number;
}

export interface YieldPredictionOutput {
  currentYield: number;     // predicted yield if no changes (%)
  correctedYield: number;   // predicted yield with corrections (%)
  currentRejectRate: number;
  correctedRejectRate: number;
  confidenceLevel: number;  // 0-1
  riskLevel: 'low' | 'medium' | 'high';
  potentialImprovement: number;
}

export interface YieldRecommendationOutput {
  id: string;
  parameter: string;
  currentValue: number;
  recommendedValue: number;
  unit: string;
  adjustment: string;
  expectedImprovement: number;
  sopMin: number;
  sopMax: number;
  riskLevel: 'low' | 'medium';
  reasoning: string;
}

export interface SOPLimits {
  feederSpeed: { min: number; max: number; unit: string };
  turretSpeed: { min: number; max: number; unit: string };
  preCompressionForce: { min: number; max: number; unit: string };
  mainCompressionForce: { min: number; max: number; unit: string };
  vacuum: { min: number; max: number; unit: string };
}

export interface ProductSpecs {
  weight: { target: number; tolerance: number };
  thickness: { target: number; tolerance: number };
  hardness: { target: number; min: number; max: number };
}

// ============================================================
// VISION QC AI AGENT TYPES
// ============================================================

export interface VisionDetectionInput {
  id: string;
  type: 'ppe_violation' | 'surface_damage' | 'leak' | 'contamination' | 'safety_hazard';
  location: string;
  confidence: number;        // 0-1
  rawImageData?: string;     // base64 encoded image
  timestamp?: Date;
}

export interface VisionDetectionOutput {
  id: string;
  type: 'ppe_violation' | 'surface_damage' | 'leak' | 'contamination' | 'safety_hazard';
  severity: 'minor' | 'moderate' | 'critical';
  location: string;
  timestamp: Date;
  confidence: number;
  recommendation: string;
  priorityScore: number;     // 0-100
  alertRecipients: string[];
  status: 'detected' | 'investigating' | 'resolved';
  requiresImmediate: boolean;
}

export interface BaselineMetricsInput {
  ppeCompliance: number;     // %
  surfaceCondition: number;  // %
  environmentalNorm: number; // %
  safetyScore: number;       // %
}

export interface BaselineDeviationOutput {
  id: string;
  metric: string;
  baselineValue: number;
  currentValue: number;
  deviation: number;
  severity: 'low' | 'medium' | 'high';
  detectedAt: Date;
  trend: 'stable' | 'declining' | 'improving';
  recommendedAction: string;
}

export interface AlertRoutingOutput {
  detectionId: string;
  recipients: string[];
  notificationMethods: ('push' | 'sms' | 'email' | 'alarm')[];
  escalationPath: string[];
  responseDeadline: Date;
  autoEscalate: boolean;
  workflowIntegrations: string[];
}

export interface VisionAnalysisInput {
  detections: VisionDetectionOutput[];
  baselineMetrics: BaselineMetricsInput;
  totalInspections: number;
}

export interface VisionAnalysisOutput {
  rftPercentage: number;
  totalDetections: number;
  criticalCount: number;
  moderateCount: number;
  minorCount: number;
  unresolvedCount: number;
  baselineDeviations: BaselineDeviationOutput[];
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
  confidenceScore: number;
}

// ============================================================
// SCHEDULING AI AGENT TYPES
// ============================================================

export interface BatchOrderInput {
  id: string;
  batchNumber: string;
  productName: string;
  drug: string;
  density: 'low' | 'medium' | 'high';
  status: 'queued' | 'in-progress' | 'completed';
  estimatedDuration: number;  // minutes
  priority?: number;
}

export interface ScheduleGroupOutput {
  id: string;
  type: 'same-drug-same-density' | 'same-drug-diff-density' | 'diff-drug-diff-density';
  label: string;
  batches: BatchOrderInput[];
  cleaningRequired: 'none' | 'partial' | 'full';
  cleaningTimeMinutes: number;
  estimatedSavings: number;   // minutes
  sequenceOrder: number;
  color: string;
}

export interface ProductionConditionInput {
  id: string;
  unit: string;
  name: string;
  status: 'ready' | 'warning' | 'blocked';
  detail: string;
}

export interface ResourceConstraintInput {
  minOperatorSkill?: number;
  maxMachineWear?: number;
  requiredCertifications?: string[];
}

export interface ScheduleOptimizationOutput {
  groups: ScheduleGroupOutput[];
  totalBatches: number;
  totalSavingsMinutes: number;
  efficiencyGain: number;     // %
  baselineCleaningTime: number;
  optimizedCleaningTime: number;
  blockers: Array<{ unit: string; name: string; detail: string }>;
  warnings: Array<{ unit: string; name: string; detail: string }>;
  constraintViolations: string[];
  confidence: number;
  insights: string[];
  isOptimal: boolean;
}

export interface ScheduleValidationOutput {
  isValid: boolean;
  canProceed: boolean;
  issues: Array<{ severity: 'warning' | 'error'; message: string }>;
  errorCount: number;
  warningCount: number;
  recommendations: string[];
}

// ============================================================
// AGENT SERVICE INTERFACES
// ============================================================

export interface MaintenanceAgentService {
  analyzeComponent(component: ComponentHealthInput, schedule: ScheduledBatchInput[]): MaintenanceDecisionOutput;
  predictRUL(input: RULPredictionInput): RULPredictionOutput;
  detectAnomalies(sensorData: SensorData[], threshold?: number): AnomalyInput[];
  findIdleWindow(schedule: ScheduledBatchInput[], durationHours: number): { start: Date; end: Date } | null;
}

export interface YieldOptimizationAgentService {
  detectDrift(signals: TabletPressSignalsInput[], windowSize?: number): DriftDetectionOutput[];
  predictYield(input: YieldPredictionInput): YieldPredictionOutput;
  generateRecommendations(signals: TabletPressSignalsInput, profile: BatchProfileInput, sopLimits?: SOPLimits, specs?: ProductSpecs): YieldRecommendationOutput[];
  validateRecommendation(recommendation: YieldRecommendationOutput, sopLimits?: SOPLimits): boolean;
}

export interface VisionAgentService {
  analyzeDetection(input: VisionDetectionInput): VisionDetectionOutput;
  detectBaselineDeviation(current: BaselineMetricsInput, baseline?: BaselineMetricsInput): BaselineDeviationOutput[];
  routeAlert(detection: VisionDetectionOutput): AlertRoutingOutput;
  analyzeVisionMetrics(input: VisionAnalysisInput): VisionAnalysisOutput;
}

export interface SchedulingAgentService {
  groupBatches(batches: BatchOrderInput[]): ScheduleGroupOutput[];
  optimizeSchedule(groups: ScheduleGroupOutput[], conditions: ProductionConditionInput[], constraints?: ResourceConstraintInput): ScheduleOptimizationOutput;
  validateSchedule(groups: ScheduleGroupOutput[], conditions: ProductionConditionInput[], equipmentFailures?: { lineId: string; processName: string }[]): ScheduleValidationOutput;
}
