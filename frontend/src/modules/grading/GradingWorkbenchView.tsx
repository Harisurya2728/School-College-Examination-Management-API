import React, { useState, useEffect } from 'react';
import {
  Sliders, Calculator, CheckCircle2, AlertCircle, Save, Download,
  RotateCcw, Scale, Award, ShieldCheck, Search
} from 'lucide-react';
import { api } from '../../services/api';
import { Exam, StudentSubmission, GradingPolicy } from '../../types';

interface GradingWorkbenchViewProps {
  exams: Exam[];
  selectedExamId: string;
  onSelectExam: (id: string) => void;
  onGradingCalculated: () => void;
}

export const GradingWorkbenchView: React.FC<GradingWorkbenchViewProps> = ({
  exams,
  selectedExamId,
  onSelectExam,
  onGradingCalculated,
}) => {
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [policies, setPolicies] = useState<GradingPolicy[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Grading controls state
  const [moderationMarks, setModerationMarks] = useState<number>(0);
  const [applyRelativeCurve, setApplyRelativeCurve] = useState<boolean>(false);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>('');
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [calcSummary, setCalcSummary] = useState<any>(null);
  const [searchStudent, setSearchStudent] = useState<string>('');
  const [semesterFilter, setSemesterFilter] = useState<string>('');

  useEffect(() => {
    loadPolicies();
  }, []);

  useEffect(() => {
    if (!selectedExamId) return;
    loadSubmissions(selectedExamId);
  }, [selectedExamId]);

  const loadPolicies = async () => {
    try {
      const data = await api.gradingPolicies.list();
      setPolicies(data);
      if (data.length > 0) setSelectedPolicyId(data[0].id);
    } catch (err) {
      console.error('Failed to load policies:', err);
    }
  };

  const loadSubmissions = async (examId: string) => {
    setLoading(true);
    try {
      const data = await api.submissions.list(examId);
      setSubmissions(data);
    } catch (err) {
      console.error('Failed to load submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunBatchCalculation = async () => {
    if (!selectedExamId) return;
    setIsCalculating(true);
    try {
      const summary = await api.submissions.batchCalculate(
        selectedExamId,
        moderationMarks,
        applyRelativeCurve
      );
      setCalcSummary(summary);
      await loadSubmissions(selectedExamId);
      onGradingCalculated();
    } catch (err: any) {
      alert(`Calculation failed: ${err.message}`);
    } finally {
      setIsCalculating(false);
    }
  };

  const activeExam = exams.find((e) => e.id === selectedExamId);

  const filteredSubmissions = submissions.filter(
    (s) =>
      s.student_name.toLowerCase().includes(searchStudent.toLowerCase()) ||
      s.roll_number.toLowerCase().includes(searchStudent.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Grade Calculation & Moderation Workbench
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Configure grading schema, adjust moderation curves, evaluate examinees, and finalize university grade sheets.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 600 }}>SELECT EXAM:</span>
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '320px', fontWeight: 600 }}
            value={selectedExamId}
            onChange={(e) => onSelectExam(e.target.value)}
          >
            {(semesterFilter ? exams.filter((e) => e.semester === parseInt(semesterFilter)) : exams).map((ex) => (
              <option key={ex.id} value={ex.id}>
                Sem {ex.semester}: {ex.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Semester Quick Pills */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        <button
          className={`btn ${semesterFilter === '' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          onClick={() => setSemesterFilter('')}
        >
          All 8 Semesters
        </button>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
          <button
            key={s}
            className={`btn ${semesterFilter === String(s) ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            onClick={() => {
              setSemesterFilter(String(s));
              const semExams = exams.filter((e) => e.semester === s);
              if (semExams.length > 0) {
                onSelectExam(semExams[0].id);
              }
            }}
          >
            Semester {s}
          </button>
        ))}
      </div>

      {/* Control Panel: Policy & Moderation Adjuster */}
      <div className="glass-card" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Scale size={22} style={{ color: 'var(--primary-500)' }} />
              Grading Policy & Moderation Controls
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Exam Maximum: {activeExam?.total_marks || 100} Marks • Pass Mark: {activeExam?.passing_marks || 40} Marks
            </p>
          </div>

          <button
            className="btn btn-emerald"
            style={{ padding: '12px 24px', fontSize: '0.95rem' }}
            onClick={handleRunBatchCalculation}
            disabled={isCalculating}
          >
            <Calculator size={18} />
            {isCalculating ? 'Computing Grades...' : 'Batch Calculate & Finalize Grades'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
          {/* Policy Selector */}
          <div>
            <label className="form-label">Active Grading Scale Policy</label>
            <select
              className="form-select"
              value={selectedPolicyId}
              onChange={(e) => setSelectedPolicyId(e.target.value)}
            >
              {policies.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.mode})
                </option>
              ))}
            </select>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
              Cutoffs: O (≥90%), A+ (≥80%), A (≥70%), B+ (≥60%), B (≥50%), C (≥40%), F (&lt;40%)
            </span>
          </div>

          {/* Moderation Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Moderation (Grace Marks)</label>
              <span style={{ fontWeight: 800, color: '#38bdf8', fontSize: '0.9rem' }}>
                +{moderationMarks} Marks
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              step="0.5"
              value={moderationMarks}
              onChange={(e) => setModerationMarks(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--primary-500)', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
              Uniformly compensates examinees for difficult papers (Capped by university policy).
            </span>
          </div>

          {/* Relative Grading Curve Toggle */}
          <div>
            <label className="form-label">Grading Method Mode</label>
            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button
                type="button"
                className={`btn ${!applyRelativeCurve ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, padding: '8px' }}
                onClick={() => setApplyRelativeCurve(false)}
              >
                Absolute Cutoffs
              </button>
              <button
                type="button"
                className={`btn ${applyRelativeCurve ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, padding: '8px' }}
                onClick={() => setApplyRelativeCurve(true)}
              >
                Relative Bell Curve
              </button>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
              {applyRelativeCurve
                ? 'Grades mapped to standard deviations (Z-scores) from cohort mean.'
                : 'Grades assigned according to percentage brackets.'}
            </span>
          </div>
        </div>

        {/* Live Calculation Banner */}
        {calcSummary && (
          <div
            style={{
              marginTop: '20px',
              padding: '16px 20px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle2 size={22} style={{ color: '#34d399' }} />
              <div>
                <strong style={{ color: '#34d399' }}>Grade Engine Executed Successfully!</strong>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Processed {calcSummary.total_submissions_processed} students • Mean: {calcSummary.mean_score} • Median: {calcSummary.median_score} • StdDev: {calcSummary.standard_deviation}
                </div>
              </div>
            </div>

            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#34d399' }}>
              Pass Rate: {calcSummary.pass_percentage}% ({calcSummary.pass_count} Passed / {calcSummary.fail_count} Failed)
            </div>
          </div>
        )}
      </div>

      {/* Grade Sheet Table */}
      <div className="glass-card" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={22} style={{ color: 'var(--accent-cyan)' }} />
              Official Examination Grade Sheet
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              {submissions.length} students enrolled in this examination course.
            </p>
          </div>

          <div style={{ position: 'relative', width: '260px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-dim)' }} />
            <input
              type="text"
              placeholder="Filter student or roll no..."
              className="form-input"
              style={{ paddingLeft: '36px' }}
              value={searchStudent}
              onChange={(e) => setSearchStudent(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>Loading grade sheet records...</div>
        ) : (
          <div style={{ overflowX: 'auto', maxHeight: '500px' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Roll No</th>
                  <th>Student Name</th>
                  <th>Raw Score</th>
                  <th>Grace</th>
                  <th>Final Score</th>
                  <th>%</th>
                  <th>Grade</th>
                  <th>GP</th>
                  <th>Percentile</th>
                  <th>Result</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{s.roll_number}</td>
                    <td style={{ fontWeight: 600 }}>{s.student_name}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{s.raw_score}</td>
                    <td style={{ color: s.moderated_score > 0 ? '#38bdf8' : 'var(--text-dim)' }}>
                      +{s.moderated_score}
                    </td>
                    <td style={{ fontWeight: 800 }}>{s.final_score}</td>
                    <td>{s.percentage}%</td>
                    <td>
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: '0.95rem',
                          color: s.grade_letter === 'O' ? '#34d399' : s.grade_letter === 'F' ? '#fb7185' : '#38bdf8',
                        }}
                      >
                        {s.grade_letter}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>{s.grade_point}</td>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--primary-500)' }}>
                        {s.percentile}%
                      </span>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: s.is_passed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                          color: s.is_passed ? '#34d399' : '#fb7185',
                        }}
                      >
                        {s.is_passed ? 'PASS' : 'FAIL'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
