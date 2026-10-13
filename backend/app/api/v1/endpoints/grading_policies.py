from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import List

from app.core.database import get_db
from app.models.grading_policy import GradingPolicy, GradeCutoff
from app.schemas.grading import (
    GradingPolicyCreate,
    GradingPolicyUpdate,
    GradingPolicyResponse
)

router = APIRouter()


@router.post("/", response_model=GradingPolicyResponse, status_code=status.HTTP_201_CREATED)
async def create_grading_policy(policy_in: GradingPolicyCreate, db: AsyncSession = Depends(get_db)):
    """Create a new grading policy and its cutoff tiers."""
    new_pol = GradingPolicy(
        name=policy_in.name,
        description=policy_in.description,
        mode=policy_in.mode,
        moderation_allowed=policy_in.moderation_allowed,
        grace_marks_cap=policy_in.grace_marks_cap,
        is_active=policy_in.is_active
    )
    db.add(new_pol)
    await db.flush()

    if policy_in.cutoffs:
        for cut in policy_in.cutoffs:
            c = GradeCutoff(
                policy_id=new_pol.id,
                grade_letter=cut.grade_letter,
                grade_point=cut.grade_point,
                min_percentage=cut.min_percentage,
                description=cut.description
            )
            db.add(c)

    await db.commit()
    await db.refresh(new_pol)
    return new_pol


@router.get("/", response_model=List[GradingPolicyResponse])
async def list_grading_policies(db: AsyncSession = Depends(get_db)):
    """List all grading policies."""
    stmt = select(GradingPolicy).order_by(GradingPolicy.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{policy_id}", response_model=GradingPolicyResponse)
async def get_grading_policy(policy_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieve grading policy by ID."""
    stmt = select(GradingPolicy).where(GradingPolicy.id == policy_id)
    result = await db.execute(stmt)
    pol = result.scalar_one_or_none()
    if not pol:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grading policy not found")
    return pol


@router.put("/{policy_id}", response_model=GradingPolicyResponse)
async def update_grading_policy(
    policy_id: str,
    policy_update: GradingPolicyUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update grading policy thresholds and parameters."""
    stmt = select(GradingPolicy).where(GradingPolicy.id == policy_id)
    result = await db.execute(stmt)
    pol = result.scalar_one_or_none()
    if not pol:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grading policy not found")

    update_dict = policy_update.model_dump(exclude_unset=True)

    if "cutoffs" in update_dict:
        cutoffs_data = update_dict.pop("cutoffs")
        if cutoffs_data is not None:
            await db.execute(delete(GradeCutoff).where(GradeCutoff.policy_id == policy_id))
            for cut in cutoffs_data:
                db.add(GradeCutoff(
                    policy_id=pol.id,
                    grade_letter=cut["grade_letter"],
                    grade_point=cut["grade_point"],
                    min_percentage=cut["min_percentage"],
                    description=cut.get("description")
                ))

    for key, val in update_dict.items():
        setattr(pol, key, val)

    await db.commit()
    await db.refresh(pol)
    return pol


@router.delete("/{policy_id}", status_code=status.HTTP_200_OK)
async def delete_grading_policy(policy_id: str, db: AsyncSession = Depends(get_db)):
    """Delete a grading policy by ID."""
    stmt = select(GradingPolicy).where(GradingPolicy.id == policy_id)
    result = await db.execute(stmt)
    pol = result.scalar_one_or_none()
    if not pol:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grading policy not found")

    await db.delete(pol)
    await db.commit()
    return {"deleted": True, "id": policy_id}
