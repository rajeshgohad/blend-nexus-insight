 """
 Yield Optimization AI Agent Types
 """
 from datetime import datetime
 from typing import Optional, Literal, List
 from pydantic import BaseModel, Field
 
 
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
     parameter: Literal["weight", "thickness", "hardness", "feederSpeed", "turretSpeed"]
     direction: Literal["increasing", "decreasing"]
     magnitude: float = Field(description="% change")
     severity: Literal["low", "medium", "high"]
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
     risk_level: Literal["low", "medium", "high"]
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
     risk_level: Literal["low", "medium"]
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