/**
 * Vision QC AI Agent
 * 
 * Backend service for autonomous quality assurance with computer vision including:
 * - Detection Analysis for PPE violations, surface damage, contamination
 * - Severity Assessment and prioritization
 * - Baseline Deviation Detection
 * - Alert Generation and routing
 * - Recommendation Engine
 * 
 * This module can be deployed as a standalone Node.js service
 * or integrated with cloud functions (AWS Lambda, Azure Functions, etc.)
 */

import type {
  VisionDetectionInput,
  VisionDetectionOutput,
  BaselineMetricsInput,
  BaselineDeviationOutput,
  AlertRoutingOutput,
  VisionAnalysisInput,
  VisionAnalysisOutput,
  VisionAgentService,
} from './types';

// ============================================================
// CONFIGURATION
// ============================================================

const CONFIG = {
  // Baseline thresholds
  PPE_COMPLIANCE_TARGET: 98.0,
  SURFACE_CONDITION_TARGET: 97.0,
  ENVIRONMENTAL_TARGET: 99.0,
  SAFETY_SCORE_TARGET: 96.0,
  
  // Deviation thresholds
  MINOR_DEVIATION: 2.0,    // % below target
  MODERATE_DEVIATION: 5.0,
  CRITICAL_DEVIATION: 10.0,
  
  // Confidence thresholds
  HIGH_CONFIDENCE: 0.85,
  MEDIUM_CONFIDENCE: 0.70,
  LOW_CONFIDENCE: 0.50,
  
  // Severity weights for RFT calculation
  CRITICAL_WEIGHT: 3.0,
  MODERATE_WEIGHT: 1.5,
  MINOR_WEIGHT: 0.5,
};

// Detection type to severity mapping defaults
const DEFAULT_SEVERITY_MAP: Record<string, 'minor' | 'moderate' | 'critical'> = {
  ppe_violation: 'moderate',
  surface_damage: 'moderate',
  leak: 'critical',
  contamination: 'critical',
  safety_hazard: 'critical',
};

// Alert routing rules
const ALERT_ROUTING_RULES: Record<string, string[]> = {
  ppe_violation: ['supervisor', 'safety_officer'],
  surface_damage: ['maintenance', 'qa_inspector'],
  leak: ['maintenance', 'supervisor', 'safety_officer'],
  contamination: ['qa_inspector', 'supervisor', 'production_manager'],
  safety_hazard: ['safety_officer', 'supervisor', 'security'],
};

// ============================================================
// DETECTION ANALYSIS ENGINE
// ============================================================

/**
 * Analyzes a vision detection and enriches it with severity, recommendations, and routing
 */
export function analyzeDetection(input: VisionDetectionInput): VisionDetectionOutput {
  const {
    id,
    type,
    location,
    confidence,
    rawImageData,
    timestamp = new Date(),
  } = input;

  // Determine severity based on type and confidence
  const baseSeverity = DEFAULT_SEVERITY_MAP[type] || 'minor';
  let severity = baseSeverity;
  
  // Adjust severity based on confidence
  if (confidence < CONFIG.LOW_CONFIDENCE) {
    // Low confidence - downgrade severity
    severity = 'minor';
  } else if (confidence > CONFIG.HIGH_CONFIDENCE && baseSeverity !== 'critical') {
    // High confidence - upgrade if not already critical
    severity = baseSeverity === 'minor' ? 'moderate' : 'critical';
  }

  // Generate recommendation based on type and severity
  const recommendation = generateRecommendation(type, severity, location);

  // Calculate priority score (0-100)
  const priorityScore = calculatePriorityScore(type, severity, confidence);

  // Determine alert recipients
  const alertRecipients = ALERT_ROUTING_RULES[type] || ['supervisor'];

  return {
    id,
    type,
    severity,
    location,
    timestamp,
    confidence,
    recommendation,
    priorityScore,
    alertRecipients,
    status: 'detected',
    requiresImmediate: severity === 'critical',
  };
}

/**
 * Generates contextual recommendations based on detection type
 */
function generateRecommendation(
  type: string,
  severity: 'minor' | 'moderate' | 'critical',
  location: string
): string {
  const recommendations: Record<string, Record<string, string>> = {
    ppe_violation: {
      minor: `Remind personnel at ${location} to verify PPE compliance`,
      moderate: `Immediately notify supervisor to address PPE violation at ${location}`,
      critical: `STOP WORK at ${location} - Critical PPE violation detected. Escort personnel to compliance area.`,
    },
    surface_damage: {
      minor: `Schedule inspection of surface at ${location} during next maintenance window`,
      moderate: `Create maintenance ticket for surface damage at ${location}. Assess structural integrity.`,
      critical: `URGENT: Cordon off ${location}. Immediate structural assessment required.`,
    },
    leak: {
      minor: `Monitor potential leak at ${location}. Schedule plumbing inspection.`,
      moderate: `Deploy containment at ${location}. Notify maintenance for leak repair.`,
      critical: `EMERGENCY: Evacuate ${location}. Shut off utilities. Deploy emergency response team.`,
    },
    contamination: {
      minor: `Initiate cleaning protocol at ${location}. Document for batch records.`,
      moderate: `Quarantine area at ${location}. QA inspection required before resuming operations.`,
      critical: `STOP PRODUCTION: Contamination at ${location}. Initiate full investigation and batch quarantine.`,
    },
    safety_hazard: {
      minor: `Address safety concern at ${location}. Update safety checklist.`,
      moderate: `Clear personnel from ${location}. Safety officer review required.`,
      critical: `EVACUATE ${location} immediately. Emergency response protocols activated.`,
    },
  };

  return recommendations[type]?.[severity] || `Review detection at ${location} and take appropriate action.`;
}

/**
 * Calculates priority score for detection ranking
 */
function calculatePriorityScore(
  type: string,
  severity: 'minor' | 'moderate' | 'critical',
  confidence: number
): number {
  const severityWeights = {
    minor: 20,
    moderate: 50,
    critical: 90,
  };

  const typeWeights: Record<string, number> = {
    contamination: 10,
    leak: 10,
    safety_hazard: 8,
    ppe_violation: 5,
    surface_damage: 3,
  };

  const baseScore = severityWeights[severity];
  const typeBonus = typeWeights[type] || 0;
  const confidenceMultiplier = 0.5 + (confidence * 0.5);

  return Math.min(100, Math.round((baseScore + typeBonus) * confidenceMultiplier));
}

// ============================================================
// BASELINE DEVIATION DETECTION
// ============================================================

/**
 * Detects deviations from established baseline metrics
 */
export function detectBaselineDeviation(
  current: BaselineMetricsInput,
  baseline: BaselineMetricsInput = {
    ppeCompliance: CONFIG.PPE_COMPLIANCE_TARGET,
    surfaceCondition: CONFIG.SURFACE_CONDITION_TARGET,
    environmentalNorm: CONFIG.ENVIRONMENTAL_TARGET,
    safetyScore: CONFIG.SAFETY_SCORE_TARGET,
  }
): BaselineDeviationOutput[] {
  const deviations: BaselineDeviationOutput[] = [];

  const metrics = [
    { key: 'ppeCompliance', label: 'PPE Compliance', target: baseline.ppeCompliance },
    { key: 'surfaceCondition', label: 'Surface Condition', target: baseline.surfaceCondition },
    { key: 'environmentalNorm', label: 'Environmental', target: baseline.environmentalNorm },
    { key: 'safetyScore', label: 'Safety Score', target: baseline.safetyScore },
  ];

  for (const metric of metrics) {
    const currentValue = current[metric.key as keyof BaselineMetricsInput];
    const deviation = metric.target - currentValue;

    if (deviation > 0) {
      let severity: 'low' | 'medium' | 'high' = 'low';
      if (deviation >= CONFIG.CRITICAL_DEVIATION) {
        severity = 'high';
      } else if (deviation >= CONFIG.MODERATE_DEVIATION) {
        severity = 'medium';
      }

      deviations.push({
        id: generateId(),
        metric: metric.label,
        baselineValue: metric.target,
        currentValue,
        deviation,
        severity,
        detectedAt: new Date(),
        trend: deviation > CONFIG.MINOR_DEVIATION ? 'declining' : 'stable',
        recommendedAction: getDeviationAction(metric.key, deviation),
      });
    }
  }

  return deviations;
}

/**
 * Gets recommended action for baseline deviation
 */
function getDeviationAction(metricKey: string, deviation: number): string {
  const actions: Record<string, string> = {
    ppeCompliance: deviation > 5 
      ? 'Conduct immediate PPE audit and refresher training'
      : 'Review PPE compliance during next shift change',
    surfaceCondition: deviation > 5
      ? 'Schedule comprehensive facility inspection'
      : 'Add to routine maintenance checklist',
    environmentalNorm: deviation > 5
      ? 'Investigate HVAC and environmental controls immediately'
      : 'Monitor environmental readings more frequently',
    safetyScore: deviation > 5
      ? 'Conduct safety stand-down and risk assessment'
      : 'Review recent safety incidents and near-misses',
  };

  return actions[metricKey] || 'Investigate and address deviation';
}

// ============================================================
// ALERT ROUTING ENGINE
// ============================================================

/**
 * Determines alert routing based on detection analysis
 */
export function routeAlert(detection: VisionDetectionOutput): AlertRoutingOutput {
  const { type, severity, priorityScore, alertRecipients } = detection;

  // Determine notification method based on severity
  const notificationMethods: ('push' | 'sms' | 'email' | 'alarm')[] = ['push'];
  
  if (severity === 'critical') {
    notificationMethods.push('sms', 'alarm');
  } else if (severity === 'moderate') {
    notificationMethods.push('email');
  }

  // Determine escalation path
  const escalationPath = severity === 'critical'
    ? ['supervisor', 'production_manager', 'plant_manager']
    : severity === 'moderate'
    ? ['supervisor', 'production_manager']
    : ['supervisor'];

  // Calculate response deadline
  const deadlineMinutes = severity === 'critical' ? 5 : severity === 'moderate' ? 30 : 120;
  const responseDeadline = new Date(Date.now() + deadlineMinutes * 60 * 1000);

  return {
    detectionId: detection.id,
    recipients: alertRecipients,
    notificationMethods,
    escalationPath,
    responseDeadline,
    autoEscalate: severity === 'critical',
    workflowIntegrations: getWorkflowIntegrations(type),
  };
}

/**
 * Gets workflow system integrations for detection type
 */
function getWorkflowIntegrations(type: string): string[] {
  const integrations: Record<string, string[]> = {
    ppe_violation: ['MES', 'Incident Management'],
    surface_damage: ['CMMS', 'MES'],
    leak: ['CMMS', 'MES', 'EHS'],
    contamination: ['MES', 'QMS', 'Incident Management'],
    safety_hazard: ['EHS', 'Incident Management', 'Security'],
  };

  return integrations[type] || ['MES'];
}

// ============================================================
// COMPREHENSIVE ANALYSIS ENGINE
// ============================================================

/**
 * Performs comprehensive vision analysis including RFT calculation
 */
export function analyzeVisionMetrics(input: VisionAnalysisInput): VisionAnalysisOutput {
  const { detections, baselineMetrics, totalInspections } = input;

  // Calculate detection statistics
  const criticalCount = detections.filter(d => d.severity === 'critical').length;
  const moderateCount = detections.filter(d => d.severity === 'moderate').length;
  const minorCount = detections.filter(d => d.severity === 'minor').length;

  // Calculate RFT percentage
  const weightedDefects = 
    criticalCount * CONFIG.CRITICAL_WEIGHT +
    moderateCount * CONFIG.MODERATE_WEIGHT +
    minorCount * CONFIG.MINOR_WEIGHT;
  
  const rftPercentage = Math.max(0, Math.min(100, 
    100 - (weightedDefects / Math.max(1, totalInspections)) * 10
  ));

  // Detect baseline deviations
  const baselineDeviations = detectBaselineDeviation(baselineMetrics);

  // Calculate overall risk level
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  if (criticalCount > 0 || rftPercentage < 90) {
    riskLevel = 'high';
  } else if (moderateCount > 2 || rftPercentage < 95) {
    riskLevel = 'medium';
  }

  // Generate improvement recommendations
  const recommendations = generateImprovementRecommendations(
    detections,
    baselineDeviations,
    rftPercentage
  );

  return {
    rftPercentage,
    totalDetections: detections.length,
    criticalCount,
    moderateCount,
    minorCount,
    unresolvedCount: detections.filter(d => d.status !== 'resolved').length,
    baselineDeviations,
    riskLevel,
    recommendations,
    confidenceScore: calculateOverallConfidence(detections),
  };
}

/**
 * Generates improvement recommendations based on analysis
 */
function generateImprovementRecommendations(
  detections: VisionDetectionOutput[],
  deviations: BaselineDeviationOutput[],
  rftPercentage: number
): string[] {
  const recommendations: string[] = [];

  // Check for PPE issues
  const ppeViolations = detections.filter(d => d.type === 'ppe_violation');
  if (ppeViolations.length > 2) {
    recommendations.push('Schedule PPE compliance refresher training for all shifts');
  }

  // Check for maintenance issues
  const maintenanceIssues = detections.filter(d => 
    d.type === 'surface_damage' || d.type === 'leak'
  );
  if (maintenanceIssues.length > 0) {
    recommendations.push('Accelerate preventive maintenance schedule for affected areas');
  }

  // Check baseline deviations
  const highDeviations = deviations.filter(d => d.severity === 'high');
  if (highDeviations.length > 0) {
    recommendations.push('Conduct root cause analysis for significant baseline deviations');
  }

  // RFT-based recommendations
  if (rftPercentage < 95) {
    recommendations.push('Implement additional quality checkpoints at critical stages');
  }

  if (recommendations.length === 0) {
    recommendations.push('Maintain current practices - all metrics within acceptable ranges');
  }

  return recommendations;
}

/**
 * Calculates overall confidence score from detections
 */
function calculateOverallConfidence(detections: VisionDetectionOutput[]): number {
  if (detections.length === 0) return 1.0;
  
  const avgConfidence = detections.reduce((sum, d) => sum + d.confidence, 0) / detections.length;
  return Math.round(avgConfidence * 100) / 100;
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
 * Vision QC Agent Service
 * Complete service implementation that can be used as a standalone module
 */
export const VisionAgent: VisionAgentService = {
  analyzeDetection,
  detectBaselineDeviation,
  routeAlert,
  analyzeVisionMetrics,
};

export default VisionAgent;
