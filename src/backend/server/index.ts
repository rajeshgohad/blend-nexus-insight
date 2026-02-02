/**
 * Express.js Server for AI Agents
 * 
 * REST API server exposing maintenance and yield optimization agents
 * with proper error handling, authentication, and request validation.
 * 
 * SETUP:
 * 1. Copy this entire 'server' folder to a separate Node.js project
 * 2. npm install express cors
 * 3. npm install -D typescript @types/express @types/cors @types/node ts-node
 * 4. npx ts-node index.ts
 */

// Note: These imports require Express to be installed
// npm install express cors @types/express @types/cors
// @ts-nocheck - This file is meant to run outside the Vite frontend build

import express from 'express';
import cors from 'cors';

// Import agents - adjust path based on your deployment structure
import { MaintenanceAgent, YieldOptimizationAgent, VisionAgent, SchedulingAgent } from '../agents';
import { DEFAULT_SOP_LIMITS, DEFAULT_SPECS } from '../agents/yield-optimization-agent';

// ============================================================
// CONFIGURATION
// ============================================================

const PORT = process.env.PORT || 3001;
const API_KEY = process.env.AI_AGENTS_API_KEY || 'dev-api-key-change-in-production';

// ============================================================
// EXPRESS APP SETUP
// ============================================================

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ============================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================

function authenticateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  
  if (!apiKey || apiKey !== API_KEY) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid or missing API key',
    });
  }
  
  next();
}

// ============================================================
// ERROR HANDLING
// ============================================================

function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${err.message}`, err.stack);
  
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.name || 'InternalServerError',
    message: err.message || 'An unexpected error occurred',
  });
}

function createValidationError(message) {
  const error = new Error(message);
  error.name = 'ValidationError';
  error.statusCode = 400;
  return error;
}

// ============================================================
// HEALTH CHECK
// ============================================================

app.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'AI Agents API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    agents: ['maintenance', 'yield-optimization', 'vision', 'scheduling'],
  });
});

// ============================================================
// MAINTENANCE AGENT ENDPOINTS
// ============================================================

// POST /api/maintenance/analyze-component
app.post('/api/maintenance/analyze-component', authenticateApiKey, (req, res, next) => {
  try {
    const { component, schedule = [] } = req.body;
    
    if (!component) throw createValidationError('Missing required field: component');
    
    const scheduleInput = schedule.map(s => ({
      batchId: s.batchId,
      startTime: new Date(s.startTime),
      endTime: new Date(s.endTime),
    }));
    
    const result = MaintenanceAgent.analyzeComponent(component, scheduleInput);
    
    res.json({
      success: true,
      data: {
        ...result,
        suggestedTime: result.suggestedTime?.toISOString() || null,
        machineIdleWindow: result.machineIdleWindow ? {
          start: result.machineIdleWindow.start.toISOString(),
          end: result.machineIdleWindow.end.toISOString(),
        } : null,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/maintenance/predict-rul
app.post('/api/maintenance/predict-rul', authenticateApiKey, (req, res, next) => {
  try {
    const required = ['componentName', 'currentHealth', 'operatingHours', 'vibrationLevel', 'temperatureDelta', 'motorLoadAvg'];
    for (const field of required) {
      if (req.body[field] === undefined) throw createValidationError(`Missing required field: ${field}`);
    }
    
    const result = MaintenanceAgent.predictRUL(req.body);
    
    res.json({
      success: true,
      data: {
        ...result,
        predictedFailureDate: result.predictedFailureDate.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/maintenance/detect-anomalies
app.post('/api/maintenance/detect-anomalies', authenticateApiKey, (req, res, next) => {
  try {
    const { sensorData, thresholds } = req.body;
    
    if (!Array.isArray(sensorData) || sensorData.length === 0) {
      throw createValidationError('sensorData must be a non-empty array');
    }
    
    const parsedData = sensorData.map(d => ({
      ...d,
      timestamp: new Date(d.timestamp),
    }));
    
    const result = MaintenanceAgent.detectAnomalies(parsedData, thresholds?.vibration);
    
    res.json({
      success: true,
      data: result.map(a => ({
        ...a,
        timestamp: a.timestamp.toISOString(),
      })),
      count: result.length,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/maintenance/find-idle-window
app.post('/api/maintenance/find-idle-window', authenticateApiKey, (req, res, next) => {
  try {
    const { schedule = [], durationHours } = req.body;
    
    if (durationHours === undefined) throw createValidationError('Missing required field: durationHours');
    
    const scheduleInput = schedule.map(s => ({
      batchId: s.batchId,
      startTime: new Date(s.startTime),
      endTime: new Date(s.endTime),
    }));
    
    const result = MaintenanceAgent.findIdleWindow(scheduleInput, durationHours);
    
    res.json({
      success: true,
      data: result ? {
        start: result.start.toISOString(),
        end: result.end.toISOString(),
      } : null,
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// YIELD OPTIMIZATION ENDPOINTS
// ============================================================

// POST /api/yield/detect-drift
app.post('/api/yield/detect-drift', authenticateApiKey, (req, res, next) => {
  try {
    const { signals, windowSize } = req.body;
    
    if (!Array.isArray(signals) || signals.length === 0) {
      throw createValidationError('signals must be a non-empty array');
    }
    
    const parsedSignals = signals.map(s => ({
      ...s,
      timestamp: new Date(s.timestamp),
    }));
    
    const result = YieldOptimizationAgent.detectDrift(parsedSignals, windowSize);
    
    res.json({
      success: true,
      data: result.map(d => ({
        ...d,
        detectedAt: d.detectedAt.toISOString(),
      })),
      count: result.length,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/yield/predict
app.post('/api/yield/predict', authenticateApiKey, (req, res, next) => {
  try {
    const { signals, batchProfile, historicalYields = [], activeRecommendations = 0 } = req.body;
    
    if (!signals) throw createValidationError('Missing required field: signals');
    if (!batchProfile) throw createValidationError('Missing required field: batchProfile');
    
    const input = {
      signals: { ...signals, timestamp: new Date(signals.timestamp) },
      batchProfile,
      historicalYields,
      activeRecommendations,
    };
    
    const result = YieldOptimizationAgent.predictYield(input);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/yield/recommendations
app.post('/api/yield/recommendations', authenticateApiKey, (req, res, next) => {
  try {
    const { signals, profile, sopLimits, specs } = req.body;
    
    if (!signals) throw createValidationError('Missing required field: signals');
    if (!profile) throw createValidationError('Missing required field: profile');
    
    const parsedSignals = { ...signals, timestamp: new Date(signals.timestamp) };
    
    const result = YieldOptimizationAgent.generateRecommendations(
      parsedSignals,
      profile,
      sopLimits,
      specs
    );
    
    res.json({
      success: true,
      data: result,
      count: result.length,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/yield/validate-recommendation
app.post('/api/yield/validate-recommendation', authenticateApiKey, (req, res, next) => {
  try {
    const { recommendation, sopLimits } = req.body;
    
    if (!recommendation) throw createValidationError('Missing required field: recommendation');
    
    const isValid = YieldOptimizationAgent.validateRecommendation(recommendation, sopLimits);
    
    res.json({
      success: true,
      data: { isValid },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/yield/sop-limits
app.get('/api/yield/sop-limits', authenticateApiKey, (req, res) => {
  res.json({
    success: true,
    data: {
      sopLimits: DEFAULT_SOP_LIMITS,
      productSpecs: DEFAULT_SPECS,
    },
  });
});

// ============================================================
// VISION QC AGENT ENDPOINTS
// ============================================================

// POST /api/vision/analyze-detection
app.post('/api/vision/analyze-detection', authenticateApiKey, (req, res, next) => {
  try {
    const { detection } = req.body;
    
    if (!detection) throw createValidationError('Missing required field: detection');
    
    const parsedDetection = {
      ...detection,
      timestamp: detection.timestamp ? new Date(detection.timestamp) : new Date(),
    };
    
    const result = VisionAgent.analyzeDetection(parsedDetection);
    
    res.json({
      success: true,
      data: {
        ...result,
        timestamp: result.timestamp.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/vision/detect-baseline-deviation
app.post('/api/vision/detect-baseline-deviation', authenticateApiKey, (req, res, next) => {
  try {
    const { current, baseline } = req.body;
    
    if (!current) throw createValidationError('Missing required field: current');
    
    const result = VisionAgent.detectBaselineDeviation(current, baseline);
    
    res.json({
      success: true,
      data: result.map(d => ({
        ...d,
        detectedAt: d.detectedAt.toISOString(),
      })),
      count: result.length,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/vision/route-alert
app.post('/api/vision/route-alert', authenticateApiKey, (req, res, next) => {
  try {
    const { detection } = req.body;
    
    if (!detection) throw createValidationError('Missing required field: detection');
    
    const parsedDetection = {
      ...detection,
      timestamp: new Date(detection.timestamp),
    };
    
    const result = VisionAgent.routeAlert(parsedDetection);
    
    res.json({
      success: true,
      data: {
        ...result,
        responseDeadline: result.responseDeadline.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/vision/analyze-metrics
app.post('/api/vision/analyze-metrics', authenticateApiKey, (req, res, next) => {
  try {
    const { detections, baselineMetrics, totalInspections } = req.body;
    
    if (!Array.isArray(detections)) throw createValidationError('detections must be an array');
    if (!baselineMetrics) throw createValidationError('Missing required field: baselineMetrics');
    if (totalInspections === undefined) throw createValidationError('Missing required field: totalInspections');
    
    const parsedDetections = detections.map(d => ({
      ...d,
      timestamp: new Date(d.timestamp),
    }));
    
    const result = VisionAgent.analyzeVisionMetrics({
      detections: parsedDetections,
      baselineMetrics,
      totalInspections,
    });
    
    res.json({
      success: true,
      data: {
        ...result,
        baselineDeviations: result.baselineDeviations.map(d => ({
          ...d,
          detectedAt: d.detectedAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// SCHEDULING AGENT ENDPOINTS
// ============================================================

// POST /api/scheduling/group-batches
app.post('/api/scheduling/group-batches', authenticateApiKey, (req, res, next) => {
  try {
    const { batches } = req.body;
    
    if (!Array.isArray(batches) || batches.length === 0) {
      throw createValidationError('batches must be a non-empty array');
    }
    
    const result = SchedulingAgent.groupBatches(batches);
    
    res.json({
      success: true,
      data: result,
      count: result.length,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/scheduling/optimize
app.post('/api/scheduling/optimize', authenticateApiKey, (req, res, next) => {
  try {
    const { groups, conditions, constraints } = req.body;
    
    if (!Array.isArray(groups)) throw createValidationError('groups must be an array');
    if (!Array.isArray(conditions)) throw createValidationError('conditions must be an array');
    
    const result = SchedulingAgent.optimizeSchedule(groups, conditions, constraints);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/scheduling/validate
app.post('/api/scheduling/validate', authenticateApiKey, (req, res, next) => {
  try {
    const { groups, conditions, equipmentFailures = [] } = req.body;
    
    if (!Array.isArray(groups)) throw createValidationError('groups must be an array');
    if (!Array.isArray(conditions)) throw createValidationError('conditions must be an array');
    
    const result = SchedulingAgent.validateSchedule(groups, conditions, equipmentFailures);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// 404 & ERROR HANDLERS
// ============================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'NotFound',
    message: 'The requested endpoint does not exist',
  });
});

app.use(errorHandler);

// ============================================================
// SERVER STARTUP
// ============================================================

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n🚀 AI Agents API Server running on http://localhost:${PORT}`);
    console.log(`\n📚 Available endpoints:`);
    console.log(`   GET  /health`);
    console.log(`   POST /api/maintenance/analyze-component`);
    console.log(`   POST /api/maintenance/predict-rul`);
    console.log(`   POST /api/maintenance/detect-anomalies`);
    console.log(`   POST /api/maintenance/find-idle-window`);
    console.log(`   POST /api/yield/detect-drift`);
    console.log(`   POST /api/yield/predict`);
    console.log(`   POST /api/yield/recommendations`);
    console.log(`   POST /api/yield/validate-recommendation`);
    console.log(`   GET  /api/yield/sop-limits`);
    console.log(`   POST /api/vision/analyze-detection`);
    console.log(`   POST /api/vision/detect-baseline-deviation`);
    console.log(`   POST /api/vision/route-alert`);
    console.log(`   POST /api/vision/analyze-metrics`);
    console.log(`   POST /api/scheduling/group-batches`);
    console.log(`   POST /api/scheduling/optimize`);
    console.log(`   POST /api/scheduling/validate`);
    console.log(`\n🔐 Authentication: x-api-key header required`);
    console.log(`   Dev key: ${API_KEY}\n`);
  });
}

export default app;
