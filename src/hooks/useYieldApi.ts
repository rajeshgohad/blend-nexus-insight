 /**
  * React hook for Yield Optimization Agent API
  */
 import { useState, useCallback } from 'react';
 import { 
   yieldApi, 
   TabletPressSignals, 
   BatchProfile, 
   DriftDetection,
   YieldPrediction,
   YieldRecommendation,
   SOPLimits,
   ProductSpecs 
 } from '@/services/api';
 
 export function useYieldApi() {
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
 
   const detectDrift = useCallback(async (
     signals: TabletPressSignals[],
     windowSize?: number
   ): Promise<DriftDetection[]> => {
     setLoading(true);
     setError(null);
     try {
       const response = await yieldApi.detectDrift(signals, windowSize);
       return response.data || [];
     } catch (err) {
       setError(err instanceof Error ? err.message : 'Failed to detect drift');
       return [];
     } finally {
       setLoading(false);
     }
   }, []);
 
   const predictYield = useCallback(async (input: {
     signals: TabletPressSignals;
     batch_profile: BatchProfile;
     historical_yields?: number[];
     active_recommendations?: number;
   }): Promise<YieldPrediction | null> => {
     setLoading(true);
     setError(null);
     try {
       const response = await yieldApi.predictYield(input);
       return response.data || null;
     } catch (err) {
       setError(err instanceof Error ? err.message : 'Failed to predict yield');
       return null;
     } finally {
       setLoading(false);
     }
   }, []);
 
   const generateRecommendations = useCallback(async (
     signals: TabletPressSignals,
     profile: BatchProfile,
     sopLimits?: SOPLimits,
     specs?: ProductSpecs
   ): Promise<YieldRecommendation[]> => {
     setLoading(true);
     setError(null);
     try {
       const response = await yieldApi.generateRecommendations(signals, profile, sopLimits, specs);
       return response.data || [];
     } catch (err) {
       setError(err instanceof Error ? err.message : 'Failed to generate recommendations');
       return [];
     } finally {
       setLoading(false);
     }
   }, []);
 
   const validateRecommendation = useCallback(async (
     recommendation: YieldRecommendation,
     sopLimits?: SOPLimits
   ): Promise<boolean> => {
     setLoading(true);
     setError(null);
     try {
       const response = await yieldApi.validateRecommendation(recommendation, sopLimits);
       return response.data?.is_valid ?? false;
     } catch (err) {
       setError(err instanceof Error ? err.message : 'Failed to validate recommendation');
       return false;
     } finally {
       setLoading(false);
     }
   }, []);
 
   const getSOPLimits = useCallback(async (): Promise<{
     sop_limits: SOPLimits;
     product_specs: ProductSpecs;
   } | null> => {
     setLoading(true);
     setError(null);
     try {
       const response = await yieldApi.getSOPLimits();
       return response.data || null;
     } catch (err) {
       setError(err instanceof Error ? err.message : 'Failed to get SOP limits');
       return null;
     } finally {
       setLoading(false);
     }
   }, []);
 
   return {
     loading,
     error,
     detectDrift,
     predictYield,
     generateRecommendations,
     validateRecommendation,
     getSOPLimits,
   };
 }