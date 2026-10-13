import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


class GradingPolicy(Base):
    __tablename__ = "grading_policies"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(128), nullable=False)
    description = Column(Text, nullable=True)
    # Mode: ABSOLUTE, RELATIVE_NORMAL, PERCENTILE_BASED
    mode = Column(String(32), default="ABSOLUTE")
    moderation_allowed = Column(Boolean, default=True)
    grace_marks_cap = Column(Float, default=5.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    cutoffs = relationship("GradeCutoff", back_populates="policy", cascade="all, delete-orphan", lazy="selectin", order_by="desc(GradeCutoff.min_percentage)")


class GradeCutoff(Base):
    __tablename__ = "grade_cutoffs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    policy_id = Column(String(36), ForeignKey("grading_policies.id", ondelete="CASCADE"), nullable=False)
    grade_letter = Column(String(8), nullable=False)  # O, A+, A, B+, B, C, F
    grade_point = Column(Float, nullable=False)       # 10, 9, 8, 7, 6, 5, 0
    min_percentage = Column(Float, nullable=False)    # e.g., 90.0, 80.0, etc.
    description = Column(String(64), nullable=True)   # Outstanding, Excellent, etc.

    policy = relationship("GradingPolicy", back_populates="cutoffs")
