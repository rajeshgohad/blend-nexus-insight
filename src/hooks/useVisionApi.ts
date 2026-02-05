 /**
  * React hook for Vision QC Agent API
  */
 import { useState, useCallback } from 'react';
 import { 
   visionApi, 
   VisionDetectionInput,
   VisionDetection, 
   BaselineMetrics, 
   BaselineDeviation,
   AlertRouting,
   VisionAnalysis 
 } from '@/services/api';
 
 export function useVisionApi() {
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
 
   const analyzeDetection = useCallback(async (
     detection: VisionDetectionInput
   ): Promise<VisionDetection | null> => {
     setLoading(true);
     setError(null);
     try {
       const response = await visionApi.analyzeDetection(detection);
       return response.data || null;
     } catch (err) {
       setError(err instanceof Error ? err.message : 'Failed to analyze detection');
       return null;
     } finally {
       setLoading(false);
     }
   }, []);
 
   const detectBaselineDeviation = useCallback(async (
     current: BaselineMetrics,
     baseline?: BaselineMetrics
   ): Promise<BaselineDeviation[]> => {
     setLoading(true);
     setError(null);
     try {
       const response = await visionApi.detectBaselineDeviation(current, baseline);
       return response.data || [];
     } catch (err) {
       setError(err instanceof Error ? err.message : 'Failed to detect baseline deviation');
       return [];
     } finally {
       setLoading(false);
     }
   }, []);
 
   const routeAlert = useCallback(async (
     detection: VisionDetection
   ): Promise<AlertRouting | null> => {
     setLoading(true);
     setError(null);
     try {
       const response = await visionApi.routeAlert(detection);
       return response.data || null;
     } catch (err) {
       setError(err instanceof Error ? err.message : 'Failed to route alert');
       return null;
     } finally {
       setLoading(false);
     }
   }, []);
 
   const analyzeMetrics = useCallback(async (
     detections: VisionDetection[],
     baselineMetrics: BaselineMetrics,
     totalInspections: number
   ): Promise<VisionAnalysis | null> => {
     setLoading(true);
     setError(null);
     try {
       const response = await visionApi.analyzeMetrics(detections, baselineMetrics, totalInspections);
       return response.data || null;
     } catch (err) {
       setError(err instanceof Error ? err.message : 'Failed to analyze metrics');
       return null;
     } finally {
       setLoading(false);
     }
   }, []);
 
   return {
     loading,
     error,
     analyzeDetection,
     detectBaselineDeviation,
     routeAlert,
     analyzeMetrics,
   };
 }