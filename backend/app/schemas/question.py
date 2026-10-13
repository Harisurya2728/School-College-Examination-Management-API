from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime


class QuestionOptionBase(BaseModel):
    text: str
    latex: Optional[str] = None
    is_correct: bool = False


class QuestionOptionCreate(QuestionOptionBase):
    pass


class QuestionOptionResponse(QuestionOptionBase):
    id: str
    question_id: str
    model_config = ConfigDict(from_attributes=True)


class RubricCriterionBase(BaseModel):
    title: str
    max_marks: float
    description: Optional[str] = None


class RubricCriterionCreate(RubricCriterionBase):
    pass


class RubricCriterionResponse(RubricCriterionBase):
    id: str
    question_id: str
    model_config = ConfigDict(from_attributes=True)


class QuestionBase(BaseModel):
    course_id: str
    subject_code: str
    subject_name: str
    semester: int = 1
    unit: int = 1
    topic: str
    type: str  # MCQ_SINGLE, MCQ_MULTI, NUMERICAL, SUBJECTIVE, TRUE_FALSE
    prompt: str
    prompt_latex: Optional[str] = None
    model_answer: Optional[str] = None
    target_numeric: Optional[float] = None
    min_tolerance: Optional[float] = None
    max_tolerance: Optional[float] = None
    difficulty: str = "MEDIUM"  # EASY, MEDIUM, HARD
    bloom_level: str = "APPLY"  # REMEMBER, UNDERSTAND, APPLY, ANALYZE, EVALUATE, CREATE
    marks: float = 1.0
    negative_marks: float = 0.0
    tags: str = ""
    status: str = "APPROVED"


class QuestionCreate(QuestionBase):
    options: Optional[List[QuestionOptionCreate]] = []
    rubrics: Optional[List[RubricCriterionCreate]] = []


class QuestionUpdate(BaseModel):
    course_id: Optional[str] = None
    subject_code: Optional[str] = None
    subject_name: Optional[str] = None
    semester: Optional[int] = None
    unit: Optional[int] = None
    topic: Optional[str] = None
    type: Optional[str] = None
    prompt: Optional[str] = None
    prompt_latex: Optional[str] = None
    model_answer: Optional[str] = None
    target_numeric: Optional[float] = None
    min_tolerance: Optional[float] = None
    max_tolerance: Optional[float] = None
    difficulty: Optional[str] = None
    bloom_level: Optional[str] = None
    marks: Optional[float] = None
    negative_marks: Optional[float] = None
    tags: Optional[str] = None
    status: Optional[str] = None
    options: Optional[List[QuestionOptionCreate]] = None
    rubrics: Optional[List[RubricCriterionCreate]] = None


class QuestionResponse(QuestionBase):
    id: str
    created_at: datetime
    updated_at: datetime
    options: List[QuestionOptionResponse] = []
    rubrics: List[RubricCriterionResponse] = []
    model_config = ConfigDict(from_attributes=True)


class BulkUploadSummary(BaseModel):
    total_processed: int
    created_count: int
    errors: List[str] = []
