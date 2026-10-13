import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Trash2, Edit3, Upload, BookOpen, Check,
  Layers, Lightbulb, Sigma, HelpCircle, Code, Eye, GraduationCap
} from 'lucide-react';
import { api } from '../../services/api';
import { Question, QuestionOption, RubricCriterion } from '../../types';
import { MathView } from '../../components/MathView';
import { CURRICULUM_SEMESTERS, getSubjectsForSemester } from '../../constants/curriculum';

export const QuestionBankView: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Filters
  const [search, setSearch] = useState<string>('');
  const [semesterFilter, setSemesterFilter] = useState<string>('');
  const [subjectFilter, setSubjectFilter] = useState<string>('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState<boolean>(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    semester: number;
    course_id: string;
    subject_code: string;
    subject_name: string;
    unit: number;
    topic: string;
    type: 'MCQ_SINGLE' | 'MCQ_MULTI' | 'NUMERICAL' | 'SUBJECTIVE' | 'TRUE_FALSE';
    prompt: string;
    prompt_latex: string;
    model_answer: string;
    target_numeric: string;
    min_tolerance: string;
    max_tolerance: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    bloom_level: 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE';
    marks: number;
    negative_marks: number;
    tags: string;
    options: QuestionOption[];
    rubrics: RubricCriterion[];
  }>({
    semester: 1,
    course_id: 'CS101',
    subject_code: 'CS101',
    subject_name: 'Programming for Problem Solving (Python & C)',
    unit: 1,
    topic: 'Recursion & Memory',
    type: 'MCQ_SINGLE',
    prompt: '',
    prompt_latex: '',
    model_answer: '',
    target_numeric: '',
    min_tolerance: '',
    max_tolerance: '',
    difficulty: 'MEDIUM',
    bloom_level: 'APPLY',
    marks: 5,
    negative_marks: 1,
    tags: 'c,recursion',
    options: [
      { text: 'Option A', latex: '', is_correct: true },
      { text: 'Option B', latex: '', is_correct: false },
      { text: 'Option C', latex: '', is_correct: false },
      { text: 'Option D', latex: '', is_correct: false },
    ],
    rubrics: [],
  });

  // Bulk Upload State
  const [bulkJson, setBulkJson] = useState<string>('');
  const [bulkStatus, setBulkStatus] = useState<string | null>(null);

  useEffect(() => {
    loadQuestions();
  }, [semesterFilter, subjectFilter, difficultyFilter, typeFilter]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const data = await api.questions.list({
        semester: semesterFilter ? parseInt(semesterFilter) : undefined,
        subject_code: subjectFilter || undefined,
        difficulty: difficultyFilter || undefined,
        type: typeFilter || undefined,
      });
      setQuestions(data);
    } catch (err) {
      console.error('Failed to load questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSemesterChangeInForm = (newSem: number) => {
    const subjects = getSubjectsForSemester(newSem);
    const defaultSub = subjects[0] || { code: 'CS101', name: 'Programming', courseId: 'CS101' };
    setFormData({
      ...formData,
      semester: newSem,
      subject_code: defaultSub.code,
      subject_name: defaultSub.name,
      course_id: defaultSub.courseId,
    });
  };

  const handleSubjectChangeInForm = (subCode: string) => {
    const subjects = getSubjectsForSemester(formData.semester);
    const selected = subjects.find((s) => s.code === subCode);
    if (selected) {
      setFormData({
        ...formData,
        subject_code: selected.code,
        subject_name: selected.name,
        course_id: selected.courseId,
      });
    }
  };

  const handleOpenCreateModal = (q?: Question) => {
    if (q) {
      setEditingQuestion(q);
      setFormData({
        semester: q.semester || 1,
        course_id: q.course_id,
        subject_code: q.subject_code,
        subject_name: q.subject_name,
        unit: q.unit,
        topic: q.topic,
        type: q.type,
        prompt: q.prompt,
        prompt_latex: q.prompt_latex || '',
        model_answer: q.model_answer || '',
        target_numeric: q.target_numeric !== undefined && q.target_numeric !== null ? String(q.target_numeric) : '',
        min_tolerance: q.min_tolerance !== undefined && q.min_tolerance !== null ? String(q.min_tolerance) : '',
        max_tolerance: q.max_tolerance !== undefined && q.max_tolerance !== null ? String(q.max_tolerance) : '',
        difficulty: q.difficulty,
        bloom_level: q.bloom_level,
        marks: q.marks,
        negative_marks: q.negative_marks,
        tags: q.tags,
        options: q.options || [],
        rubrics: q.rubrics || [],
      });
    } else {
      setEditingQuestion(null);
      const defaultSub = getSubjectsForSemester(1)[0];
      setFormData({
        semester: 1,
        course_id: defaultSub.code,
        subject_code: defaultSub.code,
        subject_name: defaultSub.name,
        unit: 1,
        topic: 'Core Fundamentals',
        type: 'MCQ_SINGLE',
        prompt: '',
        prompt_latex: '',
        model_answer: '',
        target_numeric: '',
        min_tolerance: '',
        max_tolerance: '',
        difficulty: 'MEDIUM',
        bloom_level: 'APPLY',
        marks: 5,
        negative_marks: 1,
        tags: 'exam',
        options: [
          { text: 'Option A', latex: '', is_correct: true },
          { text: 'Option B', latex: '', is_correct: false },
        ],
        rubrics: [],
      });
    }
    setIsCreateModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      await api.questions.delete(id);
      setQuestions((prev) => prev.filter((q) => q.id !== id));
    } catch (err) {
      alert(`Delete failed: ${err}`);
    }
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.prompt.trim()) {
      alert('Question prompt is required.');
      return;
    }

    const payload: any = {
      semester: Number(formData.semester),
      course_id: formData.course_id,
      subject_code: formData.subject_code,
      subject_name: formData.subject_name,
      unit: formData.unit,
      topic: formData.topic,
      type: formData.type,
      prompt: formData.prompt,
      prompt_latex: formData.prompt_latex || null,
      model_answer: formData.model_answer || null,
      difficulty: formData.difficulty,
      bloom_level: formData.bloom_level,
      marks: Number(formData.marks),
      negative_marks: Number(formData.negative_marks),
      tags: formData.tags,
      options: formData.options,
      rubrics: formData.rubrics,
    };

    if (formData.type === 'NUMERICAL') {
      payload.target_numeric = formData.target_numeric ? parseFloat(formData.target_numeric) : null;
      payload.min_tolerance = formData.min_tolerance ? parseFloat(formData.min_tolerance) : null;
      payload.max_tolerance = formData.max_tolerance ? parseFloat(formData.max_tolerance) : null;
    }

    try {
      if (editingQuestion) {
        const updated = await api.questions.update(editingQuestion.id, payload);
        setQuestions((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
      } else {
        const created = await api.questions.create(payload);
        setQuestions((prev) => [created, ...prev]);
      }
      setIsCreateModalOpen(false);
    } catch (err) {
      alert(`Failed to save question: ${err}`);
    }
  };

  const handleBulkUpload = async () => {
    try {
      const parsed = JSON.parse(bulkJson);
      if (!Array.isArray(parsed)) throw new Error('Input must be a JSON array of questions');
      const res = await api.questions.bulkUpload(parsed);
      setBulkStatus(`Successfully uploaded ${res.created_count} of ${res.total_processed} questions!`);
      loadQuestions();
      setTimeout(() => {
        setIsBulkModalOpen(false);
        setBulkStatus(null);
        setBulkJson('');
      }, 1500);
    } catch (err: any) {
      alert(`Invalid JSON or upload error: ${err.message}`);
    }
  };

  const filteredQuestions = questions.filter(
    (q) =>
      q.prompt.toLowerCase().includes(search.toLowerCase()) ||
      q.topic.toLowerCase().includes(search.toLowerCase()) ||
      q.tags.toLowerCase().includes(search.toLowerCase())
  );

  // Available subjects for selected semester filter
  const currentSemesterSubjects = semesterFilter
    ? getSubjectsForSemester(parseInt(semesterFilter))
    : CURRICULUM_SEMESTERS.flatMap((s) => s.subjects);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header & Action Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            8-Semester Question Bank Management
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Author, categorize, and organize exam questions across all 8 university semesters with distinct subjects and LaTeX equations.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={() => setIsBulkModalOpen(true)}>
            <Upload size={16} /> Bulk Import
          </button>
          <button className="btn btn-primary" onClick={() => handleOpenCreateModal()}>
            <Plus size={16} /> Author Question
          </button>
        </div>
      </div>

      {/* Semester Quick Pills */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        <button
          className={`btn ${semesterFilter === '' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          onClick={() => {
            setSemesterFilter('');
            setSubjectFilter('');
          }}
        >
          All Semesters (1–8)
        </button>
        {CURRICULUM_SEMESTERS.map((s) => (
          <button
            key={s.semester}
            className={`btn ${semesterFilter === String(s.semester) ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            onClick={() => {
              setSemesterFilter(String(s.semester));
              setSubjectFilter('');
            }}
          >
            Sem {s.semester}
          </button>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-dim)' }} />
          <input
            type="text"
            placeholder="Search questions by prompt, topic, or tag..."
            className="form-input"
            style={{ paddingLeft: '36px' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <select
            className="form-select"
            style={{ width: '220px' }}
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
          >
            <option value="">All Subjects</option>
            {currentSemesterSubjects.map((sub) => (
              <option key={sub.code} value={sub.code}>
                {sub.code}: {sub.name.slice(0, 24)}...
              </option>
            ))}
          </select>

          <select
            className="form-select"
            style={{ width: '150px' }}
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
          >
            <option value="">All Difficulties</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>

          <select
            className="form-select"
            style={{ width: '160px' }}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Question Types</option>
            <option value="MCQ_SINGLE">MCQ (Single)</option>
            <option value="MCQ_MULTI">MCQ (Multiple)</option>
            <option value="NUMERICAL">Numerical</option>
            <option value="SUBJECTIVE">Subjective</option>
            <option value="TRUE_FALSE">True / False</option>
          </select>
        </div>
      </div>

      {/* Question Cards List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-dim)' }}>Loading questions...</div>
      ) : filteredQuestions.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <BookOpen size={44} style={{ color: 'var(--text-dim)', margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>No questions found for this selection</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
            Try selecting a different semester or subject, or click "Author Question" to create one.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredQuestions.map((q) => (
            <div key={q.id} className="glass-card" style={{ padding: '24px' }}>
              {/* Question Header Badges */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ padding: '3px 10px', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', fontWeight: 800, fontSize: '0.8rem' }}>
                    Semester {q.semester}
                  </span>
                  <span style={{ fontWeight: 700, color: '#38bdf8', fontSize: '0.85rem' }}>
                    {q.subject_code} — {q.subject_name}
                  </span>
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                    • Unit {q.unit}: {q.topic}
                  </span>
                  <span className={`badge badge-${q.difficulty.toLowerCase()}`}>{q.difficulty}</span>
                  <span style={{ padding: '3px 8px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.06)', fontSize: '0.75rem', fontWeight: 600 }}>
                    {q.type.replace('_', ' ')}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                    {q.marks} Marks {q.negative_marks > 0 ? `(-${q.negative_marks})` : ''}
                  </span>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                    onClick={() => handleOpenCreateModal(q)}
                  >
                    <Edit3 size={14} /> Edit
                  </button>
                  <button
                    className="btn btn-danger"
                    style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                    onClick={() => handleDelete(q.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Question Prompt */}
              <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '10px', lineHeight: 1.6 }}>
                {q.prompt}
              </div>

              {/* KaTeX Mathematical Formula */}
              {q.prompt_latex && (
                <div style={{ marginBottom: '14px' }}>
                  <MathView latex={q.prompt_latex} block />
                </div>
              )}

              {/* Options list for MCQs */}
              {q.options && q.options.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '8px', marginTop: '12px' }}>
                  {q.options.map((opt, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: opt.is_correct ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                        border: opt.is_correct ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.9rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, color: opt.is_correct ? '#34d399' : 'var(--text-dim)' }}>
                          {String.fromCharCode(65 + i)}.
                        </span>
                        <span>{opt.text}</span>
                        {opt.latex && <MathView latex={opt.latex} />}
                      </div>
                      {opt.is_correct && <Check size={16} style={{ color: '#34d399' }} />}
                    </div>
                  ))}
                </div>
              )}

              {/* Numerical Answer Info */}
              {q.type === 'NUMERICAL' && q.target_numeric !== undefined && (
                <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '8px', fontSize: '0.85rem' }}>
                  <strong>Correct Target:</strong> {q.target_numeric} (Tolerance: [{q.min_tolerance ?? q.target_numeric} to {q.max_tolerance ?? q.target_numeric}])
                </div>
              )}

              {/* Subjective Rubric Criteria */}
              {q.rubrics && q.rubrics.length > 0 && (
                <div style={{ marginTop: '14px', padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '8px' }}>
                    Evaluation Rubrics:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {q.rubrics.map((r, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span>• {r.title} {r.description ? `(${r.description})` : ''}</span>
                        <span style={{ fontWeight: 700, color: 'var(--primary-500)' }}>Max {r.max_marks} marks</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Question Modal */}
      {isCreateModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsCreateModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '780px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                {editingQuestion ? 'Edit Question' : 'Author New Examination Question'}
              </h3>
              <button className="btn btn-secondary" style={{ padding: '4px 10px' }} onClick={() => setIsCreateModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '14px' }}>
                <div>
                  <label className="form-label">Semester (1–8)</label>
                  <select
                    className="form-select"
                    value={formData.semester}
                    onChange={(e) => handleSemesterChangeInForm(parseInt(e.target.value) || 1)}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Subject for Semester {formData.semester}</label>
                  <select
                    className="form-select"
                    value={formData.subject_code}
                    onChange={(e) => handleSubjectChangeInForm(e.target.value)}
                  >
                    {getSubjectsForSemester(formData.semester).map((sub) => (
                      <option key={sub.code} value={sub.code}>
                        {sub.code}: {sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Unit / Module</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: parseInt(e.target.value) || 1 })}
                    min={1}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                <div>
                  <label className="form-label">Question Type</label>
                  <select
                    className="form-select"
                    value={formData.type}
                    onChange={(e: any) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="MCQ_SINGLE">MCQ (Single Choice)</option>
                    <option value="MCQ_MULTI">MCQ (Multi-Select)</option>
                    <option value="NUMERICAL">Numerical / Tolerance</option>
                    <option value="SUBJECTIVE">Subjective / Essay</option>
                    <option value="TRUE_FALSE">True / False</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Difficulty</label>
                  <select
                    className="form-select"
                    value={formData.difficulty}
                    onChange={(e: any) => setFormData({ ...formData, difficulty: e.target.value })}
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Bloom's Taxonomy</label>
                  <select
                    className="form-select"
                    value={formData.bloom_level}
                    onChange={(e: any) => setFormData({ ...formData, bloom_level: e.target.value })}
                  >
                    <option value="REMEMBER">Remember</option>
                    <option value="UNDERSTAND">Understand</option>
                    <option value="APPLY">Apply</option>
                    <option value="ANALYZE">Analyze</option>
                    <option value="EVALUATE">Evaluate</option>
                    <option value="CREATE">Create</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Topic / Concept</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="form-label">Question Prompt</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={formData.prompt}
                  onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                  placeholder="Enter the question text clearly..."
                  required
                />
              </div>

              <div>
                <label className="form-label">KaTeX Mathematical Equation (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.prompt_latex}
                  onChange={(e) => setFormData({ ...formData, prompt_latex: e.target.value })}
                  placeholder="e.g. \\int_0^\\infty e^{-x^2} dx  or  \\sum_{i=1}^n \\lambda_i"
                />
                {formData.prompt_latex && (
                  <div style={{ marginTop: '8px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Live Formula Preview:</span>
                    <MathView latex={formData.prompt_latex} block />
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '14px' }}>
                <div>
                  <label className="form-label">Marks</label>
                  <input
                    type="number"
                    step="0.5"
                    className="form-input"
                    value={formData.marks}
                    onChange={(e) => setFormData({ ...formData, marks: parseFloat(e.target.value) || 1 })}
                    min={0.5}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Negative Marks</label>
                  <input
                    type="number"
                    step="0.5"
                    className="form-input"
                    value={formData.negative_marks}
                    onChange={(e) => setFormData({ ...formData, negative_marks: parseFloat(e.target.value) || 0 })}
                    min={0}
                  />
                </div>
                <div>
                  <label className="form-label">Tags (comma separated)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  />
                </div>
              </div>

              {/* Options editor for MCQs */}
              {(formData.type === 'MCQ_SINGLE' || formData.type === 'MCQ_MULTI') && (
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>Options & Correct Answer</label>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                      onClick={() =>
                        setFormData({
                          ...formData,
                          options: [...formData.options, { text: '', latex: '', is_correct: false }],
                        })
                      }
                    >
                      + Add Option
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {formData.options.map((opt, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                          type={formData.type === 'MCQ_SINGLE' ? 'radio' : 'checkbox'}
                          name="correct_option"
                          checked={opt.is_correct}
                          onChange={(e) => {
                            const newOpts = [...formData.options];
                            if (formData.type === 'MCQ_SINGLE') {
                              newOpts.forEach((o, i) => (o.is_correct = i === idx));
                            } else {
                              newOpts[idx].is_correct = e.target.checked;
                            }
                            setFormData({ ...formData, options: newOpts });
                          }}
                          style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                        />
                        <input
                          type="text"
                          className="form-input"
                          placeholder={`Option ${String.fromCharCode(65 + idx)} text`}
                          value={opt.text}
                          onChange={(e) => {
                            const newOpts = [...formData.options];
                            newOpts[idx].text = e.target.value;
                            setFormData({ ...formData, options: newOpts });
                          }}
                          required
                        />
                        <button
                          type="button"
                          className="btn btn-danger"
                          style={{ padding: '8px' }}
                          onClick={() => {
                            const newOpts = formData.options.filter((_, i) => i !== idx);
                            setFormData({ ...formData, options: newOpts });
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Numerical range inputs */}
              {formData.type === 'NUMERICAL' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  <div>
                    <label className="form-label">Target Number</label>
                    <input
                      type="number"
                      step="any"
                      className="form-input"
                      value={formData.target_numeric}
                      onChange={(e) => setFormData({ ...formData, target_numeric: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Min Allowed</label>
                    <input
                      type="number"
                      step="any"
                      className="form-input"
                      value={formData.min_tolerance}
                      onChange={(e) => setFormData({ ...formData, min_tolerance: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label">Max Allowed</label>
                    <input
                      type="number"
                      step="any"
                      className="form-input"
                      value={formData.max_tolerance}
                      onChange={(e) => setFormData({ ...formData, max_tolerance: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '14px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingQuestion ? 'Update Question' : 'Save Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {isBulkModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsBulkModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Bulk Import Questions (JSON)</h3>
              <button className="btn btn-secondary" style={{ padding: '4px 10px' }} onClick={() => setIsBulkModalOpen(false)}>
                ✕
              </button>
            </div>

            <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Paste a JSON array of question objects containing semester, course_id, subject_code, prompt, type, marks, options, etc.
              </p>
              <textarea
                className="form-textarea"
                rows={10}
                style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                placeholder='[ { "semester": 6, "course_id": "CS306", "subject_code": "CS306", "subject_name": "AI", "unit": 1, "topic": "A* Search", "type": "MCQ_SINGLE", "prompt": "Heuristic?", "marks": 5, "options": [...] } ]'
                value={bulkJson}
                onChange={(e) => setBulkJson(e.target.value)}
              />

              {bulkStatus && (
                <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', borderRadius: '8px', fontSize: '0.85rem' }}>
                  {bulkStatus}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button className="btn btn-secondary" onClick={() => setIsBulkModalOpen(false)}>
                  Cancel
                </button>
                <button className="btn btn-emerald" onClick={handleBulkUpload}>
                  Commit Import
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
