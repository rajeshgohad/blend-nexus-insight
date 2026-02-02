/**
 * Scheduling AI Agent
 * 
 * Backend service for self-optimizing batch scheduling including:
 * - Batch Grouping by drug and density compatibility
 * - Cleaning Optimization to minimize changeover time
 * - Resource Allocation and constraint checking
 * - Schedule Optimization with efficiency scoring
 * 
 * This module can be deployed as a standalone Node.js service
 * or integrated with cloud functions (AWS Lambda, Azure Functions, etc.)
 */

import type {
  BatchOrderInput,
  ScheduleGroupOutput,
  ProductionConditionInput,
  ScheduleOptimizationOutput,
  ResourceConstraintInput,
  ScheduleValidationOutput,
  SchedulingAgentService,
} from './types';

// ============================================================
// CONFIGURATION
// ============================================================

const CONFIG = {
  // Cleaning time settings (minutes)
  NO_CLEANING_TIME: 0,
  PARTIAL_CLEANING_TIME: 15,
  FULL_CLEANING_TIME: 45,
  
  // Time savings per optimization
  SAME_DRUG_SAME_DENSITY_SAVINGS: 15,  // minutes per batch
  SAME_DRUG_DIFF_DENSITY_SAVINGS: 8,
  DIFF_DRUG_DIFF_DENSITY_SAVINGS: 5,
  
  // Constraint thresholds
  MIN_OPERATOR_SKILL_LEVEL: 2,  // 1=junior, 2=senior, 3=specialist
  MAX_MACHINE_WEAR_PERCENT: 90,
  MIN_ROOM_CLEARANCE_HOURS: 2,
  
  // Efficiency targets
  TARGET_EFFICIENCY_GAIN: 40,  // %
  MIN_BATCH_GROUP_SIZE: 2,
};

// ============================================================
// BATCH GROUPING ENGINE
// ============================================================

/**
 * Groups batches by drug and density compatibility for optimal sequencing
 */
export function groupBatches(batches: BatchOrderInput[]): ScheduleGroupOutput[] {
  const groups: ScheduleGroupOutput[] = [];
  
  // Sort batches by drug and density for grouping
  const sortedBatches = [...batches].sort((a, b) => {
    if (a.drug !== b.drug) return a.drug.localeCompare(b.drug);
    return a.density.localeCompare(b.density);
  });

  // Group 1: Same Drug + Same Density (no cleaning required)
  const sameDrugSameDensity = groupByDrugAndDensity(sortedBatches, true, true);
  if (sameDrugSameDensity.length >= CONFIG.MIN_BATCH_GROUP_SIZE) {
    groups.push({
      id: generateId(),
      type: 'same-drug-same-density',
      label: 'Same Drug + Same Density',
      batches: sameDrugSameDensity,
      cleaningRequired: 'none',
      cleaningTimeMinutes: CONFIG.NO_CLEANING_TIME,
      estimatedSavings: sameDrugSameDensity.length * CONFIG.SAME_DRUG_SAME_DENSITY_SAVINGS,
      sequenceOrder: 1,
      color: 'emerald',
    });
  }

  // Group 2: Same Drug + Different Density (partial cleaning)
  const sameDrugDiffDensity = groupByDrugAndDensity(sortedBatches, true, false);
  if (sameDrugDiffDensity.length >= CONFIG.MIN_BATCH_GROUP_SIZE) {
    groups.push({
      id: generateId(),
      type: 'same-drug-diff-density',
      label: 'Same Drug + Different Density',
      batches: sameDrugDiffDensity,
      cleaningRequired: 'partial',
      cleaningTimeMinutes: CONFIG.PARTIAL_CLEANING_TIME,
      estimatedSavings: sameDrugDiffDensity.length * CONFIG.SAME_DRUG_DIFF_DENSITY_SAVINGS,
      sequenceOrder: 2,
      color: 'amber',
    });
  }

  // Group 3: Different Drug + Different Density (full cleaning + QA clearance)
  const diffDrugDiffDensity = groupByDrugAndDensity(sortedBatches, false, false);
  if (diffDrugDiffDensity.length > 0) {
    groups.push({
      id: generateId(),
      type: 'diff-drug-diff-density',
      label: 'Different Drug + Different Density',
      batches: diffDrugDiffDensity,
      cleaningRequired: 'full',
      cleaningTimeMinutes: CONFIG.FULL_CLEANING_TIME,
      estimatedSavings: diffDrugDiffDensity.length * CONFIG.DIFF_DRUG_DIFF_DENSITY_SAVINGS,
      sequenceOrder: 3,
      color: 'rose',
    });
  }

  return groups;
}

/**
 * Helper function to group batches by drug and density criteria
 */
function groupByDrugAndDensity(
  batches: BatchOrderInput[],
  sameDrug: boolean,
  sameDensity: boolean
): BatchOrderInput[] {
  if (batches.length === 0) return [];

  const result: BatchOrderInput[] = [];
  const used = new Set<string>();

  for (let i = 0; i < batches.length; i++) {
    if (used.has(batches[i].id)) continue;

    const group: BatchOrderInput[] = [batches[i]];
    used.add(batches[i].id);

    for (let j = i + 1; j < batches.length; j++) {
      if (used.has(batches[j].id)) continue;

      const drugMatch = batches[i].drug === batches[j].drug;
      const densityMatch = batches[i].density === batches[j].density;

      if (sameDrug && sameDensity && drugMatch && densityMatch) {
        group.push(batches[j]);
        used.add(batches[j].id);
      } else if (sameDrug && !sameDensity && drugMatch && !densityMatch) {
        group.push(batches[j]);
        used.add(batches[j].id);
      } else if (!sameDrug && !sameDensity && !drugMatch) {
        group.push(batches[j]);
        used.add(batches[j].id);
      }
    }

    if (group.length >= 1) {
      result.push(...group);
    }
  }

  return result;
}

// ============================================================
// SCHEDULE OPTIMIZATION ENGINE
// ============================================================

/**
 * Optimizes the production schedule based on grouped batches and constraints
 */
export function optimizeSchedule(
  groups: ScheduleGroupOutput[],
  conditions: ProductionConditionInput[],
  constraints: ResourceConstraintInput = {}
): ScheduleOptimizationOutput {
  // Calculate baseline (unoptimized) time
  const totalBatches = groups.reduce((sum, g) => sum + g.batches.length, 0);
  const baselineCleaningTime = totalBatches * CONFIG.FULL_CLEANING_TIME;
  
  // Calculate optimized cleaning time
  const optimizedCleaningTime = groups.reduce((sum, g) => {
    return sum + (g.batches.length * g.cleaningTimeMinutes);
  }, 0);

  // Calculate total savings
  const totalSavingsMinutes = groups.reduce((sum, g) => sum + g.estimatedSavings, 0);
  const efficiencyGain = baselineCleaningTime > 0 
    ? Math.round((1 - optimizedCleaningTime / baselineCleaningTime) * 100)
    : 0;

  // Check production conditions for blockers
  const blockers = conditions.filter(c => c.status === 'blocked');
  const warnings = conditions.filter(c => c.status === 'warning');

  // Validate resource constraints
  const constraintViolations = validateConstraints(constraints, conditions);

  // Calculate schedule confidence
  const confidence = calculateScheduleConfidence(blockers, warnings, constraintViolations);

  // Generate optimization insights
  const insights = generateOptimizationInsights(groups, efficiencyGain, blockers);

  return {
    groups,
    totalBatches,
    totalSavingsMinutes,
    efficiencyGain,
    baselineCleaningTime,
    optimizedCleaningTime,
    blockers: blockers.map(b => ({
      unit: b.unit,
      name: b.name,
      detail: b.detail,
    })),
    warnings: warnings.map(w => ({
      unit: w.unit,
      name: w.name,
      detail: w.detail,
    })),
    constraintViolations,
    confidence,
    insights,
    isOptimal: blockers.length === 0 && constraintViolations.length === 0,
  };
}

/**
 * Validates resource constraints against current conditions
 */
function validateConstraints(
  constraints: ResourceConstraintInput,
  conditions: ProductionConditionInput[]
): string[] {
  const violations: string[] = [];

  // Check operator skill constraints
  if (constraints.minOperatorSkill && constraints.minOperatorSkill > CONFIG.MIN_OPERATOR_SKILL_LEVEL) {
    const operatorCondition = conditions.find(c => c.name.includes('Operator'));
    if (operatorCondition && operatorCondition.status !== 'ready') {
      violations.push('Insufficient operator skill level available');
    }
  }

  // Check machine wear constraints
  if (constraints.maxMachineWear) {
    const machineWearCondition = conditions.find(c => c.name.includes('Machine Wear'));
    if (machineWearCondition && machineWearCondition.status === 'warning') {
      violations.push('Machine wear approaching maximum threshold');
    }
  }

  // Check room clearance
  const roomCondition = conditions.find(c => c.name.includes('Room Clearance'));
  if (roomCondition && roomCondition.status !== 'ready') {
    violations.push('Room clearance not yet approved');
  }

  return violations;
}

/**
 * Calculates schedule confidence based on blockers and warnings
 */
function calculateScheduleConfidence(
  blockers: ProductionConditionInput[],
  warnings: ProductionConditionInput[],
  violations: string[]
): number {
  let confidence = 1.0;
  
  // Reduce confidence for blockers
  confidence -= blockers.length * 0.25;
  
  // Reduce confidence for warnings
  confidence -= warnings.length * 0.10;
  
  // Reduce confidence for constraint violations
  confidence -= violations.length * 0.15;

  return Math.max(0, Math.min(1, Math.round(confidence * 100) / 100));
}

/**
 * Generates optimization insights for the schedule
 */
function generateOptimizationInsights(
  groups: ScheduleGroupOutput[],
  efficiencyGain: number,
  blockers: ProductionConditionInput[]
): string[] {
  const insights: string[] = [];

  // Efficiency insight
  if (efficiencyGain >= CONFIG.TARGET_EFFICIENCY_GAIN) {
    insights.push(`Optimal grouping achieved ${efficiencyGain}% cleaning time reduction`);
  } else if (efficiencyGain > 0) {
    insights.push(`Current grouping provides ${efficiencyGain}% efficiency gain. Consider batch resequencing for further improvement.`);
  }

  // Group-specific insights
  const sameDrugGroup = groups.find(g => g.type === 'same-drug-same-density');
  if (sameDrugGroup && sameDrugGroup.batches.length >= 5) {
    insights.push(`Large same-product run (${sameDrugGroup.batches.length} batches) maximizes throughput`);
  }

  // Blocker insights
  if (blockers.length > 0) {
    insights.push(`Schedule may be delayed due to ${blockers.length} blocking condition(s)`);
  }

  // Cleaning optimization insight
  const noCleanGroups = groups.filter(g => g.cleaningRequired === 'none');
  if (noCleanGroups.length > 0) {
    const batchCount = noCleanGroups.reduce((sum, g) => sum + g.batches.length, 0);
    insights.push(`${batchCount} batches require no cleaning changeover`);
  }

  return insights;
}

// ============================================================
// SCHEDULE VALIDATION ENGINE
// ============================================================

/**
 * Validates a proposed schedule against all constraints and conditions
 */
export function validateSchedule(
  groups: ScheduleGroupOutput[],
  conditions: ProductionConditionInput[],
  equipmentFailures: { lineId: string; processName: string }[] = []
): ScheduleValidationOutput {
  const issues: Array<{ severity: 'warning' | 'error'; message: string }> = [];
  
  // Check for equipment failures
  for (const failure of equipmentFailures) {
    issues.push({
      severity: 'error',
      message: `${failure.processName} on ${failure.lineId} is offline - batches diverted to backup`,
    });
  }

  // Check production conditions
  for (const condition of conditions) {
    if (condition.status === 'blocked') {
      issues.push({
        severity: 'error',
        message: `${condition.name} at ${condition.unit}: ${condition.detail}`,
      });
    } else if (condition.status === 'warning') {
      issues.push({
        severity: 'warning',
        message: `${condition.name} at ${condition.unit}: ${condition.detail}`,
      });
    }
  }

  // Validate batch sequence
  for (const group of groups) {
    if (group.batches.length === 0) {
      issues.push({
        severity: 'warning',
        message: `Empty batch group: ${group.label}`,
      });
    }
  }

  // Check for QA clearance on full cleaning groups
  const fullCleanGroups = groups.filter(g => g.cleaningRequired === 'full');
  for (const group of fullCleanGroups) {
    const qaCondition = conditions.find(c => 
      c.name.includes('Room Clearance') || c.name.includes('QA')
    );
    if (qaCondition && qaCondition.status !== 'ready') {
      issues.push({
        severity: 'warning',
        message: `QA clearance pending for ${group.label} group`,
      });
    }
  }

  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;

  return {
    isValid: errorCount === 0,
    canProceed: errorCount === 0 || equipmentFailures.length > 0, // Can proceed with backup
    issues,
    errorCount,
    warningCount,
    recommendations: generateValidationRecommendations(issues, equipmentFailures),
  };
}

/**
 * Generates recommendations based on validation issues
 */
function generateValidationRecommendations(
  issues: Array<{ severity: 'warning' | 'error'; message: string }>,
  equipmentFailures: { lineId: string; processName: string }[]
): string[] {
  const recommendations: string[] = [];

  if (equipmentFailures.length > 0) {
    recommendations.push('Continue production using backup equipment while maintenance addresses failures');
    recommendations.push('Monitor backup equipment capacity to prevent overload');
  }

  const errorIssues = issues.filter(i => i.severity === 'error');
  if (errorIssues.length > 0 && equipmentFailures.length === 0) {
    recommendations.push('Resolve blocking conditions before proceeding with scheduled batches');
  }

  const warningIssues = issues.filter(i => i.severity === 'warning');
  if (warningIssues.length > 0) {
    recommendations.push('Review and address warnings to maintain optimal schedule efficiency');
  }

  if (issues.length === 0) {
    recommendations.push('All conditions nominal - proceed with optimized schedule');
  }

  return recommendations;
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
 * Scheduling Agent Service
 * Complete service implementation that can be used as a standalone module
 */
export const SchedulingAgent: SchedulingAgentService = {
  groupBatches,
  optimizeSchedule,
  validateSchedule,
};

export default SchedulingAgent;
