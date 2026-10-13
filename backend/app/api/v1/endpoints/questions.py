from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, delete
from typing import List, Optional

from app.core.database import get_db
from app.models.question import Question, QuestionOption, RubricCriterion
from app.schemas.question import (
    QuestionCreate,
    QuestionUpdate,
    QuestionResponse,
    BulkUploadSummary
)

router = APIRouter()


@router.post("/", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
async def create_question(question_in: QuestionCreate, db: AsyncSession = Depends(get_db)):
    """Create a new question with optional options and rubrics."""
    new_q = Question(
        course_id=question_in.course_id,
        subject_code=question_in.subject_code,
        subject_name=question_in.subject_name,
        semester=question_in.semester,
        unit=question_in.unit,
        topic=question_in.topic,
        type=question_in.type,
        prompt=question_in.prompt,
        prompt_latex=question_in.prompt_latex,
        model_answer=question_in.model_answer,
        target_numeric=question_in.target_numeric,
        min_tolerance=question_in.min_tolerance,
        max_tolerance=question_in.max_tolerance,
        difficulty=question_in.difficulty,
        bloom_level=question_in.bloom_level,
        marks=question_in.marks,
        negative_marks=question_in.negative_marks,
        tags=question_in.tags,
        status=question_in.status
    )
    db.add(new_q)
    await db.flush()

    if question_in.options:
        for opt in question_in.options:
            new_opt = QuestionOption(
                question_id=new_q.id,
                text=opt.text,
                latex=opt.latex,
                is_correct=opt.is_correct
            )
            db.add(new_opt)

    if question_in.rubrics:
        for rub in question_in.rubrics:
            new_rub = RubricCriterion(
                question_id=new_q.id,
                title=rub.title,
                max_marks=rub.max_marks,
                description=rub.description
            )
            db.add(new_rub)

    await db.commit()
    await db.refresh(new_q)
    return new_q


@router.get("/", response_model=List[QuestionResponse])
async def list_questions(
    course_id: Optional[str] = None,
    subject_code: Optional[str] = None,
    semester: Optional[int] = None,
    difficulty: Optional[str] = None,
    bloom_level: Optional[str] = None,
    q_type: Optional[str] = Query(None, alias="type"),
    search: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve questions with filtering and pagination."""
    stmt = select(Question)
    if course_id:
        stmt = stmt.where(Question.course_id == course_id)
    if subject_code:
        stmt = stmt.where(Question.subject_code == subject_code)
    if semester:
        stmt = stmt.where(Question.semester == semester)
    if difficulty:
        stmt = stmt.where(Question.difficulty == difficulty)
    if bloom_level:
        stmt = stmt.where(Question.bloom_level == bloom_level)
    if q_type:
        stmt = stmt.where(Question.type == q_type)
    if search:
        search_filter = or_(
            Question.prompt.ilike(f"%{search}%"),
            Question.topic.ilike(f"%{search}%"),
            Question.tags.ilike(f"%{search}%")
        )
        stmt = stmt.where(search_filter)

    stmt = stmt.order_by(Question.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()


from app.core.resolvers import resolve_question

@router.get("/{question_id}", response_model=QuestionResponse)
async def get_question(question_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieve a single question by ID or 1-based index."""
    q = await resolve_question(question_id, db)
    if not q:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Question '{question_id}' not found. Please provide a valid Question UUID or 1-based index (e.g., 1, 2)."
        )
    return q


@router.put("/{question_id}", response_model=QuestionResponse)
async def update_question(
    question_id: str,
    question_update: QuestionUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update question attributes, options, and rubrics."""
    q = await resolve_question(question_id, db)
    if not q:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Question '{question_id}' not found. Please provide a valid Question UUID or 1-based index."
        )

    real_id = q.id
    update_dict = question_update.model_dump(exclude_unset=True)
    
    # Handle nested options replacement if provided
    if "options" in update_dict:
        opts_data = update_dict.pop("options")
        if opts_data is not None:
            await db.execute(delete(QuestionOption).where(QuestionOption.question_id == real_id))
            for opt in opts_data:
                db.add(QuestionOption(
                    question_id=real_id,
                    text=opt["text"],
                    latex=opt.get("latex"),
                    is_correct=opt.get("is_correct", False)
                ))

    # Handle nested rubrics replacement if provided
    if "rubrics" in update_dict:
        rub_data = update_dict.pop("rubrics")
        if rub_data is not None:
            await db.execute(delete(RubricCriterion).where(RubricCriterion.question_id == real_id))
            for rub in rub_data:
                db.add(RubricCriterion(
                    question_id=real_id,
                    title=rub["title"],
                    max_marks=rub["max_marks"],
                    description=rub.get("description")
                ))

    for key, val in update_dict.items():
        setattr(q, key, val)

    await db.commit()
    await db.refresh(q)
    return q


@router.delete("/{question_id}", status_code=status.HTTP_200_OK)
async def delete_question(question_id: str, db: AsyncSession = Depends(get_db)):
    """Delete a question by ID or 1-based index."""
    q = await resolve_question(question_id, db)
    if not q:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Question '{question_id}' not found. Please provide a valid Question UUID or 1-based index."
        )

    real_id = q.id
    await db.delete(q)
    await db.commit()
    return {"deleted": True, "id": real_id}


@router.post("/bulk-upload", response_model=BulkUploadSummary, status_code=status.HTTP_201_CREATED)
async def bulk_upload_questions(questions: List[QuestionCreate], db: AsyncSession = Depends(get_db)):
    """Bulk create multiple questions at once."""
    created_count = 0
    errors = []

    for idx, q_data in enumerate(questions):
        try:
            new_q = Question(
                course_id=q_data.course_id,
                subject_code=q_data.subject_code,
                subject_name=q_data.subject_name,
                semester=q_data.semester,
                unit=q_data.unit,
                topic=q_data.topic,
                type=q_data.type,
                prompt=q_data.prompt,
                prompt_latex=q_data.prompt_latex,
                model_answer=q_data.model_answer,
                target_numeric=q_data.target_numeric,
                min_tolerance=q_data.min_tolerance,
                max_tolerance=q_data.max_tolerance,
                difficulty=q_data.difficulty,
                bloom_level=q_data.bloom_level,
                marks=q_data.marks,
                negative_marks=q_data.negative_marks,
                tags=q_data.tags,
                status=q_data.status
            )
            db.add(new_q)
            await db.flush()

            if q_data.options:
                for opt in q_data.options:
                    db.add(QuestionOption(
                        question_id=new_q.id,
                        text=opt.text,
                        latex=opt.latex,
                        is_correct=opt.is_correct
                    ))

            if q_data.rubrics:
                for rub in q_data.rubrics:
                    db.add(RubricCriterion(
                        question_id=new_q.id,
                        title=rub.title,
                        max_marks=rub.max_marks,
                        description=rub.description
                    ))
            created_count += 1
        except Exception as e:
            errors.append(f"Row {idx + 1}: {str(e)}")

    await db.commit()
    return BulkUploadSummary(
        total_processed=len(questions),
        created_count=created_count,
        errors=errors
    )
