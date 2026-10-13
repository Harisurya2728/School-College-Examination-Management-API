import urllib.parse
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.exam import Exam
from app.models.question import Question


def normalize_id(id_str: str) -> str:
    """Cleans up raw input IDs from accidental url encoding, quotes, or whitespace."""
    if not id_str:
        return ""
    # Unquote URL encoding first (e.g. %221%22 -> "1")
    unquoted = urllib.parse.unquote(str(id_str).strip())
    # Strip double quotes, single quotes, backticks, and whitespace
    cleaned = unquoted.strip(' \t\n\r"\'`')
    return cleaned


async def resolve_question(question_id: str, db: AsyncSession) -> Optional[Question]:
    """
    Resolves question by:
    1. Exact UUID / ID
    2. 1-based index if numeric (e.g. "1" -> 1st question, "2" -> 2nd question)
    """
    clean_id = normalize_id(question_id)
    if not clean_id:
        return None

    # 1. Exact ID
    stmt = select(Question).where(Question.id == clean_id)
    res = await db.execute(stmt)
    q = res.scalar_one_or_none()
    if q:
        return q

    # 2. 1-based index if numeric (e.g., user tested with "1" or "2" in Swagger)
    if clean_id.isdigit():
        idx = int(clean_id) - 1
        if idx >= 0:
            stmt_idx = select(Question).order_by(Question.created_at.asc()).offset(idx).limit(1)
            res_idx = await db.execute(stmt_idx)
            return res_idx.scalar_one_or_none()

    return None


async def resolve_exam(exam_id: str, db: AsyncSession) -> Optional[Exam]:
    """
    Resolves exam by:
    1. Exact UUID / ID
    2. Exam code (e.g. EXAM-2026-CS-SEM1)
    3. Semester number if numeric (e.g. "1" -> Semester 1 Exam)
    4. 1-based index if numeric
    """
    clean_id = normalize_id(exam_id)
    if not clean_id:
        return None

    # 1. Exact ID
    stmt = select(Exam).where(Exam.id == clean_id)
    res = await db.execute(stmt)
    ex = res.scalar_one_or_none()
    if ex:
        return ex

    # 2. Exam code (e.g. EXAM-2026-CS-SEM1)
    stmt_code = select(Exam).where(Exam.exam_code == clean_id)
    res_code = await db.execute(stmt_code)
    ex = res_code.scalar_one_or_none()
    if ex:
        return ex

    # 3. Numeric: Semester or index
    if clean_id.isdigit():
        sem_num = int(clean_id)
        # Check by semester (e.g. 1 -> Semester 1 Exam)
        stmt_sem = select(Exam).where(Exam.semester == sem_num).order_by(Exam.created_at.asc()).limit(1)
        res_sem = await db.execute(stmt_sem)
        ex = res_sem.scalar_one_or_none()
        if ex:
            return ex

        # Check by 1-based index
        idx = sem_num - 1
        if idx >= 0:
            stmt_idx = select(Exam).order_by(Exam.created_at.asc()).offset(idx).limit(1)
            res_idx = await db.execute(stmt_idx)
            return res_idx.scalar_one_or_none()

    return None
