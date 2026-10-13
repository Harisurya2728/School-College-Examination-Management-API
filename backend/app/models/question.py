import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class Question(Base):
    __tablename__ = "questions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    course_id = Column(String(64), nullable=False, index=True)
    subject_code = Column(String(32), nullable=False, index=True)
    subject_name = Column(String(128), nullable=False)
    semester = Column(Integer, default=1, index=True)
    unit = Column(Integer, default=1)
    topic = Column(String(128), nullable=False, index=True)
    
    # Types: MCQ_SINGLE, MCQ_MULTI, NUMERICAL, SUBJECTIVE, TRUE_FALSE
    type = Column(String(32), nullable=False)
    
    prompt = Column(Text, nullable=False)
    prompt_latex = Column(Text, nullable=True)
    model_answer = Column(Text, nullable=True)
    
    # For NUMERICAL type
    target_numeric = Column(Float, nullable=True)
    min_tolerance = Column(Float, nullable=True)
    max_tolerance = Column(Float, nullable=True)
    
    # Taxonomy
    difficulty = Column(String(16), default="MEDIUM")  # EASY, MEDIUM, HARD
    bloom_level = Column(String(24), default="APPLY")  # REMEMBER, UNDERSTAND, APPLY, ANALYZE, EVALUATE, CREATE
    
    marks = Column(Float, default=1.0)
    negative_marks = Column(Float, default=0.0)
    tags = Column(String(256), default="")  # comma-separated tags
    status = Column(String(24), default="APPROVED")  # DRAFT, IN_REVIEW, APPROVED
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    options = relationship("QuestionOption", back_populates="question", cascade="all, delete-orphan", lazy="selectin")
    rubrics = relationship("RubricCriterion", back_populates="question", cascade="all, delete-orphan", lazy="selectin")


class QuestionOption(Base):
    __tablename__ = "question_options"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    question_id = Column(String(36), ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    text = Column(Text, nullable=False)
    latex = Column(Text, nullable=True)
    is_correct = Column(Boolean, default=False)

    question = relationship("Question", back_populates="options")


class RubricCriterion(Base):
    __tablename__ = "rubric_criteria"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    question_id = Column(String(36), ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(128), nullable=False)
    max_marks = Column(Float, nullable=False)
    description = Column(Text, nullable=True)

    question = relationship("Question", back_populates="rubrics")
