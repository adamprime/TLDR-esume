'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { selectFolder, initializeFolderStructure, readFile } from '@/lib/browser-fs';
import { saveFolderHandle } from '@/lib/folder-handle';

export default function FolderSelectionPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  async function handleSelectFolder() {
    setError(null);
    setIsSelecting(true);

    try {
      const handle = await selectFolder();
      await initializeFolderStructure(handle);
      await saveFolderHandle(handle);

      // Check if config has onboarding complete
      const configContent = await readFile(handle, 'config.json');
      const config = JSON.parse(configContent);

      if (config.onboardingComplete) {
        // Returning user, go to dashboard
        router.push('/dashboard');
      } else if (config.anthropicApiKey || config.openaiApiKey) {
        // Has API key but not complete - go to resume setup
        router.push('/onboarding/resume');
      } else {
        // New user - continue with API key setup
        router.push('/onboarding/api-key');
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // User cancelled - not an error
        setIsSelecting(false);
        return;
      }
      setError('Failed to access folder. Please try again.');
      console.error(err);
    } finally {
      setIsSelecting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-paper">
      <div className="max-w-lg w-full">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <div className="w-10 h-10 rounded-full bg-accent text-black border-2 border-ink flex items-center justify-center text-sm font-bold shadow-hard-sm">1</div>
          <div className="w-16 h-0.5 bg-ink" />
          <div className="w-10 h-10 rounded-full bg-paper border-2 border-ink text-gray-500 flex items-center justify-center text-sm font-bold">2</div>
          <div className="w-16 h-0.5 bg-ink" />
          <div className="w-10 h-10 rounded-full bg-paper border-2 border-ink text-gray-500 flex items-center justify-center text-sm font-bold">3</div>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-serif font-black mb-6">Choose Your Data Folder</h1>
          <p className="text-gray-400 font-mono text-sm leading-relaxed">
            Select a folder on your computer where TLDR;esume will store your resumes,
            applications, and settings. All your data stays here - we never see it.
          </p>
        </div>

        <div className="bg-paper border-2 border-ink p-8 mb-8 shadow-hard transform rotate-1">
          <h2 className="font-serif font-bold text-xl mb-4 border-b-2 border-ink pb-2 inline-block">RECOMMENDED APPROACH:</h2>
          <ol className="text-gray-300 font-mono text-xs space-y-4">
            <li>1. Create a new folder called <code className="bg-ink text-black px-1 py-0.5 font-bold">TLDResume</code></li>
            <li>2. Put it somewhere easy to find (Desktop, Documents, etc.)</li>
            <li>3. Select that folder below</li>
          </ol>
        </div>

        <button
          onClick={handleSelectFolder}
          disabled={isSelecting}
          className="w-full py-4 bg-accent text-black text-xl font-bold border-2 border-ink shadow-hard-sm hover:shadow-hard hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
        >
          {isSelecting ? 'Selecting...' : 'Select Folder'}
        </button>

        {error && (
          <p className="mt-6 text-red-500 font-bold font-mono text-center bg-red-100/10 p-2 border-2 border-red-500">{error}</p>
        )}

        <p className="mt-8 text-xs text-gray-500 text-center font-mono uppercase tracking-widest">
          Your browser will ask for permission to read and write files in this folder.
          This is how we keep your data local.
        </p>
      </div>
    </div>
  );
}
