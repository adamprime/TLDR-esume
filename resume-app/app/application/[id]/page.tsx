'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import StatusSelector from '@/components/StatusSelector';
import StyleSelector from '@/components/StyleSelector';
import LoadingText from '@/components/LoadingText';
import { Application, ApplicationStatus, StyleOption, FitAssessment } from '@/lib/types';

interface ApplicationData {
  application: Application;
  resume: string | null;
  coverLetter: string | null;
  questions: Array<{ id: string; question: string; answer: string }>;
  assessment: FitAssessment | null;
}

const RECOMMENDATION_COLORS: Record<string, string> = {
  strong_fit: 'text-green-400 bg-green-900/30',
  worth_applying: 'text-blue-400 bg-blue-900/30',
  stretch: 'text-yellow-400 bg-yellow-900/30',
  long_shot: 'text-orange-400 bg-orange-900/30',
  not_recommended: 'text-red-400 bg-red-900/30',
};

export default function ApplicationDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [data, setData] = useState<ApplicationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingCover, setGeneratingCover] = useState(false);
  const [regeneratingResume, setRegeneratingResume] = useState(false);

  useEffect(() => {
    fetchApplication();
  }, [id]);

  async function fetchApplication() {
    try {
      const res = await fetch(`/api/applications/${id}`);
      if (!res.ok) {
        router.push('/');
        return;
      }
      const appData = await res.json();
      setData(appData);
    } catch (error) {
      console.error('Error fetching application:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(status: ApplicationStatus) {
    if (!data) return;
    setSaving(true);
    try {
      await fetch(`/api/applications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      setData({ ...data, application: { ...data.application, status } });
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setSaving(false);
    }
  }

  async function updateStyle(style: StyleOption) {
    if (!data) return;
    setSaving(true);
    try {
      await fetch(`/api/applications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ style }),
      });
      setData({ ...data, application: { ...data.application, style } });
    } catch (error) {
      console.error('Error updating style:', error);
    } finally {
      setSaving(false);
    }
  }

  async function generateCoverLetter() {
    if (!data?.resume) {
      alert('Please create a resume first.');
      return;
    }
    setGeneratingCover(true);
    try {
      const res = await fetch('/api/generate-cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: id }),
      });
      if (!res.ok) throw new Error('Failed to generate');
      const { coverLetter } = await res.json();
      setData({ ...data, coverLetter });
    } catch (error) {
      console.error('Error generating cover letter:', error);
      alert('Failed to generate cover letter.');
    } finally {
      setGeneratingCover(false);
    }
  }

  async function regenerateResume() {
    if (!data?.application.jobDescription) {
      alert('No job description available. Add one first.');
      return;
    }
    if (!confirm('This will replace your current resume draft. Continue?')) {
      return;
    }
    setRegeneratingResume(true);
    try {
      const res = await fetch('/api/generate-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: id,
          baseResumeFile: data.application.baseResume,
          jobDescription: data.application.jobDescription,
          company: data.application.company,
          role: data.application.role,
        }),
      });
      if (!res.ok) throw new Error('Failed to regenerate');
      const { resume } = await res.json();
      setData({ ...data, resume });
    } catch (error) {
      console.error('Error regenerating resume:', error);
      alert('Failed to regenerate resume.');
    } finally {
      setRegeneratingResume(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-gray-400">Application not found</div>
      </div>
    );
  }

  const { application, resume, coverLetter, assessment } = data;

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <header className="bg-[#1a1a1a] border-b border-[#2a2a2a]">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-400 hover:text-gray-200">
              &larr; Back
            </Link>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-100">{application.company}</h1>
              <p className="text-sm text-gray-400">{application.role}</p>
            </div>
            <div className="flex items-center gap-3">
              <StatusSelector
                value={application.status}
                onChange={updateStatus}
              />
              <StyleSelector
                value={application.style}
                onChange={updateStyle}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Job Info */}
        {application.jobUrl && (
          <div className="mb-6">
            <a
              href={application.jobUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline text-sm"
            >
              View Job Posting &rarr;
            </a>
          </div>
        )}

        {/* Assessment Card - Full Width */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-100">Fit Assessment</h2>
            {assessment ? (
              <span className={`text-xs px-2 py-0.5 rounded ${RECOMMENDATION_COLORS[assessment.recommendation] || 'text-gray-400 bg-gray-800'}`}>
                {assessment.fitScore}/10
              </span>
            ) : (
              <span className="text-xs text-gray-500 bg-[#2a2a2a] px-2 py-0.5 rounded">Not assessed</span>
            )}
          </div>
          {assessment ? (
            <p className="text-sm text-gray-400 mb-4 line-clamp-2">{assessment.overallAssessment}</p>
          ) : (
            <p className="text-sm text-gray-400 mb-4">Get honest feedback about your fit for this role before generating materials.</p>
          )}
          <Link
            href={`/application/${id}/assessment`}
            className="block text-center px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-500 text-sm"
          >
            {assessment ? 'View Assessment' : 'Run Assessment'}
          </Link>
        </div>

        {/* Document Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Resume Card */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-100">Resume</h2>
              {resume ? (
                <span className="text-xs text-green-400 bg-green-900/30 px-2 py-0.5 rounded">Ready</span>
              ) : (
                <span className="text-xs text-gray-500 bg-[#2a2a2a] px-2 py-0.5 rounded">Not created</span>
              )}
            </div>
            <p className="text-sm text-gray-400 mb-4">
              {resume ? 'Edit and export your customized resume.' : 'Generate a customized resume for this role.'}
            </p>
            <div className="space-y-2">
              <Link
                href={`/application/${id}/resume`}
                className="block text-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 text-sm"
              >
                {resume ? 'Edit Resume' : 'Create Resume'}
              </Link>
              {resume && (
                <button
                  onClick={regenerateResume}
                  disabled={regeneratingResume}
                  className="w-full px-4 py-2 bg-gray-700 text-gray-200 rounded hover:bg-gray-600 text-sm disabled:opacity-50"
                >
                  {regeneratingResume ? <LoadingText text="Regenerating" /> : 'Regenerate with AI'}
                </button>
              )}
            </div>
          </div>

          {/* Cover Letter Card */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-100">Cover Letter</h2>
              {coverLetter ? (
                <span className="text-xs text-green-400 bg-green-900/30 px-2 py-0.5 rounded">Ready</span>
              ) : (
                <span className="text-xs text-gray-500 bg-[#2a2a2a] px-2 py-0.5 rounded">Not created</span>
              )}
            </div>
            <p className="text-sm text-gray-400 mb-4">
              {coverLetter ? 'Edit and export your cover letter.' : 'Generate a tailored cover letter.'}
            </p>
            {coverLetter ? (
              <Link
                href={`/application/${id}/cover-letter`}
                className="block text-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 text-sm"
              >
                Edit Cover Letter
              </Link>
            ) : (
              <button
                onClick={generateCoverLetter}
                disabled={generatingCover || !resume}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 text-sm disabled:opacity-50"
              >
                {generatingCover ? <LoadingText text="Generating" /> : 'Generate Cover Letter'}
              </button>
            )}
          </div>

          {/* Questions Card */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-100">Questions</h2>
              {data.questions.length > 0 ? (
                <span className="text-xs text-green-400 bg-green-900/30 px-2 py-0.5 rounded">
                  {data.questions.length} saved
                </span>
              ) : (
                <span className="text-xs text-gray-500 bg-[#2a2a2a] px-2 py-0.5 rounded">None</span>
              )}
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Draft answers for application questions.
            </p>
            <Link
              href={`/application/${id}/questions`}
              className="block text-center px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm"
            >
              {data.questions.length > 0 ? 'Edit Questions' : 'Add Questions'}
            </Link>
          </div>
        </div>

        {/* Job Description */}
        {application.jobDescription && (
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
            <h2 className="font-semibold text-gray-100 mb-3">Job Description</h2>
            <pre className="text-sm text-gray-400 whitespace-pre-wrap font-sans max-h-96 overflow-y-auto">
              {application.jobDescription}
            </pre>
          </div>
        )}
      </main>
    </div>
  );
}
