'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { readFile, writeFile, fileExists, createDirectory } from '@/lib/browser-fs';
import { getSavedFolderHandle } from '@/lib/folder-handle';
import { callAI } from '@/lib/browser-ai';
import { FIT_ASSESSMENT_PROMPT, RESUME_PROMPT, getCoverLetterPrompt, TonePreference } from '@/lib/prompts';
import { exportToPDF, PdfStyle } from '@/lib/pdf-styles';
import MarkdownEditor from '@/components/MarkdownEditor';
import LoadingText from '@/components/LoadingText';

// Types
interface Application {
  company: string;
  role: string;
  url: string;
  jobDescription: string;
  status: string;
}

interface Assessment {
  overallAssessment: string;
  fitScore: number;
  recommendation: string;
  strengths: { area: string; evidence: string }[];
  gaps: { area: string; concern: string; question: string }[];
  dealbreakers: string[];
}

interface CoverLetterHooks {
  whatDrewYou: string;
  personalConnection: string;
  whyNow: string;
  uniqueValue: string;
}

// New Application View
function NewApplicationView() {
  const router = useRouter();
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [url, setUrl] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [handle, setHandle] = useState<FileSystemDirectoryHandle | null>(null);

  useEffect(() => {
    getSavedFolderHandle().then(h => { if (!h) router.push('/'); else setHandle(h); });
  }, [router]);

  async function handleCreate() {
    if (!company.trim() || !role.trim() || !jobDescription.trim()) { setError('Please fill in company, role, and job description'); return; }
    if (!handle) return;
    setError(null);
    setIsCreating(true);
    try {
      const folderName = `${company.trim()} - ${role.trim()}`;
      await createDirectory(handle, `versions/${folderName}`);
      await writeFile(handle, `versions/${folderName}/application.json`, JSON.stringify({
        company: company.trim(), role: role.trim(), url: url.trim(), jobDescription: jobDescription.trim(), status: 'draft', createdAt: new Date().toISOString(),
      }, null, 2));
      router.push(`/application?id=${encodeURIComponent(folderName)}&view=assessment`);
    } catch (err) { setError('Failed to create application'); console.error(err); }
    finally { setIsCreating(false); }
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.push('/dashboard')} className="text-gray-500 hover:text-accent font-bold transition-colors">← Back</button>
          <h1 className="text-3xl font-serif font-black">New Application</h1>
        </div>
        <div className="space-y-6 bg-paper border-2 border-ink p-8 shadow-hard">
          <div><label className="block text-sm font-bold mb-2 font-serif uppercase tracking-wider">Company *</label><input type="text" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g., Google" className="w-full px-4 py-3 bg-paper border-2 border-ink focus:outline-none focus:border-accent focus:shadow-hard-sm transition-all" /></div>
          <div><label className="block text-sm font-bold mb-2 font-serif uppercase tracking-wider">Role *</label><input type="text" value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g., Senior Software Engineer" className="w-full px-4 py-3 bg-paper border-2 border-ink focus:outline-none focus:border-accent focus:shadow-hard-sm transition-all" /></div>
          <div><label className="block text-sm font-bold mb-2 font-serif uppercase tracking-wider">Job URL (optional)</label><input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." className="w-full px-4 py-3 bg-paper border-2 border-ink focus:outline-none focus:border-accent focus:shadow-hard-sm transition-all" /></div>
          <div><label className="block text-sm font-bold mb-2 font-serif uppercase tracking-wider">Job Description *</label><textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder="Paste the full job description here..." rows={12} className="w-full px-4 py-3 bg-paper border-2 border-ink focus:outline-none focus:border-accent focus:shadow-hard-sm transition-all resize-none font-mono text-sm" /></div>
          {error && <p className="text-red-500 font-bold text-center border-2 border-red-500 p-2 bg-red-100/10">{error}</p>}
          <button onClick={handleCreate} disabled={isCreating || !company.trim() || !role.trim() || !jobDescription.trim()} className="w-full py-4 bg-accent text-black text-lg font-bold border-2 border-ink shadow-hard-sm hover:shadow-hard hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed">{isCreating ? 'Creating...' : 'Continue to Fit Assessment'}</button>
        </div>
      </div>
    </div>
  );
}

// Main Application View
function ApplicationView({ appId }: { appId: string }) {
  const router = useRouter();
  const [app, setApp] = useState<Application | null>(null);
  const [hasResume, setHasResume] = useState(false);
  const [hasCoverLetter, setHasCoverLetter] = useState(false);
  const [hasAssessment, setHasAssessment] = useState(false);
  const [handle, setHandle] = useState<FileSystemDirectoryHandle | null>(null);

  useEffect(() => {
    async function init() {
      const h = await getSavedFolderHandle();
      if (!h) { router.push('/'); return; }
      setHandle(h);
      try { setApp(JSON.parse(await readFile(h, `versions/${appId}/application.json`))); } catch { router.push('/dashboard'); return; }
      setHasResume(await fileExists(h, `versions/${appId}/resume.md`));
      setHasCoverLetter(await fileExists(h, `versions/${appId}/cover-letter.md`));
      setHasAssessment(await fileExists(h, `versions/${appId}/assessment.json`));
    }
    init();
  }, [appId, router]);

  async function updateStatus(newStatus: string) {
    if (!handle || !app) return;
    const updated = { ...app, status: newStatus };
    await writeFile(handle, `versions/${appId}/application.json`, JSON.stringify(updated, null, 2));
    setApp(updated);
  }

  if (!app) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400 font-mono animate-pulse">Loading case file...</p></div>;

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6"><button onClick={() => router.push('/dashboard')} className="text-gray-500 hover:text-accent font-bold transition-colors">← Back</button></div>
        <div className="mb-8 border-b-4 border-ink pb-6">
          <h1 className="text-4xl font-serif font-black italic">{app.company}</h1>
          <p className="text-gray-400 font-mono mt-2">{app.role}</p>
          {app.url && <a href={app.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline text-sm font-bold mt-2 inline-block">View job posting →</a>}
        </div>
        <div className="mb-8">
          <label className="block text-sm font-bold mb-2 font-serif uppercase tracking-wider">Status</label>
          <select value={app.status} onChange={(e) => updateStatus(e.target.value)} className="px-4 py-2 bg-paper border-2 border-ink rounded-none focus:outline-none focus:border-accent focus:shadow-hard-sm cursor-pointer w-full font-mono">
            {['draft', 'applied', 'submitted', 'interviewing', 'offered', 'offer', 'rejected', 'closed'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
        <div className="space-y-4">
          {[{ view: 'assessment', label: 'Fit Assessment', desc: hasAssessment ? 'View or re-run' : 'Evaluate your fit', done: hasAssessment },
            { view: 'resume', label: 'Resume', desc: hasResume ? 'Edit or export' : 'Generate tailored resume', done: hasResume },
            { view: 'cover-letter', label: 'Cover Letter', desc: hasCoverLetter ? 'Edit or export' : 'Generate cover letter', done: hasCoverLetter }].map(item => (
            <button key={item.view} onClick={() => router.push(`/application?id=${encodeURIComponent(appId)}&view=${item.view}`)} className="w-full p-6 bg-paper border-2 border-ink shadow-hard-sm hover:shadow-hard hover:-translate-y-1 transition-all text-left group">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-serif font-bold text-xl group-hover:text-accent transition-colors">{item.label}</div>
                  <div className="text-gray-500 text-sm font-mono mt-1">{item.desc}</div>
                </div>
                {item.done ? 
                  <span className="text-green-500 font-bold border-2 border-green-500 px-2 py-0.5 transform -rotate-12 text-xs uppercase">COMPLETE</span> : 
                  <span className="text-gray-400 font-bold text-xl group-hover:translate-x-1 transition-transform">→</span>
                }
              </div>
            </button>))}
        </div>
      </div>
    </div>
  );
}

// Assessment View
function AssessmentView({ appId }: { appId: string }) {
  const router = useRouter();
  const [isAssessing, setIsAssessing] = useState(false);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [gapAnswers, setGapAnswers] = useState<{ question: string; answer: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [handle, setHandle] = useState<FileSystemDirectoryHandle | null>(null);

  useEffect(() => {
    async function init() {
      const h = await getSavedFolderHandle();
      if (!h) { router.push('/'); return; }
      setHandle(h);
      if (await fileExists(h, `versions/${appId}/assessment.json`)) {
        const data = JSON.parse(await readFile(h, `versions/${appId}/assessment.json`));
        setAssessment(data.assessment);
        setGapAnswers(data.gapAnswers || []);
      }
    }
    init();
  }, [appId, router]);

  async function runAssessment() {
    if (!handle) return;
    setError(null); setIsAssessing(true);
    try {
      const [resume, appJson, configJson] = await Promise.all([readFile(handle, 'resume.md'), readFile(handle, `versions/${appId}/application.json`), readFile(handle, 'config.json')]);
      const app = JSON.parse(appJson), config = JSON.parse(configJson);
      const prompt = FIT_ASSESSMENT_PROMPT.replace('{resume}', resume).replace('{jobDescription}', app.jobDescription).replace('{company}', app.company).replace('{role}', app.role);
      const response = await callAI(config, prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Invalid response');
      const assessmentData = JSON.parse(jsonMatch[0]) as Assessment;
      setAssessment(assessmentData);
      const answers = assessmentData.gaps.map(g => ({ question: g.question, answer: '' }));
      setGapAnswers(answers);
      await writeFile(handle, `versions/${appId}/assessment.json`, JSON.stringify({ assessment: assessmentData, gapAnswers: answers }, null, 2));
    } catch (err) { setError('Failed to run assessment'); console.error(err); }
    finally { setIsAssessing(false); }
  }

  async function saveGapAnswers() { if (handle && assessment) await writeFile(handle, `versions/${appId}/assessment.json`, JSON.stringify({ assessment, gapAnswers }, null, 2)); }

  const getScoreColor = (s: number) => s >= 8 ? 'text-green-500' : s >= 6 ? 'text-blue-500' : s >= 4 ? 'text-yellow-500' : 'text-red-500';
  const badges: Record<string, { label: string; color: string }> = { strong_fit: { label: 'Strong Fit', color: 'bg-green-600' }, worth_applying: { label: 'Worth Applying', color: 'bg-blue-600' }, stretch: { label: 'Stretch', color: 'bg-yellow-600' }, long_shot: { label: 'Long Shot', color: 'bg-orange-600' }, not_recommended: { label: 'Not Recommended', color: 'bg-red-600' } };

  if (!assessment && !isAssessing) return (
    <div className="min-h-screen flex items-center justify-center p-6"><div className="max-w-lg w-full text-center border-2 border-ink p-8 bg-paper shadow-hard">
      <h1 className="text-3xl font-serif font-black mb-4">Fit Assessment</h1><p className="text-gray-400 mb-8 font-mono text-sm">Assess how well you match this role before investing time.</p>
      <button onClick={runAssessment} className="w-full py-4 bg-accent text-black text-lg font-bold border-2 border-ink shadow-hard-sm hover:shadow-hard hover:-translate-y-1 transition-all mb-4">Run Assessment</button>
      <button onClick={() => router.push(`/application?id=${encodeURIComponent(appId)}`)} className="w-full py-3 bg-paper text-ink border-2 border-ink font-bold hover:bg-gray-800">Cancel</button>
      {error && <p className="mt-4 text-red-500 font-bold bg-red-100/10 p-2 border-2 border-red-500">{error}</p>}
    </div></div>
  );

  if (isAssessing) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4"><LoadingText text="Analyzing Fit" /></h1>
        <p className="text-gray-400">Comparing your resume against the job requirements...</p>
      </div>
    </div>
  );

  const badge = badges[assessment!.recommendation] || { label: assessment!.recommendation, color: 'bg-gray-600' };
  return (
    <div className="min-h-screen p-6"><div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.push(`/application?id=${encodeURIComponent(appId)}`)} className="text-gray-500 hover:text-accent font-bold transition-colors">← Back</button>
        <button onClick={runAssessment} disabled={isAssessing} className="px-4 py-2 bg-paper border-2 border-ink hover:bg-accent hover:text-black font-bold shadow-hard-sm hover:shadow-hard transition-all disabled:opacity-50">Re-run Assessment</button>
      </div>
      <div className="bg-paper border-2 border-ink shadow-hard p-8 mb-8 text-center relative overflow-hidden">
        <div className={`text-6xl font-black font-serif ${getScoreColor(assessment!.fitScore)}`}>{assessment!.fitScore}/10</div>
        <span className={`inline-block mt-4 px-4 py-1 border-2 border-ink text-sm font-bold uppercase tracking-widest bg-ink text-black transform -rotate-2 shadow-sm`}>{badge.label}</span>
        <p className="text-gray-300 mt-6 font-mono text-sm leading-relaxed border-t-2 border-dashed border-gray-700 pt-4">{assessment!.overallAssessment}</p>
      </div>
      {assessment!.dealbreakers.length > 0 && <div className="bg-red-900/10 border-2 border-red-500 p-6 mb-6 shadow-hard-sm"><h2 className="font-serif font-bold text-red-500 text-xl mb-4 border-b-2 border-red-500 pb-2 inline-block">DEALBREAKERS</h2><ul className="space-y-2">{assessment!.dealbreakers.map((db, i) => <li key={i} className="flex items-start gap-2 font-mono text-sm"><span className="text-red-500 font-bold">✗</span><span className="text-gray-300">{db}</span></li>)}</ul></div>}
      <div className="bg-paper border-2 border-ink p-6 mb-6 shadow-hard-sm"><h2 className="font-serif font-bold text-green-500 text-xl mb-4 border-b-2 border-green-500 pb-2 inline-block">STRENGTHS</h2><ul className="space-y-4">{assessment!.strengths.map((s, i) => <li key={i}><div className="flex items-start gap-2"><span className="text-green-500 font-bold">✓</span><span className="font-bold text-gray-200">{s.area}</span></div><p className="ml-5 text-sm text-gray-400 font-mono mt-1">{s.evidence}</p></li>)}</ul></div>
      {assessment!.gaps.length > 0 && <div className="bg-paper border-2 border-ink p-6 mb-6 shadow-hard-sm"><h2 className="font-serif font-bold text-yellow-500 text-xl mb-4 border-b-2 border-yellow-500 pb-2 inline-block">GAPS TO ADDRESS</h2><p className="text-gray-400 text-sm mb-6 font-mono">Answer these questions to provide context for resume generation.</p><div className="space-y-8">{assessment!.gaps.map((gap, i) => (
        <div key={i} className="border-t-2 border-dashed border-gray-800 pt-6 first:border-0 first:pt-0"><div className="flex items-start gap-2 mb-2"><span className="text-yellow-500 font-bold">!</span><span className="font-bold text-gray-200">{gap.area}</span></div><p className="ml-5 text-sm text-gray-400 mb-3 font-mono">{gap.concern}</p>
        <label className="block ml-5"><span className="text-xs font-bold text-accent uppercase tracking-wider block mb-2">{gap.question}</span><textarea value={gapAnswers[i]?.answer || ''} onChange={(e) => { const u = [...gapAnswers]; u[i] = { ...u[i], answer: e.target.value }; setGapAnswers(u); }} onBlur={saveGapAnswers} placeholder="Your answer..." rows={3} className="w-full px-4 py-3 bg-paper border-2 border-ink focus:outline-none focus:border-accent focus:shadow-hard-sm transition-all text-sm resize-none font-mono" /></label></div>))}</div></div>}
      <button onClick={() => router.push(`/application?id=${encodeURIComponent(appId)}`)} className="w-full py-4 bg-accent text-black text-lg font-bold border-2 border-ink shadow-hard-sm hover:shadow-hard hover:-translate-y-1 transition-all">Continue to Application</button>
    </div></div>
  );
}

// Resume View - Uses MarkdownEditor
function ResumeView({ appId }: { appId: string }) {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [handle, setHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [appInfo, setAppInfo] = useState<{ company: string; role: string } | null>(null);

  useEffect(() => {
    async function init() {
      const h = await getSavedFolderHandle();
      if (!h) { router.push('/'); return; }
      setHandle(h);
      
      // Load app info
      try {
        const appJson = await readFile(h, `versions/${appId}/application.json`);
        const app = JSON.parse(appJson);
        setAppInfo({ company: app.company, role: app.role });
      } catch {}
      
      // Load existing resume
      if (await fileExists(h, `versions/${appId}/resume.md`)) {
        const existing = await readFile(h, `versions/${appId}/resume.md`);
        setContent(existing);
        setOriginalContent(existing);
      }
    }
    init();
  }, [appId, router]);

  async function generateResume() {
    if (!handle) return;
    setError(null);
    setIsGenerating(true);
    try {
      const [baseResume, appJson, configJson] = await Promise.all([
        readFile(handle, 'resume.md'),
        readFile(handle, `versions/${appId}/application.json`),
        readFile(handle, 'config.json'),
      ]);
      const app = JSON.parse(appJson);
      const config = JSON.parse(configJson);
      
      // Build gap context
      let gapContext = '';
      try {
        const assessmentJson = await readFile(handle, `versions/${appId}/assessment.json`);
        const { gapAnswers } = JSON.parse(assessmentJson);
        const answered = gapAnswers?.filter((g: { answer: string }) => g.answer.trim()) || [];
        if (answered.length) {
          gapContext = '\n--- Additional Context from Candidate ---\n';
          answered.forEach((g: { question: string; answer: string }) => {
            gapContext += `Q: ${g.question}\nA: ${g.answer}\n\n`;
          });
        }
      } catch {}
      
      const prompt = RESUME_PROMPT
        .replace('{baseResume}', baseResume)
        .replace('{jobDescription}', app.jobDescription)
        .replace('{company}', app.company)
        .replace('{role}', app.role)
        .replace('{gapContext}', gapContext);

      const generated = await callAI(config, prompt);
      setContent(generated);
      setOriginalContent(generated);
      await writeFile(handle, `versions/${appId}/resume.md`, generated);
    } catch (err) {
      setError('Failed to generate resume. Please try again.');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  }

  async function saveResume() {
    if (!handle || !content.trim()) return;
    setIsSaving(true);
    try {
      await writeFile(handle, `versions/${appId}/resume.md`, content);
      setOriginalContent(content);
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setIsSaving(false);
    }
  }

  async function exportPDF() {
    if (!content.trim() || !handle) return;
    setIsExporting(true);
    try {
      const configJson = await readFile(handle, 'config.json');
      const config = JSON.parse(configJson);
      const style: PdfStyle = config.defaultPdfStyle || 'modern';
      exportToPDF(content, style, `Resume - ${appInfo?.company || ''}`);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      // Fallback to modern style
      exportToPDF(content, 'modern', `Resume - ${appInfo?.company || ''}`);
    } finally {
      setIsExporting(false);
    }
  }

  const hasUnsavedChanges = content !== originalContent;

  return (
    <div className="h-screen flex flex-col bg-[#0f0f0f]">
      <header className="bg-paper border-b-4 border-ink flex-shrink-0 z-10 shadow-hard-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button onClick={() => router.push(`/application?id=${encodeURIComponent(appId)}`)} className="text-gray-500 hover:text-accent font-bold transition-colors">← Back</button>
            <div>
              <h1 className="font-serif font-black text-xl text-ink">RESUME: <span className="text-accent">{appInfo?.company}</span></h1>
              <p className="text-xs text-gray-400 font-mono mt-1 uppercase tracking-wider">{appInfo?.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {hasUnsavedChanges && <span className="text-xs font-bold text-yellow-500 uppercase tracking-wider border border-yellow-500 px-2 py-1 bg-yellow-900/20">Unsaved changes</span>}
            {!content && (
              <button onClick={generateResume} disabled={isGenerating} className="px-4 py-2 text-sm bg-accent text-black font-bold border-2 border-transparent hover:border-ink shadow-sm transition-all disabled:opacity-50">
                {isGenerating ? <LoadingText text="Generating" /> : 'Generate with AI'}
              </button>
            )}
          </div>
        </div>
      </header>
      {error && <div className="p-3 bg-red-900/20 border-b-2 border-red-500 text-red-500 font-bold text-center text-sm">{error}</div>}
      <main className="flex-1 overflow-hidden relative">
        {content ? (
          <MarkdownEditor
            value={content}
            onChange={setContent}
            onSave={saveResume}
            onExportPDF={exportPDF}
            onRegenerate={generateResume}
            saving={isSaving}
            exporting={isExporting}
            regenerating={isGenerating}
          />
        ) : (
          <div className="h-full flex items-center justify-center bg-paper">
            <div className="text-center p-8 border-2 border-dashed border-gray-700 rounded-lg max-w-md">
              <p className="text-gray-400 mb-6 font-mono">No resume yet for this application.</p>
              <button onClick={generateResume} disabled={isGenerating} className="px-8 py-3 bg-accent text-black font-bold border-2 border-ink shadow-hard-sm hover:shadow-hard hover:-translate-y-1 transition-all disabled:opacity-50">
                {isGenerating ? <LoadingText text="Generating" /> : 'Generate Resume with AI'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Cover Letter View - Uses MarkdownEditor
function CoverLetterView({ appId }: { appId: string }) {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [hooks, setHooks] = useState<CoverLetterHooks>({ whatDrewYou: '', personalConnection: '', whyNow: '', uniqueValue: '' });
  const [showHooks, setShowHooks] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [handle, setHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [appInfo, setAppInfo] = useState<{ company: string; role: string } | null>(null);

  useEffect(() => {
    async function init() {
      const h = await getSavedFolderHandle();
      if (!h) { router.push('/'); return; }
      setHandle(h);
      
      // Load app info
      try {
        const appJson = await readFile(h, `versions/${appId}/application.json`);
        const app = JSON.parse(appJson);
        setAppInfo({ company: app.company, role: app.role });
      } catch {}
      
      // Load existing cover letter
      if (await fileExists(h, `versions/${appId}/cover-letter.md`)) {
        const existing = await readFile(h, `versions/${appId}/cover-letter.md`);
        setContent(existing);
        setOriginalContent(existing);
        setShowHooks(false);
      }
      
      // Load hooks
      if (await fileExists(h, `versions/${appId}/cover-letter-hooks.json`)) {
        try {
          const hooksJson = await readFile(h, `versions/${appId}/cover-letter-hooks.json`);
          setHooks(JSON.parse(hooksJson));
        } catch {}
      }
    }
    init();
  }, [appId, router]);

  async function saveHooks() {
    if (!handle) return;
    try {
      await writeFile(handle, `versions/${appId}/cover-letter-hooks.json`, JSON.stringify(hooks, null, 2));
    } catch (err) {
      console.error('Failed to save hooks:', err);
    }
  }

  async function generateCoverLetter() {
    if (!handle) return;
    setError(null);
    setIsGenerating(true);
    try {
      await saveHooks();
      const [resume, appJson, configJson] = await Promise.all([
        readFile(handle, 'resume.md'),
        readFile(handle, `versions/${appId}/application.json`),
        readFile(handle, 'config.json'),
      ]);
      const app = JSON.parse(appJson);
      const config = JSON.parse(configJson);
      
      // Build hook context
      let hookContext = '';
      if (hooks.whatDrewYou || hooks.personalConnection || hooks.whyNow || hooks.uniqueValue) {
        hookContext = '\n--- Personal Context from Candidate (USE THIS!) ---\n';
        if (hooks.whatDrewYou) hookContext += `What drew me to this company: ${hooks.whatDrewYou}\n\n`;
        if (hooks.personalConnection) hookContext += `Personal connection to their mission: ${hooks.personalConnection}\n\n`;
        if (hooks.whyNow) hookContext += `Why this role now: ${hooks.whyNow}\n\n`;
        if (hooks.uniqueValue) hookContext += `What I uniquely bring: ${hooks.uniqueValue}\n\n`;
      }
      
      // Build gap context
      let gapContext = '';
      try {
        const assessmentJson = await readFile(handle, `versions/${appId}/assessment.json`);
        const { gapAnswers } = JSON.parse(assessmentJson);
        const answered = gapAnswers?.filter((g: { answer: string }) => g.answer.trim()) || [];
        if (answered.length) {
          gapContext = '\n--- Additional Context from Candidate ---\n';
          answered.forEach((g: { question: string; answer: string }) => {
            gapContext += `Q: ${g.question}\nA: ${g.answer}\n\n`;
          });
        }
      } catch {}

      const tone: TonePreference = config.tonePreference || 'balanced';
      const prompt = getCoverLetterPrompt(tone)
        .replace('{resume}', resume)
        .replace('{jobDescription}', app.jobDescription)
        .replace('{company}', app.company)
        .replace('{role}', app.role)
        .replace('{jobUrl}', app.url || 'Not provided')
        .replace('{gapContext}', gapContext)
        .replace('{hookContext}', hookContext);

      const generated = await callAI(config, prompt);
      setContent(generated);
      setOriginalContent(generated);
      setShowHooks(false);
      await writeFile(handle, `versions/${appId}/cover-letter.md`, generated);
    } catch (err) {
      setError('Failed to generate cover letter. Please try again.');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  }

  async function saveCoverLetter() {
    if (!handle || !content.trim()) return;
    setIsSaving(true);
    try {
      await writeFile(handle, `versions/${appId}/cover-letter.md`, content);
      setOriginalContent(content);
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setIsSaving(false);
    }
  }

  async function exportPDF() {
    if (!content.trim() || !handle) return;
    setIsExporting(true);
    try {
      const configJson = await readFile(handle, 'config.json');
      const config = JSON.parse(configJson);
      const style: PdfStyle = config.defaultPdfStyle || 'modern';
      exportToPDF(content, style, `Cover Letter - ${appInfo?.company || ''}`);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      exportToPDF(content, 'modern', `Cover Letter - ${appInfo?.company || ''}`);
    } finally {
      setIsExporting(false);
    }
  }

  const hasUnsavedChanges = content !== originalContent;
  const hookFields = [
    { key: 'whatDrewYou' as const, label: 'What drew you to this company?', placeholder: 'A specific product, article, person, news...' },
    { key: 'personalConnection' as const, label: 'Personal connection to their mission?', placeholder: 'How their work relates to your life or values' },
    { key: 'whyNow' as const, label: 'Why this role, why now?', placeholder: 'Career transition, passion project, timing...' },
    { key: 'uniqueValue' as const, label: 'What do you uniquely bring?', placeholder: 'Unusual combination of skills, perspective...' },
  ];

  return (
    <div className="h-screen flex flex-col bg-[#0f0f0f]">
      <header className="bg-paper border-b-4 border-ink flex-shrink-0 z-10 shadow-hard-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button onClick={() => router.push(`/application?id=${encodeURIComponent(appId)}`)} className="text-gray-500 hover:text-accent font-bold transition-colors">← Back</button>
            <div>
              <h1 className="font-serif font-black text-xl text-ink">COVER LETTER: <span className="text-accent">{appInfo?.company}</span></h1>
              <p className="text-xs text-gray-400 font-mono mt-1 uppercase tracking-wider">{appInfo?.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {hasUnsavedChanges && <span className="text-xs font-bold text-yellow-500 uppercase tracking-wider border border-yellow-500 px-2 py-1 bg-yellow-900/20">Unsaved changes</span>}
            {content && (
              <button onClick={() => setShowHooks(!showHooks)} className="px-3 py-1.5 text-sm bg-paper text-ink border-2 border-ink hover:bg-accent hover:text-black font-bold transition-all">
                {showHooks ? 'Hide' : 'Show'} Hooks
              </button>
            )}
            {!content && (
              <button onClick={generateCoverLetter} disabled={isGenerating} className="px-4 py-2 text-sm bg-accent text-black font-bold border-2 border-transparent hover:border-ink shadow-sm transition-all disabled:opacity-50">
                {isGenerating ? <LoadingText text="Generating" /> : 'Generate with AI'}
              </button>
            )}
          </div>
        </div>
      </header>
      {error && <div className="p-3 bg-red-900/20 border-b-2 border-red-500 text-red-500 font-bold text-center text-sm">{error}</div>}
      
      <div className="flex-1 flex overflow-hidden">
        {/* Hooks Panel */}
        {showHooks && (
          <div className="w-80 border-r-2 border-ink bg-paper p-6 overflow-y-auto flex-shrink-0 shadow-hard-sm z-0">
            <h2 className="font-serif font-bold text-lg mb-2 text-accent">Cover Letter Hooks</h2>
            <p className="text-gray-400 text-xs mb-6 font-mono">These personal details make your cover letter stand out. The AI will weave them in naturally.</p>
            <div className="space-y-6">
              {hookFields.map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-bold mb-2 uppercase tracking-wider text-ink">{f.label}</label>
                  <textarea
                    value={hooks[f.key]}
                    onChange={(e) => setHooks({ ...hooks, [f.key]: e.target.value })}
                    onBlur={saveHooks}
                    placeholder={f.placeholder}
                    rows={3}
                    className="w-full px-3 py-2 bg-paper border-2 border-gray-700 focus:border-accent focus:outline-none focus:shadow-hard-sm transition-all text-sm resize-none font-mono"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Editor */}
        <main className="flex-1 overflow-hidden relative">
          {content ? (
            <MarkdownEditor
              value={content}
              onChange={setContent}
              onSave={saveCoverLetter}
              onExportPDF={exportPDF}
              onRegenerate={generateCoverLetter}
              saving={isSaving}
              exporting={isExporting}
              regenerating={isGenerating}
            />
          ) : (
            <div className="h-full flex items-center justify-center bg-paper">
              <div className="text-center p-8 border-2 border-dashed border-gray-700 rounded-lg max-w-md">
                <p className="text-gray-400 mb-2 font-mono">No cover letter yet for this application.</p>
                <p className="text-gray-500 text-sm mb-6">Fill in the hooks on the left for a more personalized letter.</p>
                <button onClick={generateCoverLetter} disabled={isGenerating} className="px-8 py-3 bg-accent text-black font-bold border-2 border-ink shadow-hard-sm hover:shadow-hard hover:-translate-y-1 transition-all disabled:opacity-50">
                  {isGenerating ? <LoadingText text="Generating" /> : 'Generate Cover Letter with AI'}
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
// Router Component
function ApplicationRouter() {
  const searchParams = useSearchParams();
  const appId = searchParams.get('id');
  const view = searchParams.get('view');

  if (!appId) return <NewApplicationView />;
  if (view === 'assessment') return <AssessmentView appId={appId} />;
  if (view === 'resume') return <ResumeView appId={appId} />;
  if (view === 'cover-letter') return <CoverLetterView appId={appId} />;
  return <ApplicationView appId={appId} />;
}

export default function ApplicationPage() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Loading...</p></div>}><ApplicationRouter /></Suspense>;
}
