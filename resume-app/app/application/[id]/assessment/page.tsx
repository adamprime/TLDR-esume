'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LoadingText from '@/components/LoadingText';
import { Application, FitAssessment } from '@/lib/types';

const RECOMMENDATION_LABELS: Record<string, { label: string; color: string }> = {
  strong_fit: { label: 'Strong Fit', color: 'bg-green-600' },
  worth_applying: { label: 'Worth Applying', color: 'bg-blue-600' },
  stretch: { label: 'Stretch Role', color: 'bg-yellow-600' },
  long_shot: { label: 'Long Shot', color: 'bg-orange-600' },
  not_recommended: { label: 'Not Recommended', color: 'bg-red-600' },
};

export default function AssessmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [application, setApplication] = useState<Application | null>(null);
  const [assessment, setAssessment] = useState<FitAssessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [assessing, setAssessing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  async function fetchData() {
    try {
      const res = await fetch(`/api/applications/${id}`);
      if (!res.ok) {
        router.push('/');
        return;
      }
      const data = await res.json();
      setApplication(data.application);
      
      // Fetch assessment separately
      const assessRes = await fetch(`/api/applications/${id}`);
      const assessData = await assessRes.json();
      if (assessData.assessment) {
        setAssessment(assessData.assessment);
      }
    } catch (error) {
      console.error('Error fetching:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  }

  async function runAssessment() {
    if (!application?.jobDescription) {
      alert('No job description available. Add one first.');
      return;
    }
    setAssessing(true);
    try {
      const res = await fetch('/api/assess-fit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: id,
          baseResumeFile: application.baseResume,
        }),
      });
      if (!res.ok) throw new Error('Assessment failed');
      const data = await res.json();
      setAssessment(data.assessment);
    } catch (error) {
      console.error('Error assessing:', error);
      alert('Failed to run assessment. Please try again.');
    } finally {
      setAssessing(false);
    }
  }

  async function saveGaps() {
    if (!assessment) return;
    setSaving(true);
    try {
      const res = await fetch('/api/assess-fit', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: id,
          gaps: assessment.gaps,
        }),
      });
      if (!res.ok) throw new Error('Save failed');
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function updateGapContext(gapId: string, context: string) {
    if (!assessment) return;
    setAssessment({
      ...assessment,
      gaps: assessment.gaps.map(g =>
        g.id === gapId ? { ...g, userContext: context } : g
      ),
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  const recInfo = assessment ? RECOMMENDATION_LABELS[assessment.recommendation] : null;

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <header className="bg-[#1a1a1a] border-b border-[#2a2a2a]">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/application/${id}`} className="text-gray-400 hover:text-gray-200">
                &larr; Back
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-100">Fit Assessment</h1>
                <p className="text-sm text-gray-400">{application?.company} - {application?.role}</p>
              </div>
            </div>
            <button
              onClick={runAssessment}
              disabled={assessing}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-50"
            >
              {assessing ? <LoadingText text="Assessing" /> : assessment ? 'Re-assess' : 'Run Assessment'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {!assessment ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🎯</div>
            <h2 className="text-xl font-semibold text-gray-100 mb-2">No Assessment Yet</h2>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Run an assessment to get honest feedback about your fit for this role. 
              The AI will act as a critical hiring manager to identify strengths, gaps, and dealbreakers.
            </p>
            <button
              onClick={runAssessment}
              disabled={assessing || !application?.jobDescription}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50"
            >
              {assessing ? <LoadingText text="Assessing" /> : 'Run Fit Assessment'}
            </button>
            {!application?.jobDescription && (
              <p className="text-sm text-gray-500 mt-3">Add a job description first.</p>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Score and Recommendation */}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-4xl font-bold text-gray-100">{assessment.fitScore}</span>
                    <span className="text-gray-500 text-lg">/10</span>
                    {recInfo && (
                      <span className={`${recInfo.color} text-white text-sm px-3 py-1 rounded-full`}>
                        {recInfo.label}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    Assessed {new Date(assessment.assessedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <p className="text-gray-300 leading-relaxed">{assessment.overallAssessment}</p>
            </div>

            {/* Dealbreakers */}
            {assessment.dealbreakers.length > 0 && (
              <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-red-400 mb-3 flex items-center gap-2">
                  <span>⚠️</span> Dealbreakers
                </h2>
                <ul className="space-y-2">
                  {assessment.dealbreakers.map((db, i) => (
                    <li key={i} className="text-red-300 text-sm">{db}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Strengths */}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
                <span className="text-green-500">✓</span> Strengths
              </h2>
              {assessment.strengths.length === 0 ? (
                <p className="text-gray-500 text-sm">No clear strengths identified.</p>
              ) : (
                <div className="space-y-4">
                  {assessment.strengths.map((strength, i) => (
                    <div key={i} className="border-l-2 border-green-600 pl-4">
                      <h3 className="font-medium text-gray-200">{strength.area}</h3>
                      <p className="text-sm text-gray-400 mt-1">{strength.evidence}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Gaps */}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
                  <span className="text-yellow-500">!</span> Gaps to Address
                </h2>
                <button
                  onClick={saveGaps}
                  disabled={saving}
                  className="px-4 py-1.5 bg-gray-700 text-gray-200 rounded hover:bg-gray-600 text-sm disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Responses'}
                </button>
              </div>
              
              {assessment.gaps.length === 0 ? (
                <p className="text-gray-500 text-sm">No significant gaps identified.</p>
              ) : (
                <div className="space-y-6">
                  {assessment.gaps.map((gap) => (
                    <div key={gap.id} className="border border-[#2a2a2a] rounded-lg p-4 bg-[#0f0f0f]">
                      <h3 className="font-medium text-yellow-400 mb-1">{gap.area}</h3>
                      <p className="text-sm text-gray-400 mb-3">{gap.concern}</p>
                      <div className="bg-[#1a1a1a] rounded p-3 mb-3">
                        <p className="text-sm text-gray-300 italic">"{gap.question}"</p>
                      </div>
                      <textarea
                        value={gap.userContext}
                        onChange={(e) => updateGapContext(gap.id, e.target.value)}
                        placeholder="Provide context here... (e.g., relevant experience not on your resume)"
                        rows={3}
                        className="w-full px-3 py-2 border border-[#3a3a3a] bg-[#1a1a1a] text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                  ))}
                </div>
              )}
              
              <p className="text-xs text-gray-500 mt-4">
                Your responses will be used to enhance the generated resume and cover letter.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
