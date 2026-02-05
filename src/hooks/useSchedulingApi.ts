 /**
  * React hook for Scheduling Agent API
  */
 import { useState, useCallback } from 'react';
 import { 
   schedulingApi, 
   BatchOrder, 
   ScheduleGroup, 
   ProductionCondition,
   ResourceConstraint,
   ScheduleOptimization,
   ScheduleValidation 
 } from '@/services/api';
 
 export function useSchedulingApi() {
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
 
   const groupBatches = useCallback(async (
     batches: BatchOrder[]
   ): Promise<ScheduleGroup[]> => {
     setLoading(true);
     setError(null);
     try {
       const response = await schedulingApi.groupBatches(batches);
       return response.data || [];
     } catch (err) {
       setError(err instanceof Error ? err.message : 'Failed to group batches');
       return [];
     } finally {
       setLoading(false);
     }
   }, []);
 
   const optimizeSchedule = useCallback(async (
     groups: ScheduleGroup[],
     conditions: ProductionCondition[],
     constraints?: ResourceConstraint
   ): Promise<ScheduleOptimization | null> => {
     setLoading(true);
     setError(null);
     try {
       const response = await schedulingApi.optimizeSchedule(groups, conditions, constraints);
       return response.data || null;
     } catch (err) {
       setError(err instanceof Error ? err.message : 'Failed to optimize schedule');
       return null;
     } finally {
       setLoading(false);
     }
   }, []);
 
   const validateSchedule = useCallback(async (
     groups: ScheduleGroup[],
     conditions: ProductionCondition[],
     equipmentFailures?: Array<{ lineId: string; processName: string }>
   ): Promise<ScheduleValidation | null> => {
     setLoading(true);
     setError(null);
     try {
       const response = await schedulingApi.validateSchedule(groups, conditions, equipmentFailures);
       return response.data || null;
     } catch (err) {
       setError(err instanceof Error ? err.message : 'Failed to validate schedule');
       return null;
     } finally {
       setLoading(false);
     }
   }, []);
 
   return {
     loading,
     error,
     groupBatches,
     optimizeSchedule,
     validateSchedule,
   };
 }