// Types for Tablet Press Yield Optimization

export interface TabletPressSignals {
  weight: number;           // mg - individual tablet weight
  thickness: number;        // mm
  hardness: number;         // kP (kiloponds)
  feederSpeed: number;      // rpm
  turretSpeed: number;      // rpm
  vacuum: number;           // mbar
  preCompressionForce: number;  // kN
  mainCompressionForce: number; // kN
}

export interface BatchProfile {
  avgWeight: number;        // mg
  weightRSD: number;        // % RSD (Relative Standard Deviation)
  avgThickness: number;     // mm
  avgHardness: number;      // kP
  rejectRate: number;       // rejects per minute
  tabletsProduced: number;  // total count
  tabletsPerMinute: number; // production rate
  inSpecPercentage: number; // % tablets within spec
}

export interface DriftDetection {
  id: string;
  parameter: 'weight' | 'thickness' | 'hardness' | 'feederSpeed' | 'turretSpeed';
  direction: 'increasing' | 'decreasing';
  magnitude: number;        // % change
  severity: 'low' | 'medium' | 'high';
  detectedAt: Date;
  description: string;
}

export interface OutcomePrediction {
  currentYield: number;     // predicted yield if no changes (%)
  correctedYield: number;   // predicted yield with corrections (%)
  currentRejectRate: number;    // rejects/min if no changes
  correctedRejectRate: number;  // rejects/min with corrections
  confidenceLevel: number;  // AI model confidence (0-1)
  riskLevel: 'low' | 'medium' | 'high';
}

export interface YieldRecommendation {
  id: string;
  parameter: string;
  currentValue: number;
  recommendedValue: number;
  unit: string;
  adjustment: string;       // e.g., "+0.2 rpm"
  expectedImprovement: number; // % yield improvement
  sopMin: number;           // SOP lower limit
  sopMax: number;           // SOP upper limit
  riskLevel: 'low' | 'medium';
  reasoning: string;
  approved: boolean;
  appliedAt: Date | null;
}

export interface YieldHistoryPoint {
  batchNumber: string;
  timestamp: Date;
  actualYield: number;
  predictedYield: number;
  target: number;
  rejectRate: number;
}
