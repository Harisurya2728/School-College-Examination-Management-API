from fastapi import APIRouter
from app.api.v1.endpoints import (
    questions,
    exams,
    grading_policies,
    submissions,
    analytics
)

api_router = APIRouter()

api_router.include_router(questions.router, prefix="/questions", tags=["Question Bank"])
api_router.include_router(exams.router, prefix="/exams", tags=["Exams & Blueprints"])
api_router.include_router(grading_policies.router, prefix="/grading-policies", tags=["Grading Policies"])
api_router.include_router(submissions.router, prefix="/submissions", tags=["Submissions & Evaluation"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Percentile & Analytics"])
