# PharmaMES AI Dashboard - Functional Specification

**Version:** 1.0  
**Last Updated:** February 4, 2026  
**Document Type:** Functional Specification

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Overview](#2-system-overview)
3. [Data Entities](#3-data-entities)
4. [User Interface Screens](#4-user-interface-screens)
5. [Functional Modules](#5-functional-modules)
6. [AI Agent Services](#6-ai-agent-services)
7. [API Endpoints](#7-api-endpoints)
8. [Voice Assistant](#8-voice-assistant)
9. [Simulation Engine](#9-simulation-engine)
10. [Appendix](#10-appendix)

---

## 1. Executive Summary

### 1.1 Purpose
The PharmaMES AI Dashboard is an interactive pharmaceutical manufacturing execution system that visualizes and manages five interconnected AI-powered use cases for production monitoring, optimization, and control.

### 1.2 Scope
This document covers the functional specification of all entities, UI screens, and functionality implemented in the dashboard application.

### 1.3 Key Features
- Real-time Digital Process Twin visualization
- Autonomous Predictive Maintenance with work order automation
- Adaptive Yield Optimization with role-based approvals
- Autonomous Quality Assurance with Computer Vision
- Self-Optimizing Batch Scheduling

---

## 2. System Overview

### 2.1 Technology Stack
| Component | Technology |
|-----------|------------|
| Frontend Framework | React 18 with TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui (Radix primitives) |
| State Management | React Hooks + TanStack Query |
| Charts | Recharts |
| Backend Services | Express.js REST API |

### 2.2 Visual Design System
| Token | Color (HSL) | Usage |
|-------|-------------|-------|
| Primary | Deep Blue (#1e40af) | Primary actions, headers |
| Success | Green (#10b981) | Running states, approvals |
| Warning | Amber (#f59e0b) | Cautions, pending states |
| Destructive | Red (#ef4444) | Critical alerts, errors |
| Background | Slate Gray | Dark mode industrial aesthetic |

### 2.3 Architecture Overview
```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
├─────────────────────────────────────────────────────────────┤
│  Header │ Control Panel │ Tab Navigation │ Content Area     │
├─────────────────────────────────────────────────────────────┤
│              Simulation Engine (useSimulation)               │
├─────────────────────────────────────────────────────────────┤
│                    AI Agent Services                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │Maintenance│ │  Yield   │ │  Vision  │ │  Scheduling  │   │
│  │  Agent   │ │  Agent   │ │  Agent   │ │    Agent     │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                Express.js REST API Server                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Data Entities

### 3.1 Manufacturing Core Entities

#### 3.1.1 BatchState
```typescript
type BatchState = 
  | 'idle' 
  | 'loading' 
  | 'blending' 
  | 'sampling' 
  | 'discharge' 
  | 'cleaning' 
  | 'complete' 
  | 'emergency-stop';
```
**Description:** Represents the lifecycle state of a manufacturing batch.

#### 3.1.2 BatchInfo
| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique batch identifier |
| productName | string | Name of the product being manufactured |
| productId | string | Product SKU/code |
| batchNumber | string | Batch reference number (e.g., BN-2024-0847) |
| startTime | Date \| null | Batch start timestamp |
| endTime | Date \| null | Batch completion timestamp |
| targetQuantity | number | Target production quantity |
| recipe | RecipeItem[] | List of ingredients |
| recipeId | string | Recipe identifier |
| recipeName | string | Recipe name |
| state | BatchState | Current batch state |
| operator | Operator | Assigned operator |
| blendingSequence | BlendingSequenceItem[] | Blending process steps |

#### 3.1.3 BlendingSequenceItem
| Field | Type | Description |
|-------|------|-------------|
| step | BlendingSequenceStep | Step identifier |
| label | string | Display label |
| setPointMinutes | number | Target duration in minutes |
| actualMinutes | number | Actual elapsed time |
| status | 'pending' \| 'in-progress' \| 'completed' | Step status |

**Blending Sequence Steps:**
1. Start Delay
2. Charging
3. Pre-Blend
4. Main Blend
5. Lube Pause
6. Lube Blend
7. Discharge

#### 3.1.4 BlenderParameters
| Field | Type | Unit | Range |
|-------|------|------|-------|
| rotationSpeed | number | RPM | 10-25 |
| blendTime | number | minutes | 0-30 |
| motorLoad | number | % | 0-100 |
| temperature | number | °C | Ambient-50 |
| vibration | number | mm/s | 0-10 |
| blendUniformity | number | % | 0-100 |

#### 3.1.5 RecipeItem
| Field | Type | Description |
|-------|------|-------------|
| ingredient | string | Ingredient name |
| quantity | number | Amount required |
| unit | string | Unit of measurement (kg, g, L) |
| added | boolean | Whether ingredient has been added |

#### 3.1.6 Operator
| Field | Type | Description |
|-------|------|-------------|
| id | string | Operator ID |
| name | string | Operator full name |

### 3.2 Maintenance Entities

#### 3.2.1 ComponentHealth
| Field | Type | Description |
|-------|------|-------------|
| name | string | Component name |
| health | number | Health percentage (0-100) |
| rul | number | Remaining Useful Life in hours |
| trend | 'stable' \| 'declining' \| 'critical' | Health trend |
| lastMaintenance | Date | Last maintenance date |
| failureProbability | number | Probability of failure (0-1) |
| predictedFailureDate | Date \| null | Predicted failure timestamp |

#### 3.2.2 WorkOrder
| Field | Type | Description |
|-------|------|-------------|
| id | string | Work order ID |
| component | string | Component requiring work |
| type | 'general' \| 'spare_replacement' | Type of maintenance |
| status | WorkOrderStatus | Current status |
| priority | 'low' \| 'medium' \| 'high' \| 'critical' | Priority level |
| assignedTechnician | Technician \| null | Assigned technician |
| scheduledTime | Date \| null | Scheduled maintenance time |
| sparesRequired | SpareRequirement[] | Required spare parts |
| estimatedDuration | number | Estimated hours |
| createdAt | Date | Creation timestamp |
| instructions | string | Work instructions |
| notificationsSent | NotificationRecord[] | Notification history |

**WorkOrderStatus:** `'pending' | 'scheduled' | 'in-progress' | 'completed' | 'waiting-spares'`

#### 3.2.3 PurchaseOrder
| Field | Type | Description |
|-------|------|-------------|
| id | string | Purchase order ID |
| sparePart | SparePart | Part being ordered |
| quantity | number | Order quantity |
| vendor | string | Vendor name |
| status | POStatus | Order status |
| createdAt | Date | Creation timestamp |
| expectedDelivery | Date | Expected delivery date |
| workOrderId | string | Related work order ID |

**POStatus:** `'pending' | 'approved' | 'ordered' | 'shipped' | 'received'`

#### 3.2.4 SparePart
| Field | Type | Description |
|-------|------|-------------|
| id | string | Part ID |
| name | string | Part name |
| partNumber | string | Part number |
| quantity | number | Stock quantity |
| minStock | number | Minimum stock level |
| leadTimeDays | number | Procurement lead time |
| vendor | string | Preferred vendor |
| unitCost | number | Cost per unit |

#### 3.2.5 Technician
| Field | Type | Description |
|-------|------|-------------|
| id | string | Technician ID |
| name | string | Technician name |
| skill | 'junior' \| 'senior' \| 'specialist' | Skill level |
| available | boolean | Availability status |
| currentTask | string \| null | Current assignment |
| nextAvailable | Date \| null | Next available time |

### 3.3 Yield Optimization Entities

#### 3.3.1 TabletPressSignals
| Field | Type | Unit | Description |
|-------|------|------|-------------|
| weight | number | mg | Tablet weight |
| thickness | number | mm | Tablet thickness |
| hardness | number | kP | Tablet hardness |
| feederSpeed | number | rpm | Feeder rotation speed |
| turretSpeed | number | rpm | Turret rotation speed |
| vacuum | number | mbar | Vacuum pressure |
| preCompressionForce | number | kN | Pre-compression force |
| mainCompressionForce | number | kN | Main compression force |
| timestamp | Date | - | Signal timestamp |

#### 3.3.2 DriftDetection
| Field | Type | Description |
|-------|------|-------------|
| id | string | Detection ID |
| parameter | string | Parameter name |
| direction | 'increasing' \| 'decreasing' | Drift direction |
| magnitude | number | Change percentage |
| severity | 'low' \| 'medium' \| 'high' | Severity level |
| detectedAt | Date | Detection timestamp |
| description | string | Drift description |
| recommendedAction | string | Suggested action |

#### 3.3.3 YieldRecommendation
| Field | Type | Description |
|-------|------|-------------|
| id | string | Recommendation ID |
| parameter | string | Parameter to adjust |
| currentValue | number | Current value |
| recommendedValue | number | Suggested value |
| unit | string | Unit of measurement |
| adjustment | string | Adjustment description |
| expectedImprovement | number | Expected yield improvement % |
| sopMin | number | SOP minimum limit |
| sopMax | number | SOP maximum limit |
| riskLevel | 'low' \| 'medium' | Risk assessment |
| reasoning | string | AI reasoning |

### 3.4 Vision QC Entities

#### 3.4.1 QualityDetection
| Field | Type | Description |
|-------|------|-------------|
| id | string | Detection ID |
| type | DetectionType | Type of detection |
| severity | 'minor' \| 'moderate' \| 'critical' | Severity level |
| location | string | Detection location |
| timestamp | Date | Detection time |
| imageUrl | string \| undefined | Captured image URL |
| recommendation | string | Recommended action |
| status | 'detected' \| 'investigating' \| 'resolved' | Status |

**DetectionType:** `'ppe_violation' | 'surface_damage' | 'leak' | 'contamination' | 'safety_hazard'`

#### 3.4.2 BaselineMetrics
| Field | Type | Description |
|-------|------|-------------|
| ppeCompliance | number | PPE compliance percentage |
| surfaceCondition | number | Surface condition score |
| environmentalNorm | number | Environmental compliance |
| safetyScore | number | Overall safety score |

### 3.5 Scheduling Entities

#### 3.5.1 ScheduledBatch
| Field | Type | Description |
|-------|------|-------------|
| id | string | Batch ID |
| batchNumber | string | Batch number |
| productName | string | Product name |
| startTime | Date | Scheduled start time |
| endTime | Date | Scheduled end time |
| status | ScheduleStatus | Schedule status |
| priority | number | Priority level (1-10) |

**ScheduleStatus:** `'queued' | 'in-progress' | 'completed' | 'delayed'`

#### 3.5.2 BatchOrder
| Field | Type | Description |
|-------|------|-------------|
| id | string | Order ID |
| batchNumber | string | Batch number |
| productName | string | Product name |
| drug | string | Drug name |
| density | 'low' \| 'medium' \| 'high' | Powder density |
| status | string | Order status |
| estimatedDuration | number | Duration in minutes |
| priority | number | Priority (optional) |

#### 3.5.3 ScheduleGroup
| Field | Type | Description |
|-------|------|-------------|
| id | string | Group ID |
| type | GroupType | Grouping type |
| label | string | Display label |
| batches | BatchOrder[] | Grouped batches |
| cleaningRequired | CleaningLevel | Cleaning requirement |
| cleaningTimeMinutes | number | Cleaning duration |
| estimatedSavings | number | Time savings in minutes |
| sequenceOrder | number | Execution order |
| color | string | Display color |

**GroupType:** `'same-drug-same-density' | 'same-drug-diff-density' | 'diff-drug-diff-density'`  
**CleaningLevel:** `'none' | 'partial' | 'full'`

### 3.6 System Entities

#### 3.6.1 Alert
| Field | Type | Description |
|-------|------|-------------|
| id | string | Alert ID |
| timestamp | Date | Alert timestamp |
| source | string | Alert source |
| type | 'info' \| 'warning' \| 'critical' \| 'success' | Alert type |
| message | string | Alert message |
| acknowledged | boolean | Acknowledgment status |

#### 3.6.2 SimulationState
| Field | Type | Description |
|-------|------|-------------|
| speed | number | Simulation speed multiplier |
| isPaused | boolean | Pause state |
| currentTime | Date | Simulated current time |
| elapsedSeconds | number | Elapsed simulation time |

---

## 4. User Interface Screens

### 4.1 Application Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                           HEADER                                 │
│  Logo │ Production Line │ Time │ Alerts │ Voice │ Chatbot       │
├─────────────────────────────────────────────────────────────────┤
│       │                                                         │
│  C    │                    CONTENT AREA                         │
│  O    │                                                         │
│  N    │  ┌─────────────────────────────────────────────────┐   │
│  T    │  │              TAB NAVIGATION                      │   │
│  R    │  │  Digital Twin │ Maintenance │ Yield │ Vision │   │   │
│  O    │  │  Scheduling │ Process Line │ Data Flow           │   │
│  L    │  └─────────────────────────────────────────────────┘   │
│       │                                                         │
│  P    │  ┌─────────────────────────────────────────────────┐   │
│  A    │  │                                                  │   │
│  N    │  │              TAB CONTENT                         │   │
│  E    │  │                                                  │   │
│  L    │  │                                                  │   │
│       │  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Header Component
**File:** `src/components/dashboard/Header.tsx`

| Element | Description |
|---------|-------------|
| Logo | PharmaMES AI Dashboard branding |
| Production Line | Current production line identifier |
| Clock | Real-time simulation clock display |
| Alert Bell | Notification popover (max 20 alerts) |
| Connection Status | WiFi indicator (Connected/Disconnected) |
| Batch Status Badge | Current batch state indicator |
| Voice Assistant | Microphone toggle for voice commands |
| Chatbot | AI assistant dialog trigger |

### 4.3 Control Panel
**File:** `src/components/dashboard/ControlPanel.tsx`

| Section | Controls |
|---------|----------|
| Batch Control | Start, Stop, Suspend, Resume buttons |
| Simulation Speed | Speed control (fixed at 50x) |
| Simulation Controls | Pause/Resume, Reset |
| Scenario Injection | Equipment Failure, Emergency Stop |

### 4.4 Tab Screens

#### 4.4.1 Digital Twin Tab
**File:** `src/components/dashboard/DigitalTwin.tsx`

**Layout:** Two-column grid
- Left: V-Blender 3D visualization with real-time parameters
- Right: Batch metadata, recipe, blending sequence progress

**Key Features:**
- Real-time parameter gauges (RPM, Temperature, Motor Load)
- Blending sequence timeline with progress indicators
- Recipe ingredient checklist
- Tablet Press visualization (activates after discharge)

#### 4.4.2 Predictive Maintenance Tab
**File:** `src/components/dashboard/PredictiveMaintenance.tsx`

**Sub-tabs:**
| Sub-tab | Content |
|---------|---------|
| Health | Component health cards with RUL indicators |
| Work Orders | Active work order cards with status |
| Purchase Orders | PO list with delivery tracking |
| Resources | Technician availability grid |
| Spares | Spare parts inventory table |
| Logs | Maintenance activity log |

#### 4.4.3 Yield Optimization Tab
**File:** `src/components/dashboard/YieldOptimization.tsx`

**Layout:** Three-section grid
- Left: Real-time tablet press signals
- Center: Batch yield metrics and trends
- Right: AI recommendations with approval workflow

**Key Features:**
- Drift detection alerts with trend visualization
- Parameter adjustment recommendations
- Role-based approval dialog (Supervisor/Recipe Manager)
- Yield prediction charts

#### 4.4.4 Computer Vision Tab
**File:** `src/components/dashboard/ComputerVision.tsx`

**Layout:** Camera grid with detection panels
- 6-camera monitoring grid (Dispensing, Sieving, Blending, Compression, Coating, Polishing)
- Detection list with severity indicators
- Baseline metrics dashboard
- System sync status

**Key Features:**
- Animated scan line overlays on camera feeds
- Severity-coded detection cards (minor/moderate/critical)
- PPE compliance tracking
- Action recommendation system

#### 4.4.5 Batch Scheduling Tab
**File:** `src/components/dashboard/BatchScheduling.tsx`

**Layout:** Order list with optimization panel
- Batch order queue
- Grouping optimization results
- Cleaning time savings calculator
- Production condition indicators

#### 4.4.6 Process Line Tab
**File:** `src/components/dashboard/ProcessLine.tsx`

**Visualization:** Two production lines with 7 stages each
```
Line 1: Sieving → Dispensing → Blending → Compression → Coating → Polishing → Packing
Line 2: Sieving → Dispensing → Blending → Compression → Coating → Polishing → Packing
```

**Key Features:**
- Real-time batch tracking on process blocks
- Backup area visualization for critical stages
- Equipment failure injection controls
- Line status indicators

#### 4.4.7 Data Flow Tab
**File:** `src/components/dashboard/DataFlowVisualization.tsx`

**Visualization:** Animated node graph showing data flows between:
- Digital Twin ↔ Predictive Maintenance
- Predictive Maintenance ↔ Scheduling
- Digital Twin ↔ Yield Optimization
- Quality Vision ↔ Scheduling
- All modules ↔ Alert System

---

## 5. Functional Modules

### 5.1 Digital Process Twin

#### 5.1.1 V-Blender Monitoring
| Function | Description |
|----------|-------------|
| Real-time Parameters | Display rotation speed, motor load, temperature, vibration |
| Blending Uniformity | Calculate and display blend uniformity percentage |
| Sequence Tracking | Track progress through 7 blending steps |
| Time Comparison | Show set-point vs actual time for each step |

#### 5.1.2 Tablet Press Operation
| Function | Description |
|----------|-------------|
| Standby Mode | Grayscale display until discharge completes |
| Active Mode | Animated visualization with real-time signals |
| Manual Control | Start/Stop button for operator intervention |
| Signal Display | Weight, thickness, hardness, forces, vacuum |

#### 5.1.3 Batch Lifecycle Management
| State | Trigger | Actions |
|-------|---------|---------|
| idle | Initial/Reset | Display "Ready" status |
| loading | Start Batch | Begin ingredient loading |
| blending | Loading complete | Execute blending sequence |
| sampling | Main blend complete | Pause for quality sample |
| discharge | Sampling approved | Transfer to tablet press |
| cleaning | Discharge complete | CIP sequence |
| complete | Cleaning complete | Archive batch record |
| emergency-stop | E-Stop button | Halt all operations |

### 5.2 Autonomous Predictive Maintenance

#### 5.2.1 Component Health Monitoring
| Function | Description |
|----------|-------------|
| Health Calculation | Real-time health percentage based on sensor data |
| RUL Prediction | Remaining Useful Life estimation in hours |
| Trend Analysis | Classify as stable/declining/critical |
| Failure Probability | Calculate probability of imminent failure |

#### 5.2.2 Work Order Automation
| Trigger | Action |
|---------|--------|
| Health < 70% | Generate preventive work order |
| Anomaly detected | Generate predictive work order |
| Equipment failure | Generate critical work order |
| Spare unavailable | Set status to "waiting-spares" |

#### 5.2.3 Purchase Order Automation
| Trigger | Action |
|---------|--------|
| Stock < minStock | Generate reorder PO |
| Work order needs spares | Link PO to work order |
| Delivery received | Update inventory, notify maintenance |

#### 5.2.4 Notification System
| Recipient | Trigger |
|-----------|---------|
| maintenance_team | New work order created |
| production_supervisor | Critical equipment issue |
| operator | Scheduled maintenance approaching |
| stores | PO approved for ordering |

### 5.3 Adaptive Yield Optimization

#### 5.3.1 Drift Detection
| Parameter | Threshold | Action |
|-----------|-----------|--------|
| Weight | ±2% target | Generate drift alert |
| Thickness | ±0.05mm | Generate drift alert |
| Hardness | ±1 kP | Generate drift alert |
| Any signal | >5% change/min | High-severity alert |

#### 5.3.2 Recommendation Engine
| Input | Output |
|-------|--------|
| Current signals | Parameter adjustment suggestions |
| Historical data | Expected improvement percentage |
| SOP limits | Compliance validation |
| Batch profile | Risk level assessment |

#### 5.3.3 Approval Workflow
| Variation Range | Required Approver | Demo Credentials |
|----------------|-------------------|------------------|
| 0.1 - 0.3 points | Supervisor | supervisor / super123 |
| > 0.8 points | Recipe Manager | recipemanager / recipe123 |

### 5.4 Autonomous Quality Assurance

#### 5.4.1 10-Point Capability Matrix
| # | Capability | Description |
|---|------------|-------------|
| 1 | Continuous Monitoring | 24/7 camera feed analysis |
| 2 | Baseline Deviation | Compare against established norms |
| 3 | PPE Compliance | Verify safety equipment usage |
| 4 | Hazard Identification | Detect safety hazards |
| 5 | Severity Assessment | Classify minor/moderate/critical |
| 6 | Immediate Alerting | Push notifications for critical |
| 7 | Action Recommendations | AI-generated corrective actions |
| 8 | Workflow Integration | Connect to maintenance/scheduling |
| 9 | Audit Logging | Complete detection history |
| 10 | Accuracy Learning | Model improvement over time |

#### 5.4.2 Camera Grid Configuration
| Camera | Location | Detections |
|--------|----------|------------|
| CAM-01 | Dispensing | PPE, contamination |
| CAM-02 | Sieving | Equipment damage |
| CAM-03 | Blending | Leaks, safety hazards |
| CAM-04 | Compression | Surface damage |
| CAM-05 | Coating | Environmental |
| CAM-06 | Polishing | Quality defects |

### 5.5 Self-Optimizing Batch Scheduling

#### 5.5.1 Batch Grouping Algorithm
| Group Type | Cleaning Required | Time Savings |
|------------|-------------------|--------------|
| Same drug, same density | None | Maximum |
| Same drug, diff density | Partial | Moderate |
| Different drugs | Full | Baseline |

#### 5.5.2 Optimization Factors
| Factor | Weight | Description |
|--------|--------|-------------|
| Cleaning time | 40% | Minimize changeover |
| Equipment availability | 25% | Avoid blocked equipment |
| Priority | 20% | Respect order priorities |
| Operator skill | 15% | Match to requirements |

#### 5.5.3 Constraint Validation
| Constraint | Check |
|------------|-------|
| Equipment status | Not 'down' or 'maintenance' |
| Operator certification | Matches product requirements |
| Material availability | Sufficient inventory |
| Room clearance | Environmental compliance |

---

## 6. AI Agent Services

### 6.1 Maintenance Agent
**File:** `src/backend/agents/maintenance-agent.ts`

| Method | Input | Output |
|--------|-------|--------|
| analyzeComponent | ComponentHealthInput, Schedule | MaintenanceDecisionOutput |
| predictRUL | RULPredictionInput | RULPredictionOutput |
| detectAnomalies | SensorData[], threshold | AnomalyInput[] |
| findIdleWindow | Schedule, duration | TimeWindow \| null |

### 6.2 Yield Optimization Agent
**File:** `src/backend/agents/yield-optimization-agent.ts`

| Method | Input | Output |
|--------|-------|--------|
| detectDrift | TabletPressSignals[], window | DriftDetectionOutput[] |
| predictYield | YieldPredictionInput | YieldPredictionOutput |
| generateRecommendations | Signals, Profile, SOP | YieldRecommendationOutput[] |
| validateRecommendation | Recommendation, SOP | boolean |

### 6.3 Vision Agent
**File:** `src/backend/agents/vision-agent.ts`

| Method | Input | Output |
|--------|-------|--------|
| analyzeDetection | VisionDetectionInput | VisionDetectionOutput |
| detectBaselineDeviation | CurrentMetrics, Baseline | BaselineDeviationOutput[] |
| routeAlert | Detection | AlertRoutingOutput |
| analyzeVisionMetrics | VisionAnalysisInput | VisionAnalysisOutput |

### 6.4 Scheduling Agent
**File:** `src/backend/agents/scheduling-agent.ts`

| Method | Input | Output |
|--------|-------|--------|
| groupBatches | BatchOrderInput[] | ScheduleGroupOutput[] |
| optimizeSchedule | Groups, Conditions, Constraints | ScheduleOptimizationOutput |
| validateSchedule | Groups, Conditions, Failures | ScheduleValidationOutput |

---

## 7. API Endpoints

### 7.1 Server Configuration
**File:** `src/backend/server/index.ts`  
**Base URL:** `http://localhost:3001`  
**Authentication:** API Key or Bearer Token

### 7.2 Maintenance Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/maintenance/analyze-component | Analyze component health |
| POST | /api/maintenance/predict-rul | Predict remaining useful life |
| POST | /api/maintenance/detect-anomalies | Detect sensor anomalies |
| POST | /api/maintenance/find-idle-window | Find maintenance window |

### 7.3 Yield Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/yield/detect-drift | Detect parameter drift |
| POST | /api/yield/predict | Predict batch yield |
| POST | /api/yield/recommendations | Generate recommendations |
| POST | /api/yield/validate-recommendation | Validate against SOP |
| GET | /api/yield/sop-limits | Get SOP limits |

### 7.4 Vision Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/vision/analyze-detection | Analyze detection |
| POST | /api/vision/detect-baseline-deviation | Check baseline deviation |
| POST | /api/vision/route-alert | Route alert to recipients |
| POST | /api/vision/analyze-metrics | Analyze overall metrics |

### 7.5 Scheduling Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/scheduling/group-batches | Group batches |
| POST | /api/scheduling/optimize | Optimize schedule |
| POST | /api/scheduling/validate | Validate schedule |

### 7.6 System Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check with agent status |

---

## 8. Voice Assistant

### 8.1 Configuration
**File:** `src/components/dashboard/VoiceAssistant.tsx`  
**Technology:** Web Speech API (SpeechRecognition)

### 8.2 Voice Commands
| Phrase Pattern | Action | Description |
|----------------|--------|-------------|
| "compression...down" / "equipment...failure" | equipment-failure | Trigger equipment failure scenario |
| "emergency stop" / "e-stop" | emergency-stop | Execute emergency stop |
| "reset emergency" / "clear e-stop" | emergency-reset | Clear emergency stop |
| "start batch" / "begin production" | start-batch | Start batch processing |
| "stop batch" / "end production" | stop-batch | Stop batch processing |
| "suspend" / "hold batch" | suspend-batch | Suspend current batch |
| "resume batch" / "continue" | resume-batch | Resume suspended batch |
| "pause simulation" | pause-simulation | Pause simulation |
| "resume simulation" | resume-simulation | Resume simulation |
| "reset simulation" | reset-simulation | Reset to initial state |
| "speed...{number}" | set-speed | Set simulation speed |

### 8.3 Feedback System
| State | Indicator |
|-------|-----------|
| Listening | Pulsing microphone animation |
| Processing | Transcript display |
| Command Recognized | Success badge with action name |
| Error | Error message display |

---

## 9. Simulation Engine

### 9.1 Configuration
**File:** `src/hooks/useSimulation.ts`

| Parameter | Value | Description |
|-----------|-------|-------------|
| Speed | 50x (fixed) | Simulation time multiplier |
| Anomaly Cap | 2 | Maximum concurrent anomalies |
| Anomaly Types | Bearing Noise, Vibration Pattern | Allowed anomaly scenarios |

### 9.2 State Management
| Hook | Purpose |
|------|---------|
| useSimulation | Core simulation state and controls |
| useMaintenanceWorkflow | Maintenance automation logic |
| useTabletPressYield | Tablet press signal simulation |

### 9.3 Event-Driven Architecture
```
Equipment Failure Event
    │
    ├─► Update Process Line (set stage to 'down')
    │
    ├─► Create Work Order (Maintenance)
    │
    ├─► Block Scheduling (mark equipment unavailable)
    │
    └─► Generate Alert (critical)
```

### 9.4 Scenario Injection
| Scenario | Effects |
|----------|---------|
| equipment-failure | Line blockage, work order, alert |
| bearing-noise | Anomaly, declining health trend |
| vibration-pattern | Anomaly, increased vibration readings |
| emergency-stop | Full production halt |

---

## 10. Appendix

### 10.1 File Structure
```
src/
├── components/
│   ├── dashboard/
│   │   ├── Header.tsx
│   │   ├── ControlPanel.tsx
│   │   ├── DigitalTwin.tsx
│   │   ├── PredictiveMaintenance.tsx
│   │   ├── YieldOptimization.tsx
│   │   ├── ComputerVision.tsx
│   │   ├── BatchScheduling.tsx
│   │   ├── ProcessLine.tsx
│   │   ├── DataFlowVisualization.tsx
│   │   ├── VoiceAssistant.tsx
│   │   ├── ChatBot.tsx
│   │   └── ...
│   └── ui/
│       └── [shadcn components]
├── hooks/
│   ├── useSimulation.ts
│   ├── useMaintenanceWorkflow.ts
│   └── useTabletPressYield.ts
├── types/
│   ├── manufacturing.ts
│   ├── tablet-press-yield.ts
│   └── speech-recognition.d.ts
├── backend/
│   ├── agents/
│   │   ├── maintenance-agent.ts
│   │   ├── yield-optimization-agent.ts
│   │   ├── vision-agent.ts
│   │   ├── scheduling-agent.ts
│   │   └── types.ts
│   └── server/
│       └── index.ts
├── data/
│   └── batchMasterData.ts
├── lib/
│   ├── utils.ts
│   └── dateFormat.ts
└── pages/
    ├── Index.tsx
    └── NotFound.tsx
```

### 10.2 Demo Credentials
| Role | Username | Password |
|------|----------|----------|
| Supervisor | supervisor | super123 |
| Recipe Manager | recipemanager | recipe123 |

### 10.3 Browser Compatibility
| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Core App | ✅ | ✅ | ✅ | ✅ |
| Voice Assistant | ✅ | ⚠️ Limited | ⚠️ Limited | ✅ |
| Charts | ✅ | ✅ | ✅ | ✅ |

### 10.4 Revision History
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-04 | AI System | Initial specification |

---

*End of Document*
