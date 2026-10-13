from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from typing import List, Optional

from app.core.database import get_db
from app.models.submission import StudentSubmission, StudentAnswer
from app.models.exam import Exam
from app.models.grading_policy import GradingPolicy
from app.schemas.submission import (
    SubmissionCreate,
    SubmissionUpdate,
    SubmissionResponse,
    SubmissionDetailResponse
)
from app.schemas.grading import BatchGradeCalcRequest, BatchCalculationSummary
from app.services.grade_engine import calculate_grades_for_submissions
from app.services.percentile_engine import compute_percentiles_and_ranks
from app.core.resolvers import resolve_exam

router = APIRouter()


@router.post("/", response_model=SubmissionDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_submission(submission_in: SubmissionCreate, db: AsyncSession = Depends(get_db)):
    """Create a student exam submission record with answer items."""
    # Check if student already submitted this exam
    existing = await db.execute(
        select(StudentSubmission).where(
            StudentSubmission.exam_id == submission_in.exam_id,
            StudentSubmission.student_id == submission_in.student_id
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Submission already exists for this student on this exam"
        )

    new_sub = StudentSubmission(
        exam_id=submission_in.exam_id,
        student_id=submission_in.student_id,
        roll_number=submission_in.roll_number,
        student_name=submission_in.student_name,
        department=submission_in.department,
        email=submission_in.email,
        status="SUBMITTED"
    )
    db.add(new_sub)
    await db.flush()

    raw_total = 0.0
    if submission_in.answers:
        for ans in submission_in.answers:
            sa = StudentAnswer(
                submission_id=new_sub.id,
                question_id=ans.question_id,
                answer_text=ans.answer_text,
                selected_options=ans.selected_options,
                numeric_answer=ans.numeric_answer,
                marks_obtained=ans.marks_obtained,
                max_marks=ans.max_marks,
                is_evaluated=ans.is_evaluated,
                evaluator_feedback=ans.evaluator_feedback
            )
            raw_total += ans.marks_obtained
            db.add(sa)

    new_sub.raw_score = raw_total
    new_sub.final_score = raw_total
    await db.commit()
    await db.refresh(new_sub)
    return new_sub


@router.get("/", response_model=List[SubmissionResponse])
async def list_submissions(
    exam_id: Optional[str] = None,
    student_id: Optional[str] = None,
    department: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db)
):
    """List submissions with filtering."""
    stmt = select(StudentSubmission)
    if exam_id:
        ex = await resolve_exam(exam_id, db)
        target_exam_id = ex.id if ex else exam_id
        stmt = stmt.where(StudentSubmission.exam_id == target_exam_id)
    if student_id:
        stmt = stmt.where(StudentSubmission.student_id == student_id)
    if department:
        stmt = stmt.where(StudentSubmission.department == department)

    stmt = stmt.order_by(StudentSubmission.final_score.desc()).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{submission_id}", response_model=SubmissionDetailResponse)
async def get_submission(submission_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieve submission details with answer items."""
    stmt = select(StudentSubmission).where(StudentSubmission.id == submission_id)
    result = await db.execute(stmt)
    sub = result.scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")
    return sub


@router.put("/{submission_id}", response_model=SubmissionDetailResponse)
async def update_submission(
    submission_id: str,
    update_in: SubmissionUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update submission marks or status."""
    stmt = select(StudentSubmission).where(StudentSubmission.id == submission_id)
    result = await db.execute(stmt)
    sub = result.scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")

    update_dict = update_in.model_dump(exclude_unset=True)
    for key, val in update_dict.items():
        setattr(sub, key, val)

    await db.commit()
    await db.refresh(sub)
    return sub


@router.delete("/{submission_id}", status_code=status.HTTP_200_OK)
async def delete_submission(submission_id: str, db: AsyncSession = Depends(get_db)):
    """Delete a student submission."""
    stmt = select(StudentSubmission).where(StudentSubmission.id == submission_id)
    result = await db.execute(stmt)
    sub = result.scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")

    await db.delete(sub)
    await db.commit()
    return {"deleted": True, "id": submission_id}


@router.post("/batch-calculate-grades/{exam_id}", response_model=BatchCalculationSummary)
async def batch_calculate_grades(
    exam_id: str,
    calc_req: BatchGradeCalcRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Executes the grading and percentile calculation engine for all submissions of an exam:
    1. Aggregates answer scores
    2. Applies moderation & policy cutoffs
    3. Computes exact percentiles: P = ((B + 0.5E)/N) * 100
    4. Computes class ranks and grade points
    """
    # Fetch Exam
    exam = await resolve_exam(exam_id, db)
    if not exam:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Exam '{exam_id}' not found. Please provide an Exam UUID, exam code, or semester number (1-8)."
        )

    # Fetch Policy if specified or active default
    policy = None
    if calc_req.policy_id:
        pol_stmt = select(GradingPolicy).options(selectinload(GradingPolicy.cutoffs)).where(GradingPolicy.id == calc_req.policy_id)
        pol_res = await db.execute(pol_stmt)
        policy = pol_res.scalar_one_or_none()
    else:
        pol_stmt = select(GradingPolicy).options(selectinload(GradingPolicy.cutoffs)).where(GradingPolicy.is_active == True)
        pol_res = await db.execute(pol_stmt)
        policy = pol_res.scalars().first()

    # Fetch all submissions for the exam
    sub_stmt = select(StudentSubmission).where(StudentSubmission.exam_id == exam.id)
    sub_res = await db.execute(sub_stmt)
    submissions = list(sub_res.scalars().all())

    if not submissions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No submissions found for this exam to calculate grades"
        )

    # 1. Run grade engine
    stats = calculate_grades_for_submissions(
        submissions=submissions,
        total_marks=exam.total_marks,
        passing_marks=exam.passing_marks,
        policy=policy,
        cutoffs=policy.cutoffs if policy else None,
        moderation_marks=calc_req.moderation_marks,
        apply_relative_curve=calc_req.apply_relative_curve
    )

    # 2. Run percentile & ranking engine
    compute_percentiles_and_ranks(submissions)

    await db.commit()

    scores = [s.final_score for s in submissions]
    scores.sort()
    n = len(scores)
    median = scores[n // 2] if n % 2 == 1 else (scores[n // 2 - 1] + scores[n // 2]) / 2.0
    pass_cnt = sum(1 for s in submissions if s.is_passed)
    fail_cnt = n - pass_cnt

    return BatchCalculationSummary(
        exam_id=exam_id,
        total_submissions_processed=n,
        mean_score=stats["mean"],
        median_score=round(median, 2),
        standard_deviation=stats["std_dev"],
        pass_count=pass_cnt,
        fail_count=fail_cnt,
        pass_percentage=round((pass_cnt / n * 100.0) if n > 0 else 0.0, 2)
    )
