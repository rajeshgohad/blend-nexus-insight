 """
 Vision QC AI Agent Types
 """
 from datetime import datetime
 from typing import Optional, Literal, List
 from pydantic import BaseModel, Field
 
 
 class VisionDetectionInput(BaseModel):
     id: str
     type: Literal["ppe_violation", "surface_damage", "leak", "contamination", "safety_hazard"]
     location: str
     confidence: float = Field(ge=0, le=1)
     raw_image_data: Optional[str] = None
     timestamp: Optional[datetime] = None
 
 
 class VisionDetectionOutput(BaseModel):
     id: str
     type: Literal["ppe_violation", "surface_damage", "leak", "contamination", "safety_hazard"]
     severity: Literal["minor", "moderate", "critical"]
     location: str
     timestamp: datetime
     confidence: float
     recommendation: str
     priority_score: int = Field(ge=0, le=100)
     alert_recipients: List[str]
     status: Literal["detected", "investigating", "resolved"]
     requires_immediate: bool
 
 
 class BaselineMetricsInput(BaseModel):
     ppe_compliance: float = Field(description="%")
     surface_condition: float = Field(description="%")
     environmental_norm: float = Field(description="%")
     safety_score: float = Field(description="%")
 
 
 class BaselineDeviationOutput(BaseModel):
     id: str
     metric: str
     baseline_value: float
     current_value: float
     deviation: float
     severity: Literal["low", "medium", "high"]
     detected_at: datetime
     trend: Literal["stable", "declining", "improving"]
     recommended_action: str
 
 
 class AlertRoutingOutput(BaseModel):
     detection_id: str
     recipients: List[str]
     notification_methods: List[Literal["push", "sms", "email", "alarm"]]
     escalation_path: List[str]
     response_deadline: datetime
     auto_escalate: bool
     workflow_integrations: List[str]
 
 
 class VisionAnalysisInput(BaseModel):
     detections: List[VisionDetectionOutput]
     baseline_metrics: BaselineMetricsInput
     total_inspections: int
 
 
 class VisionAnalysisOutput(BaseModel):
     rft_percentage: float
     total_detections: int
     critical_count: int
     moderate_count: int
     minor_count: int
     unresolved_count: int
     baseline_deviations: List[BaselineDeviationOutput]
     risk_level: Literal["low", "medium", "high"]
     recommendations: List[str]
     confidence_score: float