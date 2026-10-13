from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import List, Optional

from app.core.database import get_db
from app.core.resolvers import resolve_exam, resolve_question
from app.models.exam import Exam, ExamQuestion
from app.schemas.exam import (
    ExamCreate,
    ExamUpdate,
    ExamResponse,
    ExamDetailResponse
)

router = APIRouter()


@router.post("/", response_model=ExamDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_exam(exam_in: ExamCreate, db: AsyncSession = Depends(get_db)):
    """Create a new exam schedule and assign questions."""
    # Check if exam_code exists
    existing = await db.execute(select(Exam).where(Exam.exam_code == exam_in.exam_code))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Exam with code '{exam_in.exam_code}' already exists"
        )

    new_exam = Exam(
        title=exam_in.title,
        exam_code=exam_in.exam_code,
        department=exam_in.department,
        semester=exam_in.semester,
        academic_year=exam_in.academic_year,
        duration_minutes=exam_in.duration_minutes,
        total_marks=exam_in.total_marks,
        passing_marks=exam_in.passing_marks,
        status=exam_in.status,
        instructions=exam_in.instructions
    )
    db.add(new_exam)
    await db.flush()

    if exam_in.questions:
        for q_entry in exam_in.questions:
            # Resolve question_id: supports UUID, 1-based index, or quoted IDs
            target_q = await resolve_question(q_entry.question_id, db)
            real_q_id = target_q.id if target_q else q_entry.question_id
            eq = ExamQuestion(
                exam_id=new_exam.id,
                question_id=real_q_id,
                section=q_entry.section,
                order_index=q_entry.order_index,
                marks=q_entry.marks
            )
            db.add(eq)

    await db.commit()
    await db.refresh(new_exam)
    return new_exam


@router.get("/", response_model=List[ExamResponse])
async def list_exams(
    department: Optional[str] = None,
    semester: Optional[int] = None,
    exam_status: Optional[str] = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """List all exams with filtering."""
    stmt = select(Exam)
    if department:
        stmt = stmt.where(Exam.department == department)
    if semester:
        stmt = stmt.where(Exam.semester == semester)
    if exam_status:
        stmt = stmt.where(Exam.status == exam_status)

    stmt = stmt.order_by(Exam.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(stmt)
    exams = result.scalars().all()

    # Calculate question count for summary response
    response_list = []
    for ex in exams:
        res = ExamResponse(
            id=ex.id,
            title=ex.title,
            exam_code=ex.exam_code,
            department=ex.department,
            semester=ex.semester,
            academic_year=ex.academic_year,
            duration_minutes=ex.duration_minutes,
            total_marks=ex.total_marks,
            passing_marks=ex.passing_marks,
            status=ex.status,
            instructions=ex.instructions,
            created_at=ex.created_at,
            questions_count=len(ex.questions) if ex.questions else 0
        )
        response_list.append(res)
    return response_list


@router.get("/{exam_id}", response_model=ExamDetailResponse)
async def get_exam(exam_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieve full details of an exam with questions by ID, exam_code, or semester number."""
    ex = await resolve_exam(exam_id, db)
    if not ex:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Exam '{exam_id}' not found. Please provide an Exam UUID, exam code (e.g., EXAM-2026-CS-SEM1), or semester number (1-8)."
        )
    return ex


@router.put("/{exam_id}", response_model=ExamDetailResponse)
async def update_exam(
    exam_id: str,
    exam_update: ExamUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update exam details and assigned questions."""
    ex = await resolve_exam(exam_id, db)
    if not ex:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Exam '{exam_id}' not found. Please provide an Exam UUID, exam code, or semester number."
        )

    real_id = ex.id
    update_dict = exam_update.model_dump(exclude_unset=True)

    if "questions" in update_dict:
        q_data = update_dict.pop("questions")
        if q_data is not None:
            await db.execute(delete(ExamQuestion).where(ExamQuestion.exam_id == real_id))
            for q_entry in q_data:
                # Resolve question_id for flexible input
                target_q = await resolve_question(q_entry["question_id"], db)
                resolved_q_id = target_q.id if target_q else q_entry["question_id"]
                db.add(ExamQuestion(
                    exam_id=real_id,
                    question_id=resolved_q_id,
                    section=q_entry.get("section", "Section A"),
                    order_index=q_entry.get("order_index", 1),
                    marks=q_entry.get("marks", 1.0)
                ))

    for key, val in update_dict.items():
        setattr(ex, key, val)

    await db.commit()
    await db.refresh(ex)
    return ex


@router.delete("/{exam_id}", status_code=status.HTTP_200_OK)
async def delete_exam(exam_id: str, db: AsyncSession = Depends(get_db)):
    """Delete an exam by ID, exam code, or semester number."""
    ex = await resolve_exam(exam_id, db)
    if not ex:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Exam '{exam_id}' not found. Please provide an Exam UUID, exam code, or semester number."
        )

    real_id = ex.id
    await db.delete(ex)
    await db.commit()
    return {"deleted": True, "id": real_id}
