import math
from typing import List, Dict, Any
from app.models.submission import StudentSubmission


def compute_percentiles_and_ranks(submissions: List[StudentSubmission]) -> None:
    """
    Computes accurate percentile ranks using formula:
    P = ((B + 0.5 * E) / N) * 100
    where:
    - B is the number of students scoring strictly lower than the student
    - E is the number of students with the exact same score
    - N is total examinees

    Also computes competition ranks (1 = highest score).
    Mutates submissions with percentile and rank.
    """
    if not submissions:
        return

    n = len(submissions)
    # Sort descending by final_score for ranking
    sorted_subs = sorted(submissions, key=lambda s: s.final_score, reverse=True)
    all_scores = [s.final_score for s in submissions]

    # Assign competition ranks
    current_rank = 1
    for i, sub in enumerate(sorted_subs):
        if i > 0 and sub.final_score < sorted_subs[i - 1].final_score:
            current_rank = i + 1
        sub.rank = current_rank

    # Assign percentile
    for sub in submissions:
        score = sub.final_score
        b = sum(1 for s in all_scores if s < score)
        e = sum(1 for s in all_scores if s == score)
        percentile = ((b + 0.5 * e) / n) * 100.0
        sub.percentile = round(percentile, 2)


def compute_cohort_statistics(submissions: List[StudentSubmission], total_marks: float) -> Dict[str, Any]:
    """Computes Mean, Median, StdDev, Variance, Pass/Fail counts and top 10% cutoff."""
    if not submissions:
        return {
            "total_students": 0,
            "evaluated_count": 0,
            "mean": 0.0,
            "median": 0.0,
            "standard_deviation": 0.0,
            "variance": 0.0,
            "highest_score": 0.0,
            "lowest_score": 0.0,
            "pass_count": 0,
            "fail_count": 0,
            "pass_percentage": 0.0,
            "top_10_percentile_cutoff": 0.0,
        }

    scores = sorted([s.final_score for s in submissions])
    n = len(scores)

    mean = sum(scores) / n
    variance = sum((x - mean) ** 2 for x in scores) / n
    std_dev = math.sqrt(variance)

    # Median
    if n % 2 == 1:
        median = scores[n // 2]
    else:
        median = (scores[n // 2 - 1] + scores[n // 2]) / 2.0

    pass_count = sum(1 for s in submissions if s.is_passed)
    fail_count = n - pass_count
    pass_pct = (pass_count / n * 100.0) if n > 0 else 0.0

    # Top 10% cutoff score (90th percentile)
    idx_top10 = max(0, int(0.9 * n) - 1)
    top_10_cutoff = scores[idx_top10] if n > 0 else 0.0

    return {
        "total_students": n,
        "evaluated_count": n,
        "mean": round(mean, 2),
        "median": round(median, 2),
        "standard_deviation": round(std_dev, 2),
        "variance": round(variance, 2),
        "highest_score": round(scores[-1], 2),
        "lowest_score": round(scores[0], 2),
        "pass_count": pass_count,
        "fail_count": fail_count,
        "pass_percentage": round(pass_pct, 2),
        "top_10_percentile_cutoff": round(top_10_cutoff, 2),
    }


def compute_distribution_buckets(
    submissions: List[StudentSubmission],
    total_marks: float,
    num_buckets: int = 10
) -> List[Dict[str, Any]]:
    """
    Creates score histogram intervals with Gaussian bell curve density overlay.
    """
    if not submissions or total_marks <= 0:
        return []

    scores = [s.final_score for s in submissions]
    n = len(scores)
    mean = sum(scores) / n
    variance = sum((x - mean) ** 2 for x in scores) / n
    std_dev = math.sqrt(variance) if variance > 0 else 1.0

    step = total_marks / num_buckets
    buckets = []

    for i in range(num_buckets):
        low = i * step
        high = (i + 1) * step
        # Count scores in [low, high) or [low, high] for the last bucket
        if i == num_buckets - 1:
            count = sum(1 for s in scores if low <= s <= high)
        else:
            count = sum(1 for s in scores if low <= s < high)

        pct = (count / n * 100.0) if n > 0 else 0.0
        mid = (low + high) / 2.0

        # Normal distribution probability density function f(x)
        exponent = -((mid - mean) ** 2) / (2 * (std_dev ** 2)) if std_dev > 0 else 0.0
        gaussian = (1.0 / (std_dev * math.sqrt(2 * math.pi))) * math.exp(exponent)
        # Scaled density for visual alignment with percentage
        scaled_density = round(gaussian * step * 100.0, 2)

        buckets.append({
            "range_label": f"{int(low)}-{int(high)}",
            "min_score": round(low, 1),
            "max_score": round(high, 1),
            "count": count,
            "percentage": round(pct, 2),
            "normal_curve_density": scaled_density,
        })

    return buckets
