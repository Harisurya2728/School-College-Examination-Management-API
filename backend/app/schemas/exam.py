from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime
from app.schemas.question import QuestionResponse


class ExamQuestionBase(BaseModel):
    question_id: str
    section: str = "Section A"
    order_index: int = 1
    marks: float = 1.0


class ExamQuestionCreate(ExamQuestionBase):
    pass


class ExamQuestionResponse(ExamQuestionBase):
    id: str
    exam_id: str
    question: Optional[QuestionResponse] = None
    model_config = ConfigDict(from_attributes=True)


class ExamBase(BaseModel):
    title: str
    exam_code: str
    department: str
    semester: int
    academic_year: str = "2025-2026"
    duration_minutes: int = 180
    total_marks: float = 100.0
    passing_marks: float = 40.0
    status: str = "SCHEDULED"
    instructions: Optional[str] = None


class ExamCreate(ExamBase):
    questions: Optional[List[ExamQuestionCreate]] = []

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "title": "NUMPY Examination",
                "exam_code": "N18",
                "department": "AIML",
                "semester": 6,
                "academic_year": "2025-2026",
                "duration_minutes": 180,
                "total_marks": 100.0,
                "passing_marks": 40.0,
                "status": "SCHEDULED",
                "instructions": "DON'T COPY. Scientific calculators permitted.",
                "questions": [
                    {
                        "question_id": "1",
                        "section": "Section A",
                        "order_index": 1,
                        "marks": 5.0
                    }
                ]
            }
        }
    )


class ExamUpdate(BaseModel):
    title: Optional[str] = None
    exam_code: Optional[str] = None
    department: Optional[str] = None
    semester: Optional[int] = None
    academic_year: Optional[str] = None
    duration_minutes: Optional[int] = None
    total_marks: Optional[float] = None
    passing_marks: Optional[float] = None
    status: Optional[str] = None
    instructions: Optional[str] = None
    questions: Optional[List[ExamQuestionCreate]] = None


class ExamResponse(ExamBase):
    id: str
    created_at: datetime
    questions_count: int = 0
    model_config = ConfigDict(from_attributes=True)


class ExamDetailResponse(ExamBase):
    id: str
    created_at: datetime
    questions: List[ExamQuestionResponse] = []
    model_config = ConfigDict(from_attributes=True)
