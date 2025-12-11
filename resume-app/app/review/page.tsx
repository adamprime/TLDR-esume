'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import * as Diff from 'diff';
import LoadingText from '@/components/LoadingText';
import ResumeSelector from '@/components/ResumeSelector';
import { BaseResume, ResumeReview } from '@/lib/types';

const GRADE_COLORS: Record<string, string> = {
  'A+': 'text-green-400 bg-green-900/30',
  'A': 'text-green-400 bg-green-900/30',
  'A-': 'text-green-400 bg-green-900/30',
  'B+': 'text-blue-400 bg-blue-900/30',
  'B': 'text-blue-400 bg-blue-900/30',
  'B-': 'text-blue-400 bg-blue-900/30',
  'C+': 'text-yellow-400 bg-yellow-900/30',
  'C': 'text-yellow-400 bg-yellow-900/30',
  'C-': 'text-yellow-400 bg-yellow-900/30',
  'D': 'text-orange-400 bg-orange-900/30',
  'F': 'text-red-400 bg-red-900/30',
};

export default function ReviewPage() {
  const [baseResumes, setBaseResumes] = useState<BaseResume[]>([]);
  const [selectedResume, setSelectedResume] = useState('');
  const [currentResume, setCurrentResume] = useState('');
  const [review, setReview] = useState<ResumeReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [improving, setImproving] = useState(false);
  const [applying, setApplying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDiff, setShowDiff] = useState(false);

  useEffect(() => {
    fetchBaseResumes();
  }, []);

  useEffect(() => {
    if (selectedResume) {
      fetchReview();
    }
  }, [selectedResume]);

  async function fetchBaseResumes() {
    try {
      const res = await fetch('/api/applications');
      const data = await res.json();
      setBaseResumes(data.baseResumes || []);
      if (data.baseResumes?.length > 0) {
        setSelectedResume(data.baseResumes[0].filename);
      }
    } catch (error) {
      console.error('Error fetching resumes:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchReview() {
    try {
      const res = await fetch(`/api/review-resume?resumeFile=${encodeURIComponent(selectedResume)}`);
      const data = await res.json();
      setReview(data.review);
      setCurrentResume(data.resume || '');
    } catch (error) {
      console.error('Error fetching review:', error);
    }
  }

  async function runReview() {
    setReviewing(true);
    try {
      const res = await fetch('/api/review-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeFile: selectedResume, action: 'review' }),
      });
      if (!res.ok) throw new Error('Review failed');
      const data = await res.json();
      setReview(data.review);
      setShowDiff(false);
    } catch (error) {
      console.error('Error reviewing:', error);
      alert('Failed to review resume.');
    } finally {
      setReviewing(false);
    }
  }

  async function generateImproved() {
    setImproving(true);
    try {
      const res = await fetch('/api/review-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeFile: selectedResume, action: 'improve' }),
      });
      if (!res.ok) throw new Error('Improvement failed');
      const data = await res.json();
      setReview(prev => prev ? { ...prev, improvedResume: data.improvedResume } : null);
      setShowDiff(true);
    } catch (error) {
      console.error('Error improving:', error);
      alert('Failed to generate improved resume.');
    } finally {
      setImproving(false);
    }
  }

  async function applyImprovements() {
    if (!confirm('This will archive your current resume and replace it with the improved version. Continue?')) {
      return;
    }
    setApplying(true);
    try {
      const res = await fetch('/api/review-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeFile: selectedResume, action: 'apply' }),
      });
      if (!res.ok) throw new Error('Apply failed');
      const data = await res.json();
      alert(data.message);
      // Refresh to show updated resume
      await fetchReview();
      setShowDiff(false);
    } catch (error) {
      console.error('Error applying:', error);
      alert('Failed to apply improvements.');
    } finally {
      setApplying(false);
    }
  }

  async function saveQuestions() {
    if (!review) return;
    setSaving(true);
    try {
      await fetch('/api/review-resume', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeFile: selectedResume, questions: review.questions }),
      });
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  function updateQuestionAnswer(questionId: string, answer: string) {
    if (!review) return;
    setReview({
      ...review,
      questions: review.questions.map(q =>
        q.id === questionId ? { ...q, answer } : q
      ),
    });
  }

  function renderDiff() {
    if (!review?.improvedResume || !currentResume) return null;
    
    const diff = Diff.diffLines(currentResume, review.improvedResume);
    
    return (
      <div className="font-mono text-sm overflow-x-auto">
        {diff.map((part, i) => {
          if (part.added) {
            return (
              <div key={i} className="bg-green-900/30 border-l-4 border-green-500 pl-2">
                {part.value.split('\n').map((line, j) => (
                  <div key={j} className="text-green-300">{line || ' '}</div>
                ))}
              </div>
            );
          }
          if (part.removed) {
            return (
              <div key={i} className="bg-red-900/30 border-l-4 border-red-500 pl-2">
                {part.value.split('\n').map((line, j) => (
                  <div key={j} className="text-red-300 line-through">{line || ' '}</div>
                ))}
              </div>
            );
          }
          return (
            <div key={i} className="text-gray-400">
              {part.value.split('\n').map((line, j) => (
                <div key={j}>{line || ' '}</div>
              ))}
            </div>
          );
        })}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <header className="bg-[#1a1a1a] border-b border-[#2a2a2a]">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-gray-400 hover:text-gray-200">
                &larr; Back
              </Link>
              <h1 className="text-xl font-bold text-gray-100">Resume Reviewer</h1>
            </div>
            <div className="flex items-center gap-3">
              <ResumeSelector
                resumes={baseResumes}
                value={selectedResume}
                onChange={setSelectedResume}
              />
              <button
                onClick={runReview}
                disabled={reviewing || !selectedResume}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-50"
              >
                {reviewing ? <LoadingText text="Reviewing" /> : review ? 'Re-review' : 'Run Review'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {!review ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-xl font-semibold text-gray-100 mb-2">No Review Yet</h2>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Get brutally honest feedback on your resume from an AI acting as a skeptical hiring manager.
            </p>
            <button
              onClick={runReview}
              disabled={reviewing || !selectedResume}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50"
            >
              {reviewing ? <LoadingText text="Reviewing" /> : 'Review My Resume'}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Grade and Overview */}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <span className={`text-4xl font-bold px-4 py-2 rounded ${GRADE_COLORS[review.overallGrade] || 'text-gray-400 bg-gray-800'}`}>
                    {review.overallGrade}
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-100">Overall Grade</h2>
                    <p className="text-sm text-gray-500">
                      Reviewed {new Date(review.reviewedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-gray-300 leading-relaxed">{review.overallFeedback}</p>
            </div>

            {/* Strengths */}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
                <span className="text-green-500">✓</span> Strengths
              </h2>
              {review.strengths.length === 0 ? (
                <p className="text-gray-500 text-sm">No particular strengths identified.</p>
              ) : (
                <div className="space-y-3">
                  {review.strengths.map((s, i) => (
                    <div key={i} className="border-l-2 border-green-600 pl-4">
                      <h3 className="font-medium text-gray-200">{s.area}</h3>
                      <p className="text-sm text-gray-400">{s.detail}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Weaknesses */}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
                <span className="text-red-500">✗</span> Weaknesses
              </h2>
              {review.weaknesses.length === 0 ? (
                <p className="text-gray-500 text-sm">No significant weaknesses identified.</p>
              ) : (
                <div className="space-y-4">
                  {review.weaknesses.map((w) => (
                    <div key={w.id} className="border-l-2 border-red-600 pl-4">
                      <h3 className="font-medium text-red-400">{w.area}</h3>
                      <p className="text-sm text-gray-400 mb-2">{w.detail}</p>
                      <p className="text-sm text-blue-400">💡 {w.suggestion}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Questions */}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
                  <span className="text-yellow-500">?</span> Questions to Strengthen Your Resume
                </h2>
                <button
                  onClick={saveQuestions}
                  disabled={saving}
                  className="px-4 py-1.5 bg-gray-700 text-gray-200 rounded hover:bg-gray-600 text-sm disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Answers'}
                </button>
              </div>
              
              {review.questions.length === 0 ? (
                <p className="text-gray-500 text-sm">No questions generated.</p>
              ) : (
                <div className="space-y-4">
                  {review.questions.map((q) => (
                    <div key={q.id} className="border border-[#2a2a2a] rounded-lg p-4 bg-[#0f0f0f]">
                      <p className="font-medium text-gray-200 mb-1">{q.question}</p>
                      <p className="text-xs text-gray-500 mb-3">{q.context}</p>
                      <textarea
                        value={q.answer}
                        onChange={(e) => updateQuestionAnswer(q.id, e.target.value)}
                        placeholder="Your answer..."
                        rows={2}
                        className="w-full px-3 py-2 border border-[#3a3a3a] bg-[#1a1a1a] text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Generate Improved Version */}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-100">Generate Improved Resume</h2>
                <div className="flex items-center gap-2">
                  {review.improvedResume && (
                    <button
                      onClick={() => setShowDiff(!showDiff)}
                      className="px-4 py-2 bg-gray-700 text-gray-200 rounded hover:bg-gray-600 text-sm"
                    >
                      {showDiff ? 'Hide Diff' : 'Show Diff'}
                    </button>
                  )}
                  <button
                    onClick={generateImproved}
                    disabled={improving}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 disabled:opacity-50"
                  >
                    {improving ? <LoadingText text="Generating" /> : review.improvedResume ? 'Regenerate' : 'Generate Improved Version'}
                  </button>
                  {review.improvedResume && (
                    <button
                      onClick={applyImprovements}
                      disabled={applying}
                      className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-500 disabled:opacity-50"
                    >
                      {applying ? <LoadingText text="Applying" /> : 'Apply & Archive Original'}
                    </button>
                  )}
                </div>
              </div>
              
              <p className="text-sm text-gray-400 mb-4">
                Answer the questions above, then generate an improved version. The AI will incorporate your answers and address the weaknesses.
              </p>

              {showDiff && review.improvedResume && (
                <div className="border border-[#2a2a2a] rounded-lg p-4 bg-[#0f0f0f] max-h-[600px] overflow-y-auto">
                  <div className="flex items-center gap-4 mb-4 text-sm">
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 bg-red-900/50 border border-red-500"></span>
                      <span className="text-gray-400">Removed</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 bg-green-900/50 border border-green-500"></span>
                      <span className="text-gray-400">Added</span>
                    </span>
                  </div>
                  {renderDiff()}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
