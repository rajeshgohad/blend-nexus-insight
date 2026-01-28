/**
 * Yield Optimization AI Agent
 * 
 * Backend service for tablet press yield optimization including:
 * - Drift Detection for process parameters
 * - Yield Prediction using statistical models
 * - Recommendation Generation for process adjustments
 * - SOP Validation for safety compliance
 * 
 * This module can be deployed as a standalone Node.js service
 * or integrated with cloud functions (AWS Lambda, Azure Functions, etc.)
 */

import type {
  TabletPressSignalsInput,
  BatchProfileInput,
  DriftDetectionOutput,
  YieldPredictionInput,
  YieldPredictionOutput,
  YieldRecommendationOutput,
  SOPLimits,
  ProductSpecs,
  YieldOptimizationAgentService,
} from './types';

// ============================================================
// CONFIGURATION
// ============================================================

export const DEFAULT_SOP_LIMITS: SOPLimits = {
  feederSpeed: { min: 20, max: 35, unit: 'rpm' },
  turretSpeed: { min: 40, max: 55, unit: 'rpm' },
  preCompressionForce: { min: 2, max: 5, unit: 'kN' },
  mainCompressionForce: { min: 12, max: 20, unit: 'kN' },
  vacuum: { min: -400, max: -200, unit: 'mbar' },
};

export const DEFAULT_SPECS: ProductSpecs = {
  weight: { target: 500, tolerance: 5 },      // ±5% = 475-525mg
  thickness: { target: 4.5, tolerance: 0.2 },
  hardness: { target: 12, min: 8, max: 16 },
};

const CONFIG = {
  // Drift detection thresholds
  DRIFT_MAGNITUDE_HIGH: 2.0,      // % change
  DRIFT_MAGNITUDE_MEDIUM: 1.0,
  
  // Yield thresholds
  TARGET_YIELD: 97,               // %
  WARNING_YIELD: 95,
  CRITICAL_YIELD: 93,
  
  // RSD thresholds
  TARGET_RSD: 1.5,                // %
  WARNING_RSD: 2.0,
  
  // Reject rate thresholds
  TARGET_REJECT_RATE: 1.5,        // per minute
  WARNING_REJECT_RATE: 3.0,
};

// ============================================================
// DRIFT DETECTION ENGINE
// ============================================================

/**
 * Detects parameter drift from time-series signal data
 * Uses linear regression to identify trends
 */
export function detectDrift(
  signals: TabletPressSignalsInput[],
  windowSize: number = 30
): DriftDetectionOutput[] {
  const detections: DriftDetectionOutput[] = [];
  
  if (signals.length < windowSize) {
    return detections;
  }

  const recentSignals = signals.slice(-windowSize);
  const parameters: Array<{
    key: keyof Pick<TabletPressSignalsInput, 'weight' | 'thickness' | 'hardness' | 'feederSpeed' | 'turretSpeed'>;
    name: string;
  }> = [
    { key: 'weight', name: 'Weight' },
    { key: 'thickness', name: 'Thickness' },
    { key: 'hardness', name: 'Hardness' },
    { key: 'feederSpeed', name: 'Feeder Speed' },
    { key: 'turretSpeed', name: 'Turret Speed' },
  ];

  for (const param of parameters) {
    const values = recentSignals.map(s => s[param.key] as number);
    const trend = calculateTrend(values);
    
    if (Math.abs(trend.slope) > 0.01) { // Significant trend detected
      const magnitude = Math.abs(trend.percentChange);
      const direction: DriftDetectionOutput['direction'] = trend.slope > 0 ? 'increasing' : 'decreasing';
      
      let severity: DriftDetectionOutput['severity'] = 'low';
      if (magnitude > CONFIG.DRIFT_MAGNITUDE_HIGH) severity = 'high';
      else if (magnitude > CONFIG.DRIFT_MAGNITUDE_MEDIUM) severity = 'medium';

      const descriptions: Record<string, string> = {
        weight: `Tablet weight ${direction} - potential fill depth adjustment needed`,
        thickness: `Thickness ${direction} - check punch wear or compression settings`,
        hardness: `Hardness ${direction} - may affect dissolution profile`,
        feederSpeed: `Feeder speed drift detected - check hopper level`,
        turretSpeed: `Turret speed variation - verify drive belt tension`,
      };

      const actions: Record<string, string> = {
        weight: direction === 'decreasing' ? 'Increase feeder speed slightly' : 'Decrease feeder speed slightly',
        thickness: direction === 'increasing' ? 'Increase compression force' : 'Decrease compression force',
        hardness: direction === 'decreasing' ? 'Increase main compression force' : 'Decrease main compression force',
        feederSpeed: 'Check hopper level and material flow',
        turretSpeed: 'Verify drive belt tension and motor condition',
      };

      detections.push({
        id: generateId(),
        parameter: param.key as DriftDetectionOutput['parameter'],
        direction,
        magnitude,
        severity,
        detectedAt: new Date(),
        description: descriptions[param.key],
        recommendedAction: actions[param.key],
      });
    }
  }

  return detections;
}

/**
 * Calculates linear trend from an array of values
 */
function calculateTrend(values: number[]): { slope: number; percentChange: number } {
  const n = values.length;
  if (n < 2) return { slope: 0, percentChange: 0 };

  // Linear regression
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumX2 += i * i;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const avgValue = sumY / n;
  const percentChange = avgValue !== 0 ? (slope * n / avgValue) * 100 : 0;

  return { slope, percentChange };
}

// ============================================================
// YIELD PREDICTION ENGINE
// ============================================================

/**
 * Predicts yield based on current signals and batch profile
 * Uses a statistical model with weighted factors
 */
export function predictYield(input: YieldPredictionInput): YieldPredictionOutput {
  const { signals, batchProfile, historicalYields, activeRecommendations } = input;

  // Base yield calculation from batch profile
  let baseYield = batchProfile.inSpecPercentage;
  
  // Adjust based on RSD (higher RSD = lower yield)
  const rsdPenalty = Math.max(0, (batchProfile.weightRSD - CONFIG.TARGET_RSD) * 2);
  baseYield -= rsdPenalty;
  
  // Adjust based on reject rate
  const rejectPenalty = Math.max(0, (batchProfile.rejectRate - CONFIG.TARGET_REJECT_RATE) * 0.5);
  baseYield -= rejectPenalty;
  
  // Historical trend adjustment
  if (historicalYields.length > 0) {
    const avgHistorical = historicalYields.reduce((a, b) => a + b, 0) / historicalYields.length;
    const trendAdjustment = (avgHistorical - baseYield) * 0.1; // Small influence from history
    baseYield += trendAdjustment;
  }

  const currentYield = Math.max(85, Math.min(99, baseYield));
  
  // Corrected yield assumes recommendations are applied
  const improvementPerRec = 0.5; // Expected improvement per approved recommendation
  const potentialImprovement = activeRecommendations * improvementPerRec;
  const correctedYield = Math.min(99.5, currentYield + potentialImprovement + 1.5);

  // Calculate reject rates
  const currentRejectRate = batchProfile.rejectRate;
  const correctedRejectRate = Math.max(0.3, currentRejectRate - (activeRecommendations * 0.4));

  // Confidence based on data quality
  const confidence = Math.min(0.95, 0.80 + (historicalYields.length * 0.01) + (activeRecommendations * 0.02));

  // Risk level assessment
  let riskLevel: YieldPredictionOutput['riskLevel'] = 'low';
  if (currentYield < CONFIG.CRITICAL_YIELD) riskLevel = 'high';
  else if (currentYield < CONFIG.WARNING_YIELD) riskLevel = 'medium';

  return {
    currentYield,
    correctedYield,
    currentRejectRate,
    correctedRejectRate,
    confidenceLevel: confidence,
    riskLevel,
    potentialImprovement: correctedYield - currentYield,
  };
}

// ============================================================
// RECOMMENDATION GENERATION ENGINE
// ============================================================

/**
 * Generates AI recommendations for process parameter adjustments
 * All recommendations stay within SOP limits
 */
export function generateRecommendations(
  signals: TabletPressSignalsInput,
  profile: BatchProfileInput,
  sopLimits: SOPLimits = DEFAULT_SOP_LIMITS,
  specs: ProductSpecs = DEFAULT_SPECS
): YieldRecommendationOutput[] {
  const recommendations: YieldRecommendationOutput[] = [];

  // Analyze weight trend
  const weightDeviation = signals.weight - specs.weight.target;
  if (Math.abs(weightDeviation) > specs.weight.tolerance * 0.5) {
    const currentFeeder = signals.feederSpeed;
    const adjustment = weightDeviation < 0 ? 0.3 : -0.3;
    const newValue = Math.max(sopLimits.feederSpeed.min, 
                              Math.min(sopLimits.feederSpeed.max, currentFeeder + adjustment));
    
    if (newValue !== currentFeeder) {
      recommendations.push({
        id: generateId(),
        parameter: 'Feeder Speed',
        currentValue: currentFeeder,
        recommendedValue: newValue,
        unit: sopLimits.feederSpeed.unit,
        adjustment: `${adjustment > 0 ? '+' : ''}${adjustment.toFixed(1)} ${sopLimits.feederSpeed.unit}`,
        expectedImprovement: 0.15,
        sopMin: sopLimits.feederSpeed.min,
        sopMax: sopLimits.feederSpeed.max,
        riskLevel: 'low',
        reasoning: weightDeviation < 0 
          ? 'Slight increase to compensate for gradual weight decrease trend'
          : 'Slight decrease to compensate for weight increase trend',
      });
    }
  }

  // Analyze hardness
  const hardnessDeviation = signals.hardness - specs.hardness.target;
  if (Math.abs(hardnessDeviation) > 1) {
    const currentForce = signals.mainCompressionForce;
    const adjustment = hardnessDeviation < 0 ? 0.5 : -0.5;
    const newValue = Math.max(sopLimits.mainCompressionForce.min,
                              Math.min(sopLimits.mainCompressionForce.max, currentForce + adjustment));
    
    if (newValue !== currentForce) {
      recommendations.push({
        id: generateId(),
        parameter: 'Main Compression Force',
        currentValue: currentForce,
        recommendedValue: newValue,
        unit: sopLimits.mainCompressionForce.unit,
        adjustment: `${adjustment > 0 ? '+' : ''}${adjustment.toFixed(1)} ${sopLimits.mainCompressionForce.unit}`,
        expectedImprovement: 0.22,
        sopMin: sopLimits.mainCompressionForce.min,
        sopMax: sopLimits.mainCompressionForce.max,
        riskLevel: 'low',
        reasoning: hardnessDeviation < 0
          ? 'Increase hardness to target center; reduces friability rejects'
          : 'Decrease compression to avoid over-hardness issues',
      });
    }
  }

  // Analyze RSD for uniformity
  if (profile.weightRSD > CONFIG.TARGET_RSD) {
    const currentTurret = signals.turretSpeed;
    const adjustment = -0.5;
    const newValue = Math.max(sopLimits.turretSpeed.min,
                              Math.min(sopLimits.turretSpeed.max, currentTurret + adjustment));
    
    if (newValue !== currentTurret) {
      recommendations.push({
        id: generateId(),
        parameter: 'Turret Speed',
        currentValue: currentTurret,
        recommendedValue: newValue,
        unit: sopLimits.turretSpeed.unit,
        adjustment: `${adjustment.toFixed(1)} ${sopLimits.turretSpeed.unit}`,
        expectedImprovement: 0.18,
        sopMin: sopLimits.turretSpeed.min,
        sopMax: sopLimits.turretSpeed.max,
        riskLevel: 'low',
        reasoning: 'Minor reduction to improve fill uniformity and reduce %RSD',
      });
    }
  }

  // Pre-compression for de-aeration
  if (profile.rejectRate > CONFIG.TARGET_REJECT_RATE) {
    const currentPreComp = signals.preCompressionForce;
    const adjustment = 0.3;
    const newValue = Math.max(sopLimits.preCompressionForce.min,
                              Math.min(sopLimits.preCompressionForce.max, currentPreComp + adjustment));
    
    if (newValue !== currentPreComp) {
      recommendations.push({
        id: generateId(),
        parameter: 'Pre-Compression Force',
        currentValue: currentPreComp,
        recommendedValue: newValue,
        unit: sopLimits.preCompressionForce.unit,
        adjustment: `+${adjustment.toFixed(1)} ${sopLimits.preCompressionForce.unit}`,
        expectedImprovement: 0.12,
        sopMin: sopLimits.preCompressionForce.min,
        sopMax: sopLimits.preCompressionForce.max,
        riskLevel: 'low',
        reasoning: 'Better de-aeration reduces capping and lamination',
      });
    }
  }

  return recommendations;
}

// ============================================================
// SOP VALIDATION
// ============================================================

/**
 * Validates that a recommendation stays within SOP limits
 */
export function validateRecommendation(
  recommendation: YieldRecommendationOutput,
  sopLimits: SOPLimits = DEFAULT_SOP_LIMITS
): boolean {
  const parameterLimits: Record<string, { min: number; max: number }> = {
    'Feeder Speed': sopLimits.feederSpeed,
    'Turret Speed': sopLimits.turretSpeed,
    'Pre-Compression Force': sopLimits.preCompressionForce,
    'Main Compression Force': sopLimits.mainCompressionForce,
  };

  const limits = parameterLimits[recommendation.parameter];
  if (!limits) return true; // Unknown parameter, allow

  return recommendation.recommendedValue >= limits.min && 
         recommendation.recommendedValue <= limits.max;
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// ============================================================
// SERVICE EXPORT
// ============================================================

/**
 * Yield Optimization Agent Service
 * Complete service implementation that can be used as a standalone module
 */
export const YieldOptimizationAgent: YieldOptimizationAgentService = {
  detectDrift,
  predictYield,
  generateRecommendations,
  validateRecommendation,
};

export default YieldOptimizationAgent;
