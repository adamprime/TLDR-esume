'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { readFile, writeFile, fileExists, createDirectory } from '@/lib/browser-fs';
import { getSavedFolderHandle } from '@/lib/folder-handle';
import { callAI } from '@/lib/browser-ai';
import { FIT_ASSESSMENT_PROMPT, RESUME_PROMPT, COVER_LETTER_PROMPT } from '@/lib/prompts';

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
          <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-white">← Back</button>
          <h1 className="text-2xl font-bold">New Application</h1>
        </div>
        <div className="space-y-6">
          <div><label className="block text-sm font-medium mb-2">Company *</label><input type="text" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g., Google" className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg focus:outline-none focus:border-blue-600" /></div>
          <div><label className="block text-sm font-medium mb-2">Role *</label><input type="text" value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g., Senior Software Engineer" className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg focus:outline-none focus:border-blue-600" /></div>
          <div><label className="block text-sm font-medium mb-2">Job URL (optional)</label><input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg focus:outline-none focus:border-blue-600" /></div>
          <div><label className="block text-sm font-medium mb-2">Job Description *</label><textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder="Paste the full job description here..." rows={12} className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg focus:outline-none focus:border-blue-600 resize-none" /></div>
          {error && <p className="text-red-400 text-center">{error}</p>}
          <button onClick={handleCreate} disabled={isCreating || !company.trim() || !role.trim() || !jobDescription.trim()} className="w-full py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50">{isCreating ? 'Creating...' : 'Continue to Fit Assessment'}</button>
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

  if (!app) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Loading...</p></div>;

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6"><button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-white">← Back</button></div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold">{app.company}</h1>
          <p className="text-gray-400">{app.role}</p>
          {app.url && <a href={app.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm">View job posting →</a>}
        </div>
        <div className="mb-8">
          <label className="block text-sm font-medium mb-2">Status</label>
          <select value={app.status} onChange={(e) => updateStatus(e.target.value)} className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg focus:outline-none focus:border-blue-600">
            {['draft', 'applied', 'interviewing', 'offered', 'rejected', 'closed'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
        <div className="space-y-4">
          {[{ view: 'assessment', label: 'Fit Assessment', desc: hasAssessment ? 'View or re-run' : 'Evaluate your fit', done: hasAssessment },
            { view: 'resume', label: 'Resume', desc: hasResume ? 'Edit or export' : 'Generate tailored resume', done: hasResume },
            { view: 'cover-letter', label: 'Cover Letter', desc: hasCoverLetter ? 'Edit or export' : 'Generate cover letter', done: hasCoverLetter }].map(item => (
            <button key={item.view} onClick={() => router.push(`/application?id=${encodeURIComponent(appId)}&view=${item.view}`)} className="w-full p-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg hover:border-blue-600 transition-colors text-left">
              <div className="flex items-center justify-between"><div><div className="font-semibold">{item.label}</div><div className="text-gray-400 text-sm">{item.desc}</div></div>{item.done ? <span className="text-green-400">✓</span> : <span className="text-gray-500">→</span>}</div>
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

  const getScoreColor = (s: number) => s >= 8 ? 'text-green-400' : s >= 6 ? 'text-blue-400' : s >= 4 ? 'text-yellow-400' : 'text-red-400';
  const badges: Record<string, { label: string; color: string }> = { strong_fit: { label: 'Strong Fit', color: 'bg-green-600' }, worth_applying: { label: 'Worth Applying', color: 'bg-blue-600' }, stretch: { label: 'Stretch', color: 'bg-yellow-600' }, long_shot: { label: 'Long Shot', color: 'bg-orange-600' }, not_recommended: { label: 'Not Recommended', color: 'bg-red-600' } };

  if (!assessment && !isAssessing) return (
    <div className="min-h-screen flex items-center justify-center p-6"><div className="max-w-lg w-full text-center">
      <h1 className="text-2xl font-bold mb-4">Fit Assessment</h1><p className="text-gray-400 mb-8">Assess how well you match this role.</p>
      <button onClick={runAssessment} className="w-full py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-500 mb-4">Run Assessment</button>
      <button onClick={() => router.push(`/application?id=${encodeURIComponent(appId)}`)} className="w-full py-3 bg-[#2a2a2a] text-white rounded-lg hover:bg-[#3a3a3a]">Cancel</button>
      {error && <p className="mt-4 text-red-400">{error}</p>}
    </div></div>
  );
  if (isAssessing) return <div className="min-h-screen flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold mb-4">Analyzing Fit...</h1></div></div>;

  const badge = badges[assessment!.recommendation] || { label: assessment!.recommendation, color: 'bg-gray-600' };
  return (
    <div className="min-h-screen p-6"><div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-6"><button onClick={() => router.push(`/application?id=${encodeURIComponent(appId)}`)} className="text-gray-400 hover:text-white">← Back</button></div>
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 mb-6 text-center">
        <div className={`text-5xl font-bold ${getScoreColor(assessment!.fitScore)}`}>{assessment!.fitScore}/10</div>
        <span className={`inline-block mt-3 px-4 py-1 rounded-full text-sm font-medium ${badge.color}`}>{badge.label}</span>
        <p className="text-gray-400 mt-4">{assessment!.overallAssessment}</p>
      </div>
      {assessment!.dealbreakers.length > 0 && <div className="bg-red-900/20 border border-red-900 rounded-lg p-6 mb-6"><h2 className="font-semibold text-red-400 mb-3">Dealbreakers</h2><ul className="space-y-2">{assessment!.dealbreakers.map((db, i) => <li key={i} className="flex items-start gap-2"><span className="text-red-400">✗</span><span className="text-gray-300">{db}</span></li>)}</ul></div>}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 mb-6"><h2 className="font-semibold text-green-400 mb-3">Strengths</h2><ul className="space-y-3">{assessment!.strengths.map((s, i) => <li key={i}><div className="flex items-start gap-2"><span className="text-green-400">✓</span><span className="font-medium text-gray-200">{s.area}</span></div><p className="ml-5 text-sm text-gray-400">{s.evidence}</p></li>)}</ul></div>
      {assessment!.gaps.length > 0 && <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 mb-6"><h2 className="font-semibold text-yellow-400 mb-3">Gaps to Address</h2><div className="space-y-6">{assessment!.gaps.map((gap, i) => (
        <div key={i} className="border-t border-[#2a2a2a] pt-4 first:border-0 first:pt-0"><div className="flex items-start gap-2 mb-2"><span className="text-yellow-400">!</span><span className="font-medium text-gray-200">{gap.area}</span></div><p className="ml-5 text-sm text-gray-400 mb-2">{gap.concern}</p>
        <label className="block ml-5"><span className="text-sm text-gray-300">{gap.question}</span><textarea value={gapAnswers[i]?.answer || ''} onChange={(e) => { const u = [...gapAnswers]; u[i] = { ...u[i], answer: e.target.value }; setGapAnswers(u); }} onBlur={saveGapAnswers} placeholder="Your answer..." rows={2} className="w-full mt-1 px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg focus:outline-none focus:border-blue-600 text-sm resize-none" /></label></div>))}</div></div>}
      <button onClick={() => router.push(`/application?id=${encodeURIComponent(appId)}`)} className="w-full py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-500">Continue to Application</button>
    </div></div>
  );
}

// Resume View
function ResumeView({ appId }: { appId: string }) {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [handle, setHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [hasExisting, setHasExisting] = useState(false);

  useEffect(() => {
    async function init() {
      const h = await getSavedFolderHandle();
      if (!h) { router.push('/'); return; }
      setHandle(h);
      if (await fileExists(h, `versions/${appId}/resume.md`)) { setContent(await readFile(h, `versions/${appId}/resume.md`)); setHasExisting(true); }
    }
    init();
  }, [appId, router]);

  async function generateResume() {
    if (!handle) return;
    setError(null); setIsGenerating(true);
    try {
      const [baseResume, appJson, configJson] = await Promise.all([readFile(handle, 'resume.md'), readFile(handle, `versions/${appId}/application.json`), readFile(handle, 'config.json')]);
      const app = JSON.parse(appJson), config = JSON.parse(configJson);
      let gapContext = '';
      try { const { gapAnswers } = JSON.parse(await readFile(handle, `versions/${appId}/assessment.json`)); const a = gapAnswers?.filter((g: { answer: string }) => g.answer.trim()) || []; if (a.length) gapContext = '\n--- Additional Context ---\n' + a.map((g: { question: string; answer: string }) => `Q: ${g.question}\nA: ${g.answer}`).join('\n\n'); } catch {}
      const prompt = RESUME_PROMPT.replace('{baseResume}', baseResume).replace('{jobDescription}', app.jobDescription).replace('{company}', app.company).replace('{role}', app.role).replace('{gapContext}', gapContext);
      const generated = await callAI(config, prompt);
      setContent(generated); setHasExisting(true);
      await writeFile(handle, `versions/${appId}/resume.md`, generated);
    } catch (err) { setError('Failed to generate resume'); console.error(err); }
    finally { setIsGenerating(false); }
  }

  async function saveResume() { if (handle && content.trim()) await writeFile(handle, `versions/${appId}/resume.md`, content); }

  function exportPDF() {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const html = content.replace(/^---[\s\S]*?---\n?/, '').replace(/^### (.*)$/gm, '<h3>$1</h3>').replace(/^## (.*)$/gm, '<h2>$1</h2>').replace(/^# (.*)$/gm, '<h1>$1</h1>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/^- (.*)$/gm, '<li>$1</li>').replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
      printWindow.document.write(`<!DOCTYPE html><html><head><title>Resume</title><style>body{font-family:system-ui,sans-serif;max-width:800px;margin:40px auto;padding:20px;line-height:1.5}h1{font-size:24px}h2{font-size:18px;margin-top:24px;border-bottom:1px solid #ccc}h3{font-size:14px}ul{padding-left:20px}li{margin-bottom:4px}@media print{body{margin:0;padding:20px}}</style></head><body>${html}</body></html>`);
      printWindow.document.close(); printWindow.print();
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="p-4 border-b border-[#2a2a2a] flex items-center justify-between">
        <div className="flex items-center gap-4"><button onClick={() => router.push(`/application?id=${encodeURIComponent(appId)}`)} className="text-gray-400 hover:text-white">← Back</button><h1 className="font-semibold">Resume</h1></div>
        <div className="flex items-center gap-2">
          <button onClick={generateResume} disabled={isGenerating} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50">{isGenerating ? 'Generating...' : hasExisting ? 'Regenerate' : 'Generate with AI'}</button>
          {hasExisting && <button onClick={exportPDF} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500">Export PDF</button>}
        </div>
      </div>
      {error && <div className="p-4 bg-red-900/20 border-b border-red-900"><p className="text-red-400 text-center">{error}</p></div>}
      <div className="flex-1 p-4">
        {!hasExisting && !isGenerating ? <div className="h-full flex items-center justify-center"><div className="text-center"><p className="text-gray-400 mb-4">No resume generated yet</p><button onClick={generateResume} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500">Generate Resume</button></div></div>
        : <textarea value={content} onChange={(e) => setContent(e.target.value)} onBlur={saveResume} className="w-full h-full min-h-[60vh] px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg focus:outline-none focus:border-blue-600 font-mono text-sm resize-none" />}
      </div>
    </div>
  );
}

// Cover Letter View
function CoverLetterView({ appId }: { appId: string }) {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [hooks, setHooks] = useState<CoverLetterHooks>({ whatDrewYou: '', personalConnection: '', whyNow: '', uniqueValue: '' });
  const [showHooks, setShowHooks] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [handle, setHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [hasExisting, setHasExisting] = useState(false);

  useEffect(() => {
    async function init() {
      const h = await getSavedFolderHandle();
      if (!h) { router.push('/'); return; }
      setHandle(h);
      if (await fileExists(h, `versions/${appId}/cover-letter.md`)) { setContent(await readFile(h, `versions/${appId}/cover-letter.md`)); setHasExisting(true); setShowHooks(false); }
      if (await fileExists(h, `versions/${appId}/cover-letter-hooks.json`)) try { setHooks(JSON.parse(await readFile(h, `versions/${appId}/cover-letter-hooks.json`))); } catch {}
    }
    init();
  }, [appId, router]);

  async function saveHooks() { if (handle) await writeFile(handle, `versions/${appId}/cover-letter-hooks.json`, JSON.stringify(hooks, null, 2)); }

  async function generateCoverLetter() {
    if (!handle) return;
    setError(null); setIsGenerating(true);
    try {
      await saveHooks();
      const [resume, appJson, configJson] = await Promise.all([readFile(handle, 'resume.md'), readFile(handle, `versions/${appId}/application.json`), readFile(handle, 'config.json')]);
      const app = JSON.parse(appJson), config = JSON.parse(configJson);
      let hookContext = '';
      if (hooks.whatDrewYou || hooks.personalConnection || hooks.whyNow || hooks.uniqueValue) {
        hookContext = '\n--- Personal Context (USE THIS!) ---\n';
        if (hooks.whatDrewYou) hookContext += `What drew me: ${hooks.whatDrewYou}\n`;
        if (hooks.personalConnection) hookContext += `Personal connection: ${hooks.personalConnection}\n`;
        if (hooks.whyNow) hookContext += `Why now: ${hooks.whyNow}\n`;
        if (hooks.uniqueValue) hookContext += `Unique value: ${hooks.uniqueValue}\n`;
      }
      let gapContext = '';
      try { const { gapAnswers } = JSON.parse(await readFile(handle, `versions/${appId}/assessment.json`)); const a = gapAnswers?.filter((g: { answer: string }) => g.answer.trim()) || []; if (a.length) gapContext = '\n--- Additional Context ---\n' + a.map((g: { question: string; answer: string }) => `Q: ${g.question}\nA: ${g.answer}`).join('\n\n'); } catch {}
      const prompt = COVER_LETTER_PROMPT.replace('{resume}', resume).replace('{jobDescription}', app.jobDescription).replace('{company}', app.company).replace('{role}', app.role).replace('{jobUrl}', app.url || 'Not provided').replace('{gapContext}', gapContext).replace('{hookContext}', hookContext);
      const generated = await callAI(config, prompt);
      setContent(generated); setHasExisting(true); setShowHooks(false);
      await writeFile(handle, `versions/${appId}/cover-letter.md`, generated);
    } catch (err) { setError('Failed to generate cover letter'); console.error(err); }
    finally { setIsGenerating(false); }
  }

  async function saveCoverLetter() { if (handle && content.trim()) await writeFile(handle, `versions/${appId}/cover-letter.md`, content); }

  function exportPDF() {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`<!DOCTYPE html><html><head><title>Cover Letter</title><style>body{font-family:system-ui,sans-serif;max-width:700px;margin:40px auto;padding:20px;line-height:1.6}p{margin-bottom:16px}@media print{body{margin:0;padding:40px}}</style></head><body>${content.replace(/\n\n/g, '</p><p>').replace(/^/, '<p>').replace(/$/, '</p>')}</body></html>`);
      printWindow.document.close(); printWindow.print();
    }
  }

  const hookFields = [{ key: 'whatDrewYou', label: 'What drew you to this company?', placeholder: 'A specific product, article, person...' }, { key: 'personalConnection', label: 'Personal connection to their mission?', placeholder: 'How their work relates to your life' }, { key: 'whyNow', label: 'Why this role, why now?', placeholder: 'Career transition, passion...' }, { key: 'uniqueValue', label: 'What do you uniquely bring?', placeholder: 'Unusual skills, perspective...' }] as const;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="p-4 border-b border-[#2a2a2a] flex items-center justify-between">
        <div className="flex items-center gap-4"><button onClick={() => router.push(`/application?id=${encodeURIComponent(appId)}`)} className="text-gray-400 hover:text-white">← Back</button><h1 className="font-semibold">Cover Letter</h1></div>
        <div className="flex items-center gap-2">
          {hasExisting && <button onClick={() => setShowHooks(!showHooks)} className="px-4 py-2 bg-[#2a2a2a] text-white rounded-lg hover:bg-[#3a3a3a]">{showHooks ? 'Hide' : 'Edit'} Hooks</button>}
          <button onClick={generateCoverLetter} disabled={isGenerating} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50">{isGenerating ? 'Generating...' : hasExisting ? 'Regenerate' : 'Generate with AI'}</button>
          {hasExisting && <button onClick={exportPDF} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500">Export PDF</button>}
        </div>
      </div>
      {error && <div className="p-4 bg-red-900/20 border-b border-red-900"><p className="text-red-400 text-center">{error}</p></div>}
      <div className="flex-1 flex">
        {showHooks && <div className="w-96 p-4 border-r border-[#2a2a2a] overflow-y-auto"><h2 className="font-semibold mb-4">Cover Letter Hooks</h2><p className="text-gray-400 text-sm mb-4">Personal details that make your letter stand out.</p><div className="space-y-4">{hookFields.map(f => <div key={f.key}><label className="block text-sm font-medium mb-1">{f.label}</label><textarea value={hooks[f.key]} onChange={(e) => setHooks({ ...hooks, [f.key]: e.target.value })} onBlur={saveHooks} placeholder={f.placeholder} rows={2} className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg focus:outline-none focus:border-blue-600 text-sm resize-none" /></div>)}</div></div>}
        <div className="flex-1 p-4">
          {!hasExisting && !isGenerating ? <div className="h-full flex items-center justify-center"><div className="text-center"><p className="text-gray-400 mb-4">No cover letter generated yet</p><p className="text-gray-500 text-sm mb-4">Fill in hooks on the left for a more personalized letter</p><button onClick={generateCoverLetter} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500">Generate Cover Letter</button></div></div>
          : <textarea value={content} onChange={(e) => setContent(e.target.value)} onBlur={saveCoverLetter} className="w-full h-full min-h-[60vh] px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg focus:outline-none focus:border-blue-600 font-mono text-sm resize-none" />}
        </div>
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
