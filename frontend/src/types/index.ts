export type QuestionType = 'MCQ_SINGLE' | 'MCQ_MULTI' | 'NUMERICAL' | 'SUBJECTIVE' | 'TRUE_FALSE';
export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD';
export type BloomLevel = 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE';

export interface QuestionOption {
  id?: string;
  text: string;
  latex?: string;
  is_correct: boolean;
}

export interface RubricCriterion {
  id?: string;
  title: string;
  max_marks: number;
  description?: string;
}

export interface Question {
  id: string;
  course_id: string;
  subject_code: string;
  subject_name: string;
  semester: number;
  unit: number;
  topic: string;
  type: QuestionType;
  prompt: string;
  prompt_latex?: string;
  model_answer?: string;
  target_numeric?: number;
  min_tolerance?: number;
  max_tolerance?: number;
  difficulty: DifficultyLevel;
  bloom_level: BloomLevel;
  marks: number;
  negative_marks: number;
  tags: string;
  status: 'DRAFT' | 'IN_REVIEW' | 'APPROVED';
  created_at: string;
  updated_at: string;
  options: QuestionOption[];
  rubrics: RubricCriterion[];
}

export interface ExamQuestion {
  id: string;
  question_id: string;
  section: string;
  order_index: number;
  marks: number;
  question?: Question;
}

export interface Exam {
  id: string;
  title: string;
  exam_code: string;
  department: string;
  semester: number;
  academic_year: string;
  duration_minutes: number;
  total_marks: number;
  passing_marks: number;
  status: 'DRAFT' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'PUBLISHED';
  instructions?: string;
  created_at: string;
  questions_count?: number;
  questions?: ExamQuestion[];
}

export interface GradeCutoff {
  id?: string;
  grade_letter: string;
  grade_point: number;
  min_percentage: number;
  description?: string;
}

export interface GradingPolicy {
  id: string;
  name: string;
  description?: string;
  mode: 'ABSOLUTE' | 'RELATIVE_NORMAL' | 'PERCENTILE_BASED';
  moderation_allowed: boolean;
  grace_marks_cap: number;
  is_active: boolean;
  created_at: string;
  cutoffs: GradeCutoff[];
}

export interface StudentAnswer {
  id: string;
  question_id: string;
  answer_text?: string;
  selected_options?: string;
  numeric_answer?: number;
  marks_obtained: number;
  max_marks: number;
  is_evaluated: boolean;
  evaluator_feedback?: string;
}

export interface StudentSubmission {
  id: string;
  exam_id: string;
  student_id: string;
  roll_number: string;
  student_name: string;
  department: string;
  email?: string;
  raw_score: number;
  moderated_score: number;
  final_score: number;
  percentage: number;
  percentile: number;
  rank: number;
  grade_letter: string;
  grade_point: number;
  is_passed: boolean;
  status: string;
  remarks?: string;
  created_at: string;
  answers?: StudentAnswer[];
}

export interface ExamStatistics {
  exam_id: string;
  exam_title: string;
  total_students: number;
  evaluated_count: number;
  mean: number;
  median: number;
  standard_deviation: number;
  variance: number;
  highest_score: number;
  lowest_score: number;
  pass_count: int_num;
  fail_count: int_num;
  pass_percentage: number;
  top_10_percentile_cutoff: number;
}
type int_num = number;

export interface ScoreBucket {
  range_label: string;
  min_score: number;
  max_score: number;
  count: number;
  percentage: number;
  normal_curve_density: number;
}

export interface DistributionData {
  exam_id: string;
  mean: number;
  standard_deviation: number;
  buckets: ScoreBucket[];
}

export interface StudentPercentileRecord {
  submission_id: string;
  student_id: string;
  roll_number: string;
  student_name: string;
  department: string;
  final_score: number;
  percentage: number;
  rank: number;
  percentile: number;
  grade_letter: string;
  grade_point: number;
  is_passed: boolean;
}

export interface ItemAnalysisRecord {
  question_id: string;
  prompt: string;
  type: string;
  topic: string;
  difficulty_tag: string;
  max_marks: number;
  total_attempts: number;
  correct_count: number;
  difficulty_index: number;
  discrimination_index: number;
  quality_verdict: 'EXCELLENT' | 'GOOD' | 'MARGINAL' | 'POOR_REVISE';
  recommendation: string;
}

export interface TopicPerformance {
  topic: string;
  total_marks: number;
  marks_obtained: number;
  percentage: number;
}

export interface StudentScorecard {
  student_id: string;
  roll_number: string;
  student_name: string;
  department: string;
  exam_id: string;
  exam_title: string;
  total_marks: number;
  final_score: number;
  percentage: number;
  rank: number;
  total_students: number;
  percentile: number;
  grade_letter: string;
  grade_point: number;
  is_passed: boolean;
  cohort_mean: number;
  cohort_median: number;
  cohort_highest: number;
  topics: TopicPerformance[];
}
