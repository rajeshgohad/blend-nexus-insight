 """
 Vision QC AI Agent
 
 Backend service for autonomous quality assurance with computer vision including:
 - Detection Analysis for PPE violations, surface damage, contamination
 - Severity Assessment and prioritization
 - Baseline Deviation Detection
 - Alert Generation and routing
 """
 import uuid
 from datetime import datetime, timedelta
 from typing import List, Optional
 from pydantic import BaseModel, Field
 
 
 # ============================================================
 # INLINE MODELS
 # ============================================================
 
 class VisionDetectionInput(BaseModel):
     id: str
     type: str  # "ppe_violation", "surface_damage", "leak", "contamination", "safety_hazard"
     location: str
     confidence: float = Field(ge=0, le=1)
     raw_image_data: Optional[str] = None
     timestamp: Optional[datetime] = None
 
 
 class VisionDetectionOutput(BaseModel):
     id: str
     type: str  # "ppe_violation", "surface_damage", "leak", "contamination", "safety_hazard"
     severity: str  # "minor", "moderate", "critical"
     location: str
     timestamp: datetime
     confidence: float
     recommendation: str
     priority_score: int = Field(ge=0, le=100)
     alert_recipients: List[str]
     status: str  # "detected", "investigating", "resolved"
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
     severity: str  # "low", "medium", "high"
     detected_at: datetime
     trend: str  # "stable", "declining", "improving"
     recommended_action: str
 
 
 class AlertRoutingOutput(BaseModel):
     detection_id: str
     recipients: List[str]
     notification_methods: List[str]  # "push", "sms", "email", "alarm"
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
     risk_level: str  # "low", "medium", "high"
     recommendations: List[str]
     confidence_score: float
 
 
 class Config:
     PPE_COMPLIANCE_TARGET = 98.0
     SURFACE_CONDITION_TARGET = 97.0
     ENVIRONMENTAL_TARGET = 99.0
     SAFETY_SCORE_TARGET = 96.0
     MINOR_DEVIATION = 2.0
     MODERATE_DEVIATION = 5.0
     CRITICAL_DEVIATION = 10.0
     HIGH_CONFIDENCE = 0.85
     MEDIUM_CONFIDENCE = 0.70
     LOW_CONFIDENCE = 0.50
     CRITICAL_WEIGHT = 3.0
     MODERATE_WEIGHT = 1.5
     MINOR_WEIGHT = 0.5
 
 
 DEFAULT_SEVERITY_MAP = {
     "ppe_violation": "moderate",
     "surface_damage": "moderate",
     "leak": "critical",
     "contamination": "critical",
     "safety_hazard": "critical",
 }
 
 ALERT_ROUTING_RULES = {
     "ppe_violation": ["supervisor", "safety_officer"],
     "surface_damage": ["maintenance", "qa_inspector"],
     "leak": ["maintenance", "supervisor", "safety_officer"],
     "contamination": ["qa_inspector", "supervisor", "production_manager"],
     "safety_hazard": ["safety_officer", "supervisor", "security"],
 }
 
 
 def generate_id() -> str:
     return str(uuid.uuid4())[:9]
 
 
 def generate_recommendation(detection_type: str, severity: str, location: str) -> str:
     """Generates contextual recommendations based on detection type"""
     recommendations = {
         "ppe_violation": {
             "minor": f"Remind personnel at {location} to verify PPE compliance",
             "moderate": f"Immediately notify supervisor to address PPE violation at {location}",
             "critical": f"STOP WORK at {location} - Critical PPE violation detected. Escort personnel to compliance area.",
         },
         "surface_damage": {
             "minor": f"Schedule inspection of surface at {location} during next maintenance window",
             "moderate": f"Create maintenance ticket for surface damage at {location}. Assess structural integrity.",
             "critical": f"URGENT: Cordon off {location}. Immediate structural assessment required.",
         },
         "leak": {
             "minor": f"Monitor potential leak at {location}. Schedule plumbing inspection.",
             "moderate": f"Deploy containment at {location}. Notify maintenance for leak repair.",
             "critical": f"EMERGENCY: Evacuate {location}. Shut off utilities. Deploy emergency response team.",
         },
         "contamination": {
             "minor": f"Initiate cleaning protocol at {location}. Document for batch records.",
             "moderate": f"Quarantine area at {location}. QA inspection required before resuming operations.",
             "critical": f"STOP PRODUCTION: Contamination at {location}. Initiate full investigation and batch quarantine.",
         },
         "safety_hazard": {
             "minor": f"Address safety concern at {location}. Update safety checklist.",
             "moderate": f"Clear personnel from {location}. Safety officer review required.",
             "critical": f"EVACUATE {location} immediately. Emergency response protocols activated.",
         },
     }
     return recommendations.get(detection_type, {}).get(severity, f"Review detection at {location} and take appropriate action.")
 
 
 def calculate_priority_score(detection_type: str, severity: str, confidence: float) -> int:
     """Calculates priority score for detection ranking"""
     severity_weights = {"minor": 20, "moderate": 50, "critical": 90}
     type_weights = {
         "contamination": 10,
         "leak": 10,
         "safety_hazard": 8,
         "ppe_violation": 5,
         "surface_damage": 3,
     }
     
     base_score = severity_weights.get(severity, 20)
     type_bonus = type_weights.get(detection_type, 0)
     confidence_multiplier = 0.5 + (confidence * 0.5)
     
     return min(100, round((base_score + type_bonus) * confidence_multiplier))
 
 
 def get_workflow_integrations(detection_type: str) -> List[str]:
     """Gets workflow system integrations for detection type"""
     integrations = {
         "ppe_violation": ["MES", "Incident Management"],
         "surface_damage": ["CMMS", "MES"],
         "leak": ["CMMS", "MES", "EHS"],
         "contamination": ["MES", "QMS", "Incident Management"],
         "safety_hazard": ["EHS", "Incident Management", "Security"],
     }
     return integrations.get(detection_type, ["MES"])
 
 
 def get_deviation_action(metric_key: str, deviation: float) -> str:
     """Gets recommended action for baseline deviation"""
     actions = {
         "ppe_compliance": "Conduct immediate PPE audit and refresher training" if deviation > 5 else "Review PPE compliance during next shift change",
         "surface_condition": "Schedule comprehensive facility inspection" if deviation > 5 else "Add to routine maintenance checklist",
         "environmental_norm": "Investigate HVAC and environmental controls immediately" if deviation > 5 else "Monitor environmental readings more frequently",
         "safety_score": "Conduct safety stand-down and risk assessment" if deviation > 5 else "Review recent safety incidents and near-misses",
     }
     return actions.get(metric_key, "Investigate and address deviation")
 
 
 class VisionAgent:
     """Vision QC Agent Service for autonomous quality assurance"""
 
     @staticmethod
     def analyze_detection(input_data: VisionDetectionInput) -> VisionDetectionOutput:
         """Analyzes a vision detection and enriches it with severity, recommendations, and routing"""
         detection_type = input_data.type
         base_severity = DEFAULT_SEVERITY_MAP.get(detection_type, "minor")
         severity = base_severity
         
         if input_data.confidence < Config.LOW_CONFIDENCE:
             severity = "minor"
         elif input_data.confidence > Config.HIGH_CONFIDENCE and base_severity != "critical":
             severity = "moderate" if base_severity == "minor" else "critical"
 
         recommendation = generate_recommendation(detection_type, severity, input_data.location)
         priority_score = calculate_priority_score(detection_type, severity, input_data.confidence)
         alert_recipients = ALERT_ROUTING_RULES.get(detection_type, ["supervisor"])
 
         return VisionDetectionOutput(
             id=input_data.id,
             type=detection_type,
             severity=severity,
             location=input_data.location,
             timestamp=input_data.timestamp or datetime.now(),
             confidence=input_data.confidence,
             recommendation=recommendation,
             priority_score=priority_score,
             alert_recipients=alert_recipients,
             status="detected",
             requires_immediate=severity == "critical",
         )
 
     @staticmethod
     def detect_baseline_deviation(
         current: BaselineMetricsInput,
         baseline: Optional[BaselineMetricsInput] = None,
     ) -> List[BaselineDeviationOutput]:
         """Detects deviations from established baseline metrics"""
         baseline = baseline or BaselineMetricsInput(
             ppe_compliance=Config.PPE_COMPLIANCE_TARGET,
             surface_condition=Config.SURFACE_CONDITION_TARGET,
             environmental_norm=Config.ENVIRONMENTAL_TARGET,
             safety_score=Config.SAFETY_SCORE_TARGET,
         )
         
         deviations = []
         metrics = [
             {"key": "ppe_compliance", "label": "PPE Compliance", "target": baseline.ppe_compliance},
             {"key": "surface_condition", "label": "Surface Condition", "target": baseline.surface_condition},
             {"key": "environmental_norm", "label": "Environmental", "target": baseline.environmental_norm},
             {"key": "safety_score", "label": "Safety Score", "target": baseline.safety_score},
         ]
 
         for metric in metrics:
             current_value = getattr(current, metric["key"])
             deviation = metric["target"] - current_value
 
             if deviation > 0:
                 if deviation >= Config.CRITICAL_DEVIATION:
                     severity = "high"
                 elif deviation >= Config.MODERATE_DEVIATION:
                     severity = "medium"
                 else:
                     severity = "low"
 
                 deviations.append(BaselineDeviationOutput(
                     id=generate_id(),
                     metric=metric["label"],
                     baseline_value=metric["target"],
                     current_value=current_value,
                     deviation=deviation,
                     severity=severity,
                     detected_at=datetime.now(),
                     trend="declining" if deviation > Config.MINOR_DEVIATION else "stable",
                     recommended_action=get_deviation_action(metric["key"], deviation),
                 ))
 
         return deviations
 
     @staticmethod
     def route_alert(detection: VisionDetectionOutput) -> AlertRoutingOutput:
         """Determines alert routing based on detection analysis"""
         notification_methods = ["push"]
         
         if detection.severity == "critical":
             notification_methods.extend(["sms", "alarm"])
         elif detection.severity == "moderate":
             notification_methods.append("email")
 
         if detection.severity == "critical":
             escalation_path = ["supervisor", "production_manager", "plant_manager"]
         elif detection.severity == "moderate":
             escalation_path = ["supervisor", "production_manager"]
         else:
             escalation_path = ["supervisor"]
 
         deadline_minutes = {"critical": 5, "moderate": 30}.get(detection.severity, 120)
         response_deadline = datetime.now() + timedelta(minutes=deadline_minutes)
 
         return AlertRoutingOutput(
             detection_id=detection.id,
             recipients=detection.alert_recipients,
             notification_methods=notification_methods,
             escalation_path=escalation_path,
             response_deadline=response_deadline,
             auto_escalate=detection.severity == "critical",
             workflow_integrations=get_workflow_integrations(detection.type),
         )
 
     @staticmethod
     def analyze_vision_metrics(input_data: VisionAnalysisInput) -> VisionAnalysisOutput:
         """Performs comprehensive vision analysis including RFT calculation"""
         detections = input_data.detections
         
         critical_count = sum(1 for d in detections if d.severity == "critical")
         moderate_count = sum(1 for d in detections if d.severity == "moderate")
         minor_count = sum(1 for d in detections if d.severity == "minor")
 
         weighted_defects = (
             critical_count * Config.CRITICAL_WEIGHT +
             moderate_count * Config.MODERATE_WEIGHT +
             minor_count * Config.MINOR_WEIGHT
         )
         
         rft_percentage = max(0, min(100,
             100 - (weighted_defects / max(1, input_data.total_inspections)) * 10
         ))
 
         baseline_deviations = VisionAgent.detect_baseline_deviation(input_data.baseline_metrics)
 
         if critical_count > 0 or rft_percentage < 90:
             risk_level = "high"
         elif moderate_count > 2 or rft_percentage < 95:
             risk_level = "medium"
         else:
             risk_level = "low"
 
         recommendations = []
         ppe_violations = [d for d in detections if d.type == "ppe_violation"]
         if len(ppe_violations) > 2:
             recommendations.append("Schedule PPE compliance refresher training for all shifts")
 
         maintenance_issues = [d for d in detections if d.type in ["surface_damage", "leak"]]
         if maintenance_issues:
             recommendations.append("Accelerate preventive maintenance schedule for affected areas")
 
         high_deviations = [d for d in baseline_deviations if d.severity == "high"]
         if high_deviations:
             recommendations.append("Conduct root cause analysis for significant baseline deviations")
 
         if rft_percentage < 95:
             recommendations.append("Implement additional quality checkpoints at critical stages")
 
         if not recommendations:
             recommendations.append("Maintain current practices - all metrics within acceptable ranges")
 
         avg_confidence = sum(d.confidence for d in detections) / len(detections) if detections else 1.0
 
         return VisionAnalysisOutput(
             rft_percentage=rft_percentage,
             total_detections=len(detections),
             critical_count=critical_count,
             moderate_count=moderate_count,
             minor_count=minor_count,
             unresolved_count=sum(1 for d in detections if d.status != "resolved"),
             baseline_deviations=baseline_deviations,
             risk_level=risk_level,
             recommendations=recommendations,
             confidence_score=round(avg_confidence, 2),
         )