 """
 Scheduling AI Agent
 
 Backend service for self-optimizing batch scheduling including:
 - Batch Grouping by drug and density compatibility
 - Cleaning Optimization to minimize changeover time
 - Resource Allocation and constraint checking
 - Schedule Optimization with efficiency scoring
 """
 import uuid
 from typing import List, Optional
 from models.scheduling import (
     BatchOrderInput,
     ScheduleGroupOutput,
     ProductionConditionInput,
     ScheduleOptimizationOutput,
     ResourceConstraintInput,
     ScheduleValidationOutput,
 )
 
 
 class Config:
     NO_CLEANING_TIME = 0
     PARTIAL_CLEANING_TIME = 15
     FULL_CLEANING_TIME = 45
     SAME_DRUG_SAME_DENSITY_SAVINGS = 15
     SAME_DRUG_DIFF_DENSITY_SAVINGS = 8
     DIFF_DRUG_DIFF_DENSITY_SAVINGS = 5
     MIN_OPERATOR_SKILL_LEVEL = 2
     MAX_MACHINE_WEAR_PERCENT = 90
     MIN_ROOM_CLEARANCE_HOURS = 2
     TARGET_EFFICIENCY_GAIN = 40
     MIN_BATCH_GROUP_SIZE = 2
 
 
 def generate_id() -> str:
     return str(uuid.uuid4())[:9]
 
 
 def group_by_drug_and_density(
     batches: List[BatchOrderInput],
     same_drug: bool,
     same_density: bool,
 ) -> List[BatchOrderInput]:
     """Helper function to group batches by drug and density criteria"""
     if not batches:
         return []
 
     result = []
     used = set()
 
     for i, batch_i in enumerate(batches):
         if batch_i.id in used:
             continue
 
         group = [batch_i]
         used.add(batch_i.id)
 
         for j in range(i + 1, len(batches)):
             batch_j = batches[j]
             if batch_j.id in used:
                 continue
 
             drug_match = batch_i.drug == batch_j.drug
             density_match = batch_i.density == batch_j.density
 
             if same_drug and same_density and drug_match and density_match:
                 group.append(batch_j)
                 used.add(batch_j.id)
             elif same_drug and not same_density and drug_match and not density_match:
                 group.append(batch_j)
                 used.add(batch_j.id)
             elif not same_drug and not same_density and not drug_match:
                 group.append(batch_j)
                 used.add(batch_j.id)
 
         if len(group) >= 1:
             result.extend(group)
 
     return result
 
 
 def validate_constraints(
     constraints: ResourceConstraintInput,
     conditions: List[ProductionConditionInput],
 ) -> List[str]:
     """Validates resource constraints against current conditions"""
     violations = []
 
     if constraints.min_operator_skill and constraints.min_operator_skill > Config.MIN_OPERATOR_SKILL_LEVEL:
         operator_condition = next((c for c in conditions if "Operator" in c.name), None)
         if operator_condition and operator_condition.status != "ready":
             violations.append("Insufficient operator skill level available")
 
     if constraints.max_machine_wear:
         machine_wear_condition = next((c for c in conditions if "Machine Wear" in c.name), None)
         if machine_wear_condition and machine_wear_condition.status == "warning":
             violations.append("Machine wear approaching maximum threshold")
 
     room_condition = next((c for c in conditions if "Room Clearance" in c.name), None)
     if room_condition and room_condition.status != "ready":
         violations.append("Room clearance not yet approved")
 
     return violations
 
 
 def calculate_schedule_confidence(
     blockers: List[ProductionConditionInput],
     warnings: List[ProductionConditionInput],
     violations: List[str],
 ) -> float:
     """Calculates schedule confidence based on blockers and warnings"""
     confidence = 1.0
     confidence -= len(blockers) * 0.25
     confidence -= len(warnings) * 0.10
     confidence -= len(violations) * 0.15
     return max(0, min(1, round(confidence, 2)))
 
 
 def generate_optimization_insights(
     groups: List[ScheduleGroupOutput],
     efficiency_gain: float,
     blockers: List[ProductionConditionInput],
 ) -> List[str]:
     """Generates optimization insights for the schedule"""
     insights = []
 
     if efficiency_gain >= Config.TARGET_EFFICIENCY_GAIN:
         insights.append(f"Optimal grouping achieved {efficiency_gain}% cleaning time reduction")
     elif efficiency_gain > 0:
         insights.append(f"Current grouping provides {efficiency_gain}% efficiency gain. Consider batch resequencing for further improvement.")
 
     same_drug_group = next((g for g in groups if g.type == "same-drug-same-density"), None)
     if same_drug_group and len(same_drug_group.batches) >= 5:
         insights.append(f"Large same-product run ({len(same_drug_group.batches)} batches) maximizes throughput")
 
     if blockers:
         insights.append(f"Schedule may be delayed due to {len(blockers)} blocking condition(s)")
 
     no_clean_groups = [g for g in groups if g.cleaning_required == "none"]
     if no_clean_groups:
         batch_count = sum(len(g.batches) for g in no_clean_groups)
         insights.append(f"{batch_count} batches require no cleaning changeover")
 
     return insights
 
 
 def generate_validation_recommendations(
     issues: List[dict],
     equipment_failures: List[dict],
 ) -> List[str]:
     """Generates recommendations based on validation issues"""
     recommendations = []
 
     if equipment_failures:
         recommendations.append("Continue production using backup equipment while maintenance addresses failures")
         recommendations.append("Monitor backup equipment capacity to prevent overload")
 
     error_issues = [i for i in issues if i["severity"] == "error"]
     if error_issues and not equipment_failures:
         recommendations.append("Resolve blocking conditions before proceeding with scheduled batches")
 
     warning_issues = [i for i in issues if i["severity"] == "warning"]
     if warning_issues:
         recommendations.append("Review and address warnings to maintain optimal schedule efficiency")
 
     if not issues:
         recommendations.append("All conditions nominal - proceed with optimized schedule")
 
     return recommendations
 
 
 class SchedulingAgent:
     """Scheduling Agent Service for self-optimizing batch scheduling"""
 
     @staticmethod
     def group_batches(batches: List[BatchOrderInput]) -> List[ScheduleGroupOutput]:
         """Groups batches by drug and density compatibility for optimal sequencing"""
         groups = []
         
         sorted_batches = sorted(batches, key=lambda b: (b.drug, b.density))
 
         # Group 1: Same Drug + Same Density
         same_drug_same_density = group_by_drug_and_density(sorted_batches, True, True)
         if len(same_drug_same_density) >= Config.MIN_BATCH_GROUP_SIZE:
             groups.append(ScheduleGroupOutput(
                 id=generate_id(),
                 type="same-drug-same-density",
                 label="Same Drug + Same Density",
                 batches=same_drug_same_density,
                 cleaning_required="none",
                 cleaning_time_minutes=Config.NO_CLEANING_TIME,
                 estimated_savings=len(same_drug_same_density) * Config.SAME_DRUG_SAME_DENSITY_SAVINGS,
                 sequence_order=1,
                 color="emerald",
             ))
 
         # Group 2: Same Drug + Different Density
         same_drug_diff_density = group_by_drug_and_density(sorted_batches, True, False)
         if len(same_drug_diff_density) >= Config.MIN_BATCH_GROUP_SIZE:
             groups.append(ScheduleGroupOutput(
                 id=generate_id(),
                 type="same-drug-diff-density",
                 label="Same Drug + Different Density",
                 batches=same_drug_diff_density,
                 cleaning_required="partial",
                 cleaning_time_minutes=Config.PARTIAL_CLEANING_TIME,
                 estimated_savings=len(same_drug_diff_density) * Config.SAME_DRUG_DIFF_DENSITY_SAVINGS,
                 sequence_order=2,
                 color="amber",
             ))
 
         # Group 3: Different Drug + Different Density
         diff_drug_diff_density = group_by_drug_and_density(sorted_batches, False, False)
         if diff_drug_diff_density:
             groups.append(ScheduleGroupOutput(
                 id=generate_id(),
                 type="diff-drug-diff-density",
                 label="Different Drug + Different Density",
                 batches=diff_drug_diff_density,
                 cleaning_required="full",
                 cleaning_time_minutes=Config.FULL_CLEANING_TIME,
                 estimated_savings=len(diff_drug_diff_density) * Config.DIFF_DRUG_DIFF_DENSITY_SAVINGS,
                 sequence_order=3,
                 color="rose",
             ))
 
         return groups
 
     @staticmethod
     def optimize_schedule(
         groups: List[ScheduleGroupOutput],
         conditions: List[ProductionConditionInput],
         constraints: Optional[ResourceConstraintInput] = None,
     ) -> ScheduleOptimizationOutput:
         """Optimizes the production schedule based on grouped batches and constraints"""
         constraints = constraints or ResourceConstraintInput()
         
         total_batches = sum(len(g.batches) for g in groups)
         baseline_cleaning_time = total_batches * Config.FULL_CLEANING_TIME
         
         optimized_cleaning_time = sum(
             len(g.batches) * g.cleaning_time_minutes for g in groups
         )
 
         total_savings_minutes = sum(g.estimated_savings for g in groups)
         efficiency_gain = (
             round((1 - optimized_cleaning_time / baseline_cleaning_time) * 100)
             if baseline_cleaning_time > 0 else 0
         )
 
         blockers = [c for c in conditions if c.status == "blocked"]
         warnings = [c for c in conditions if c.status == "warning"]
         constraint_violations = validate_constraints(constraints, conditions)
         confidence = calculate_schedule_confidence(blockers, warnings, constraint_violations)
         insights = generate_optimization_insights(groups, efficiency_gain, blockers)
 
         return ScheduleOptimizationOutput(
             groups=groups,
             total_batches=total_batches,
             total_savings_minutes=total_savings_minutes,
             efficiency_gain=efficiency_gain,
             baseline_cleaning_time=baseline_cleaning_time,
             optimized_cleaning_time=optimized_cleaning_time,
             blockers=[{"unit": b.unit, "name": b.name, "detail": b.detail} for b in blockers],
             warnings=[{"unit": w.unit, "name": w.name, "detail": w.detail} for w in warnings],
             constraint_violations=constraint_violations,
             confidence=confidence,
             insights=insights,
             is_optimal=len(blockers) == 0 and len(constraint_violations) == 0,
         )
 
     @staticmethod
     def validate_schedule(
         groups: List[ScheduleGroupOutput],
         conditions: List[ProductionConditionInput],
         equipment_failures: Optional[List[dict]] = None,
     ) -> ScheduleValidationOutput:
         """Validates a proposed schedule against all constraints and conditions"""
         equipment_failures = equipment_failures or []
         issues = []
 
         for failure in equipment_failures:
             issues.append({
                 "severity": "error",
                 "message": f"{failure['processName']} on {failure['lineId']} is offline - batches diverted to backup",
             })
 
         for condition in conditions:
             if condition.status == "blocked":
                 issues.append({
                     "severity": "error",
                     "message": f"{condition.name} at {condition.unit}: {condition.detail}",
                 })
             elif condition.status == "warning":
                 issues.append({
                     "severity": "warning",
                     "message": f"{condition.name} at {condition.unit}: {condition.detail}",
                 })
 
         for group in groups:
             if not group.batches:
                 issues.append({
                     "severity": "warning",
                     "message": f"Empty batch group: {group.label}",
                 })
 
         full_clean_groups = [g for g in groups if g.cleaning_required == "full"]
         for group in full_clean_groups:
             qa_condition = next(
                 (c for c in conditions if "Room Clearance" in c.name or "QA" in c.name),
                 None
             )
             if qa_condition and qa_condition.status != "ready":
                 issues.append({
                     "severity": "warning",
                     "message": f"QA clearance pending for {group.label} group",
                 })
 
         error_count = sum(1 for i in issues if i["severity"] == "error")
         warning_count = sum(1 for i in issues if i["severity"] == "warning")
 
         return ScheduleValidationOutput(
             is_valid=error_count == 0,
             can_proceed=error_count == 0 or len(equipment_failures) > 0,
             issues=issues,
             error_count=error_count,
             warning_count=warning_count,
             recommendations=generate_validation_recommendations(issues, equipment_failures),
         )