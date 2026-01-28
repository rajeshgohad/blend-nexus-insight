import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  TabletPressSignals,
  BatchProfile,
  DriftDetection,
  OutcomePrediction,
  YieldRecommendation,
  YieldHistoryPoint,
  ParameterTrendPoint,
} from '@/types/tablet-press-yield';

// Import AI Agent from backend
import {
  generateRecommendations as aiGenerateRecommendations,
  predictYield as aiPredictYield,
  detectDrift as aiDetectDrift,
  DEFAULT_SOP_LIMITS,
  DEFAULT_SPECS,
  type TabletPressSignalsInput,
  type BatchProfileInput,
} from '@/backend/agents';

const generateId = () => Math.random().toString(36).substr(2, 9);

const addNoise = (value: number, variance: number) => {
  return value + (Math.random() - 0.5) * 2 * variance;
};

// Re-export SOP limits for use in components (now from backend)
export const SOP_LIMITS = DEFAULT_SOP_LIMITS;

// Re-export specs for use in components (now from backend)
export const SPECS = DEFAULT_SPECS;

export function useTabletPressYield(isActive: boolean, isPaused: boolean) {
  const [signals, setSignals] = useState<TabletPressSignals>({
    weight: 500,
    thickness: 4.5,
    hardness: 12,
    feederSpeed: 28,
    turretSpeed: 45,
    vacuum: -300,
    preCompressionForce: 3.5,
    mainCompressionForce: 15,
  });

  const [batchProfile, setBatchProfile] = useState<BatchProfile>({
    avgWeight: 500,
    weightRSD: 1.2,
    avgThickness: 4.5,
    avgHardness: 12,
    rejectRate: 1.5,
    tabletsProduced: 0,
    tabletsPerMinute: 2400,
    inSpecPercentage: 98.5,
  });

  const [driftDetections, setDriftDetections] = useState<DriftDetection[]>([]);
  
  const [prediction, setPrediction] = useState<OutcomePrediction>({
    currentYield: 96.5,
    correctedYield: 98.2,
    currentRejectRate: 2.1,
    correctedRejectRate: 0.8,
    confidenceLevel: 0.89,
    riskLevel: 'low',
  });

  const [recommendations, setRecommendations] = useState<YieldRecommendation[]>([]);
  const [yieldHistory, setYieldHistory] = useState<YieldHistoryPoint[]>([]);
  const [learningProgress, setLearningProgress] = useState({ episodes: 15847, reward: 0.91 });
  const [parameterTrend, setParameterTrend] = useState<ParameterTrendPoint[]>([]);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const weightHistoryRef = useRef<number[]>([]);
  const tabletsProducedRef = useRef(0);

  // Generate initial recommendations using backend AI agent
  useEffect(() => {
    // Convert signals to backend format
    const signalsInput: TabletPressSignalsInput = {
      ...signals,
      timestamp: new Date(),
    };
    
    const profileInput: BatchProfileInput = {
      batchNumber: 'BN-2024-0001',
      ...batchProfile,
    };
    
    // Use backend AI agent to generate recommendations
    const aiRecs = aiGenerateRecommendations(signalsInput, profileInput, SOP_LIMITS, SPECS);
    
    // Convert to frontend format with additional fields
    const initialRecs: YieldRecommendation[] = aiRecs.map(rec => ({
      ...rec,
      approved: false,
      appliedAt: null,
    }));
    
    // If no recommendations from AI, use defaults
    if (initialRecs.length === 0) {
      const defaultRecs: YieldRecommendation[] = [
        {
          id: generateId(),
          parameter: 'Feeder Speed',
          currentValue: 28,
          recommendedValue: 28.3,
          unit: 'rpm',
          adjustment: '+0.3 rpm',
          expectedImprovement: 0.15,
          sopMin: SOP_LIMITS.feederSpeed.min,
          sopMax: SOP_LIMITS.feederSpeed.max,
          riskLevel: 'low',
          reasoning: 'Slight increase to compensate for gradual weight decrease trend',
          approved: false,
          appliedAt: null,
        },
        {
          id: generateId(),
          parameter: 'Main Compression Force',
          currentValue: 15,
          recommendedValue: 15.5,
          unit: 'kN',
          adjustment: '+0.5 kN',
          expectedImprovement: 0.22,
          sopMin: SOP_LIMITS.mainCompressionForce.min,
          sopMax: SOP_LIMITS.mainCompressionForce.max,
          riskLevel: 'low',
          reasoning: 'Increase hardness to target center; reduces friability rejects',
          approved: false,
          appliedAt: null,
        },
      ];
      setRecommendations(defaultRecs);
    } else {
      setRecommendations(initialRecs);
    }

    // Generate yield history
    const history: YieldHistoryPoint[] = Array.from({ length: 20 }, (_, i) => ({
      batchNumber: `BN-2024-${(847 - 20 + i).toString().padStart(4, '0')}`,
      timestamp: new Date(Date.now() - (20 - i) * 4 * 60 * 60 * 1000),
      actualYield: 94 + Math.random() * 4,
      predictedYield: 95 + Math.random() * 3,
      target: 97,
      rejectRate: 1 + Math.random() * 3,
    }));
    setYieldHistory(history);
  }, []);

  // Approve recommendation
  const approveRecommendation = useCallback((id: string) => {
    setRecommendations(prev => prev.map(rec => 
      rec.id === id 
        ? { ...rec, approved: true, appliedAt: new Date() }
        : rec
    ));
    
    // Simulate applying the change - adjust signals accordingly
    const rec = recommendations.find(r => r.id === id);
    if (rec) {
      setSignals(prev => {
        const updates: Partial<TabletPressSignals> = {};
        if (rec.parameter === 'Feeder Speed') updates.feederSpeed = rec.recommendedValue;
        if (rec.parameter === 'Turret Speed') updates.turretSpeed = rec.recommendedValue;
        if (rec.parameter === 'Main Compression Force') updates.mainCompressionForce = rec.recommendedValue;
        if (rec.parameter === 'Pre-Compression Force') updates.preCompressionForce = rec.recommendedValue;
        return { ...prev, ...updates };
      });

      // Improve prediction
      setPrediction(prev => ({
        ...prev,
        currentYield: Math.min(99, prev.currentYield + rec.expectedImprovement),
        correctedYield: Math.min(99.5, prev.correctedYield + rec.expectedImprovement * 0.3),
      }));
    }
  }, [recommendations]);

  // Main simulation loop
  useEffect(() => {
    if (!isActive || isPaused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      // Update signals with realistic noise
      setSignals(prev => {
        const newWeight = addNoise(prev.weight, 3);
        const newThickness = addNoise(prev.thickness, 0.05);
        const newHardness = addNoise(prev.hardness, 0.5);
        const newFeederSpeed = addNoise(prev.feederSpeed, 0.2);
        const newTurretSpeed = addNoise(prev.turretSpeed, 0.3);

        weightHistoryRef.current.push(newWeight);
        if (weightHistoryRef.current.length > 100) {
          weightHistoryRef.current.shift();
        }

        // Track parameter trend for charts
        const trendPoint: ParameterTrendPoint = {
          timestamp: new Date(),
          weight: newWeight,
          thickness: newThickness,
          hardness: newHardness,
          feederSpeed: newFeederSpeed,
          turretSpeed: newTurretSpeed,
        };
        setParameterTrend(prevTrend => [...prevTrend.slice(-59), trendPoint]);

        return {
          weight: newWeight,
          thickness: newThickness,
          hardness: newHardness,
          feederSpeed: newFeederSpeed,
          turretSpeed: newTurretSpeed,
          vacuum: addNoise(prev.vacuum, 10),
          preCompressionForce: addNoise(prev.preCompressionForce, 0.1),
          mainCompressionForce: addNoise(prev.mainCompressionForce, 0.2),
        };
      });

      // Update tablets produced
      tabletsProducedRef.current += Math.floor(40 + Math.random() * 10);

      // Update batch profile
      setBatchProfile(prev => {
        const weights = weightHistoryRef.current;
        const avgWeight = weights.length > 0 
          ? weights.reduce((a, b) => a + b, 0) / weights.length 
          : 500;
        
        const variance = weights.length > 1
          ? weights.reduce((acc, w) => acc + Math.pow(w - avgWeight, 2), 0) / (weights.length - 1)
          : 0;
        const rsd = avgWeight > 0 ? (Math.sqrt(variance) / avgWeight) * 100 : 0;

        // Calculate in-spec percentage based on weight RSD
        const inSpec = Math.max(95, Math.min(99.9, 99 - rsd * 0.5));

        return {
          ...prev,
          avgWeight,
          weightRSD: rsd,
          avgThickness: addNoise(4.5, 0.02),
          avgHardness: addNoise(12, 0.2),
          rejectRate: addNoise(Math.max(0.5, 3 - inSpec * 0.03), 0.3),
          tabletsProduced: tabletsProducedRef.current,
          tabletsPerMinute: Math.floor(2400 + addNoise(0, 50)),
          inSpecPercentage: inSpec,
        };
      });

      // Use backend AI agent for drift detection on parameter trend
      if (Math.random() < 0.02 && parameterTrend.length > 10) {
        const signalsHistory: TabletPressSignalsInput[] = parameterTrend.map(p => ({
          weight: p.weight,
          thickness: p.thickness,
          hardness: p.hardness,
          feederSpeed: p.feederSpeed,
          turretSpeed: p.turretSpeed,
          vacuum: -300,
          preCompressionForce: 3.5,
          mainCompressionForce: 15,
          timestamp: p.timestamp,
        }));
        
        const detectedDrifts = aiDetectDrift(signalsHistory, 30);
        
        if (detectedDrifts.length > 0) {
          const newDrifts: DriftDetection[] = detectedDrifts.map(d => ({
            id: d.id,
            parameter: d.parameter,
            direction: d.direction,
            magnitude: d.magnitude,
            severity: d.severity,
            detectedAt: d.detectedAt,
            description: d.description,
          }));
          setDriftDetections(prev => [...newDrifts, ...prev].slice(0, 5));
        }
      }

      // Use backend AI agent for yield prediction
      setPrediction(prev => {
        const approvedCount = recommendations.filter(r => r.approved).length;
        
        // Use backend prediction engine
        const predictionResult = aiPredictYield({
          signals: { ...signals, timestamp: new Date() } as TabletPressSignalsInput,
          batchProfile: { batchNumber: 'current', ...batchProfile } as BatchProfileInput,
          historicalYields: yieldHistory.map(h => h.actualYield),
          activeRecommendations: approvedCount,
        });
        
        return {
          currentYield: addNoise(predictionResult.currentYield, 0.3),
          correctedYield: addNoise(predictionResult.correctedYield, 0.2),
          currentRejectRate: addNoise(predictionResult.currentRejectRate, 0.2),
          correctedRejectRate: addNoise(predictionResult.correctedRejectRate, 0.1),
          confidenceLevel: predictionResult.confidenceLevel,
          riskLevel: predictionResult.riskLevel,
        };
      });

      // Update learning progress
      setLearningProgress(prev => ({
        episodes: prev.episodes + Math.floor(Math.random() * 3),
        reward: Math.min(0.98, prev.reward + (Math.random() * 0.0005)),
      }));

    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, isPaused, recommendations]);

  // Reset when deactivated
  useEffect(() => {
    if (!isActive) {
      tabletsProducedRef.current = 0;
      weightHistoryRef.current = [];
      setDriftDetections([]);
      setParameterTrend([]);
      setBatchProfile(prev => ({ ...prev, tabletsProduced: 0 }));
    }
  }, [isActive]);

  return {
    signals,
    batchProfile,
    driftDetections,
    prediction,
    recommendations,
    yieldHistory,
    learningProgress,
    parameterTrend,
    approveRecommendation,
  };
}
