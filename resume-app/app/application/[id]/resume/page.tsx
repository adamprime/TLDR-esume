'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MarkdownEditor from '@/components/MarkdownEditor';
import LoadingText from '@/components/LoadingText';
import { Application } from '@/lib/types';

export default function ResumeEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [application, setApplication] = useState<Application | null>(null);
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [generating, setGenerating] = useState(false);

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
      setContent(data.resume || '');
      setOriginalContent(data.resume || '');
    } catch (error) {
      console.error('Error fetching:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await fetch(`/api/applications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume: content }),
      });
      setOriginalContent(content);
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleExportPDF() {
    if (content !== originalContent) {
      await handleSave();
    }
    setExporting(true);
    try {
      const res = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: id, type: 'resume' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert(`PDF exported to:\n${data.path}`);
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  }

  async function handleGenerate() {
    if (!application) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/generate-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: id,
          baseResumeFile: application.baseResume,
          jobDescription: application.jobDescription,
          company: application.company,
          role: application.role,
        }),
      });
      if (!res.ok) throw new Error('Generation failed');
      const data = await res.json();
      setContent(data.resume);
      setOriginalContent(data.resume);
    } catch (error) {
      console.error('Error generating:', error);
      alert('Failed to generate resume. Please try again.');
    } finally {
      setGenerating(false);
    }
  }

  const hasChanges = content !== originalContent;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#0f0f0f]">
      <header className="bg-[#1a1a1a] border-b border-[#2a2a2a] flex-shrink-0">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href={`/application/${id}`} 
              className="text-gray-400 hover:text-gray-200"
            >
              &larr; Back
            </Link>
            <div>
              <h1 className="font-semibold text-gray-100">
                Resume: {application?.company}
              </h1>
              <p className="text-xs text-gray-400">{application?.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!content && (
              <button
                onClick={handleGenerate}
                disabled={generating || !application?.jobDescription}
                className="px-4 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-500 disabled:opacity-50"
              >
                {generating ? 'Generating...' : 'Generate with AI'}
              </button>
            )}
            {hasChanges && (
              <span className="text-xs text-amber-600 mr-2">Unsaved changes</span>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        {content ? (
          <MarkdownEditor
            value={content}
            onChange={setContent}
            onSave={handleSave}
            onExportPDF={handleExportPDF}
            saving={saving}
            exporting={exporting}
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-400 mb-4">No resume yet for this application.</p>
              <button
                onClick={handleGenerate}
                disabled={generating || !application?.jobDescription}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-50"
              >
                {generating ? <LoadingText text="Generating" /> : 'Draft Resume with AI'}
              </button>
              {!application?.jobDescription && (
                <p className="text-xs text-gray-500 mt-2">
                  Add a job description to enable AI generation.
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
