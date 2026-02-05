 /**
  * Vision QC Agent API Service
  */
 import { apiRequest, ApiResponse } from './config';
 
 // Types matching Python backend
 export interface VisionDetectionInput {
   id: string;
   type: 'ppe_violation' | 'surface_damage' | 'leak' | 'contamination' | 'safety_hazard';
   location: string;
   confidence: number;
   raw_image_data?: string;
   timestamp?: string;
 }
 
 export interface VisionDetection {
   id: string;
   type: 'ppe_violation' | 'surface_damage' | 'leak' | 'contamination' | 'safety_hazard';
   severity: 'minor' | 'moderate' | 'critical';
   location: string;
   timestamp: string;
   confidence: number;
   recommendation: string;
   priority_score: number;
   alert_recipients: string[];
   status: 'detected' | 'investigating' | 'resolved';
   requires_immediate: boolean;
 }
 
 export interface BaselineMetrics {
   ppe_compliance: number;
   surface_condition: number;
   environmental_norm: number;
   safety_score: number;
 }
 
 export interface BaselineDeviation {
   id: string;
   metric: string;
   baseline_value: number;
   current_value: number;
   deviation: number;
   severity: 'low' | 'medium' | 'high';
   detected_at: string;
   trend: 'stable' | 'declining' | 'improving';
   recommended_action: string;
 }
 
 export interface AlertRouting {
   detection_id: string;
   recipients: string[];
   notification_methods: ('push' | 'sms' | 'email' | 'alarm')[];
   escalation_path: string[];
   response_deadline: string;
   auto_escalate: boolean;
   workflow_integrations: string[];
 }
 
 export interface VisionAnalysis {
   rft_percentage: number;
   total_detections: number;
   critical_count: number;
   moderate_count: number;
   minor_count: number;
   unresolved_count: number;
   baseline_deviations: BaselineDeviation[];
   risk_level: 'low' | 'medium' | 'high';
   recommendations: string[];
   confidence_score: number;
 }
 
 export const visionApi = {
   /**
    * Analyze a detection
    */
   analyzeDetection: async (
     detection: VisionDetectionInput
   ): Promise<ApiResponse<VisionDetection>> => {
     return apiRequest('/api/vision/analyze-detection', {
       method: 'POST',
       body: JSON.stringify({ detection }),
     });
   },
 
   /**
    * Detect baseline deviation
    */
   detectBaselineDeviation: async (
     current: BaselineMetrics,
     baseline?: BaselineMetrics
   ): Promise<ApiResponse<BaselineDeviation[]>> => {
     return apiRequest('/api/vision/detect-baseline-deviation', {
       method: 'POST',
       body: JSON.stringify({ current, baseline }),
     });
   },
 
   /**
    * Route alert
    */
   routeAlert: async (
     detection: VisionDetection
   ): Promise<ApiResponse<AlertRouting>> => {
     return apiRequest('/api/vision/route-alert', {
       method: 'POST',
       body: JSON.stringify({ detection }),
     });
   },
 
   /**
    * Analyze vision metrics
    */
   analyzeMetrics: async (
     detections: VisionDetection[],
     baselineMetrics: BaselineMetrics,
     totalInspections: number
   ): Promise<ApiResponse<VisionAnalysis>> => {
     return apiRequest('/api/vision/analyze-metrics', {
       method: 'POST',
       body: JSON.stringify({
         detections,
         baseline_metrics: baselineMetrics,
         total_inspections: totalInspections,
       }),
     });
   },
 };