from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime


class GradeCutoffBase(BaseModel):
    grade_letter: str
    grade_point: float
    min_percentage: float
    description: Optional[str] = None


class GradeCutoffCreate(GradeCutoffBase):
    pass


class GradeCutoffResponse(GradeCutoffBase):
    id: str
    policy_id: str
    model_config = ConfigDict(from_attributes=True)


class GradingPolicyBase(BaseModel):
    name: str
    description: Optional[str] = None
    mode: str = "ABSOLUTE"  # ABSOLUTE, RELATIVE_NORMAL, PERCENTILE_BASED
    moderation_allowed: bool = True
    grace_marks_cap: float = 5.0
    is_active: bool = True


class GradingPolicyCreate(GradingPolicyBase):
    cutoffs: Optional[List[GradeCutoffCreate]] = []


class GradingPolicyUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    mode: Optional[str] = None
    moderation_allowed: Optional[bool] = None
    grace_marks_cap: Optional[float] = None
    is_active: Optional[bool] = None
    cutoffs: Optional[List[GradeCutoffCreate]] = None


class GradingPolicyResponse(GradingPolicyBase):
    id: str
    created_at: datetime
    cutoffs: List[GradeCutoffResponse] = []
    model_config = ConfigDict(from_attributes=True)


class BatchGradeCalcRequest(BaseModel):
    policy_id: Optional[str] = None
    moderation_marks: float = 0.0
    apply_relative_curve: bool = False


class BatchCalculationSummary(BaseModel):
    exam_id: str
    total_submissions_processed: int
    mean_score: float
    median_score: float
    standard_deviation: float
    pass_count: int
    fail_count: int
    pass_percentage: float
