import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


class Exam(Base):
    __tablename__ = "exams"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(128), nullable=False)
    exam_code = Column(String(32), unique=True, nullable=False, index=True)
    department = Column(String(64), nullable=False)
    semester = Column(Integer, nullable=False)
    academic_year = Column(String(16), default="2025-2026")
    duration_minutes = Column(Integer, default=180)
    total_marks = Column(Float, default=100.0)
    passing_marks = Column(Float, default=40.0)
    status = Column(String(24), default="SCHEDULED")  # DRAFT, SCHEDULED, IN_PROGRESS, COMPLETED, PUBLISHED
    instructions = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    questions = relationship("ExamQuestion", back_populates="exam", cascade="all, delete-orphan", lazy="selectin")
    submissions = relationship("StudentSubmission", back_populates="exam", cascade="all, delete-orphan", lazy="selectin")


class ExamQuestion(Base):
    __tablename__ = "exam_questions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    exam_id = Column(String(36), ForeignKey("exams.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(String(36), ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    section = Column(String(32), default="Section A")
    order_index = Column(Integer, default=1)
    marks = Column(Float, default=1.0)

    exam = relationship("Exam", back_populates="questions")
    question = relationship("Question", lazy="joined")
