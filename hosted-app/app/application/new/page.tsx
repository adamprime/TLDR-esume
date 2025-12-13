'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { writeFile, createDirectory } from '@/lib/browser-fs';
import { getSavedFolderHandle } from '@/lib/folder-handle';

export default function NewApplicationPage() {
  const router = useRouter();
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [url, setUrl] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [handle, setHandle] = useState<FileSystemDirectoryHandle | null>(null);

  useEffect(() => {
    async function init() {
      const h = await getSavedFolderHandle();
      if (!h) {
        router.push('/');
        return;
      }
      setHandle(h);
    }
    init();
  }, [router]);

  async function handleCreate() {
    if (!company.trim() || !role.trim() || !jobDescription.trim()) {
      setError('Please fill in company, role, and job description');
      return;
    }

    if (!handle) return;

    setError(null);
    setIsCreating(true);

    try {
      // Create folder name
      const folderName = `${company.trim()} - ${role.trim()}`;
      const folderPath = `versions/${folderName}`;

      // Create application folder
      await createDirectory(handle, folderPath);

      // Create application.json
      const applicationData = {
        company: company.trim(),
        role: role.trim(),
        url: url.trim(),
        jobDescription: jobDescription.trim(),
        status: 'draft',
        createdAt: new Date().toISOString(),
      };
      await writeFile(handle, `${folderPath}/application.json`, JSON.stringify(applicationData, null, 2));

      // Navigate to assessment
      router.push(`/application?id=${encodeURIComponent(folderName)}&view=assessment`);
    } catch (err) {
      setError('Failed to create application. Please try again.');
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-gray-400 hover:text-white"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold">New Application</h1>
        </div>

        <div className="space-y-6">
          {/* Company */}
          <div>
            <label className="block text-sm font-medium mb-2">Company *</label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g., Google"
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg focus:outline-none focus:border-blue-600"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium mb-2">Role *</label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g., Senior Software Engineer"
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg focus:outline-none focus:border-blue-600"
            />
          </div>

          {/* URL */}
          <div>
            <label className="block text-sm font-medium mb-2">Job URL (optional)</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg focus:outline-none focus:border-blue-600"
            />
          </div>

          {/* Job Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Job Description *</label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job description here..."
              rows={12}
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg focus:outline-none focus:border-blue-600 resize-none"
            />
            <p className="text-gray-500 text-sm mt-1">
              Paste everything - requirements, responsibilities, qualifications, etc.
            </p>
          </div>

          {error && (
            <p className="text-red-400 text-center">{error}</p>
          )}

          <button
            onClick={handleCreate}
            disabled={isCreating || !company.trim() || !role.trim() || !jobDescription.trim()}
            className="w-full py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? 'Creating...' : 'Continue to Fit Assessment'}
          </button>
        </div>
      </div>
    </div>
  );
}
