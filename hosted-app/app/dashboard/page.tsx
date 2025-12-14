'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { readFile, writeFile, listDirectory, fileExists } from '@/lib/browser-fs';
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
          const folderPath = `versions/${entry.name}`;
          let appData;
          
          try {
            const appJson = await readFile(h, `${folderPath}/application.json`);
            appData = JSON.parse(appJson);
          } catch (readErr) {
            // No application.json - create one from folder name (legacy support)
            const parts = entry.name.split(' - ');
            const company = parts[0] || entry.name;
            const role = parts.slice(1).join(' - ') || 'Unknown Role';
            
            appData = {
              company,
              role,
              url: '',
              jobDescription: '',
              status: 'draft',
              createdAt: new Date().toISOString(),
            };
            
            try {
              await writeFile(h, `${folderPath}/application.json`, JSON.stringify(appData, null, 2));
            } catch (writeErr) {
              console.error('Failed to create application.json:', writeErr);
            }
          }
          
          apps.push({
            id: entry.name,
            company: appData.company || entry.name.split(' - ')[0],
            role: appData.role || entry.name.split(' - ')[1] || 'Unknown Role',
            status: appData.status || 'draft',
            createdAt: appData.createdAt || new Date().toISOString(),
          });
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
    // Return classes for the border/text color of status
    switch (status.toLowerCase()) {
      case 'draft': return 'border-gray-500 text-gray-500';
      case 'applied': 
      case 'submitted': return 'border-blue-500 text-blue-500';
      case 'interviewing': return 'border-purple-500 text-purple-500';
      case 'offered': 
      case 'offer': return 'border-green-500 text-green-500';
      case 'rejected': return 'border-red-500 text-red-500';
      case 'closed': return 'border-gray-600 text-gray-600';
      default: return 'border-gray-500 text-gray-500';
    }
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-12 border-b-4 border-ink pb-4 bg-paper px-6 shadow-hard-sm">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-serif font-black italic tracking-tighter">TL;DResume</h1>
            <span className="text-xs border border-ink px-1 transform -rotate-2">DASHBOARD</span>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={() => router.push('/review')}
              className="text-gray-400 hover:text-accent font-bold hover:underline decoration-2 underline-offset-4 transition-colors"
            >
              Review Resume
            </button>
            <button
              onClick={() => router.push('/settings')}
              className="text-gray-400 hover:text-accent font-bold hover:underline decoration-2 underline-offset-4 transition-colors"
            >
              Settings
            </button>
            <button
              onClick={handleDisconnect}
              className="text-xs text-red-400 hover:text-red-300 border border-transparent hover:border-red-400 px-2 py-1 transition-all"
            >
              Disconnect
            </button>
          </div>
        </div>

        {/* New Application Button */}
        <button
          onClick={() => router.push('/application/new')}
          className="w-full py-4 bg-accent text-black text-xl font-bold border-2 border-ink shadow-hard-sm hover:shadow-hard hover:-translate-y-1 transition-all mb-12 flex items-center justify-center gap-2"
        >
          <span>+</span>
          <span className="font-serif">New Application</span>
        </button>

        {/* Applications List */}
        {isLoading ? (
          <div className="text-center py-12 text-gray-400 font-mono animate-pulse">Scanning local files...</div>
        ) : applications.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-700 rounded-lg">
            <p className="text-gray-400 mb-2 font-serif text-xl">No active investigations.</p>
            <p className="text-gray-500 text-sm">
              Click &quot;New Application&quot; to start tailoring your resume for a job
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {applications.map((app) => (
              <button
                key={app.id}
                onClick={() => router.push(`/application?id=${encodeURIComponent(app.id)}`)}
                className="w-full p-6 bg-paper border-2 border-ink shadow-hard-sm hover:shadow-hard hover:-translate-y-1 transition-all text-left group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-serif font-bold text-xl group-hover:text-accent transition-colors mb-1">{app.company}</div>
                    <div className="text-gray-400 font-mono text-sm">{app.role}</div>
                  </div>
                  <span className={`px-3 py-1 border-2 text-xs font-bold uppercase tracking-wider ${getStatusColor(app.status)}`}>
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
