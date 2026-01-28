/**
 * Maintenance AI Agent
 * 
 * Backend service for predictive maintenance including:
 * - RUL (Remaining Useful Life) Prediction
 * - Anomaly Detection from sensor data
 * - Maintenance Decision Engine
 * - Idle Window Detection for scheduling
 * 
 * This module can be deployed as a standalone Node.js service
 * or integrated with cloud functions (AWS Lambda, Azure Functions, etc.)
 */

import type {
  ComponentHealthInput,
  SensorData,
  MaintenanceDecisionOutput,
  AnomalyInput,
  RULPredictionInput,
  RULPredictionOutput,
  ScheduledBatchInput,
  MaintenanceAgentService,
} from './types';

// ============================================================
// CONFIGURATION
// ============================================================

const CONFIG = {
  // Health thresholds
  CRITICAL_HEALTH_THRESHOLD: 50,
  WARNING_HEALTH_THRESHOLD: 70,
  
  // RUL thresholds (hours)
  CRITICAL_RUL_THRESHOLD: 100,
  WARNING_RUL_THRESHOLD: 500,
  
  // Anomaly detection thresholds
  VIBRATION_THRESHOLD: 5.0,      // mm/s
  TEMPERATURE_THRESHOLD: 65,     // °C
  MOTOR_LOAD_THRESHOLD: 90,      // %
  
  // Maintenance durations (hours)
  GENERAL_MAINTENANCE_DURATION: 2,
  SPARE_REPLACEMENT_DURATION: 4,
};

// ============================================================
// RUL PREDICTION ENGINE
// ============================================================

/**
 * Predicts Remaining Useful Life based on component health and sensor data
 * Uses a degradation model with weighted factors
 */
export function predictRUL(input: RULPredictionInput): RULPredictionOutput {
  const {
    componentName,
    currentHealth,
    operatingHours,
    vibrationLevel,
    temperatureDelta,
    motorLoadAvg,
  } = input;

  // Base degradation rate calculation (% per hour)
  let baseDegradationRate = 0.001; // 0.001% per hour base
  
  // Adjust degradation rate based on operating conditions
  const vibrationFactor = vibrationLevel > CONFIG.VIBRATION_THRESHOLD ? 1.5 : 1.0;
  const temperatureFactor = temperatureDelta > 10 ? 1.3 : 1.0;
  const loadFactor = motorLoadAvg > CONFIG.MOTOR_LOAD_THRESHOLD ? 1.4 : 1.0;
  
  // Calculate adjusted degradation rate
  const adjustedDegradationRate = baseDegradationRate * vibrationFactor * temperatureFactor * loadFactor;
  
  // Calculate RUL based on remaining health and degradation rate
  const healthRemaining = currentHealth; // Health until 0%
  const predictedRUL = healthRemaining / adjustedDegradationRate;
  
  // Calculate confidence based on data quality
  const confidence = Math.max(0.6, Math.min(0.95, 
    0.85 - (Math.abs(vibrationFactor - 1) * 0.1) - (Math.abs(temperatureFactor - 1) * 0.1)
  ));
  
  // Calculate failure probability (increases as RUL decreases)
  const failureProbability = Math.min(0.99, Math.max(0.01, 
    1 - (predictedRUL / 1000) // Higher probability when RUL is low
  ));
  
  // Predicted failure date
  const predictedFailureDate = new Date(Date.now() + predictedRUL * 60 * 60 * 1000);

  return {
    componentName,
    predictedRUL: Math.round(predictedRUL),
    confidenceLevel: confidence,
    degradationRate: adjustedDegradationRate,
    failureProbability,
    predictedFailureDate,
  };
}

// ============================================================
// ANOMALY DETECTION ENGINE
// ============================================================

/**
 * Detects anomalies from sensor data using threshold-based detection
 * Can be extended with ML models for more sophisticated detection
 */
export function detectAnomalies(
  sensorData: SensorData[],
  options: { 
    vibrationThreshold?: number; 
    temperatureThreshold?: number; 
    motorLoadThreshold?: number;
  } = {}
): AnomalyInput[] {
  const anomalies: AnomalyInput[] = [];
  const thresholds = {
    vibration: options.vibrationThreshold ?? CONFIG.VIBRATION_THRESHOLD,
    temperature: options.temperatureThreshold ?? CONFIG.TEMPERATURE_THRESHOLD,
    motorLoad: options.motorLoadThreshold ?? CONFIG.MOTOR_LOAD_THRESHOLD,
  };

  for (const data of sensorData) {
    // High vibration detection
    if (data.vibration > thresholds.vibration) {
      const severity = data.vibration > thresholds.vibration * 1.5 ? 'high' : 
                       data.vibration > thresholds.vibration * 1.2 ? 'medium' : 'low';
      anomalies.push({
        id: generateId(),
        timestamp: data.timestamp,
        source: 'Vibration Sensor',
        severity,
        description: `High vibration detected: ${data.vibration.toFixed(2)} mm/s (threshold: ${thresholds.vibration} mm/s)`,
      });
    }

    // High temperature detection
    if (data.temperature > thresholds.temperature) {
      const severity = data.temperature > thresholds.temperature + 15 ? 'high' : 
                       data.temperature > thresholds.temperature + 5 ? 'medium' : 'low';
      anomalies.push({
        id: generateId(),
        timestamp: data.timestamp,
        source: 'Temperature Sensor',
        severity,
        description: `High temperature detected: ${data.temperature.toFixed(1)}°C (threshold: ${thresholds.temperature}°C)`,
      });
    }

    // Motor overload detection
    if (data.motorLoad > thresholds.motorLoad) {
      const severity = data.motorLoad > 95 ? 'high' : 'medium';
      anomalies.push({
        id: generateId(),
        timestamp: data.timestamp,
        source: 'Motor Load Sensor',
        severity,
        description: `Motor overload detected: ${data.motorLoad.toFixed(1)}% (threshold: ${thresholds.motorLoad}%)`,
      });
    }
  }

  return anomalies;
}

// ============================================================
// MAINTENANCE DECISION ENGINE
// ============================================================

/**
 * AI Decision Engine for determining maintenance requirements
 * Analyzes component health and returns maintenance recommendations
 */
export function analyzeComponent(
  component: ComponentHealthInput,
  schedule: ScheduledBatchInput[]
): MaintenanceDecisionOutput {
  const requiresMaintenance = 
    component.health < CONFIG.WARNING_HEALTH_THRESHOLD || 
    component.rul < CONFIG.WARNING_RUL_THRESHOLD || 
    component.trend === 'critical';
  
  let maintenanceType: 'general' | 'spare_replacement' | null = null;
  let reasoning = '';
  let priority: MaintenanceDecisionOutput['priority'] = 'low';

  if (!requiresMaintenance) {
    reasoning = `Component health at ${component.health.toFixed(0)}% with RUL of ${component.rul}h. No maintenance required.`;
  } else if (component.health < CONFIG.CRITICAL_HEALTH_THRESHOLD || component.trend === 'critical') {
    maintenanceType = 'spare_replacement';
    priority = component.health < 30 ? 'critical' : 'high';
    reasoning = `Critical condition detected. Health: ${component.health.toFixed(0)}%, Trend: ${component.trend}. Spare replacement required.`;
  } else {
    maintenanceType = 'general';
    priority = component.health < 60 ? 'high' : 'medium';
    reasoning = `Preventive maintenance recommended. Health: ${component.health.toFixed(0)}%, RUL: ${component.rul}h. General maintenance sufficient.`;
  }

  const estimatedDuration = maintenanceType === 'spare_replacement' 
    ? CONFIG.SPARE_REPLACEMENT_DURATION 
    : CONFIG.GENERAL_MAINTENANCE_DURATION;
    
  const idleWindow = findIdleWindow(schedule, estimatedDuration);

  return {
    componentName: component.name,
    requiresMaintenance,
    maintenanceType,
    reasoning,
    suggestedTime: idleWindow?.start || null,
    machineIdleWindow: idleWindow,
    priority,
    estimatedDuration,
  };
}

// ============================================================
// IDLE WINDOW DETECTION
// ============================================================

/**
 * Finds available maintenance windows in the production schedule
 * Returns the earliest window that can accommodate the required duration
 */
export function findIdleWindow(
  schedule: ScheduledBatchInput[],
  durationHours: number
): { start: Date; end: Date } | null {
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
  return { 
    start: lastBatch.endTime, 
    end: new Date(lastBatch.endTime.getTime() + durationHours * 60 * 60 * 1000) 
  };
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
 * Maintenance Agent Service
 * Complete service implementation that can be used as a standalone module
 */
export const MaintenanceAgent: MaintenanceAgentService = {
  analyzeComponent,
  predictRUL,
  detectAnomalies: (sensorData, threshold) => detectAnomalies(sensorData, { vibrationThreshold: threshold }),
  findIdleWindow,
};

export default MaintenanceAgent;
