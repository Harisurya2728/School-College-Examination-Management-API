from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List

from app.core.database import get_db
from app.models.exam import Exam
from app.models.submission import StudentSubmission, StudentAnswer
from app.models.question import Question
from app.schemas.analytics import (
    ExamStatisticsResponse,
    DistributionResponse,
    StudentPercentileRecord,
    ItemAnalysisResponse,
    StudentExamScorecardResponse,
    TopicPerformance
)
from app.services.percentile_engine import (
    compute_cohort_statistics,
    compute_distribution_buckets
)
from app.services.item_analysis import compute_item_analysis

from app.core.resolvers import resolve_exam

router = APIRouter()


@router.get("/exams/{exam_id}/overview", response_model=ExamStatisticsResponse)
async def get_exam_overview(exam_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieve statistical summary for an exam."""
    exam = await resolve_exam(exam_id, db)
    if not exam:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Exam '{exam_id}' not found. Please provide an Exam UUID, exam code, or semester number (1-8)."
        )

    sub_res = await db.execute(select(StudentSubmission).where(StudentSubmission.exam_id == exam.id))
    submissions = list(sub_res.scalars().all())

    stats = compute_cohort_statistics(submissions, exam.total_marks)
    return ExamStatisticsResponse(
        exam_id=exam.id,
        exam_title=exam.title,
        **stats
    )


@router.get("/exams/{exam_id}/distribution", response_model=DistributionResponse)
async def get_exam_distribution(exam_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieve score distribution histogram and normal distribution bell curve data."""
    exam = await resolve_exam(exam_id, db)
    if not exam:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Exam '{exam_id}' not found. Please provide an Exam UUID, exam code, or semester number (1-8)."
        )

    sub_res = await db.execute(select(StudentSubmission).where(StudentSubmission.exam_id == exam.id))
    submissions = list(sub_res.scalars().all())

    stats = compute_cohort_statistics(submissions, exam.total_marks)
    buckets = compute_distribution_buckets(submissions, exam.total_marks, num_buckets=10)

    return DistributionResponse(
        exam_id=exam.id,
        mean=stats["mean"],
        standard_deviation=stats["standard_deviation"],
        buckets=buckets
    )


@router.get("/exams/{exam_id}/percentiles", response_model=List[StudentPercentileRecord])
async def get_exam_percentiles(exam_id: str, db: AsyncSession = Depends(get_db)):
    """List all students for an exam sorted by score and percentile rank."""
    exam = await resolve_exam(exam_id, db)
    if not exam:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Exam '{exam_id}' not found. Please provide an Exam UUID, exam code, or semester number (1-8)."
        )

    sub_res = await db.execute(
        select(StudentSubmission)
        .where(StudentSubmission.exam_id == exam.id)
        .order_by(StudentSubmission.final_score.desc())
    )
    submissions = sub_res.scalars().all()

    return [
        StudentPercentileRecord(
            submission_id=s.id,
            student_id=s.student_id,
            roll_number=s.roll_number,
            student_name=s.student_name,
            department=s.department,
            final_score=s.final_score,
            percentage=s.percentage,
            rank=s.rank,
            percentile=s.percentile,
            grade_letter=s.grade_letter,
            grade_point=s.grade_point,
            is_passed=s.is_passed,
        )
        for s in submissions
    ]


@router.get("/exams/{exam_id}/item-analysis", response_model=List[ItemAnalysisResponse])
async def get_exam_item_analysis(exam_id: str, db: AsyncSession = Depends(get_db)):
    """Psychometric analysis of each question's difficulty and discrimination power."""
    exam = await resolve_exam(exam_id, db)
    if not exam:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Exam '{exam_id}' not found. Please provide an Exam UUID, exam code, or semester number (1-8)."
        )

    # Extract questions assigned to this exam
    assigned_q_ids = [eq.question_id for eq in exam.questions]
    if not assigned_q_ids:
        return []

    q_res = await db.execute(select(Question).where(Question.id.in_(assigned_q_ids)))
    questions = list(q_res.scalars().all())

    sub_res = await db.execute(
        select(StudentSubmission)
        .options(selectinload(StudentSubmission.answers))
        .where(StudentSubmission.exam_id == exam.id)
    )
    submissions = list(sub_res.scalars().all())

    return compute_item_analysis(questions, submissions)


@router.get("/students/{student_id}/exam/{exam_id}", response_model=StudentExamScorecardResponse)
async def get_student_scorecard(student_id: str, exam_id: str, db: AsyncSession = Depends(get_db)):
    """Generate detailed individual student scorecard with topic performance and cohort benchmark."""
    exam = await resolve_exam(exam_id, db)
    if not exam:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Exam '{exam_id}' not found. Please provide an Exam UUID, exam code, or semester number (1-8)."
        )

    sub_res = await db.execute(
        select(StudentSubmission)
        .options(selectinload(StudentSubmission.answers).selectinload(StudentAnswer.question))
        .where(StudentSubmission.exam_id == exam.id)
    )
    submissions = list(sub_res.scalars().all())

    student_sub = next((s for s in submissions if s.student_id == student_id), None)
    if not student_sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student submission not found")

    stats = compute_cohort_statistics(submissions, exam.total_marks)

    # Compute topic level performance breakdown
    topic_map = {}
    for ans in student_sub.answers:
        if ans.question:
            top = ans.question.topic
            if top not in topic_map:
                topic_map[top] = {"total": 0.0, "obtained": 0.0}
            topic_map[top]["total"] += ans.max_marks
            topic_map[top]["obtained"] += ans.marks_obtained

    topics_list = [
        TopicPerformance(
            topic=t_name,
            total_marks=vals["total"],
            marks_obtained=vals["obtained"],
            percentage=round((vals["obtained"] / vals["total"] * 100.0) if vals["total"] > 0 else 0.0, 2)
        )
        for t_name, vals in topic_map.items()
    ]

    return StudentExamScorecardResponse(
        student_id=student_sub.student_id,
        roll_number=student_sub.roll_number,
        student_name=student_sub.student_name,
        department=student_sub.department,
        exam_id=exam.id,
        exam_title=exam.title,
        total_marks=exam.total_marks,
        final_score=student_sub.final_score,
        percentage=student_sub.percentage,
        rank=student_sub.rank,
        total_students=len(submissions),
        percentile=student_sub.percentile,
        grade_letter=student_sub.grade_letter,
        grade_point=student_sub.grade_point,
        is_passed=student_sub.is_passed,
        cohort_mean=stats["mean"],
        cohort_median=stats["median"],
        cohort_highest=stats["highest_score"],
        topics=topics_list
    )
