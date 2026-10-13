import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import {
  TrendingUp, Award, Users, Percent, CheckCircle2, AlertTriangle, HelpCircle,
  Search, Eye, FileText, ArrowUpDown, Brain, Sparkles, BookOpen
} from 'lucide-react';
import { api } from '../../services/api';
import {
  Exam, ExamStatistics, DistributionData, StudentPercentileRecord,
  ItemAnalysisRecord, StudentScorecard
} from '../../types';
import { MathView } from '../../components/MathView';

interface AnalyticsViewProps {
  exams: Exam[];
  selectedExamId: string;
  onSelectExam: (id: string) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ exams, selectedExamId, onSelectExam }) => {
  const [stats, setStats] = useState<ExamStatistics | null>(null);
  const [distribution, setDistribution] = useState<DistributionData | null>(null);
  const [percentiles, setPercentiles] = useState<StudentPercentileRecord[]>([]);
  const [itemAnalysis, setItemAnalysis] = useState<ItemAnalysisRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchStudent, setSearchStudent] = useState<string>('');
  const [semesterFilter, setSemesterFilter] = useState<string>('');
  
  // Scorecard modal state
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [scorecard, setScorecard] = useState<StudentScorecard | null>(null);
  const [loadingScorecard, setLoadingScorecard] = useState<boolean>(false);

  useEffect(() => {
    if (!selectedExamId) return;
    loadAnalyticsData(selectedExamId);
  }, [selectedExamId]);

  const loadAnalyticsData = async (examId: string) => {
    setLoading(true);
    try {
      const [overviewData, distData, pctlData, itemsData] = await Promise.all([
        api.analytics.overview(examId),
        api.analytics.distribution(examId),
        api.analytics.percentiles(examId),
        api.analytics.itemAnalysis(examId),
      ]);
      setStats(overviewData);
      setDistribution(distData);
      setPercentiles(pctlData);
      setItemAnalysis(itemsData);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenScorecard = async (studentId: string) => {
    setSelectedStudentId(studentId);
    setLoadingScorecard(true);
    try {
      const card = await api.analytics.studentScorecard(studentId, selectedExamId);
      setScorecard(card);
    } catch (err) {
      console.error('Failed to load scorecard:', err);
    } finally {
      setLoadingScorecard(false);
    }
  };

  const filteredPercentiles = percentiles.filter(
    (p) =>
      p.student_name.toLowerCase().includes(searchStudent.toLowerCase()) ||
      p.roll_number.toLowerCase().includes(searchStudent.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header & Exam Picker */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Percentile & Psychometric Analytics
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Comprehensive performance distributions, Gaussian bell curves, and item discrimination indexes.
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

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-dim)' }}>
          <Sparkles className="animate-spin" size={36} style={{ margin: '0 auto 16px', color: 'var(--primary-500)' }} />
          <p>Computing statistical metrics and bell curve normal distribution...</p>
        </div>
      ) : stats ? (
        <>
          {/* Key Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '20px' }}>
            <div className="glass-card" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 700 }}>COHORT SIZE (N)</span>
                <Users size={20} style={{ color: 'var(--accent-cyan)' }} />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '8px' }}>{stats.total_students}</div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Examinees evaluated</span>
            </div>

            <div className="glass-card" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 700 }}>COHORT MEAN (μ)</span>
                <TrendingUp size={20} style={{ color: 'var(--primary-500)' }} />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '8px', color: '#818cf8' }}>
                {stats.mean}
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Median: {stats.median}</span>
            </div>

            <div className="glass-card" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 700 }}>STD DEVIATION (σ)</span>
                <Brain size={20} style={{ color: 'var(--accent-purple)' }} />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '8px', color: '#c084fc' }}>
                {stats.standard_deviation}
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Variance: {stats.variance}</span>
            </div>

            <div className="glass-card" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 700 }}>HIGHEST / LOWEST</span>
                <Award size={20} style={{ color: 'var(--accent-amber)' }} />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '8px', color: '#fbbf24' }}>
                {stats.highest_score}
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Min Score: {stats.lowest_score}</span>
            </div>

            <div className="glass-card" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 700 }}>PASS PERCENTAGE</span>
                <CheckCircle2 size={20} style={{ color: 'var(--accent-emerald)' }} />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '8px', color: '#34d399' }}>
                {stats.pass_percentage}%
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {stats.pass_count} Passed / {stats.fail_count} Failed
              </span>
            </div>
          </div>

          {/* Section: Bell Curve Normal Distribution */}
          <div className="glass-card" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={22} style={{ color: 'var(--primary-500)' }} />
                  Gaussian Normal Distribution Fit & Score Histogram
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Overlay of actual student score frequency with theoretical normal distribution bell curve (μ = {stats.mean}, σ = {stats.standard_deviation}).
                </p>
              </div>
              <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '12px', height: '12px', background: '#6366f1', borderRadius: '2px' }} />
                  Actual Count
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '14px', height: '3px', background: '#38bdf8' }} />
                  Bell Curve Fit
                </span>
              </div>
            </div>

            {distribution && distribution.buckets.length > 0 ? (
              <div style={{ width: '100%', height: 340 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={distribution.buckets} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" />
                    <XAxis
                      dataKey="range_label"
                      stroke="#64748b"
                      label={{ value: 'Score Range Interval', position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 12 }}
                    />
                    <YAxis
                      yAxisId="left"
                      stroke="#64748b"
                      label={{ value: 'Number of Students', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 12 }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#38bdf8"
                      label={{ value: 'Density (%)', angle: 90, position: 'insideRight', fill: '#38bdf8', fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#111827',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: '#f8fafc',
                      }}
                    />
                    <Bar yAxisId="left" dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} name="Students Count" />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="normal_curve_density"
                      stroke="#38bdf8"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#38bdf8' }}
                      name="Bell Curve Fit"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : null}
          </div>

          {/* Section: Psychometric Item Analysis */}
          <div className="glass-card" style={{ padding: '28px' }}>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Brain size={22} style={{ color: 'var(--accent-purple)' }} />
                Item Analysis (Difficulty Index & Discrimination Power)
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Evaluates question effectiveness using difficulty index (P) and discrimination index (D = Upper 27% vs Lower 27%).
              </p>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Question</th>
                    <th>Topic</th>
                    <th>Difficulty (P)</th>
                    <th>Discrimination (D)</th>
                    <th>Verdict</th>
                    <th>Recommendation</th>
                  </tr>
                </thead>
                <tbody>
                  {itemAnalysis.map((item) => (
                    <tr key={item.question_id}>
                      <td style={{ maxWidth: '280px', fontWeight: 500 }}>
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.prompt}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                          {item.type} • {item.max_marks} marks
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{item.topic}</td>
                      <td>
                        <span style={{ fontWeight: 700, color: item.difficulty_index < 0.3 ? '#fb7185' : '#34d399' }}>
                          {(item.difficulty_index * 100).toFixed(0)}%
                        </span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>P = {item.difficulty_index}</div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: item.discrimination_index >= 0.3 ? '#34d399' : '#fbbf24' }}>
                          {item.discrimination_index}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${item.quality_verdict.toLowerCase().replace('_revise', '')}`}>
                          {item.quality_verdict.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '250px' }}>
                        {item.recommendation}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section: Student Percentile Rank Leaderboard */}
          <div className="glass-card" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award size={22} style={{ color: 'var(--accent-amber)' }} />
                  Student Percentile Ranks & Score Sheet
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Exact formula: P = ((B + 0.5E) / N) × 100. Click any student to view comprehensive scorecard.
                </p>
              </div>

              <div style={{ position: 'relative', width: '260px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-dim)' }} />
                <input
                  type="text"
                  placeholder="Search student or roll no..."
                  className="form-input"
                  style={{ paddingLeft: '36px' }}
                  value={searchStudent}
                  onChange={(e) => setSearchStudent(e.target.value)}
                />
              </div>
            </div>

            <div style={{ overflowX: 'auto', maxHeight: '450px' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Roll No</th>
                    <th>Student Name</th>
                    <th>Department</th>
                    <th>Score</th>
                    <th>Percentage</th>
                    <th>Percentile</th>
                    <th>Grade</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPercentiles.map((p) => (
                    <tr key={p.submission_id} style={{ cursor: 'pointer' }} onClick={() => handleOpenScorecard(p.student_id)}>
                      <td style={{ fontWeight: 800, color: p.rank <= 3 ? '#fbbf24' : 'var(--text-main)' }}>
                        #{p.rank}
                      </td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{p.roll_number}</td>
                      <td style={{ fontWeight: 600 }}>{p.student_name}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{p.department}</td>
                      <td style={{ fontWeight: 700 }}>{p.final_score}</td>
                      <td>{p.percentage}%</td>
                      <td>
                        <span
                          style={{
                            fontWeight: 800,
                            padding: '4px 10px',
                            borderRadius: '9999px',
                            background: p.percentile >= 90 ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                            color: p.percentile >= 90 ? '#818cf8' : 'var(--text-main)',
                            border: p.percentile >= 90 ? '1px solid rgba(99, 102, 241, 0.4)' : 'none',
                          }}
                        >
                          {p.percentile} %ile
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            fontWeight: 800,
                            color: p.grade_letter === 'O' ? '#34d399' : p.grade_letter === 'F' ? '#fb7185' : '#38bdf8',
                          }}
                        >
                          {p.grade_letter} ({p.grade_point} GP)
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenScorecard(p.student_id);
                          }}
                        >
                          <Eye size={14} /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}

      {/* Individual Student Scorecard Modal */}
      {selectedStudentId && (
        <div className="modal-backdrop" onClick={() => setSelectedStudentId(null)}>
          <div className="modal-content" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Award size={24} style={{ color: 'var(--primary-500)' }} />
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Student Examination Scorecard</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Individual Performance & Cohort Benchmark</span>
                </div>
              </div>
              <button
                className="btn btn-secondary"
                style={{ padding: '6px 12px' }}
                onClick={() => setSelectedStudentId(null)}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '28px' }}>
              {loadingScorecard ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>Loading student scorecard...</div>
              ) : scorecard ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Student Header Info */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.03)', padding: '16px 20px', borderRadius: '12px' }}>
                    <div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{scorecard.student_name}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        Roll No: <span style={{ color: '#fff', fontWeight: 600 }}>{scorecard.roll_number}</span> • {scorecard.department}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#818cf8' }}>
                        {scorecard.percentile} %ile
                      </div>
                      <span className="badge badge-easy">Rank #{scorecard.rank} of {scorecard.total_students}</span>
                    </div>
                  </div>

                  {/* Quick KPI stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                    <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: '8px', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>SCORE OBTAINED</span>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                        {scorecard.final_score} / {scorecard.total_marks}
                      </div>
                    </div>
                    <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: '8px', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>LETTER GRADE</span>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399' }}>
                        {scorecard.grade_letter} ({scorecard.grade_point} GP)
                      </div>
                    </div>
                    <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: '8px', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>COHORT MEAN</span>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8' }}>
                        {scorecard.cohort_mean}
                      </div>
                    </div>
                  </div>

                  {/* Topic Performance Breakdown */}
                  {scorecard.topics && scorecard.topics.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px' }}>Topic-Wise Proficiency:</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {scorecard.topics.map((t) => (
                          <div key={t.topic} style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '10px 14px', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                              <span style={{ fontWeight: 600 }}>{t.topic}</span>
                              <span style={{ color: 'var(--text-muted)' }}>
                                {t.marks_obtained} / {t.total_marks} ({t.percentage}%)
                              </span>
                            </div>
                            <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div
                                style={{
                                  width: `${t.percentage}%`,
                                  height: '100%',
                                  background: t.percentage >= 75 ? 'var(--emerald-gradient)' : t.percentage >= 50 ? 'var(--cyan-gradient)' : 'var(--amber-gradient)',
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
