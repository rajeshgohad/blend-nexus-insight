 """
 Maintenance AI Agent Types
 """
 from datetime import datetime
 from typing import Optional, Literal
 from pydantic import BaseModel, Field
 
 
 class ComponentHealthInput(BaseModel):
     name: str
     health: float = Field(ge=0, le=100, description="Health percentage 0-100")
     rul: float = Field(description="Remaining Useful Life in hours")
     trend: Literal["stable", "declining", "critical"]
     failure_probability: Optional[float] = Field(None, ge=0, le=1)
     last_maintenance: Optional[datetime] = None
     predicted_failure_date: Optional[datetime] = None
 
 
 class SensorData(BaseModel):
     vibration: float = Field(description="mm/s")
     motor_load: float = Field(description="percentage")
     temperature: float = Field(description="°C")
     timestamp: datetime
 
 
 class MaintenanceDecisionOutput(BaseModel):
     component_name: str
     requires_maintenance: bool
     maintenance_type: Optional[Literal["general", "spare_replacement"]] = None
     reasoning: str
     suggested_time: Optional[datetime] = None
     machine_idle_window: Optional[dict] = None
     priority: Literal["low", "medium", "high", "critical"]
     estimated_duration: float = Field(description="hours")
 
 
 class AnomalyInput(BaseModel):
     id: str
     timestamp: datetime
     source: str
     severity: Literal["low", "medium", "high"]
     description: str
 
 
 class RULPredictionInput(BaseModel):
     component_name: str
     current_health: float
     operating_hours: float
     vibration_level: float
     temperature_delta: float
     motor_load_avg: float
 
 
 class RULPredictionOutput(BaseModel):
     component_name: str
     predicted_rul: float = Field(description="hours")
     confidence_level: float = Field(ge=0, le=1)
     degradation_rate: float = Field(description="% per hour")
     failure_probability: float
     predicted_failure_date: datetime
 
 
 class ScheduledBatchInput(BaseModel):
     batch_id: Optional[str] = None
     id: Optional[str] = None
     batch_number: Optional[str] = None
     product_name: Optional[str] = None
     start_time: datetime
     end_time: datetime
     status: Optional[Literal["queued", "in-progress", "completed", "delayed"]] = None