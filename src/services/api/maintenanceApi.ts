 /**
  * Maintenance Agent API Service
  */
 import { apiRequest, ApiResponse } from './config';
 
 // Types matching Python backend
 export interface ComponentHealth {
   name: string;
   health: number;
   rul: number;
   trend: 'stable' | 'declining' | 'critical';
   failure_probability?: number;
   last_maintenance?: string;
   predicted_failure_date?: string;
 }
 
 export interface SensorData {
   vibration: number;
   motor_load: number;
   temperature: number;
   timestamp: string;
 }
 
 export interface ScheduledBatch {
   batch_id?: string;
   id?: string;
   batch_number?: string;
   product_name?: string;
   start_time: string;
   end_time: string;
   status?: 'queued' | 'in-progress' | 'completed' | 'delayed';
 }
 
 export interface MaintenanceDecision {
   component_name: string;
   requires_maintenance: boolean;
   maintenance_type: 'general' | 'spare_replacement' | null;
   reasoning: string;
   suggested_time: string | null;
   machine_idle_window: { start: string; end: string } | null;
   priority: 'low' | 'medium' | 'high' | 'critical';
   estimated_duration: number;
 }
 
 export interface RULPrediction {
   component_name: string;
   predicted_rul: number;
   confidence_level: number;
   degradation_rate: number;
   failure_probability: number;
   predicted_failure_date: string;
 }
 
 export interface Anomaly {
   id: string;
   timestamp: string;
   source: string;
   severity: 'low' | 'medium' | 'high';
   description: string;
 }
 
 export const maintenanceApi = {
   /**
    * Analyze component for maintenance requirements
    */
   analyzeComponent: async (
     component: ComponentHealth,
     schedule: ScheduledBatch[] = []
   ): Promise<ApiResponse<MaintenanceDecision>> => {
     return apiRequest('/api/maintenance/analyze-component', {
       method: 'POST',
       body: JSON.stringify({ component, schedule }),
     });
   },
 
   /**
    * Predict Remaining Useful Life
    */
   predictRUL: async (input: {
     component_name: string;
     current_health: number;
     operating_hours: number;
     vibration_level: number;
     temperature_delta: number;
     motor_load_avg: number;
   }): Promise<ApiResponse<RULPrediction>> => {
     return apiRequest('/api/maintenance/predict-rul', {
       method: 'POST',
       body: JSON.stringify(input),
     });
   },
 
   /**
    * Detect anomalies from sensor data
    */
   detectAnomalies: async (
     sensorData: SensorData[],
     thresholds?: { vibration?: number; temperature?: number; motor_load?: number }
   ): Promise<ApiResponse<Anomaly[]>> => {
     return apiRequest('/api/maintenance/detect-anomalies', {
       method: 'POST',
       body: JSON.stringify({ sensor_data: sensorData, thresholds }),
     });
   },
 
   /**
    * Find idle window for maintenance
    */
   findIdleWindow: async (
     schedule: ScheduledBatch[],
     durationHours: number
   ): Promise<ApiResponse<{ start: string; end: string } | null>> => {
     return apiRequest('/api/maintenance/find-idle-window', {
       method: 'POST',
       body: JSON.stringify({ schedule, duration_hours: durationHours }),
     });
   },
 };