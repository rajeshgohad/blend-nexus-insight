 """
 Scheduling AI Agent Types
 """
 from typing import Optional, Literal, List
 from pydantic import BaseModel, Field
 
 
 class BatchOrderInput(BaseModel):
     id: str
     batch_number: str
     product_name: str
     drug: str
     density: Literal["low", "medium", "high"]
     status: Literal["queued", "in-progress", "completed"]
     estimated_duration: int = Field(description="minutes")
     priority: Optional[int] = None
 
 
 class ScheduleGroupOutput(BaseModel):
     id: str
     type: Literal["same-drug-same-density", "same-drug-diff-density", "diff-drug-diff-density"]
     label: str
     batches: List[BatchOrderInput]
     cleaning_required: Literal["none", "partial", "full"]
     cleaning_time_minutes: int
     estimated_savings: int = Field(description="minutes")
     sequence_order: int
     color: str
 
 
 class ProductionConditionInput(BaseModel):
     id: str
     unit: str
     name: str
     status: Literal["ready", "warning", "blocked"]
     detail: str
 
 
 class ResourceConstraintInput(BaseModel):
     min_operator_skill: Optional[int] = None
     max_machine_wear: Optional[int] = None
     required_certifications: Optional[List[str]] = None
 
 
 class ScheduleOptimizationOutput(BaseModel):
     groups: List[ScheduleGroupOutput]
     total_batches: int
     total_savings_minutes: int
     efficiency_gain: float = Field(description="%")
     baseline_cleaning_time: int
     optimized_cleaning_time: int
     blockers: List[dict]
     warnings: List[dict]
     constraint_violations: List[str]
     confidence: float
     insights: List[str]
     is_optimal: bool
 
 
 class ScheduleValidationOutput(BaseModel):
     is_valid: bool
     can_proceed: bool
     issues: List[dict]
     error_count: int
     warning_count: int
     recommendations: List[str]