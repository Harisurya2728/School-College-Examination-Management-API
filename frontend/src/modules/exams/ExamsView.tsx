import React, { useState } from 'react';
import {
  Calendar, Clock, Award, Plus, FileText, CheckCircle2, Trash2, Edit3, Eye, GraduationCap
} from 'lucide-react';
import { Exam } from '../../types';
import { api } from '../../services/api';
import { CURRICULUM_SEMESTERS, getSubjectsForSemester } from '../../constants/curriculum';

interface ExamsViewProps {
  exams: Exam[];
  onRefreshExams: () => void;
  onSelectExam: (id: string) => void;
}

export const ExamsView: React.FC<ExamsViewProps> = ({ exams, onRefreshExams, onSelectExam }) => {
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newExam, setNewExam] = useState({
    title: 'Semester 1 — Freshman Engineering Physics & Computing Exam',
    exam_code: 'EXAM-2026-CS-SEM1',
    department: 'Computer Science & Engineering',
    semester: 1,
    academic_year: '2025-2026',
    duration_minutes: 180,
    total_marks: 100,
    passing_marks: 40,
    instructions: 'All questions compulsory. Calculators permitted.',
  });

  const handleSemesterChange = (semNum: number) => {
    const semInfo = CURRICULUM_SEMESTERS.find((s) => s.semester === semNum);
    const title = semInfo ? `Semester ${semNum} — ${semInfo.title.split('—')[1]?.trim() || 'Exam'}` : `Semester ${semNum} Examination`;
    setNewExam({
      ...newExam,
      semester: semNum,
      title: title,
      exam_code: `EXAM-2026-CS-SEM${semNum}`,
    });
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.exams.create(newExam);
      setIsModalOpen(false);
      onRefreshExams();
    } catch (err: any) {
      alert(`Failed to create exam: ${err.message}`);
    }
  };

  const handleDeleteExam = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this exam?')) return;
    try {
      await api.exams.delete(id);
      onRefreshExams();
    } catch (err: any) {
      alert(`Failed to delete exam: ${err.message}`);
    }
  };

  const filteredExams = selectedSemester
    ? exams.filter((e) => e.semester === parseInt(selectedSemester))
    : exams;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            8-Semester Examination Schedules & Blueprints
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Manage semester exams across all 8 academic semesters (Freshman to Final Year Capstone).
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> Schedule Examination
        </button>
      </div>

      {/* Semester Selector Filter */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        <button
          className={`btn ${selectedSemester === '' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          onClick={() => setSelectedSemester('')}
        >
          All 8 Semesters
        </button>
        {CURRICULUM_SEMESTERS.map((s) => (
          <button
            key={s.semester}
            className={`btn ${selectedSemester === String(s.semester) ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            onClick={() => setSelectedSemester(String(s.semester))}
          >
            Sem {s.semester}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {filteredExams.map((exam) => {
          const subjects = getSubjectsForSemester(exam.semester);
          return (
            <div key={exam.id} className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', fontWeight: 800, fontSize: '0.8rem' }}>
                      Semester {exam.semester}
                    </span>
                    <span className="badge badge-easy">{exam.status}</span>
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>{exam.title}</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                    {exam.exam_code}
                  </span>
                </div>

                <button
                  className="btn btn-danger"
                  style={{ padding: '6px' }}
                  onClick={() => handleDeleteExam(exam.id)}
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Semester Subjects Preview */}
              {subjects.length > 0 && (
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '10px 12px', borderRadius: '8px', fontSize: '0.8rem' }}>
                  <div style={{ color: 'var(--text-dim)', fontWeight: 700, marginBottom: '4px' }}>SEMESTER SUBJECTS:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {subjects.map((sub) => (
                      <span key={sub.code} style={{ padding: '2px 6px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                        {sub.code}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '10px', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem' }}>DURATION</span>
                  <strong>{exam.duration_minutes} Mins</strong>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '10px', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem' }}>TOTAL / PASS MARKS</span>
                  <strong>{exam.total_marks} / {exam.passing_marks}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '10px', fontSize: '0.85rem' }}
                  onClick={() => onSelectExam(exam.id)}
                >
                  View Analytics & Grade Sheet
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Schedule New Semester Exam</h3>
              <button className="btn btn-secondary" style={{ padding: '4px 10px' }} onClick={() => setIsModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateExam} style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label">Semester</label>
                <select
                  className="form-select"
                  value={newExam.semester}
                  onChange={(e) => handleSemesterChange(parseInt(e.target.value) || 1)}
                >
                  {CURRICULUM_SEMESTERS.map((s) => (
                    <option key={s.semester} value={s.semester}>
                      Semester {s.semester} ({s.year})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Exam Title</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={newExam.title}
                  onChange={(e) => setNewExam({ ...newExam, title: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="form-label">Exam Code</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={newExam.exam_code}
                    onChange={(e) => setNewExam({ ...newExam, exam_code: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Department</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={newExam.department}
                    onChange={(e) => setNewExam({ ...newExam, department: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                <div>
                  <label className="form-label">Duration (Mins)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newExam.duration_minutes}
                    onChange={(e) => setNewExam({ ...newExam, duration_minutes: parseInt(e.target.value) || 180 })}
                  />
                </div>
                <div>
                  <label className="form-label">Total Marks</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newExam.total_marks}
                    onChange={(e) => setNewExam({ ...newExam, total_marks: parseFloat(e.target.value) || 100 })}
                  />
                </div>
                <div>
                  <label className="form-label">Passing Marks</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newExam.passing_marks}
                    onChange={(e) => setNewExam({ ...newExam, passing_marks: parseFloat(e.target.value) || 40 })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '14px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Schedule Exam</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
