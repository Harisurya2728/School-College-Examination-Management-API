import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


class StudentSubmission(Base):
    __tablename__ = "student_submissions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    exam_id = Column(String(36), ForeignKey("exams.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String(36), nullable=False, index=True)
    roll_number = Column(String(32), nullable=False, index=True)
    student_name = Column(String(128), nullable=False)
    department = Column(String(64), nullable=False)
    email = Column(String(128), nullable=True)

    # Scores
    raw_score = Column(Float, default=0.0)
    moderated_score = Column(Float, default=0.0)
    final_score = Column(Float, default=0.0)
    percentage = Column(Float, default=0.0)
    
    # Statistical analytics results
    percentile = Column(Float, default=0.0)
    rank = Column(Integer, default=0)
    
    # Grade outcomes
    grade_letter = Column(String(8), default="F")
    grade_point = Column(Float, default=0.0)
    is_passed = Column(Boolean, default=False)
    
    # Status: SUBMITTED, EVALUATED, MODERATED, PUBLISHED
    status = Column(String(24), default="SUBMITTED")
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    exam = relationship("Exam", back_populates="submissions")
    answers = relationship("StudentAnswer", back_populates="submission", cascade="all, delete-orphan", lazy="selectin")


class StudentAnswer(Base):
    __tablename__ = "student_answers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    submission_id = Column(String(36), ForeignKey("student_submissions.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(String(36), ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    
    answer_text = Column(Text, nullable=True)
    selected_options = Column(Text, nullable=True)  # JSON or comma-separated option IDs
    numeric_answer = Column(Float, nullable=True)
    
    marks_obtained = Column(Float, default=0.0)
    max_marks = Column(Float, default=1.0)
    is_evaluated = Column(Boolean, default=False)
    evaluator_feedback = Column(Text, nullable=True)

    submission = relationship("StudentSubmission", back_populates="answers")
    question = relationship("Question", lazy="joined")
