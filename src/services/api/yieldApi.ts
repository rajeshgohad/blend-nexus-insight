 /**
  * Yield Optimization Agent API Service
  */
 import { apiRequest, ApiResponse } from './config';
 
 // Types matching Python backend
 export interface TabletPressSignals {
   weight: number;
   thickness: number;
   hardness: number;
   feeder_speed: number;
   turret_speed: number;
   vacuum: number;
   pre_compression_force: number;
   main_compression_force: number;
   timestamp: string;
 }
 
 export interface BatchProfile {
   batch_number: string;
   avg_weight: number;
   weight_rsd: number;
   avg_thickness: number;
   avg_hardness: number;
   reject_rate: number;
   tablets_produced: number;
   tablets_per_minute: number;
   in_spec_percentage: number;
 }
 
 export interface DriftDetection {
   id: string;
   parameter: 'weight' | 'thickness' | 'hardness' | 'feederSpeed' | 'turretSpeed';
   direction: 'increasing' | 'decreasing';
   magnitude: number;
   severity: 'low' | 'medium' | 'high';
   detected_at: string;
   description: string;
   recommended_action: string;
 }
 
 export interface YieldPrediction {
   current_yield: number;
   corrected_yield: number;
   current_reject_rate: number;
   corrected_reject_rate: number;
   confidence_level: number;
   risk_level: 'low' | 'medium' | 'high';
   potential_improvement: number;
 }
 
 export interface YieldRecommendation {
   id: string;
   parameter: string;
   current_value: number;
   recommended_value: number;
   unit: string;
   adjustment: string;
   expected_improvement: number;
   sop_min: number;
   sop_max: number;
   risk_level: 'low' | 'medium';
   reasoning: string;
 }
 
 export interface SOPLimits {
   feeder_speed: { min: number; max: number; unit: string };
   turret_speed: { min: number; max: number; unit: string };
   pre_compression_force: { min: number; max: number; unit: string };
   main_compression_force: { min: number; max: number; unit: string };
   vacuum: { min: number; max: number; unit: string };
 }
 
 export interface ProductSpecs {
   weight: { target: number; tolerance: number };
   thickness: { target: number; tolerance: number };
   hardness: { target: number; min: number; max: number };
 }
 
 export const yieldApi = {
   /**
    * Detect parameter drift
    */
   detectDrift: async (
     signals: TabletPressSignals[],
     windowSize?: number
   ): Promise<ApiResponse<DriftDetection[]>> => {
     return apiRequest('/api/yield/detect-drift', {
       method: 'POST',
       body: JSON.stringify({ signals, window_size: windowSize }),
     });
   },
 
   /**
    * Predict yield
    */
   predictYield: async (input: {
     signals: TabletPressSignals;
     batch_profile: BatchProfile;
     historical_yields?: number[];
     active_recommendations?: number;
   }): Promise<ApiResponse<YieldPrediction>> => {
     return apiRequest('/api/yield/predict', {
       method: 'POST',
       body: JSON.stringify(input),
     });
   },
 
   /**
    * Generate recommendations
    */
   generateRecommendations: async (
     signals: TabletPressSignals,
     profile: BatchProfile,
     sopLimits?: SOPLimits,
     specs?: ProductSpecs
   ): Promise<ApiResponse<YieldRecommendation[]>> => {
     return apiRequest('/api/yield/recommendations', {
       method: 'POST',
       body: JSON.stringify({
         signals,
         profile,
         sop_limits: sopLimits,
         specs,
       }),
     });
   },
 
   /**
    * Validate recommendation
    */
   validateRecommendation: async (
     recommendation: YieldRecommendation,
     sopLimits?: SOPLimits
   ): Promise<ApiResponse<{ is_valid: boolean }>> => {
     return apiRequest('/api/yield/validate-recommendation', {
       method: 'POST',
       body: JSON.stringify({ recommendation, sop_limits: sopLimits }),
     });
   },
 
   /**
    * Get SOP limits
    */
   getSOPLimits: async (): Promise<ApiResponse<{ sop_limits: SOPLimits; product_specs: ProductSpecs }>> => {
     return apiRequest('/api/yield/sop-limits', {
       method: 'GET',
     });
   },
 };