'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { readFile, listDirectory, fileExists } from '@/lib/browser-fs';
import { getSavedFolderHandle, clearSavedFolderHandle } from '@/lib/folder-handle';

interface Application {
  id: string;
  company: string;
  role: string;
  status: string;
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [handle, setHandle] = useState<FileSystemDirectoryHandle | null>(null);

  useEffect(() => {
    async function init() {
      const h = await getSavedFolderHandle();
      if (!h) {
        router.push('/');
        return;
      }
      setHandle(h);

      // Check onboarding complete
      try {
        const configContent = await readFile(h, 'config.json');
        const config = JSON.parse(configContent);
        if (!config.onboardingComplete) {
          router.push('/onboarding/folder');
          return;
        }
      } catch {
        router.push('/onboarding/folder');
        return;
      }

      // Load applications
      await loadApplications(h);
    }
    init();
  }, [router]);

  async function loadApplications(h: FileSystemDirectoryHandle) {
    setIsLoading(true);
    try {
      const versionsExists = await fileExists(h, 'versions');
      if (!versionsExists) {
        setApplications([]);
        setIsLoading(false);
        return;
      }

      const entries = await listDirectory(h, 'versions');
      const apps: Application[] = [];

      for (const entry of entries) {
        if (entry.kind === 'directory') {
          try {
            const appJson = await readFile(h, `versions/${entry.name}/application.json`);
            const appData = JSON.parse(appJson);
            apps.push({
              id: entry.name,
              company: appData.company || entry.name.split(' - ')[0],
              role: appData.role || entry.name.split(' - ')[1] || 'Unknown Role',
              status: appData.status || 'draft',
              createdAt: appData.createdAt || new Date().toISOString(),
            });
          } catch {
            // Skip folders without application.json
          }
        }
      }

      // Sort by creation date, newest first
      apps.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setApplications(apps);
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDisconnect() {
    await clearSavedFolderHandle();
    router.push('/');
  }

  function getStatusColor(status: string) {
    switch (status.toLowerCase()) {
      case 'draft': return 'bg-gray-600';
      case 'applied': return 'bg-blue-600';
      case 'interviewing': return 'bg-purple-600';
      case 'offered': return 'bg-green-600';
      case 'rejected': return 'bg-red-600';
      case 'closed': return 'bg-gray-500';
      default: return 'bg-gray-600';
    }
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">TLDR;esume</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/review')}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Review Resume
            </button>
            <button
              onClick={() => router.push('/settings')}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Settings
            </button>
            <button
              onClick={handleDisconnect}
              className="px-4 py-2 text-gray-500 hover:text-gray-300 text-sm"
            >
              Disconnect Folder
            </button>
          </div>
        </div>

        {/* New Application Button */}
        <button
          onClick={() => router.push('/application/new')}
          className="w-full py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-500 transition-colors mb-8"
        >
          + New Application
        </button>

        {/* Applications List */}
        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Loading applications...</div>
        ) : applications.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-2">No applications yet</p>
            <p className="text-gray-500 text-sm">
              Click &quot;New Application&quot; to start tailoring your resume for a job
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {applications.map((app) => (
              <button
                key={app.id}
                onClick={() => router.push(`/application?id=${encodeURIComponent(app.id)}`)}
                className="w-full p-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg hover:border-blue-600 transition-colors text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{app.company}</div>
                    <div className="text-gray-400 text-sm">{app.role}</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                    {app.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
