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
  failureProbability: number;  // 0-1 probability
  lastMaintenance: Date;
  predictedFailureDate: Date | null;
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
  id: string;
  batchNumber: string;
  productName: string;
  startTime: Date;
  endTime: Date;
  status: 'queued' | 'in-progress' | 'completed' | 'delayed';
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
// AGENT SERVICE INTERFACES
// ============================================================

export interface MaintenanceAgentService {
  analyzeComponent(component: ComponentHealthInput, schedule: ScheduledBatchInput[]): MaintenanceDecisionOutput;
  predictRUL(input: RULPredictionInput): RULPredictionOutput;
  detectAnomalies(sensorData: SensorData[], threshold: number): AnomalyInput[];
  findIdleWindow(schedule: ScheduledBatchInput[], durationHours: number): { start: Date; end: Date } | null;
}

export interface YieldOptimizationAgentService {
  detectDrift(signals: TabletPressSignalsInput[], windowSize: number): DriftDetectionOutput[];
  predictYield(input: YieldPredictionInput): YieldPredictionOutput;
  generateRecommendations(signals: TabletPressSignalsInput, profile: BatchProfileInput, sopLimits: SOPLimits): YieldRecommendationOutput[];
  validateRecommendation(recommendation: YieldRecommendationOutput, sopLimits: SOPLimits): boolean;
}
