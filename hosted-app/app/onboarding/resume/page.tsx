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
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-lg w-full">
          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-sm">✓</div>
            <div className="w-12 h-0.5 bg-green-600" />
            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-sm">✓</div>
            <div className="w-12 h-0.5 bg-blue-600" />
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">3</div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-4">Set Up Your Base Resume</h1>
            <p className="text-gray-400">
              This is your master resume that we&apos;ll customize for each job application.
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => setMode('paste')}
              className="w-full p-6 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg hover:border-blue-600 transition-colors text-left"
            >
              <div className="font-semibold mb-1">Paste my existing resume</div>
              <div className="text-sm text-gray-400">
                Copy text from your Word doc or PDF. AI will format it for you.
              </div>
            </button>

            <button
              onClick={handleUseTemplate}
              className="w-full p-6 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg hover:border-blue-600 transition-colors text-left"
            >
              <div className="font-semibold mb-1">Start from template</div>
              <div className="text-sm text-gray-400">
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
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold mb-2">Paste Your Resume</h1>
            <p className="text-gray-400">
              Copy all the text from your existing resume and paste it below.
            </p>
          </div>

          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="Paste your resume text here..."
            className="w-full h-80 px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg focus:outline-none focus:border-blue-600 font-mono text-sm resize-none"
          />

          <div className="flex gap-4 mt-6">
            <button
              onClick={() => setMode('choose')}
              className="px-6 py-3 bg-[#2a2a2a] text-white rounded-lg hover:bg-[#3a3a3a] transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleFormatResume}
              disabled={isFormatting || !pastedText.trim()}
              className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isFormatting ? 'Formatting with AI...' : 'Format Resume'}
            </button>
          </div>

          {error && (
            <p className="mt-4 text-red-400 text-center">{error}</p>
          )}
        </div>
      </div>
    );
  }

  // Template/Edit mode
  return (
    <div className="min-h-screen flex flex-col p-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold mb-2">Review Your Resume</h1>
        <p className="text-gray-400">
          Edit as needed, then continue to optional AI review.
        </p>
      </div>

      <div className="flex-1 max-w-4xl w-full mx-auto">
        <textarea
          value={formattedResume}
          onChange={(e) => setFormattedResume(e.target.value)}
          className="w-full h-[60vh] px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg focus:outline-none focus:border-blue-600 font-mono text-sm resize-none"
        />
      </div>

      <div className="max-w-4xl w-full mx-auto mt-6">
        <div className="flex gap-4">
          <button
            onClick={() => setMode('choose')}
            className="px-6 py-3 bg-[#2a2a2a] text-white rounded-lg hover:bg-[#3a3a3a] transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleSkipReview}
            className="px-6 py-3 bg-[#2a2a2a] text-white rounded-lg hover:bg-[#3a3a3a] transition-colors"
          >
            Skip Review
          </button>
          <button
            onClick={handleSaveAndContinue}
            className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 transition-colors"
          >
            Get AI Review (Recommended)
          </button>
        </div>

        {error && (
          <p className="mt-4 text-red-400 text-center">{error}</p>
        )}
      </div>
    </div>
  );
}
