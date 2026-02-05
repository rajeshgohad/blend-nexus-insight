 /**
  * Scheduling Agent API Service
  */
 import { apiRequest, ApiResponse } from './config';
 
 // Types matching Python backend
 export interface BatchOrder {
   id: string;
   batch_number: string;
   product_name: string;
   drug: string;
   density: 'low' | 'medium' | 'high';
   status: 'queued' | 'in-progress' | 'completed';
   estimated_duration: number;
   priority?: number;
 }
 
 export interface ScheduleGroup {
   id: string;
   type: 'same-drug-same-density' | 'same-drug-diff-density' | 'diff-drug-diff-density';
   label: string;
   batches: BatchOrder[];
   cleaning_required: 'none' | 'partial' | 'full';
   cleaning_time_minutes: number;
   estimated_savings: number;
   sequence_order: number;
   color: string;
 }
 
 export interface ProductionCondition {
   id: string;
   unit: string;
   name: string;
   status: 'ready' | 'warning' | 'blocked';
   detail: string;
 }
 
 export interface ResourceConstraint {
   min_operator_skill?: number;
   max_machine_wear?: number;
   required_certifications?: string[];
 }
 
 export interface ScheduleOptimization {
   groups: ScheduleGroup[];
   total_batches: number;
   total_savings_minutes: number;
   efficiency_gain: number;
   baseline_cleaning_time: number;
   optimized_cleaning_time: number;
   blockers: Array<{ unit: string; name: string; detail: string }>;
   warnings: Array<{ unit: string; name: string; detail: string }>;
   constraint_violations: string[];
   confidence: number;
   insights: string[];
   is_optimal: boolean;
 }
 
 export interface ScheduleValidation {
   is_valid: boolean;
   can_proceed: boolean;
   issues: Array<{ severity: 'warning' | 'error'; message: string }>;
   error_count: number;
   warning_count: number;
   recommendations: string[];
 }
 
 export const schedulingApi = {
   /**
    * Group batches by compatibility
    */
   groupBatches: async (
     batches: BatchOrder[]
   ): Promise<ApiResponse<ScheduleGroup[]>> => {
     return apiRequest('/api/scheduling/group-batches', {
       method: 'POST',
       body: JSON.stringify({ batches }),
     });
   },
 
   /**
    * Optimize schedule
    */
   optimizeSchedule: async (
     groups: ScheduleGroup[],
     conditions: ProductionCondition[],
     constraints?: ResourceConstraint
   ): Promise<ApiResponse<ScheduleOptimization>> => {
     return apiRequest('/api/scheduling/optimize', {
       method: 'POST',
       body: JSON.stringify({ groups, conditions, constraints }),
     });
   },
 
   /**
    * Validate schedule
    */
   validateSchedule: async (
     groups: ScheduleGroup[],
     conditions: ProductionCondition[],
     equipmentFailures?: Array<{ lineId: string; processName: string }>
   ): Promise<ApiResponse<ScheduleValidation>> => {
     return apiRequest('/api/scheduling/validate', {
       method: 'POST',
       body: JSON.stringify({
         groups,
         conditions,
         equipment_failures: equipmentFailures,
       }),
     });
   },
 };