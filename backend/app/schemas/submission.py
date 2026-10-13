from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime


class StudentAnswerBase(BaseModel):
    question_id: str
    answer_text: Optional[str] = None
    selected_options: Optional[str] = None
    numeric_answer: Optional[float] = None
    marks_obtained: float = 0.0
    max_marks: float = 1.0
    is_evaluated: bool = False
    evaluator_feedback: Optional[str] = None


class StudentAnswerCreate(StudentAnswerBase):
    pass


class StudentAnswerUpdate(BaseModel):
    marks_obtained: float
    is_evaluated: bool = True
    evaluator_feedback: Optional[str] = None


class StudentAnswerResponse(StudentAnswerBase):
    id: str
    submission_id: str
    model_config = ConfigDict(from_attributes=True)


class SubmissionBase(BaseModel):
    exam_id: str
    student_id: str
    roll_number: str
    student_name: str
    department: str
    email: Optional[str] = None
    raw_score: float = 0.0
    moderated_score: float = 0.0
    final_score: float = 0.0
    percentage: float = 0.0
    percentile: float = 0.0
    rank: int = 0
    grade_letter: str = "F"
    grade_point: float = 0.0
    is_passed: bool = False
    status: str = "SUBMITTED"
    remarks: Optional[str] = None


class SubmissionCreate(BaseModel):
    exam_id: str
    student_id: str
    roll_number: str
    student_name: str
    department: str
    email: Optional[str] = None
    answers: Optional[List[StudentAnswerCreate]] = []


class SubmissionUpdate(BaseModel):
    raw_score: Optional[float] = None
    moderated_score: Optional[float] = None
    final_score: Optional[float] = None
    percentage: Optional[float] = None
    percentile: Optional[float] = None
    rank: Optional[int] = None
    grade_letter: Optional[str] = None
    grade_point: Optional[float] = None
    is_passed: Optional[bool] = None
    status: Optional[str] = None
    remarks: Optional[str] = None


class EvaluationUpdate(BaseModel):
    answers: List[dict]  # [{"answer_id": "...", "marks_obtained": 4.5, "feedback": "..."}]
    remarks: Optional[str] = None
    moderated_score: Optional[float] = None


class SubmissionResponse(SubmissionBase):
    id: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class SubmissionDetailResponse(SubmissionBase):
    id: str
    created_at: datetime
    answers: List[StudentAnswerResponse] = []
    model_config = ConfigDict(from_attributes=True)
