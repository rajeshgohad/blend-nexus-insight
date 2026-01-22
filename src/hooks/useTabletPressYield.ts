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

const generateId = () => Math.random().toString(36).substr(2, 9);

const addNoise = (value: number, variance: number) => {
  return value + (Math.random() - 0.5) * 2 * variance;
};

// SOP limits for parameters
const SOP_LIMITS = {
  feederSpeed: { min: 20, max: 35, unit: 'rpm' },
  turretSpeed: { min: 40, max: 55, unit: 'rpm' },
  preCompressionForce: { min: 2, max: 5, unit: 'kN' },
  mainCompressionForce: { min: 12, max: 20, unit: 'kN' },
  vacuum: { min: -400, max: -200, unit: 'mbar' },
};

// Target specifications
const SPECS = {
  weight: { target: 500, tolerance: 5 }, // ±5% = 475-525mg
  thickness: { target: 4.5, tolerance: 0.2 },
  hardness: { target: 12, min: 8, max: 16 },
};

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

  // Generate initial recommendations
  useEffect(() => {
    const initialRecs: YieldRecommendation[] = [
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
      {
        id: generateId(),
        parameter: 'Turret Speed',
        currentValue: 45,
        recommendedValue: 44.5,
        unit: 'rpm',
        adjustment: '-0.5 rpm',
        expectedImprovement: 0.18,
        sopMin: SOP_LIMITS.turretSpeed.min,
        sopMax: SOP_LIMITS.turretSpeed.max,
        riskLevel: 'low',
        reasoning: 'Minor reduction to improve fill uniformity and reduce %RSD',
        approved: false,
        appliedAt: null,
      },
      {
        id: generateId(),
        parameter: 'Pre-Compression Force',
        currentValue: 3.5,
        recommendedValue: 3.8,
        unit: 'kN',
        adjustment: '+0.3 kN',
        expectedImprovement: 0.12,
        sopMin: SOP_LIMITS.preCompressionForce.min,
        sopMax: SOP_LIMITS.preCompressionForce.max,
        riskLevel: 'low',
        reasoning: 'Better de-aeration reduces capping and lamination',
        approved: false,
        appliedAt: null,
      },
    ];
    setRecommendations(initialRecs);

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

      // Randomly generate drift detections
      if (Math.random() < 0.02) {
        const parameters: DriftDetection['parameter'][] = ['weight', 'thickness', 'hardness', 'feederSpeed', 'turretSpeed'];
        const param = parameters[Math.floor(Math.random() * parameters.length)];
        const direction: DriftDetection['direction'] = Math.random() > 0.5 ? 'increasing' : 'decreasing';
        
        const descriptions: Record<DriftDetection['parameter'], string> = {
          weight: `Tablet weight ${direction} - potential fill depth adjustment needed`,
          thickness: `Thickness ${direction} - check punch wear or compression settings`,
          hardness: `Hardness ${direction} - may affect dissolution profile`,
          feederSpeed: `Feeder speed drift detected - check hopper level`,
          turretSpeed: `Turret speed variation - verify drive belt tension`,
        };

        const newDrift: DriftDetection = {
          id: generateId(),
          parameter: param,
          direction,
          magnitude: 0.5 + Math.random() * 2,
          severity: Math.random() < 0.2 ? 'high' : Math.random() < 0.5 ? 'medium' : 'low',
          detectedAt: new Date(),
          description: descriptions[param],
        };

        setDriftDetections(prev => [newDrift, ...prev].slice(0, 5));
      }

      // Update prediction based on current state
      setPrediction(prev => {
        const approvedCount = recommendations.filter(r => r.approved).length;
        const baseYield = 94 + approvedCount * 0.5;
        
        return {
          currentYield: addNoise(baseYield + 2, 0.3),
          correctedYield: addNoise(baseYield + 3.5, 0.2),
          currentRejectRate: addNoise(Math.max(0.5, 4 - approvedCount * 0.8), 0.2),
          correctedRejectRate: addNoise(Math.max(0.3, 2 - approvedCount * 0.4), 0.1),
          confidenceLevel: Math.min(0.95, 0.85 + approvedCount * 0.02),
          riskLevel: approvedCount >= 2 ? 'low' : 'medium',
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
