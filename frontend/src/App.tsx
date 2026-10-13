import React, { useState, useEffect } from 'react';
import {
  BarChart3, BookOpen, Scale, Calendar, GraduationCap,
  RefreshCw
} from 'lucide-react';
import { api } from './services/api';
import { Exam } from './types';
import { AnalyticsView } from './modules/analytics/AnalyticsView';
import { QuestionBankView } from './modules/question-bank/QuestionBankView';
import { GradingWorkbenchView } from './modules/grading/GradingWorkbenchView';
import { ExamsView } from './modules/exams/ExamsView';

export function App() {
  const [activeTab, setActiveTab] = useState<'analytics' | 'questions' | 'grading' | 'exams'>('analytics');
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [apiOnline, setApiOnline] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsRefreshing(true);
    try {
      const examList = await api.exams.list();
      setExams(examList);
      if (examList.length > 0 && !selectedExamId) {
        setSelectedExamId(examList[0].id);
      }
      setApiOnline(true);
    } catch (err) {
      console.error('API connection failed:', err);
      setApiOnline(false);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'var(--primary-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-glow)',
            }}
          >
            <GraduationCap size={24} style={{ color: '#fff' }} />
          </div>
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, letterSpacing: '-0.02em' }}>EXAMEXPERT</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 600 }}>COLLEGE EXAM SUITE</div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav style={{ padding: '20px 14px', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
          <button
            className={`btn ${activeTab === 'analytics' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ width: '100%', justifyContent: 'flex-start', padding: '12px 16px' }}
            onClick={() => setActiveTab('analytics')}
          >
            <BarChart3 size={18} />
            <span>Percentile Analytics</span>
          </button>

          <button
            className={`btn ${activeTab === 'grading' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ width: '100%', justifyContent: 'flex-start', padding: '12px 16px' }}
            onClick={() => setActiveTab('grading')}
          >
            <Scale size={18} />
            <span>Grade Workbench</span>
          </button>

          <button
            className={`btn ${activeTab === 'questions' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ width: '100%', justifyContent: 'flex-start', padding: '12px 16px' }}
            onClick={() => setActiveTab('questions')}
          >
            <BookOpen size={18} />
            <span>Question Bank</span>
          </button>

          <button
            className={`btn ${activeTab === 'exams' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ width: '100%', justifyContent: 'flex-start', padding: '12px 16px' }}
            onClick={() => setActiveTab('exams')}
          >
            <Calendar size={18} />
            <span>Exam Blueprints</span>
          </button>
        </nav>

        {/* Backend Status indicator in sidebar footer */}
        <div style={{ padding: '20px', borderTop: '1px solid var(--border-subtle)', background: 'rgba(0, 0, 0, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>FASTAPI BACKEND</span>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: apiOnline ? '#10b981' : '#f43f5e',
                boxShadow: apiOnline ? '0 0 10px #10b981' : '0 0 10px #f43f5e',
              }}
            />
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {apiOnline ? 'REST Engine Online (:8000)' : 'Backend Disconnected'}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Swagger: <a href="http://127.0.0.1:8000/docs" target="_blank" rel="noreferrer" style={{ color: '#818cf8', textDecoration: 'none' }}>/docs</a>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-content">
        {/* Top Navbar */}
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Institution Portal:</span>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f8fafc' }}>
              Autonomous Engineering College • Office of Examination Controller
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              className="btn btn-secondary"
              style={{ padding: '8px 14px', fontSize: '0.8rem' }}
              onClick={loadInitialData}
              disabled={isRefreshing}
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
            <div style={{ height: '24px', width: '1px', background: 'var(--border-subtle)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.2)', border: '1px solid rgba(99, 102, 241, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', color: '#818cf8' }}>
                FC
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Faculty / Controller</span>
            </div>
          </div>
        </header>

        {/* Page Body Viewport */}
        <main className="page-body">
          {activeTab === 'analytics' && (
            <AnalyticsView
              exams={exams}
              selectedExamId={selectedExamId}
              onSelectExam={setSelectedExamId}
            />
          )}

          {activeTab === 'grading' && (
            <GradingWorkbenchView
              exams={exams}
              selectedExamId={selectedExamId}
              onSelectExam={setSelectedExamId}
              onGradingCalculated={loadInitialData}
            />
          )}

          {activeTab === 'questions' && <QuestionBankView />}

          {activeTab === 'exams' && (
            <ExamsView
              exams={exams}
              onRefreshExams={loadInitialData}
              onSelectExam={(id) => {
                setSelectedExamId(id);
                setActiveTab('analytics');
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
