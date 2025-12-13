'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isFileSystemAccessSupported } from '@/lib/browser-fs';
import { hasSavedFolderHandle, reconnectToSavedFolder } from '@/lib/folder-handle';

type AppState = 'loading' | 'unsupported' | 'onboarding' | 'reconnecting' | 'ready';

export default function Home() {
  const router = useRouter();
  const [state, setState] = useState<AppState>('loading');

  useEffect(() => {
    async function init() {
      // Check browser support
      if (!isFileSystemAccessSupported()) {
        setState('unsupported');
        return;
      }

      // Check for saved folder
      const hasSaved = await hasSavedFolderHandle();
      if (!hasSaved) {
        setState('onboarding');
        return;
      }

      // Try to reconnect
      setState('reconnecting');
      const handle = await reconnectToSavedFolder();
      
      if (handle) {
        setState('ready');
        router.push('/dashboard');
      } else {
        setState('onboarding');
      }
    }

    init();
  }, [router]);

  if (state === 'loading' || state === 'reconnecting') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">TLDR;esume</h1>
          <p className="text-gray-400">
            {state === 'loading' ? 'Loading...' : 'Reconnecting to your folder...'}
          </p>
        </div>
      </div>
    );
  }

  if (state === 'unsupported') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-400">Browser Not Supported</h1>
          <p className="text-gray-400 mb-6">
            TLDR;esume requires a Chromium-based browser to access local files.
            Please use Brave, Chrome, or Edge.
          </p>
          <a
            href="https://brave.com/download"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
          >
            Download Brave (Recommended)
          </a>
        </div>
      </div>
    );
  }

  // Onboarding state - redirect to onboarding flow
  if (state === 'onboarding') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-bold mb-4">Welcome to TLDR;esume</h1>
          <p className="text-gray-400 mb-8">
            AI-powered resume tailoring that keeps your data on your computer.
            Let&apos;s get you set up in a few quick steps.
          </p>
          <button
            onClick={() => router.push('/onboarding/folder')}
            className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-500 transition-colors"
          >
            Get Started
          </button>
          <p className="mt-4 text-sm text-gray-500">
            Takes about 5 minutes
          </p>
        </div>
      </div>
    );
  }

  return null;
}
