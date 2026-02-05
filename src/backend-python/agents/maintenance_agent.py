 """
 Maintenance AI Agent
 
 Backend service for predictive maintenance including:
 - RUL (Remaining Useful Life) Prediction
 - Anomaly Detection from sensor data
 - Maintenance Decision Engine
 - Idle Window Detection for scheduling
 """
 import uuid
 from datetime import datetime, timedelta
 from typing import Optional, List
 from pydantic import BaseModel, Field
 
 
 # ============================================================
 # INLINE MODELS (to avoid circular import issues)
 # ============================================================
 
 class ComponentHealthInput(BaseModel):
     name: str
     health: float = Field(ge=0, le=100, description="Health percentage 0-100")
     rul: float = Field(description="Remaining Useful Life in hours")
     trend: str  # "stable", "declining", "critical"
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
     maintenance_type: Optional[str] = None  # "general", "spare_replacement"
     reasoning: str
     suggested_time: Optional[datetime] = None
     machine_idle_window: Optional[dict] = None
     priority: str  # "low", "medium", "high", "critical"
     estimated_duration: float = Field(description="hours")
 
 
 class AnomalyInput(BaseModel):
     id: str
     timestamp: datetime
     source: str
     severity: str  # "low", "medium", "high"
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
     status: Optional[str] = None  # "queued", "in-progress", "completed", "delayed"
 
 
 # Configuration
 class Config:
     CRITICAL_HEALTH_THRESHOLD = 50
     WARNING_HEALTH_THRESHOLD = 70
     CRITICAL_RUL_THRESHOLD = 100
     WARNING_RUL_THRESHOLD = 500
     VIBRATION_THRESHOLD = 5.0
     TEMPERATURE_THRESHOLD = 65
     MOTOR_LOAD_THRESHOLD = 90
     GENERAL_MAINTENANCE_DURATION = 2
     SPARE_REPLACEMENT_DURATION = 4
 
 
 def generate_id() -> str:
     return str(uuid.uuid4())[:9]
 
 
 class MaintenanceAgent:
     """Maintenance Agent Service for predictive maintenance"""
 
     @staticmethod
     def predict_rul(input_data: RULPredictionInput) -> RULPredictionOutput:
         """Predicts Remaining Useful Life based on component health and sensor data"""
         base_degradation_rate = 0.001
         
         vibration_factor = 1.5 if input_data.vibration_level > Config.VIBRATION_THRESHOLD else 1.0
         temperature_factor = 1.3 if input_data.temperature_delta > 10 else 1.0
         load_factor = 1.4 if input_data.motor_load_avg > Config.MOTOR_LOAD_THRESHOLD else 1.0
         
         adjusted_degradation_rate = base_degradation_rate * vibration_factor * temperature_factor * load_factor
         
         health_remaining = input_data.current_health
         predicted_rul = health_remaining / adjusted_degradation_rate
         
         confidence = max(0.6, min(0.95,
             0.85 - (abs(vibration_factor - 1) * 0.1) - (abs(temperature_factor - 1) * 0.1)
         ))
         
         failure_probability = min(0.99, max(0.01, 1 - (predicted_rul / 1000)))
         predicted_failure_date = datetime.now() + timedelta(hours=predicted_rul)
 
         return RULPredictionOutput(
             component_name=input_data.component_name,
             predicted_rul=round(predicted_rul),
             confidence_level=confidence,
             degradation_rate=adjusted_degradation_rate,
             failure_probability=failure_probability,
             predicted_failure_date=predicted_failure_date,
         )
 
     @staticmethod
     def detect_anomalies(
         sensor_data: List[SensorData],
         vibration_threshold: Optional[float] = None,
         temperature_threshold: Optional[float] = None,
         motor_load_threshold: Optional[float] = None,
     ) -> List[AnomalyInput]:
         """Detects anomalies from sensor data using threshold-based detection"""
         anomalies = []
         thresholds = {
             "vibration": vibration_threshold or Config.VIBRATION_THRESHOLD,
             "temperature": temperature_threshold or Config.TEMPERATURE_THRESHOLD,
             "motor_load": motor_load_threshold or Config.MOTOR_LOAD_THRESHOLD,
         }
 
         for data in sensor_data:
             if data.vibration > thresholds["vibration"]:
                 if data.vibration > thresholds["vibration"] * 1.5:
                     severity = "high"
                 elif data.vibration > thresholds["vibration"] * 1.2:
                     severity = "medium"
                 else:
                     severity = "low"
                 anomalies.append(AnomalyInput(
                     id=generate_id(),
                     timestamp=data.timestamp,
                     source="Vibration Sensor",
                     severity=severity,
                     description=f"High vibration detected: {data.vibration:.2f} mm/s (threshold: {thresholds['vibration']} mm/s)",
                 ))
 
             if data.temperature > thresholds["temperature"]:
                 if data.temperature > thresholds["temperature"] + 15:
                     severity = "high"
                 elif data.temperature > thresholds["temperature"] + 5:
                     severity = "medium"
                 else:
                     severity = "low"
                 anomalies.append(AnomalyInput(
                     id=generate_id(),
                     timestamp=data.timestamp,
                     source="Temperature Sensor",
                     severity=severity,
                     description=f"High temperature detected: {data.temperature:.1f}°C (threshold: {thresholds['temperature']}°C)",
                 ))
 
             if data.motor_load > thresholds["motor_load"]:
                 severity = "high" if data.motor_load > 95 else "medium"
                 anomalies.append(AnomalyInput(
                     id=generate_id(),
                     timestamp=data.timestamp,
                     source="Motor Load Sensor",
                     severity=severity,
                     description=f"Motor overload detected: {data.motor_load:.1f}% (threshold: {thresholds['motor_load']}%)",
                 ))
 
         return anomalies
 
     @staticmethod
     def find_idle_window(
         schedule: List[ScheduledBatchInput],
         duration_hours: float
     ) -> Optional[dict]:
         """Finds available maintenance windows in the production schedule"""
         now = datetime.now()
         future_schedule = sorted(
             [b for b in schedule if b.end_time > now],
             key=lambda b: b.start_time
         )
 
         if not future_schedule:
             return {"start": now, "end": now + timedelta(hours=duration_hours)}
 
         first_batch = future_schedule[0]
         gap_before_first = (first_batch.start_time - now).total_seconds() / 3600
         if gap_before_first >= duration_hours:
             return {"start": now, "end": now + timedelta(hours=duration_hours)}
 
         for i in range(len(future_schedule) - 1):
             gap_start = future_schedule[i].end_time
             gap_end = future_schedule[i + 1].start_time
             gap_hours = (gap_end - gap_start).total_seconds() / 3600
             if gap_hours >= duration_hours:
                 return {"start": gap_start, "end": gap_start + timedelta(hours=duration_hours)}
 
         last_batch = future_schedule[-1]
         return {"start": last_batch.end_time, "end": last_batch.end_time + timedelta(hours=duration_hours)}
 
     @staticmethod
     def analyze_component(
         component: ComponentHealthInput,
         schedule: List[ScheduledBatchInput]
     ) -> MaintenanceDecisionOutput:
         """AI Decision Engine for determining maintenance requirements"""
         requires_maintenance = (
             component.health < Config.WARNING_HEALTH_THRESHOLD or
             component.rul < Config.WARNING_RUL_THRESHOLD or
             component.trend == "critical"
         )
 
         maintenance_type = None
         reasoning = ""
         priority = "low"
 
         if not requires_maintenance:
             reasoning = f"Component health at {component.health:.0f}% with RUL of {component.rul}h. No maintenance required."
         elif component.health < Config.CRITICAL_HEALTH_THRESHOLD or component.trend == "critical":
             maintenance_type = "spare_replacement"
             priority = "critical" if component.health < 30 else "high"
             reasoning = f"Critical condition detected. Health: {component.health:.0f}%, Trend: {component.trend}. Spare replacement required."
         else:
             maintenance_type = "general"
             priority = "high" if component.health < 60 else "medium"
             reasoning = f"Preventive maintenance recommended. Health: {component.health:.0f}%, RUL: {component.rul}h. General maintenance sufficient."
 
         estimated_duration = (
             Config.SPARE_REPLACEMENT_DURATION
             if maintenance_type == "spare_replacement"
             else Config.GENERAL_MAINTENANCE_DURATION
         )
         idle_window = MaintenanceAgent.find_idle_window(schedule, estimated_duration)
 
         return MaintenanceDecisionOutput(
             component_name=component.name,
             requires_maintenance=requires_maintenance,
             maintenance_type=maintenance_type,
             reasoning=reasoning,
             suggested_time=idle_window["start"] if idle_window else None,
             machine_idle_window=idle_window,
             priority=priority,
             estimated_duration=estimated_duration,
         )