 /**
  * React hook for Maintenance Agent API
  */
 import { useState, useCallback } from 'react';
 import { 
   maintenanceApi, 
   ComponentHealth, 
   ScheduledBatch, 
   MaintenanceDecision,
   RULPrediction,
   SensorData,
   Anomaly 
 } from '@/services/api';
 
 export function useMaintenanceApi() {
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
 
   const analyzeComponent = useCallback(async (
     component: ComponentHealth,
     schedule: ScheduledBatch[] = []
   ): Promise<MaintenanceDecision | null> => {
     setLoading(true);
     setError(null);
     try {
       const response = await maintenanceApi.analyzeComponent(component, schedule);
       return response.data || null;
     } catch (err) {
       setError(err instanceof Error ? err.message : 'Failed to analyze component');
       return null;
     } finally {
       setLoading(false);
     }
   }, []);
 
   const predictRUL = useCallback(async (input: {
     component_name: string;
     current_health: number;
     operating_hours: number;
     vibration_level: number;
     temperature_delta: number;
     motor_load_avg: number;
   }): Promise<RULPrediction | null> => {
     setLoading(true);
     setError(null);
     try {
       const response = await maintenanceApi.predictRUL(input);
       return response.data || null;
     } catch (err) {
       setError(err instanceof Error ? err.message : 'Failed to predict RUL');
       return null;
     } finally {
       setLoading(false);
     }
   }, []);
 
   const detectAnomalies = useCallback(async (
     sensorData: SensorData[],
     thresholds?: { vibration?: number; temperature?: number; motor_load?: number }
   ): Promise<Anomaly[]> => {
     setLoading(true);
     setError(null);
     try {
       const response = await maintenanceApi.detectAnomalies(sensorData, thresholds);
       return response.data || [];
     } catch (err) {
       setError(err instanceof Error ? err.message : 'Failed to detect anomalies');
       return [];
     } finally {
       setLoading(false);
     }
   }, []);
 
   const findIdleWindow = useCallback(async (
     schedule: ScheduledBatch[],
     durationHours: number
   ): Promise<{ start: string; end: string } | null> => {
     setLoading(true);
     setError(null);
     try {
       const response = await maintenanceApi.findIdleWindow(schedule, durationHours);
       return response.data || null;
     } catch (err) {
       setError(err instanceof Error ? err.message : 'Failed to find idle window');
       return null;
     } finally {
       setLoading(false);
     }
   }, []);
 
   return {
     loading,
     error,
     analyzeComponent,
     predictRUL,
     detectAnomalies,
     findIdleWindow,
   };
 }