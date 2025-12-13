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
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">1</div>
          <div className="w-12 h-0.5 bg-gray-700" />
          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm">2</div>
          <div className="w-12 h-0.5 bg-gray-700" />
          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm">3</div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-4">Choose Your Data Folder</h1>
          <p className="text-gray-400">
            Select a folder on your computer where TLDR;esume will store your resumes,
            applications, and settings. All your data stays here - we never see it.
          </p>
        </div>

        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 mb-6">
          <h2 className="font-semibold mb-3">Recommended approach:</h2>
          <ol className="text-gray-400 text-sm space-y-2">
            <li>1. Create a new folder called <code className="bg-[#2a2a2a] px-1 rounded">TLDResume</code></li>
            <li>2. Put it somewhere easy to find (Desktop, Documents, etc.)</li>
            <li>3. Select that folder below</li>
          </ol>
        </div>

        <button
          onClick={handleSelectFolder}
          disabled={isSelecting}
          className="w-full py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSelecting ? 'Selecting...' : 'Select Folder'}
        </button>

        {error && (
          <p className="mt-4 text-red-400 text-center">{error}</p>
        )}

        <p className="mt-6 text-sm text-gray-500 text-center">
          Your browser will ask for permission to read and write files in this folder.
          This is how we keep your data local.
        </p>
      </div>
    </div>
  );
}
