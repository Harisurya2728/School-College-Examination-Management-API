from pydantic import BaseModel
from typing import List, Optional


class ScoreBucket(BaseModel):
    range_label: str
    min_score: float
    max_score: float
    count: int
    percentage: float
    normal_curve_density: float


class ExamStatisticsResponse(BaseModel):
    exam_id: str
    exam_title: str
    total_students: int
    evaluated_count: int
    mean: float
    median: float
    standard_deviation: float
    variance: float
    highest_score: float
    lowest_score: float
    pass_count: int
    fail_count: int
    pass_percentage: float
    top_10_percentile_cutoff: float


class DistributionResponse(BaseModel):
    exam_id: str
    mean: float
    standard_deviation: float
    buckets: List[ScoreBucket]


class StudentPercentileRecord(BaseModel):
    submission_id: str
    student_id: str
    roll_number: str
    student_name: str
    department: str
    final_score: float
    percentage: float
    rank: int
    percentile: float
    grade_letter: str
    grade_point: float
    is_passed: bool


class ItemAnalysisResponse(BaseModel):
    question_id: str
    prompt: str
    type: str
    topic: str
    difficulty_tag: str
    max_marks: float
    total_attempts: int
    correct_count: int
    difficulty_index: float      # P-value (0.0 to 1.0)
    discrimination_index: float  # D-value (-1.0 to 1.0)
    quality_verdict: str         # EXCELLENT, GOOD, MARGINAL, POOR_REVISE
    recommendation: str


class TopicPerformance(BaseModel):
    topic: str
    total_marks: float
    marks_obtained: float
    percentage: float


class StudentExamScorecardResponse(BaseModel):
    student_id: str
    roll_number: str
    student_name: str
    department: str
    exam_id: str
    exam_title: str
    total_marks: float
    final_score: float
    percentage: float
    rank: int
    total_students: int
    percentile: float
    grade_letter: str
    grade_point: float
    is_passed: bool
    cohort_mean: float
    cohort_median: float
    cohort_highest: float
    topics: List[TopicPerformance]
