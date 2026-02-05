 """
 FastAPI Server for AI Agents
 
 REST API server exposing maintenance, yield optimization, vision, and scheduling agents
 with proper error handling, authentication, and request validation.
 
 SETUP:
 1. pip install -r requirements.txt
 2. uvicorn main:app --reload --port 3001
 """
 import os
 from datetime import datetime
 from typing import Optional, List
 from fastapi import FastAPI, HTTPException, Depends, Header
 from fastapi.middleware.cors import CORSMiddleware
 from pydantic import BaseModel
 
 from agents import (
     MaintenanceAgent,
     YieldOptimizationAgent,
     VisionAgent,
     SchedulingAgent,
     DEFAULT_SOP_LIMITS,
     DEFAULT_SPECS,
 )
 from models.maintenance import (
     ComponentHealthInput,
     SensorData,
     RULPredictionInput,
     ScheduledBatchInput,
 )
 from models.yield_optimization import (
     TabletPressSignalsInput,
     BatchProfileInput,
     YieldRecommendationOutput,
     SOPLimits,
     ProductSpecs,
 )
 from models.vision import (
     VisionDetectionInput,
     VisionDetectionOutput,
     BaselineMetricsInput,
 )
 from models.scheduling import (
     BatchOrderInput,
     ScheduleGroupOutput,
     ProductionConditionInput,
     ResourceConstraintInput,
 )
 
 
 # Configuration
 API_KEY = os.getenv("AI_AGENTS_API_KEY", "dev-api-key-change-in-production")
 
 # FastAPI app
 app = FastAPI(
     title="PharmaMES AI Agents API",
     description="REST API for Maintenance, Yield Optimization, Vision QC, and Scheduling AI Agents",
     version="1.0.0",
 )
 
 # CORS middleware
 app.add_middleware(
     CORSMiddleware,
     allow_origins=["*"],
     allow_credentials=True,
     allow_methods=["*"],
     allow_headers=["*"],
 )
 
 
 # Authentication dependency
 async def verify_api_key(
     x_api_key: Optional[str] = Header(None),
     authorization: Optional[str] = Header(None),
 ):
     api_key = x_api_key or (authorization.replace("Bearer ", "") if authorization else None)
     if not api_key or api_key != API_KEY:
         raise HTTPException(status_code=401, detail="Invalid or missing API key")
     return api_key
 
 
 # =============================================================
 # REQUEST/RESPONSE MODELS
 # =============================================================
 
 class AnalyzeComponentRequest(BaseModel):
     component: ComponentHealthInput
     schedule: List[ScheduledBatchInput] = []
 
 
 class DetectAnomaliesRequest(BaseModel):
     sensor_data: List[SensorData]
     thresholds: Optional[dict] = None
 
 
 class FindIdleWindowRequest(BaseModel):
     schedule: List[ScheduledBatchInput] = []
     duration_hours: float
 
 
 class DetectDriftRequest(BaseModel):
     signals: List[TabletPressSignalsInput]
     window_size: Optional[int] = 30
 
 
 class YieldPredictRequest(BaseModel):
     signals: TabletPressSignalsInput
     batch_profile: BatchProfileInput
     historical_yields: List[float] = []
     active_recommendations: int = 0
 
 
 class YieldRecommendationsRequest(BaseModel):
     signals: TabletPressSignalsInput
     profile: BatchProfileInput
     sop_limits: Optional[SOPLimits] = None
     specs: Optional[ProductSpecs] = None
 
 
 class ValidateRecommendationRequest(BaseModel):
     recommendation: YieldRecommendationOutput
     sop_limits: Optional[SOPLimits] = None
 
 
 class AnalyzeDetectionRequest(BaseModel):
     detection: VisionDetectionInput
 
 
 class DetectBaselineDeviationRequest(BaseModel):
     current: BaselineMetricsInput
     baseline: Optional[BaselineMetricsInput] = None
 
 
 class RouteAlertRequest(BaseModel):
     detection: VisionDetectionOutput
 
 
 class AnalyzeMetricsRequest(BaseModel):
     detections: List[VisionDetectionOutput]
     baseline_metrics: BaselineMetricsInput
     total_inspections: int
 
 
 class GroupBatchesRequest(BaseModel):
     batches: List[BatchOrderInput]
 
 
 class OptimizeScheduleRequest(BaseModel):
     groups: List[ScheduleGroupOutput]
     conditions: List[ProductionConditionInput]
     constraints: Optional[ResourceConstraintInput] = None
 
 
 class ValidateScheduleRequest(BaseModel):
     groups: List[ScheduleGroupOutput]
     conditions: List[ProductionConditionInput]
     equipment_failures: Optional[List[dict]] = None
 
 
 # =============================================================
 # HEALTH CHECK
 # =============================================================
 
 @app.get("/health")
 async def health_check():
     return {
         "success": True,
         "service": "AI Agents API",
         "version": "1.0.0",
         "timestamp": datetime.now().isoformat(),
         "agents": ["maintenance", "yield-optimization", "vision", "scheduling"],
     }
 
 
 # =============================================================
 # MAINTENANCE AGENT ENDPOINTS
 # =============================================================
 
 @app.post("/api/maintenance/analyze-component")
 async def analyze_component(
     request: AnalyzeComponentRequest,
     api_key: str = Depends(verify_api_key),
 ):
     result = MaintenanceAgent.analyze_component(request.component, request.schedule)
     return {"success": True, "data": result}
 
 
 @app.post("/api/maintenance/predict-rul")
 async def predict_rul(
     request: RULPredictionInput,
     api_key: str = Depends(verify_api_key),
 ):
     result = MaintenanceAgent.predict_rul(request)
     return {"success": True, "data": result}
 
 
 @app.post("/api/maintenance/detect-anomalies")
 async def detect_anomalies(
     request: DetectAnomaliesRequest,
     api_key: str = Depends(verify_api_key),
 ):
     thresholds = request.thresholds or {}
     result = MaintenanceAgent.detect_anomalies(
         request.sensor_data,
         vibration_threshold=thresholds.get("vibration"),
         temperature_threshold=thresholds.get("temperature"),
         motor_load_threshold=thresholds.get("motor_load"),
     )
     return {"success": True, "data": result, "count": len(result)}
 
 
 @app.post("/api/maintenance/find-idle-window")
 async def find_idle_window(
     request: FindIdleWindowRequest,
     api_key: str = Depends(verify_api_key),
 ):
     result = MaintenanceAgent.find_idle_window(request.schedule, request.duration_hours)
     return {"success": True, "data": result}
 
 
 # =============================================================
 # YIELD OPTIMIZATION ENDPOINTS
 # =============================================================
 
 @app.post("/api/yield/detect-drift")
 async def detect_drift(
     request: DetectDriftRequest,
     api_key: str = Depends(verify_api_key),
 ):
     result = YieldOptimizationAgent.detect_drift(request.signals, request.window_size or 30)
     return {"success": True, "data": result, "count": len(result)}
 
 
 @app.post("/api/yield/predict")
 async def predict_yield(
     request: YieldPredictRequest,
     api_key: str = Depends(verify_api_key),
 ):
     from models.yield_optimization import YieldPredictionInput
     input_data = YieldPredictionInput(
         signals=request.signals,
         batch_profile=request.batch_profile,
         historical_yields=request.historical_yields,
         active_recommendations=request.active_recommendations,
     )
     result = YieldOptimizationAgent.predict_yield(input_data)
     return {"success": True, "data": result}
 
 
 @app.post("/api/yield/recommendations")
 async def generate_recommendations(
     request: YieldRecommendationsRequest,
     api_key: str = Depends(verify_api_key),
 ):
     result = YieldOptimizationAgent.generate_recommendations(
         request.signals,
         request.profile,
         request.sop_limits,
         request.specs,
     )
     return {"success": True, "data": result, "count": len(result)}
 
 
 @app.post("/api/yield/validate-recommendation")
 async def validate_recommendation(
     request: ValidateRecommendationRequest,
     api_key: str = Depends(verify_api_key),
 ):
     is_valid = YieldOptimizationAgent.validate_recommendation(
         request.recommendation,
         request.sop_limits,
     )
     return {"success": True, "data": {"is_valid": is_valid}}
 
 
 @app.get("/api/yield/sop-limits")
 async def get_sop_limits(api_key: str = Depends(verify_api_key)):
     return {
         "success": True,
         "data": {
             "sop_limits": DEFAULT_SOP_LIMITS,
             "product_specs": DEFAULT_SPECS,
         },
     }
 
 
 # =============================================================
 # VISION QC AGENT ENDPOINTS
 # =============================================================
 
 @app.post("/api/vision/analyze-detection")
 async def analyze_detection(
     request: AnalyzeDetectionRequest,
     api_key: str = Depends(verify_api_key),
 ):
     result = VisionAgent.analyze_detection(request.detection)
     return {"success": True, "data": result}
 
 
 @app.post("/api/vision/detect-baseline-deviation")
 async def detect_baseline_deviation(
     request: DetectBaselineDeviationRequest,
     api_key: str = Depends(verify_api_key),
 ):
     result = VisionAgent.detect_baseline_deviation(request.current, request.baseline)
     return {"success": True, "data": result, "count": len(result)}
 
 
 @app.post("/api/vision/route-alert")
 async def route_alert(
     request: RouteAlertRequest,
     api_key: str = Depends(verify_api_key),
 ):
     result = VisionAgent.route_alert(request.detection)
     return {"success": True, "data": result}
 
 
 @app.post("/api/vision/analyze-metrics")
 async def analyze_metrics(
     request: AnalyzeMetricsRequest,
     api_key: str = Depends(verify_api_key),
 ):
     from models.vision import VisionAnalysisInput
     input_data = VisionAnalysisInput(
         detections=request.detections,
         baseline_metrics=request.baseline_metrics,
         total_inspections=request.total_inspections,
     )
     result = VisionAgent.analyze_vision_metrics(input_data)
     return {"success": True, "data": result}
 
 
 # =============================================================
 # SCHEDULING AGENT ENDPOINTS
 # =============================================================
 
 @app.post("/api/scheduling/group-batches")
 async def group_batches(
     request: GroupBatchesRequest,
     api_key: str = Depends(verify_api_key),
 ):
     result = SchedulingAgent.group_batches(request.batches)
     return {"success": True, "data": result, "count": len(result)}
 
 
 @app.post("/api/scheduling/optimize")
 async def optimize_schedule(
     request: OptimizeScheduleRequest,
     api_key: str = Depends(verify_api_key),
 ):
     result = SchedulingAgent.optimize_schedule(
         request.groups,
         request.conditions,
         request.constraints,
     )
     return {"success": True, "data": result}
 
 
 @app.post("/api/scheduling/validate")
 async def validate_schedule(
     request: ValidateScheduleRequest,
     api_key: str = Depends(verify_api_key),
 ):
     result = SchedulingAgent.validate_schedule(
         request.groups,
         request.conditions,
         request.equipment_failures,
     )
     return {"success": True, "data": result}
 
 
 # =============================================================
 # MAIN
 # =============================================================
 
 if __name__ == "__main__":
     import uvicorn
     uvicorn.run(app, host="0.0.0.0", port=3001)