'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ResumeSelector from '@/components/ResumeSelector';
import StyleSelector from '@/components/StyleSelector';
import LoadingText from '@/components/LoadingText';
import { BaseResume, StyleOption } from '@/lib/types';

export default function NewApplication() {
  const router = useRouter();
  const [baseResumes, setBaseResumes] = useState<BaseResume[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [baseResume, setBaseResume] = useState('');
  const [style, setStyle] = useState<StyleOption>('ibm-plex-mono');

  useEffect(() => {
    fetchBaseResumes();
  }, []);

  async function fetchBaseResumes() {
    try {
      const res = await fetch('/api/applications');
      const data = await res.json();
      setBaseResumes(data.baseResumes || []);
      if (data.baseResumes?.length > 0) {
        // Default to corporate resume if available
        const corporate = data.baseResumes.find((r: BaseResume) => 
          r.filename.includes('corporate')
        );
        setBaseResume(corporate?.filename || data.baseResumes[0].filename);
      }
    } catch (error) {
      console.error('Error fetching base resumes:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent, generateResume: boolean) {
    e.preventDefault();
    
    if (!company || !role || !baseResume) {
      alert('Please fill in company, role, and select a base resume.');
      return;
    }

    if (generateResume && !jobDescription) {
      alert('Please provide a job description to generate a customized resume.');
      return;
    }

    setCreating(true);
    if (generateResume) setGenerating(true);

    try {
      // Create the application
      const createRes = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company,
          role,
          jobUrl,
          jobDescription,
          baseResume,
          style,
          status: 'draft',
        }),
      });

      if (!createRes.ok) {
        throw new Error('Failed to create application');
      }

      const application = await createRes.json();

      // Generate resume if requested
      if (generateResume) {
        const genRes = await fetch('/api/generate-resume', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            applicationId: application.id,
            baseResumeFile: baseResume,
            jobDescription,
            company,
            role,
          }),
        });

        if (!genRes.ok) {
          console.error('Failed to generate resume, but application was created');
        }
      }

      router.push(`/application/${application.id}`);
    } catch (error) {
      console.error('Error creating application:', error);
      alert('Failed to create application. Please try again.');
    } finally {
      setCreating(false);
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <header className="bg-[#1a1a1a] border-b border-[#2a2a2a]">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-400 hover:text-gray-200">
              &larr; Back
            </Link>
            <h1 className="text-xl font-bold text-gray-100">New Application</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <form className="space-y-6">
          <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-100">Job Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Company *
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g., Stripe"
                  className="w-full px-3 py-2 border border-[#3a3a3a] bg-[#1a1a1a] text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Role *
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g., Chief of Staff"
                  className="w-full px-3 py-2 border border-[#3a3a3a] bg-[#1a1a1a] text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Job URL
              </label>
              <input
                type="url"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-[#3a3a3a] bg-[#1a1a1a] text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Job Description
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job description here..."
                rows={10}
                className="w-full px-3 py-2 border border-[#3a3a3a] bg-[#1a1a1a] text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
            </div>
          </div>

          <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-100">Resume Settings</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Base Resume *
                </label>
                <ResumeSelector
                  resumes={baseResumes}
                  value={baseResume}
                  onChange={setBaseResume}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  PDF Style
                </label>
                <StyleSelector
                  value={style}
                  onChange={setStyle}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              disabled={creating}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-500 disabled:opacity-50 font-medium"
            >
              {generating ? <LoadingText text="Creating" /> : 'Create & Draft Resume with AI'}
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, false)}
              disabled={creating}
              className="px-6 py-3 bg-gray-700 text-gray-200 rounded-md hover:bg-gray-600 disabled:opacity-50 font-medium"
            >
              {creating && !generating ? 'Creating...' : 'Create Without AI'}
            </button>
          </div>
          <p className="text-sm text-gray-400 text-center">
            AI drafts a customized resume you can edit. PDF export comes later.
          </p>
        </form>
      </main>
    </div>
  );
}
