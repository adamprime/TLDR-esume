'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MarkdownEditor from '@/components/MarkdownEditor';
import LoadingText from '@/components/LoadingText';
import { Application, CoverLetterHooks } from '@/lib/types';

const DEFAULT_HOOKS: CoverLetterHooks = {
  whyThisCompany: '',
  personalConnection: '',
  uniqueValue: '',
  memorableNote: '',
};

export default function CoverLetterEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [application, setApplication] = useState<Application | null>(null);
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [hasResume, setHasResume] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [hooks, setHooks] = useState<CoverLetterHooks>(DEFAULT_HOOKS);
  const [showHooks, setShowHooks] = useState(true);
  const [savingHooks, setSavingHooks] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  async function fetchData() {
    try {
      const [appRes, hooksRes] = await Promise.all([
        fetch(`/api/applications/${id}`),
        fetch(`/api/cover-letter-hooks?applicationId=${id}`),
      ]);
      
      if (!appRes.ok) {
        router.push('/');
        return;
      }
      
      const data = await appRes.json();
      setApplication(data.application);
      setContent(data.coverLetter || '');
      setOriginalContent(data.coverLetter || '');
      setHasResume(!!data.resume);
      
      if (hooksRes.ok) {
        const hooksData = await hooksRes.json();
        if (hooksData.hooks) {
          setHooks(hooksData.hooks);
        }
      }
      
      // Hide hooks section if cover letter already exists
      if (data.coverLetter) {
        setShowHooks(false);
      }
    } catch (error) {
      console.error('Error fetching:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  }

  async function saveHooks() {
    setSavingHooks(true);
    try {
      await fetch('/api/cover-letter-hooks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: id, hooks }),
      });
    } catch (error) {
      console.error('Error saving hooks:', error);
    } finally {
      setSavingHooks(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await fetch(`/api/applications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coverLetter: content }),
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
        body: JSON.stringify({ applicationId: id, type: 'cover-letter' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      // PDF opens automatically, no alert needed
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  }

  async function handleGenerate() {
    // Save hooks first
    await saveHooks();
    
    setGenerating(true);
    try {
      const res = await fetch('/api/generate-cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: id }),
      });
      if (!res.ok) throw new Error('Generation failed');
      const data = await res.json();
      setContent(data.coverLetter);
      setOriginalContent(data.coverLetter);
      setShowHooks(false); // Hide hooks after generation
    } catch (error) {
      console.error('Error generating:', error);
      alert('Failed to generate cover letter. Please try again.');
    } finally {
      setGenerating(false);
    }
  }

  function updateHook(key: keyof CoverLetterHooks, value: string) {
    setHooks(prev => ({ ...prev, [key]: value }));
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
                Cover Letter: {application?.company}
              </h1>
              <p className="text-xs text-gray-400">{application?.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!content && hasResume && (
              <button
                onClick={handleGenerate}
                disabled={generating}
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

      <main className="flex-1 overflow-hidden flex flex-col">
        {/* Cover Letter Hook Section */}
        {hasResume && (
          <div className={`bg-[#1a1a1a] border-b border-[#2a2a2a] ${showHooks ? 'flex-shrink-0' : ''}`}>
            <button
              onClick={() => setShowHooks(!showHooks)}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[#222]"
            >
              <span className="text-sm font-medium text-gray-200">
                ✨ Cover Letter Hooks {content ? '(optional for regeneration)' : '(recommended before generating)'}
              </span>
              <span className="text-gray-400">{showHooks ? '▼' : '▶'}</span>
            </button>
            
            {showHooks && (
              <div className="px-4 pb-4 space-y-4">
                <p className="text-xs text-gray-500">
                  Fill in these prompts to give the AI real material to work with. The more specific, the better your cover letter will be.
                </p>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Why this company specifically?
                  </label>
                  <textarea
                    value={hooks.whyThisCompany}
                    onChange={(e) => updateHook('whyThisCompany', e.target.value)}
                    placeholder="Not generic reasons - what actually draws you to THIS company? Their product, mission, culture, a specific thing they've done?"
                    rows={2}
                    className="w-full px-3 py-2 border border-[#3a3a3a] bg-[#0f0f0f] text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm placeholder:text-gray-600"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Any personal connection to their product/mission/team?
                  </label>
                  <textarea
                    value={hooks.personalConnection}
                    onChange={(e) => updateHook('personalConnection', e.target.value)}
                    placeholder="Have you used their product? Know someone there? Have a relevant personal story? Met them at an event?"
                    rows={2}
                    className="w-full px-3 py-2 border border-[#3a3a3a] bg-[#0f0f0f] text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm placeholder:text-gray-600"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    What&apos;s a non-obvious reason you&apos;d be great at this?
                  </label>
                  <textarea
                    value={hooks.uniqueValue}
                    onChange={(e) => updateHook('uniqueValue', e.target.value)}
                    placeholder="Something that sets you apart that isn't obvious from your resume. A unique perspective, unusual combination of skills, contrarian take?"
                    rows={2}
                    className="w-full px-3 py-2 border border-[#3a3a3a] bg-[#0f0f0f] text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm placeholder:text-gray-600"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Anything memorable you want to include?
                  </label>
                  <textarea
                    value={hooks.memorableNote}
                    onChange={(e) => updateHook('memorableNote', e.target.value)}
                    placeholder="A quick story, an interesting fact, something that would make them remember you. Can be work-related or not."
                    rows={2}
                    className="w-full px-3 py-2 border border-[#3a3a3a] bg-[#0f0f0f] text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm placeholder:text-gray-600"
                  />
                </div>
                
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={saveHooks}
                    disabled={savingHooks}
                    className="px-3 py-1.5 text-sm bg-gray-700 text-gray-200 rounded hover:bg-gray-600 disabled:opacity-50"
                  >
                    {savingHooks ? 'Saving...' : 'Save Hooks'}
                  </button>
                  
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="px-4 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-500 disabled:opacity-50"
                  >
                    {generating ? <LoadingText text="Generating" /> : content ? 'Regenerate Cover Letter' : 'Generate Cover Letter'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Editor or Empty State */}
        <div className="flex-1 overflow-hidden">
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
                <p className="text-gray-400 mb-4">No cover letter yet for this application.</p>
                {hasResume ? (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-500">
                      Fill in the hooks above for a better cover letter, then:
                    </p>
                    <button
                      onClick={handleGenerate}
                      disabled={generating}
                      className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-50"
                    >
                      {generating ? <LoadingText text="Generating" /> : 'Draft Cover Letter with AI'}
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    Create a resume first to generate a cover letter.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
