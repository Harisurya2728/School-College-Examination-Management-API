from typing import List, Dict, Any
from app.models.submission import StudentSubmission
from app.models.question import Question


def compute_item_analysis(
    questions: List[Question],
    submissions: List[StudentSubmission]
) -> List[Dict[str, Any]]:
    """
    Performs psychometric item analysis:
    - Difficulty Index P = Total Correct Answers / Total Attempts
    - Discrimination Index D = (Upper 27% Correct - Lower 27% Correct) / Group Size
    """
    if not submissions or not questions:
        return []

    # Sort submissions by final_score descending
    sorted_subs = sorted(submissions, key=lambda s: s.final_score, reverse=True)
    n = len(sorted_subs)
    group_size = max(1, int(round(0.27 * n)))

    upper_group = sorted_subs[:group_size]
    lower_group = sorted_subs[-group_size:]

    results = []

    for q in questions:
        total_attempts = 0
        correct_count = 0
        upper_correct = 0
        lower_correct = 0

        # Map answers across all submissions
        for sub in submissions:
            ans = next((a for a in sub.answers if a.question_id == q.id), None)
            if ans:
                total_attempts += 1
                # Considered correct if marks_obtained >= 50% of max_marks
                if ans.marks_obtained >= (q.marks * 0.5):
                    correct_count += 1

        for sub in upper_group:
            ans = next((a for a in sub.answers if a.question_id == q.id), None)
            if ans and ans.marks_obtained >= (q.marks * 0.5):
                upper_correct += 1

        for sub in lower_group:
            ans = next((a for a in sub.answers if a.question_id == q.id), None)
            if ans and ans.marks_obtained >= (q.marks * 0.5):
                lower_correct += 1

        # Difficulty Index P (0.0 to 1.0)
        p_val = (correct_count / total_attempts) if total_attempts > 0 else 0.0

        # Discrimination Index D (-1.0 to 1.0)
        d_val = ((upper_correct - lower_correct) / group_size) if group_size > 0 else 0.0

        # Verdict and actionable recommendation
        if d_val >= 0.40:
            verdict = "EXCELLENT"
            rec = "Highly effective question; strongly discriminates high from low performers."
        elif d_val >= 0.30:
            verdict = "GOOD"
            rec = "Good discriminating power; suitable for standardized exams."
        elif d_val >= 0.20:
            verdict = "MARGINAL"
            rec = "Marginal discrimination; consider reviewing wording or distractor options."
        else:
            verdict = "POOR_REVISE"
            if p_val > 0.85:
                rec = "Question may be too easy, failing to separate proficiency levels."
            elif p_val < 0.20:
                rec = "Question may be confusing or excessively difficult."
            else:
                rec = "Weak discrimination; check for ambiguous keys or misleading distractors."

        results.append({
            "question_id": q.id,
            "prompt": q.prompt,
            "type": q.type,
            "topic": q.topic,
            "difficulty_tag": q.difficulty,
            "max_marks": q.marks,
            "total_attempts": total_attempts,
            "correct_count": correct_count,
            "difficulty_index": round(p_val, 2),
            "discrimination_index": round(d_val, 2),
            "quality_verdict": verdict,
            "recommendation": rec,
        })

    return results
