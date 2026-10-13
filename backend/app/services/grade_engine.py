from typing import List, Dict, Optional, Tuple, Any
import math
from app.models.grading_policy import GradingPolicy, GradeCutoff
from app.models.submission import StudentSubmission


DEFAULT_CUTOFFS = [
    {"grade_letter": "O", "grade_point": 10.0, "min_percentage": 90.0, "description": "Outstanding"},
    {"grade_letter": "A+", "grade_point": 9.0, "min_percentage": 80.0, "description": "Excellent"},
    {"grade_letter": "A", "grade_point": 8.0, "min_percentage": 70.0, "description": "Very Good"},
    {"grade_letter": "B+", "grade_point": 7.0, "min_percentage": 60.0, "description": "Good"},
    {"grade_letter": "B", "grade_point": 6.0, "min_percentage": 50.0, "description": "Above Average"},
    {"grade_letter": "C", "grade_point": 5.0, "min_percentage": 40.0, "description": "Average / Pass"},
    {"grade_letter": "F", "grade_point": 0.0, "min_percentage": 0.0, "description": "Fail"},
]


def assign_absolute_grade(percentage: float, cutoffs: List[GradeCutoff]) -> Tuple[str, float, bool]:
    """Matches percentage against descending cutoff thresholds."""
    sorted_cutoffs = sorted(cutoffs, key=lambda c: c.min_percentage, reverse=True)
    for c in sorted_cutoffs:
        if percentage >= c.min_percentage:
            is_passed = c.grade_letter != "F" and c.grade_point > 0
            return c.grade_letter, c.grade_point, is_passed
    return "F", 0.0, False


def assign_relative_grade(score: float, mean: float, std_dev: float, passing_score: float) -> Tuple[str, float, bool]:
    """Relative grading based on standard deviations from cohort mean."""
    if score < passing_score:
        return "F", 0.0, False

    if std_dev == 0:
        return ("A", 8.0, True) if score >= mean else ("B", 6.0, True)

    z = (score - mean) / std_dev
    if z >= 1.5:
        return "O", 10.0, True
    elif z >= 1.0:
        return "A+", 9.0, True
    elif z >= 0.5:
        return "A", 8.0, True
    elif z >= -0.5:
        return "B+", 7.0, True
    elif z >= -1.0:
        return "B", 6.0, True
    elif z >= -1.5:
        return "C", 5.0, True
    else:
        return "F", 0.0, False


def calculate_grades_for_submissions(
    submissions: List[StudentSubmission],
    total_marks: float,
    passing_marks: float,
    policy: Optional[GradingPolicy] = None,
    cutoffs: Optional[List[Any]] = None,
    moderation_marks: float = 0.0,
    apply_relative_curve: bool = False
) -> Dict[str, float]:
    """
    Evaluates submissions, applies moderation within allowed cap,
    computes percentages, letter grades and points.
    """
    if not submissions:
        return {"total": 0, "mean": 0.0, "std_dev": 0.0}

    grace_cap = policy.grace_marks_cap if policy else 5.0
    allowed_moderation = min(max(moderation_marks, 0.0), grace_cap)

    # 1. Update final scores with moderation
    scores = []
    for sub in submissions:
        raw = sub.raw_score
        final = min(raw + allowed_moderation, total_marks)
        sub.moderated_score = round(allowed_moderation, 2)
        sub.final_score = round(final, 2)
        pct = (final / total_marks * 100.0) if total_marks > 0 else 0.0
        sub.percentage = round(pct, 2)
        scores.append(final)

    # 2. Compute Mean & StdDev for relative mode
    n = len(scores)
    mean = sum(scores) / n if n > 0 else 0.0
    variance = sum((x - mean) ** 2 for x in scores) / n if n > 0 else 0.0
    std_dev = math.sqrt(variance)

    # 3. Grade assignment
    active_cutoffs = cutoffs if cutoffs is not None else []

    for sub in submissions:
        if apply_relative_curve or (policy and policy.mode == "RELATIVE_NORMAL"):
            letter, pt, passed = assign_relative_grade(sub.final_score, mean, std_dev, passing_marks)
        else:
            if active_cutoffs:
                letter, pt, passed = assign_absolute_grade(sub.percentage, active_cutoffs)
            else:
                # Default 10-point scale
                if sub.percentage >= 90:
                    letter, pt, passed = "O", 10.0, True
                elif sub.percentage >= 80:
                    letter, pt, passed = "A+", 9.0, True
                elif sub.percentage >= 70:
                    letter, pt, passed = "A", 8.0, True
                elif sub.percentage >= 60:
                    letter, pt, passed = "B+", 7.0, True
                elif sub.percentage >= 50:
                    letter, pt, passed = "B", 6.0, True
                elif sub.percentage >= 40:
                    letter, pt, passed = "C", 5.0, True
                else:
                    letter, pt, passed = "F", 0.0, False

        sub.grade_letter = letter
        sub.grade_point = pt
        sub.is_passed = passed
        sub.status = "EVALUATED"

    return {
        "total": float(n),
        "mean": round(mean, 2),
        "std_dev": round(std_dev, 2)
    }
