 """
 Yield Optimization AI Agent
 
 Backend service for tablet press yield optimization including:
 - Drift Detection for process parameters
 - Yield Prediction using statistical models
 - Recommendation Generation for process adjustments
 - SOP Validation for safety compliance
 """
 import uuid
 from datetime import datetime
 from typing import List, Optional
 from pydantic import BaseModel, Field
 
 
 # ============================================================
 # INLINE MODELS
 # ============================================================
 
 class TabletPressSignalsInput(BaseModel):
     weight: float = Field(description="mg")
     thickness: float = Field(description="mm")
     hardness: float = Field(description="kP (kiloponds)")
     feeder_speed: float = Field(description="rpm")
     turret_speed: float = Field(description="rpm")
     vacuum: float = Field(description="mbar")
     pre_compression_force: float = Field(description="kN")
     main_compression_force: float = Field(description="kN")
     timestamp: datetime
 
 
 class BatchProfileInput(BaseModel):
     batch_number: str
     avg_weight: float
     weight_rsd: float = Field(description="% RSD")
     avg_thickness: float
     avg_hardness: float
     reject_rate: float
     tablets_produced: int
     tablets_per_minute: float
     in_spec_percentage: float
 
 
 class DriftDetectionOutput(BaseModel):
     id: str
     parameter: str  # "weight", "thickness", "hardness", "feederSpeed", "turretSpeed"
     direction: str  # "increasing", "decreasing"
     magnitude: float = Field(description="% change")
     severity: str  # "low", "medium", "high"
     detected_at: datetime
     description: str
     recommended_action: str
 
 
 class YieldPredictionInput(BaseModel):
     signals: TabletPressSignalsInput
     batch_profile: BatchProfileInput
     historical_yields: List[float] = []
     active_recommendations: int = 0
 
 
 class YieldPredictionOutput(BaseModel):
     current_yield: float = Field(description="predicted yield if no changes (%)")
     corrected_yield: float = Field(description="predicted yield with corrections (%)")
     current_reject_rate: float
     corrected_reject_rate: float
     confidence_level: float = Field(ge=0, le=1)
     risk_level: str  # "low", "medium", "high"
     potential_improvement: float
 
 
 class YieldRecommendationOutput(BaseModel):
     id: str
     parameter: str
     current_value: float
     recommended_value: float
     unit: str
     adjustment: str
     expected_improvement: float
     sop_min: float
     sop_max: float
     risk_level: str  # "low", "medium"
     reasoning: str
 
 
 class SOPLimits(BaseModel):
     feeder_speed: dict = {"min": 20, "max": 35, "unit": "rpm"}
     turret_speed: dict = {"min": 40, "max": 55, "unit": "rpm"}
     pre_compression_force: dict = {"min": 2, "max": 5, "unit": "kN"}
     main_compression_force: dict = {"min": 12, "max": 20, "unit": "kN"}
     vacuum: dict = {"min": -400, "max": -200, "unit": "mbar"}
 
 
 class ProductSpecs(BaseModel):
     weight: dict = {"target": 500, "tolerance": 5}
     thickness: dict = {"target": 4.5, "tolerance": 0.2}
     hardness: dict = {"target": 12, "min": 8, "max": 16}
 
 
 # Default configurations
 DEFAULT_SOP_LIMITS = SOPLimits()
 DEFAULT_SPECS = ProductSpecs()
 
 
 class Config:
     DRIFT_MAGNITUDE_HIGH = 2.0
     DRIFT_MAGNITUDE_MEDIUM = 1.0
     TARGET_YIELD = 97
     WARNING_YIELD = 95
     CRITICAL_YIELD = 93
     TARGET_RSD = 1.5
     WARNING_RSD = 2.0
     TARGET_REJECT_RATE = 1.5
     WARNING_REJECT_RATE = 3.0
 
 
 def generate_id() -> str:
     return str(uuid.uuid4())[:9]
 
 
 def calculate_trend(values: List[float]) -> dict:
     """Calculates linear trend from an array of values"""
     n = len(values)
     if n < 2:
         return {"slope": 0, "percent_change": 0}
 
     sum_x = sum(range(n))
     sum_y = sum(values)
     sum_xy = sum(i * v for i, v in enumerate(values))
     sum_x2 = sum(i * i for i in range(n))
 
     denominator = n * sum_x2 - sum_x * sum_x
     if denominator == 0:
         return {"slope": 0, "percent_change": 0}
     
     slope = (n * sum_xy - sum_x * sum_y) / denominator
     avg_value = sum_y / n
     percent_change = (slope * n / avg_value) * 100 if avg_value != 0 else 0
 
     return {"slope": slope, "percent_change": percent_change}
 
 
 class YieldOptimizationAgent:
     """Yield Optimization Agent Service for tablet press optimization"""
 
     @staticmethod
     def detect_drift(
         signals: List[TabletPressSignalsInput],
         window_size: int = 30
     ) -> List[DriftDetectionOutput]:
         """Detects parameter drift from time-series signal data"""
         detections = []
         
         if len(signals) < window_size:
             return detections
 
         recent_signals = signals[-window_size:]
         parameters = [
             {"key": "weight", "name": "Weight"},
             {"key": "thickness", "name": "Thickness"},
             {"key": "hardness", "name": "Hardness"},
             {"key": "feeder_speed", "name": "Feeder Speed"},
             {"key": "turret_speed", "name": "Turret Speed"},
         ]
 
         descriptions = {
             "weight": lambda d: f"Tablet weight {d} - potential fill depth adjustment needed",
             "thickness": lambda d: f"Thickness {d} - check punch wear or compression settings",
             "hardness": lambda d: f"Hardness {d} - may affect dissolution profile",
             "feeder_speed": lambda d: "Feeder speed drift detected - check hopper level",
             "turret_speed": lambda d: "Turret speed variation - verify drive belt tension",
         }
 
         actions = {
             "weight": lambda d: "Increase feeder speed slightly" if d == "decreasing" else "Decrease feeder speed slightly",
             "thickness": lambda d: "Increase compression force" if d == "increasing" else "Decrease compression force",
             "hardness": lambda d: "Increase main compression force" if d == "decreasing" else "Decrease main compression force",
             "feeder_speed": lambda d: "Check hopper level and material flow",
             "turret_speed": lambda d: "Verify drive belt tension and motor condition",
         }
 
         for param in parameters:
             values = [getattr(s, param["key"]) for s in recent_signals]
             trend = calculate_trend(values)
             
             if abs(trend["slope"]) > 0.01:
                 magnitude = abs(trend["percent_change"])
                 direction = "increasing" if trend["slope"] > 0 else "decreasing"
                 
                 if magnitude > Config.DRIFT_MAGNITUDE_HIGH:
                     severity = "high"
                 elif magnitude > Config.DRIFT_MAGNITUDE_MEDIUM:
                     severity = "medium"
                 else:
                     severity = "low"
 
                 # Map Python key to TypeScript format for output
                 param_output = param["key"].replace("_", "S")[0].lower() + param["key"].replace("_", "S")[1:]
                 if param["key"] == "feeder_speed":
                     param_output = "feederSpeed"
                 elif param["key"] == "turret_speed":
                     param_output = "turretSpeed"
                 else:
                     param_output = param["key"]
 
                 detections.append(DriftDetectionOutput(
                     id=generate_id(),
                     parameter=param_output,
                     direction=direction,
                     magnitude=magnitude,
                     severity=severity,
                     detected_at=datetime.now(),
                     description=descriptions[param["key"]](direction),
                     recommended_action=actions[param["key"]](direction),
                 ))
 
         return detections
 
     @staticmethod
     def predict_yield(input_data: YieldPredictionInput) -> YieldPredictionOutput:
         """Predicts yield based on current signals and batch profile"""
         batch_profile = input_data.batch_profile
         historical_yields = input_data.historical_yields
         active_recommendations = input_data.active_recommendations
 
         base_yield = batch_profile.in_spec_percentage
         
         rsd_penalty = max(0, (batch_profile.weight_rsd - Config.TARGET_RSD) * 2)
         base_yield -= rsd_penalty
         
         reject_penalty = max(0, (batch_profile.reject_rate - Config.TARGET_REJECT_RATE) * 0.5)
         base_yield -= reject_penalty
         
         if historical_yields:
             avg_historical = sum(historical_yields) / len(historical_yields)
             trend_adjustment = (avg_historical - base_yield) * 0.1
             base_yield += trend_adjustment
 
         current_yield = max(85, min(99, base_yield))
         
         improvement_per_rec = 0.5
         potential_improvement = active_recommendations * improvement_per_rec
         corrected_yield = min(99.5, current_yield + potential_improvement + 1.5)
 
         current_reject_rate = batch_profile.reject_rate
         corrected_reject_rate = max(0.3, current_reject_rate - (active_recommendations * 0.4))
 
         confidence = min(0.95, 0.80 + (len(historical_yields) * 0.01) + (active_recommendations * 0.02))
 
         if current_yield < Config.CRITICAL_YIELD:
             risk_level = "high"
         elif current_yield < Config.WARNING_YIELD:
             risk_level = "medium"
         else:
             risk_level = "low"
 
         return YieldPredictionOutput(
             current_yield=current_yield,
             corrected_yield=corrected_yield,
             current_reject_rate=current_reject_rate,
             corrected_reject_rate=corrected_reject_rate,
             confidence_level=confidence,
             risk_level=risk_level,
             potential_improvement=corrected_yield - current_yield,
         )
 
     @staticmethod
     def generate_recommendations(
         signals: TabletPressSignalsInput,
         profile: BatchProfileInput,
         sop_limits: Optional[SOPLimits] = None,
         specs: Optional[ProductSpecs] = None,
     ) -> List[YieldRecommendationOutput]:
         """Generates AI recommendations for process parameter adjustments"""
         sop_limits = sop_limits or DEFAULT_SOP_LIMITS
         specs = specs or DEFAULT_SPECS
         recommendations = []
 
         # Analyze weight trend
         weight_deviation = signals.weight - specs.weight["target"]
         if abs(weight_deviation) > specs.weight["tolerance"] * 0.5:
             current_feeder = signals.feeder_speed
             adjustment = 0.3 if weight_deviation < 0 else -0.3
             new_value = max(
                 sop_limits.feeder_speed["min"],
                 min(sop_limits.feeder_speed["max"], current_feeder + adjustment)
             )
             
             if new_value != current_feeder:
                 recommendations.append(YieldRecommendationOutput(
                     id=generate_id(),
                     parameter="Feeder Speed",
                     current_value=current_feeder,
                     recommended_value=new_value,
                     unit=sop_limits.feeder_speed["unit"],
                     adjustment=f"{'+' if adjustment > 0 else ''}{adjustment:.1f} {sop_limits.feeder_speed['unit']}",
                     expected_improvement=0.15,
                     sop_min=sop_limits.feeder_speed["min"],
                     sop_max=sop_limits.feeder_speed["max"],
                     risk_level="low",
                     reasoning="Slight increase to compensate for gradual weight decrease trend" if weight_deviation < 0 else "Slight decrease to compensate for weight increase trend",
                 ))
 
         # Analyze hardness
         hardness_deviation = signals.hardness - specs.hardness["target"]
         if abs(hardness_deviation) > 1:
             current_force = signals.main_compression_force
             adjustment = 0.5 if hardness_deviation < 0 else -0.5
             new_value = max(
                 sop_limits.main_compression_force["min"],
                 min(sop_limits.main_compression_force["max"], current_force + adjustment)
             )
             
             if new_value != current_force:
                 recommendations.append(YieldRecommendationOutput(
                     id=generate_id(),
                     parameter="Main Compression Force",
                     current_value=current_force,
                     recommended_value=new_value,
                     unit=sop_limits.main_compression_force["unit"],
                     adjustment=f"{'+' if adjustment > 0 else ''}{adjustment:.1f} {sop_limits.main_compression_force['unit']}",
                     expected_improvement=0.22,
                     sop_min=sop_limits.main_compression_force["min"],
                     sop_max=sop_limits.main_compression_force["max"],
                     risk_level="low",
                     reasoning="Increase hardness to target center; reduces friability rejects" if hardness_deviation < 0 else "Decrease compression to avoid over-hardness issues",
                 ))
 
         # Analyze RSD for uniformity
         if profile.weight_rsd > Config.TARGET_RSD:
             current_turret = signals.turret_speed
             adjustment = -0.5
             new_value = max(
                 sop_limits.turret_speed["min"],
                 min(sop_limits.turret_speed["max"], current_turret + adjustment)
             )
             
             if new_value != current_turret:
                 recommendations.append(YieldRecommendationOutput(
                     id=generate_id(),
                     parameter="Turret Speed",
                     current_value=current_turret,
                     recommended_value=new_value,
                     unit=sop_limits.turret_speed["unit"],
                     adjustment=f"{adjustment:.1f} {sop_limits.turret_speed['unit']}",
                     expected_improvement=0.18,
                     sop_min=sop_limits.turret_speed["min"],
                     sop_max=sop_limits.turret_speed["max"],
                     risk_level="low",
                     reasoning="Minor reduction to improve fill uniformity and reduce %RSD",
                 ))
 
         # Pre-compression for de-aeration
         if profile.reject_rate > Config.TARGET_REJECT_RATE:
             current_pre_comp = signals.pre_compression_force
             adjustment = 0.3
             new_value = max(
                 sop_limits.pre_compression_force["min"],
                 min(sop_limits.pre_compression_force["max"], current_pre_comp + adjustment)
             )
             
             if new_value != current_pre_comp:
                 recommendations.append(YieldRecommendationOutput(
                     id=generate_id(),
                     parameter="Pre-Compression Force",
                     current_value=current_pre_comp,
                     recommended_value=new_value,
                     unit=sop_limits.pre_compression_force["unit"],
                     adjustment=f"+{adjustment:.1f} {sop_limits.pre_compression_force['unit']}",
                     expected_improvement=0.12,
                     sop_min=sop_limits.pre_compression_force["min"],
                     sop_max=sop_limits.pre_compression_force["max"],
                     risk_level="low",
                     reasoning="Better de-aeration reduces capping and lamination",
                 ))
 
         return recommendations
 
     @staticmethod
     def validate_recommendation(
         recommendation: YieldRecommendationOutput,
         sop_limits: Optional[SOPLimits] = None,
     ) -> bool:
         """Validates that a recommendation stays within SOP limits"""
         sop_limits = sop_limits or DEFAULT_SOP_LIMITS
         
         parameter_limits = {
             "Feeder Speed": sop_limits.feeder_speed,
             "Turret Speed": sop_limits.turret_speed,
             "Pre-Compression Force": sop_limits.pre_compression_force,
             "Main Compression Force": sop_limits.main_compression_force,
         }
 
         limits = parameter_limits.get(recommendation.parameter)
         if not limits:
             return True
 
         return limits["min"] <= recommendation.recommended_value <= limits["max"]