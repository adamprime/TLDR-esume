'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { readFile, writeFile, fileExists } from '@/lib/browser-fs';
import { getSavedFolderHandle } from '@/lib/folder-handle';
import { callAI } from '@/lib/browser-ai';

const RESUME_FORMAT_PROMPT = `Convert the following resume text into clean markdown format. Follow these rules:

1. Add YAML frontmatter with: name, email, phone, location, linkedin (if found)
2. Use # for the person's name as main heading
3. Use ## for major sections (Summary, Experience, Skills, Education)
4. Use ### for job titles with company name
5. Use **bold** for location and dates
6. Use bullet points (-) for accomplishments
7. Preserve ALL facts exactly - do not add, embellish, or change anything
8. Clean up formatting inconsistencies but keep the content identical

Here's the resume text:

`;

export default function ResumeSetupPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'choose' | 'paste' | 'template'>('choose');
  const [pastedText, setPastedText] = useState('');
  const [formattedResume, setFormattedResume] = useState('');
  const [isFormatting, setIsFormatting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [handle, setHandle] = useState<FileSystemDirectoryHandle | null>(null);

  useEffect(() => {
    async function init() {
      const h = await getSavedFolderHandle();
      if (!h) {
        router.push('/onboarding/folder');
        return;
      }
      setHandle(h);

      // Check if resume already exists
      if (await fileExists(h, 'resume.md')) {
        const existing = await readFile(h, 'resume.md');
        if (existing.trim().length > 100) {
          // Has substantial resume, skip to review
          router.push('/onboarding/review');
        }
      }
    }
    init();
  }, [router]);

  async function handleFormatResume() {
    if (!pastedText.trim()) {
      setError('Please paste your resume text');
      return;
    }

    if (!handle) return;

    setError(null);
    setIsFormatting(true);

    try {
      const configContent = await readFile(handle, 'config.json');
      const config = JSON.parse(configContent);

      const formatted = await callAI(
        config,
        RESUME_FORMAT_PROMPT + pastedText
      );

      setFormattedResume(formatted);
      setMode('template'); // Show the result for editing
    } catch (err) {
      setError('Failed to format resume. Please try again.');
      console.error(err);
    } finally {
      setIsFormatting(false);
    }
  }

  async function handleUseTemplate() {
    if (!handle) return;

    try {
      const template = await readFile(handle, 'resume-template.md');
      setFormattedResume(template);
      setMode('template');
    } catch (err) {
      setError('Failed to load template');
      console.error(err);
    }
  }

  async function handleSaveAndContinue() {
    if (!handle || !formattedResume.trim()) {
      setError('Please add your resume content');
      return;
    }

    try {
      await writeFile(handle, 'resume.md', formattedResume);
      router.push('/onboarding/review');
    } catch (err) {
      setError('Failed to save resume');
      console.error(err);
    }
  }

  async function handleSkipReview() {
    if (!handle || !formattedResume.trim()) {
      setError('Please add your resume content');
      return;
    }

    try {
      await writeFile(handle, 'resume.md', formattedResume);
      
      // Mark onboarding complete
      const configContent = await readFile(handle, 'config.json');
      const config = JSON.parse(configContent);
      config.onboardingComplete = true;
      await writeFile(handle, 'config.json', JSON.stringify(config, null, 2));
      
      router.push('/dashboard');
    } catch (err) {
      setError('Failed to save resume');
      console.error(err);
    }
  }

  if (mode === 'choose') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-paper">
        <div className="max-w-lg w-full">
          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <div className="w-10 h-10 rounded-full bg-green-500 text-black border-2 border-green-500 flex items-center justify-center text-sm font-bold shadow-hard-sm">✓</div>
            <div className="w-16 h-0.5 bg-green-500" />
            <div className="w-10 h-10 rounded-full bg-green-500 text-black border-2 border-green-500 flex items-center justify-center text-sm font-bold shadow-hard-sm">✓</div>
            <div className="w-16 h-0.5 bg-ink" />
            <div className="w-10 h-10 rounded-full bg-accent text-black border-2 border-ink flex items-center justify-center text-sm font-bold shadow-hard-sm">3</div>
          </div>

          <div className="text-center mb-12">
            <h1 className="text-4xl font-serif font-black mb-6">Set Up Your Base Resume</h1>
            <p className="text-gray-400 font-mono text-sm leading-relaxed">
              This is your master resume that we&apos;ll customize for each job application.
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => setMode('paste')}
              className="w-full p-6 bg-paper border-2 border-ink shadow-hard-sm hover:shadow-hard hover:-translate-y-1 transition-all text-left group"
            >
              <div className="font-serif font-bold text-xl mb-2 group-hover:text-accent transition-colors">Paste my existing resume</div>
              <div className="text-sm text-gray-400 font-mono">
                Copy text from your Word doc or PDF. AI will format it for you.
              </div>
            </button>

            <button
              onClick={handleUseTemplate}
              className="w-full p-6 bg-paper border-2 border-ink shadow-hard-sm hover:shadow-hard hover:-translate-y-1 transition-all text-left group"
            >
              <div className="font-serif font-bold text-xl mb-2 group-hover:text-accent transition-colors">Start from template</div>
              <div className="text-sm text-gray-400 font-mono">
                Use our template and fill in your information.
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'paste') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-paper">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-serif font-black mb-4">Paste Your Resume</h1>
            <p className="text-gray-400 font-mono text-sm">
              Copy all the text from your existing resume and paste it below.
            </p>
          </div>

          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="Paste your resume text here..."
            className="w-full h-80 px-4 py-3 bg-paper border-2 border-ink focus:outline-none focus:border-accent focus:shadow-hard-sm transition-all font-mono text-sm resize-none"
          />

          <div className="flex gap-4 mt-8">
            <button
              onClick={() => setMode('choose')}
              className="px-6 py-3 bg-paper text-ink border-2 border-ink font-bold hover:bg-ink hover:text-black shadow-sm transition-all"
            >
              Back
            </button>
            <button
              onClick={handleFormatResume}
              disabled={isFormatting || !pastedText.trim()}
              className="flex-1 py-3 bg-accent text-black font-bold border-2 border-ink shadow-hard-sm hover:shadow-hard hover:-translate-y-1 transition-all disabled:opacity-50"
            >
              {isFormatting ? 'Formatting with AI...' : 'Format Resume'}
            </button>
          </div>

          {error && (
            <p className="mt-6 text-red-500 font-bold font-mono text-center bg-red-100/10 p-2 border-2 border-red-500">{error}</p>
          )}
        </div>
      </div>
    );
  }

  // Template/Edit mode
  return (
    <div className="min-h-screen flex flex-col p-6 bg-paper">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-serif font-black mb-4">Review Your Resume</h1>
        <p className="text-gray-400 font-mono text-sm">
          Edit as needed, then continue to optional AI review.
        </p>
      </div>

      <div className="flex-1 max-w-4xl w-full mx-auto">
        <textarea
          value={formattedResume}
          onChange={(e) => setFormattedResume(e.target.value)}
          className="w-full h-[60vh] px-6 py-4 bg-paper border-2 border-ink focus:outline-none focus:border-accent focus:shadow-hard-sm transition-all font-mono text-sm resize-none leading-relaxed"
        />
      </div>

      <div className="max-w-4xl w-full mx-auto mt-8">
        <div className="flex gap-4">
          <button
            onClick={() => setMode('choose')}
            className="px-6 py-3 bg-paper text-ink border-2 border-ink font-bold hover:bg-ink hover:text-black shadow-sm transition-all"
          >
            Back
          </button>
          <button
            onClick={handleSkipReview}
            className="px-6 py-3 bg-paper text-ink border-2 border-ink font-bold hover:bg-ink hover:text-black shadow-sm transition-all"
          >
            Skip Review
          </button>
          <button
            onClick={handleSaveAndContinue}
            className="flex-1 py-3 bg-accent text-black font-bold border-2 border-ink shadow-hard-sm hover:shadow-hard hover:-translate-y-1 transition-all"
          >
            Get AI Review (Recommended)
          </button>
        </div>

        {error && (
          <p className="mt-6 text-red-500 font-bold font-mono text-center bg-red-100/10 p-2 border-2 border-red-500">{error}</p>
        )}
      </div>
    </div>
  );
}
