import {
  Question,
  Exam,
  GradingPolicy,
  StudentSubmission,
  ExamStatistics,
  DistributionData,
  StudentPercentileRecord,
  ItemAnalysisRecord,
  StudentScorecard
} from '../types';

const BASE_URL = '/api/v1';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || JSON.stringify(errJson);
    } catch {
      // ignore
    }
    throw new Error(`API Error (${response.status}): ${errorDetail}`);
  }

  return response.json();
}

export const api = {
  // --- Question Bank CRUD ---
  questions: {
    list: (params?: { semester?: number; subject_code?: string; difficulty?: string; type?: string; search?: string }) => {
      const query = new URLSearchParams();
      if (params?.semester !== undefined && params?.semester !== null) query.set('semester', String(params.semester));
      if (params?.subject_code) query.set('subject_code', params.subject_code);
      if (params?.difficulty) query.set('difficulty', params.difficulty);
      if (params?.type) query.set('type', params.type);
      if (params?.search) query.set('search', params.search);
      const qStr = query.toString();
      return fetchJson<Question[]>(`/questions/${qStr ? `?${qStr}` : ''}`);
    },
    get: (id: string) => fetchJson<Question>(`/questions/${id}`),
    create: (data: Partial<Question>) =>
      fetchJson<Question>('/questions/', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Question>) =>
      fetchJson<Question>(`/questions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      fetchJson<{ deleted: boolean; id: string }>(`/questions/${id}`, { method: 'DELETE' }),
    bulkUpload: (items: Partial<Question>[]) =>
      fetchJson<{ total_processed: number; created_count: number; errors: string[] }>(
        '/questions/bulk-upload',
        { method: 'POST', body: JSON.stringify(items) }
      ),
  },

  // --- Exams & Papers CRUD ---
  exams: {
    list: (params?: { semester?: number; department?: string; status?: string }) => {
      const query = new URLSearchParams();
      if (params?.semester !== undefined && params?.semester !== null) query.set('semester', String(params.semester));
      if (params?.department) query.set('department', params.department);
      if (params?.status) query.set('status', params.status);
      const qStr = query.toString();
      return fetchJson<Exam[]>(`/exams/${qStr ? `?${qStr}` : ''}`);
    },
    get: (id: string) => fetchJson<Exam>(`/exams/${id}`),
    create: (data: Partial<Exam>) =>
      fetchJson<Exam>('/exams/', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Exam>) =>
      fetchJson<Exam>(`/exams/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      fetchJson<{ deleted: boolean; id: string }>(`/exams/${id}`, { method: 'DELETE' }),
  },

  // --- Grading Policies CRUD ---
  gradingPolicies: {
    list: () => fetchJson<GradingPolicy[]>('/grading-policies/'),
    get: (id: string) => fetchJson<GradingPolicy>(`/grading-policies/${id}`),
    create: (data: Partial<GradingPolicy>) =>
      fetchJson<GradingPolicy>('/grading-policies/', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<GradingPolicy>) =>
      fetchJson<GradingPolicy>(`/grading-policies/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      fetchJson<{ deleted: boolean; id: string }>(`/grading-policies/${id}`, { method: 'DELETE' }),
  },

  // --- Submissions & Evaluation CRUD ---
  submissions: {
    list: (examId: string) => fetchJson<StudentSubmission[]>(`/submissions/?exam_id=${examId}`),
    get: (id: string) => fetchJson<StudentSubmission>(`/submissions/${id}`),
    create: (data: Partial<StudentSubmission>) =>
      fetchJson<StudentSubmission>('/submissions/', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<StudentSubmission>) =>
      fetchJson<StudentSubmission>(`/submissions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      fetchJson<{ deleted: boolean; id: string }>(`/submissions/${id}`, { method: 'DELETE' }),
    batchCalculate: (examId: string, moderationMarks: number = 0, applyRelativeCurve: boolean = false) =>
      fetchJson<{
        exam_id: string;
        total_submissions_processed: number;
        mean_score: number;
        median_score: number;
        standard_deviation: number;
        pass_count: number;
        fail_count: number;
        pass_percentage: number;
      }>(`/submissions/batch-calculate-grades/${examId}`, {
        method: 'POST',
        body: JSON.stringify({
          moderation_marks: moderationMarks,
          apply_relative_curve: applyRelativeCurve,
        }),
      }),
  },

  // --- Analytics & Percentiles ---
  analytics: {
    overview: (examId: string) => fetchJson<ExamStatistics>(`/analytics/exams/${examId}/overview`),
    distribution: (examId: string) => fetchJson<DistributionData>(`/analytics/exams/${examId}/distribution`),
    percentiles: (examId: string) => fetchJson<StudentPercentileRecord[]>(`/analytics/exams/${examId}/percentiles`),
    itemAnalysis: (examId: string) => fetchJson<ItemAnalysisRecord[]>(`/analytics/exams/${examId}/item-analysis`),
    studentScorecard: (studentId: string, examId: string) =>
      fetchJson<StudentScorecard>(`/analytics/students/${studentId}/exam/${examId}`),
  },
};
