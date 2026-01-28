# Backend AI Agents

This folder contains the AI agent logic that powers the PharmaMES dashboard. The code is structured to be **platform-agnostic** and can be deployed as standalone backend services on any Node.js platform.

## Structure

```
backend/
├── agents/
│   ├── index.ts                    # Main exports
│   ├── types.ts                    # TypeScript interfaces
│   ├── maintenance-agent.ts        # Predictive maintenance AI
│   └── yield-optimization-agent.ts # Yield optimization AI
└── README.md
```

## AI Agents

### 1. Maintenance Agent (`maintenance-agent.ts`)

Handles predictive maintenance including:

- **RUL Prediction**: Estimates Remaining Useful Life based on component health and sensor data
- **Anomaly Detection**: Identifies abnormal sensor readings (vibration, temperature, motor load)
- **Decision Engine**: Determines maintenance requirements and priorities
- **Idle Window Detection**: Finds optimal maintenance windows in production schedules

#### API Functions

```typescript
// Predict RUL for a component
predictRUL(input: RULPredictionInput): RULPredictionOutput

// Detect anomalies from sensor data
detectAnomalies(sensorData: SensorData[], options): AnomalyInput[]

// Analyze component and decide maintenance action
analyzeComponent(component: ComponentHealthInput, schedule: ScheduledBatchInput[]): MaintenanceDecisionOutput

// Find idle window in schedule
findIdleWindow(schedule: ScheduledBatchInput[], durationHours: number): { start: Date; end: Date } | null
```

### 2. Yield Optimization Agent (`yield-optimization-agent.ts`)

Handles tablet press yield optimization including:

- **Drift Detection**: Identifies parameter trends using linear regression
- **Yield Prediction**: Predicts current and potential yield based on process state
- **Recommendation Generation**: Suggests safe micro-adjustments within SOP limits
- **SOP Validation**: Ensures all recommendations comply with operating procedures

#### API Functions

```typescript
// Detect drift in process parameters
detectDrift(signals: TabletPressSignalsInput[], windowSize: number): DriftDetectionOutput[]

// Predict yield outcomes
predictYield(input: YieldPredictionInput): YieldPredictionOutput

// Generate optimization recommendations
generateRecommendations(signals, profile, sopLimits): YieldRecommendationOutput[]

// Validate recommendation against SOP limits
validateRecommendation(recommendation, sopLimits): boolean
```

## Deployment Options

### Option 1: Node.js Express Server

```typescript
import express from 'express';
import { MaintenanceAgent, YieldOptimizationAgent } from './agents';

const app = express();
app.use(express.json());

app.post('/api/maintenance/analyze', (req, res) => {
  const { component, schedule } = req.body;
  const decision = MaintenanceAgent.analyzeComponent(component, schedule);
  res.json(decision);
});

app.post('/api/yield/predict', (req, res) => {
  const prediction = YieldOptimizationAgent.predictYield(req.body);
  res.json(prediction);
});

app.listen(3000);
```

### Option 2: AWS Lambda

```typescript
import { MaintenanceAgent } from './agents';

export const handler = async (event) => {
  const { component, schedule } = JSON.parse(event.body);
  const decision = MaintenanceAgent.analyzeComponent(component, schedule);
  
  return {
    statusCode: 200,
    body: JSON.stringify(decision),
  };
};
```

### Option 3: Supabase Edge Function

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { YieldOptimizationAgent } from './agents/index.ts';

serve(async (req) => {
  const input = await req.json();
  const prediction = YieldOptimizationAgent.predictYield(input);
  
  return new Response(JSON.stringify(prediction), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

## Configuration

Both agents have configurable thresholds defined at the top of their respective files:

### Maintenance Agent Config
- `CRITICAL_HEALTH_THRESHOLD`: 50 (%)
- `WARNING_HEALTH_THRESHOLD`: 70 (%)
- `VIBRATION_THRESHOLD`: 5.0 (mm/s)
- `TEMPERATURE_THRESHOLD`: 65 (°C)

### Yield Agent Config
- `TARGET_YIELD`: 97 (%)
- `TARGET_RSD`: 1.5 (%)
- `DEFAULT_SOP_LIMITS`: Standard operating limits for all parameters

## Extending the Agents

To add new AI capabilities:

1. Define new types in `types.ts`
2. Implement the logic in the appropriate agent file
3. Export from `index.ts`
4. The frontend hooks can then consume the new functionality

## Testing

The agent functions are pure functions (no side effects) making them easy to test:

```typescript
import { predictRUL, detectDrift } from './agents';

describe('MaintenanceAgent', () => {
  it('should predict RUL correctly', () => {
    const result = predictRUL({
      componentName: 'Main Bearings',
      currentHealth: 75,
      operatingHours: 1000,
      vibrationLevel: 3.5,
      temperatureDelta: 5,
      motorLoadAvg: 70,
    });
    
    expect(result.predictedRUL).toBeGreaterThan(0);
    expect(result.confidenceLevel).toBeGreaterThan(0.5);
  });
});
```
