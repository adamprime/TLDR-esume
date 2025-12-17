'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { readFile, writeFile, fileExists, createDirectory } from '@/lib/browser-fs';
import { getSavedFolderHandle } from '@/lib/folder-handle';
import { callAI } from '@/lib/browser-ai';

const REVIEW_PROMPT = `You are a brutally honest resume reviewer. Review this resume and provide:

1. An overall grade (A+, A, A-, B+, B, B-, C+, C, C-, D, or F)
2. A brief summary of your assessment
3. Specific strengths (2-3)
4. Specific weaknesses that should be fixed (3-5), each with a unique ID
5. If LinkedIn content is provided, identify experience or skills mentioned on LinkedIn that are MISSING from the resume (these are opportunities to strengthen the resume)

For weaknesses, be SPECIFIC and provide actionable suggestions.

Output as JSON:
{
  "grade": "B+",
  "summary": "2-3 sentence honest assessment",
  "strengths": [{ "area": "string", "detail": "string" }],
  "weaknesses": [{ "id": "w1", "area": "string", "detail": "string", "suggestion": "string" }],
  "linkedinGaps": [{ "id": "lg1", "area": "string", "detail": "string", "suggestion": "string" }]
}

Note: "linkedinGaps" should only be populated if LinkedIn content was provided. These are things on LinkedIn that should be added to the resume.
`;

const IMPROVE_PROMPT = `You are an expert resume writer. Improve this resume by addressing the selected weaknesses and incorporating relevant LinkedIn content.

CRITICAL RULES:
1. NEVER invent statistics, numbers, or metrics not in the original resume or LinkedIn content
2. NEVER fabricate accomplishments or experiences
3. You MAY use information from either the original resume OR the LinkedIn content (both are real, verified information from the candidate)
4. Maintain the same markdown format including YAML frontmatter
5. Keep the authentic voice - don't make it generic

--- Original Resume ---
{resume}

--- LinkedIn Profile Content (if provided) ---
{linkedinContent}

--- Weaknesses to Address ---
{weaknesses}

Output ONLY the improved markdown resume, no explanations.`;

interface ReviewResult {
  grade: string;
  summary: string;
  strengths: { area: string; detail: string }[];
  weaknesses: { id: string; area: string; detail: string; suggestion: string }[];
  linkedinGaps?: { id: string; area: string; detail: string; suggestion: string }[];
}

export default function ReviewPage() {
  const router = useRouter();
  const [resume, setResume] = useState('');
  const [originalResume, setOriginalResume] = useState('');
  const [improvedResume, setImprovedResume] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [review, setReview] = useState<ReviewResult | null>(null);
  const [selectedWeaknesses, setSelectedWeaknesses] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'edit' | 'diff' | 'both'>('both');
  const [error, setError] = useState<string | null>(null);
  const [handle, setHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [linkedinContext, setLinkedinContext] = useState('');
  const [showLinkedinInput, setShowLinkedinInput] = useState(false);

  useEffect(() => {
    async function init() {
      const h = await getSavedFolderHandle();
      if (!h) { router.push('/'); return; }
      setHandle(h);
      
      try {
        const content = await readFile(h, 'resume.md');
        setResume(content);
        setOriginalResume(content);
      } catch {
        router.push('/dashboard');
      }
    }
    init();
  }, [router]);

  async function runReview() {
    if (!handle || !resume.trim()) return;
    setError(null);
    setIsReviewing(true);
    setImprovedResume('');

    try {
      const configJson = await readFile(handle, 'config.json');
      const config = JSON.parse(configJson);

      let prompt = REVIEW_PROMPT + '\n--- Resume to Review ---\n' + resume;
      if (linkedinContext.trim()) {
        prompt += '\n\n--- LinkedIn Profile Content ---\n' + linkedinContext;
      }

      const response = await callAI(config, prompt);
      
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Invalid response format');
      
      const reviewData = JSON.parse(jsonMatch[0]) as ReviewResult;
      setReview(reviewData);
      // Select all weaknesses and linkedin gaps by default
      const allIds = [
        ...reviewData.weaknesses.map(w => w.id),
        ...(reviewData.linkedinGaps || []).map(g => g.id)
      ];
      setSelectedWeaknesses(new Set(allIds));
    } catch (err) {
      setError('Failed to review resume. Please try again.');
      console.error(err);
    } finally {
      setIsReviewing(false);
    }
  }

  async function generateImproved() {
    if (!handle || !resume.trim() || !review || selectedWeaknesses.size === 0) return;
    setError(null);
    setIsImproving(true);

    try {
      const configJson = await readFile(handle, 'config.json');
      const config = JSON.parse(configJson);

      const selectedWeaknessDetails = review.weaknesses
        .filter(w => selectedWeaknesses.has(w.id))
        .map(w => `- ${w.area}: ${w.detail}\n  Suggestion: ${w.suggestion}`)
        .join('\n\n');

      const selectedLinkedinGaps = (review.linkedinGaps || [])
        .filter(g => selectedWeaknesses.has(g.id))
        .map(g => `- ${g.area}: ${g.detail}\n  Suggestion: ${g.suggestion}`)
        .join('\n\n');

      const allImprovements = [selectedWeaknessDetails, selectedLinkedinGaps]
        .filter(Boolean)
        .join('\n\n--- LinkedIn Gaps to Address ---\n');

      const prompt = IMPROVE_PROMPT
        .replace('{resume}', resume)
        .replace('{linkedinContent}', linkedinContext || '(none provided)')
        .replace('{weaknesses}', allImprovements);

      const improved = await callAI(config, prompt);
      setImprovedResume(improved);
      setViewMode('both');
    } catch (err) {
      setError('Failed to generate improvements. Please try again.');
      console.error(err);
    } finally {
      setIsImproving(false);
    }
  }

  async function applyImprovements() {
    if (!handle || !improvedResume.trim()) return;
    
    if (!confirm('This will archive your current resume and replace it with the improved version. Continue?')) {
      return;
    }

    try {
      // Archive old resume
      await createDirectory(handle, 'archive');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      await writeFile(handle, `archive/resume-${timestamp}.md`, originalResume);

      // Save new resume
      await writeFile(handle, 'resume.md', improvedResume);
      
      // Update state
      setResume(improvedResume);
      setOriginalResume(improvedResume);
      setImprovedResume('');
      setReview(null);
      
      alert('Improvements applied! Your previous resume has been archived.');
    } catch (err) {
      setError('Failed to apply improvements.');
      console.error(err);
    }
  }

  function toggleWeakness(id: string) {
    setSelectedWeaknesses(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function getGradeColor(grade: string) {
    if (grade.startsWith('A')) return 'text-green-500 border-green-500 bg-green-100/10';
    if (grade.startsWith('B')) return 'text-blue-500 border-blue-500 bg-blue-100/10';
    if (grade.startsWith('C')) return 'text-yellow-500 border-yellow-500 bg-yellow-100/10';
    return 'text-red-500 border-red-500 bg-red-100/10';
  }

  function renderDiff() {
    if (!improvedResume || !originalResume) return null;
    
    const originalLines = originalResume.split('\n');
    const improvedLines = improvedResume.split('\n');
    
    // Simple line-by-line diff
    const maxLines = Math.max(originalLines.length, improvedLines.length);
    const diffElements: React.ReactNode[] = [];
    
    for (let i = 0; i < maxLines; i++) {
      const orig = originalLines[i] || '';
      const impr = improvedLines[i] || '';
      
      if (orig === impr) {
        diffElements.push(<div key={i} className="text-gray-500 font-mono text-xs">{orig || ' '}</div>);
      } else if (!orig && impr) {
        diffElements.push(<div key={i} className="bg-green-900/30 text-green-400 font-mono text-xs border-l-4 border-green-500 pl-2 font-bold">+ {impr}</div>);
      } else if (orig && !impr) {
        diffElements.push(<div key={i} className="bg-red-900/30 text-red-400 font-mono text-xs border-l-4 border-red-500 pl-2 line-through opacity-70">- {orig}</div>);
      } else {
        diffElements.push(<div key={`${i}-old`} className="bg-red-900/30 text-red-400 font-mono text-xs border-l-4 border-red-500 pl-2 line-through opacity-70">- {orig}</div>);
        diffElements.push(<div key={`${i}-new`} className="bg-green-900/30 text-green-400 font-mono text-xs border-l-4 border-green-500 pl-2 font-bold">+ {impr}</div>);
      }
    }
    
    return <div className="overflow-auto">{diffElements}</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0f0f0f]">
      {/* Header */}
      <div className="px-6 py-4 border-b-4 border-ink flex items-center justify-between bg-paper shadow-hard-sm z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/dashboard')} className="text-gray-500 hover:text-accent font-bold transition-colors">← Back</button>
          <h1 className="text-2xl font-serif font-black text-ink">RESUME REVIEW</h1>
        </div>
        <div className="flex items-center gap-2">
          {improvedResume && (
            <>
              <select value={viewMode} onChange={(e) => setViewMode(e.target.value as 'edit' | 'diff' | 'both')}
                className="px-3 py-2 bg-paper border-2 border-ink font-bold text-sm focus:outline-none focus:border-accent shadow-sm">
                <option value="both">Both Views</option>
                <option value="diff">Diff Only</option>
                <option value="edit">Edit Only</option>
              </select>
              <button onClick={applyImprovements} className="px-4 py-2 bg-paper text-green-500 border-2 border-green-500 hover:bg-green-500 hover:text-black font-bold shadow-sm transition-all">
                Apply Improvements
              </button>
            </>
          )}
          <button onClick={runReview} disabled={isReviewing} className="px-4 py-2 bg-accent text-black font-bold border-2 border-ink shadow-hard-sm hover:shadow-hard hover:-translate-y-1 transition-all disabled:opacity-50">
            {isReviewing ? 'Reviewing...' : review ? 'Re-run Review' : 'Get AI Review'}
          </button>
        </div>
      </div>

      {error && <div className="p-4 bg-red-900/20 border-b-2 border-red-500 text-red-500 font-bold text-center">{error}</div>}

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Review Results */}
        <div className="w-80 border-r-2 border-ink overflow-y-auto p-6 bg-paper shadow-hard-sm z-0">
          {/* LinkedIn Context Section */}
          <div className="mb-6">
            <button
              onClick={() => setShowLinkedinInput(!showLinkedinInput)}
              className="w-full flex items-center justify-between px-3 py-2 bg-blue-900/20 border-2 border-blue-500 text-blue-400 font-bold text-sm hover:bg-blue-900/40 transition-colors"
            >
              <span>+ LinkedIn Profile</span>
              <span className={`transform transition-transform ${showLinkedinInput ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {showLinkedinInput && (
              <div className="mt-2 p-3 border-2 border-gray-700 bg-[#0f0f0f]">
                <p className="text-xs text-gray-400 mb-2 font-mono leading-relaxed">
                  Paste your LinkedIn profile content to help identify experience missing from your resume.
                </p>
                <details className="mb-2">
                  <summary className="text-xs text-blue-400 cursor-pointer hover:text-blue-300 font-bold">How to copy from LinkedIn</summary>
                  <ol className="text-xs text-gray-500 mt-2 space-y-1 font-mono pl-4 list-decimal">
                    <li>Go to your LinkedIn profile</li>
                    <li>Scroll through your About, Experience, and Skills sections</li>
                    <li>Select and copy the text (Cmd+A in each section, then Cmd+C)</li>
                    <li>Paste it all below</li>
                  </ol>
                </details>
                <textarea
                  value={linkedinContext}
                  onChange={(e) => setLinkedinContext(e.target.value)}
                  placeholder="Paste your LinkedIn About section, Experience, Skills, etc..."
                  className="w-full h-32 px-3 py-2 bg-paper border-2 border-gray-600 focus:border-blue-500 focus:outline-none text-xs font-mono resize-none"
                />
                {linkedinContext && (
                  <p className="text-xs text-green-500 mt-1 font-mono">✓ LinkedIn content added ({linkedinContext.length} chars)</p>
                )}
              </div>
            )}
          </div>

          {!review && !isReviewing && (
            <div className="text-center py-8 border-2 border-dashed border-gray-700 rounded-lg">
              <p className="text-gray-500 mb-4 font-mono text-sm">Click &quot;Get AI Review&quot; to analyze your resume</p>
            </div>
          )}

          {isReviewing && (
            <div className="text-center py-8">
              <p className="text-gray-400 font-mono animate-pulse">Analyzing resume...</p>
            </div>
          )}

          {review && (
            <div className="space-y-6">
              {/* Grade */}
              <div className="text-center py-6 border-b-2 border-ink border-dashed">
                <span className={`text-5xl font-black font-serif px-6 py-2 border-4 transform -rotate-6 inline-block shadow-hard-sm ${getGradeColor(review.grade)}`}>
                  {review.grade}
                </span>
                <p className="text-gray-400 text-sm mt-6 font-mono leading-relaxed text-left">{review.summary}</p>
              </div>

              {/* Strengths */}
              <div>
                <h3 className="font-bold font-serif text-green-500 mb-3 text-sm border-b-2 border-green-500 inline-block">STRENGTHS</h3>
                <ul className="space-y-2">
                  {review.strengths.map((s, i) => (
                    <li key={i} className="text-xs text-gray-300 font-mono">
                      <span className="text-green-500 font-bold mr-2">✓</span> {s.area}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Weaknesses with checkboxes */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold font-serif text-red-500 text-sm border-b-2 border-red-500 inline-block">WEAKNESSES</h3>
                  <div className="flex gap-2">
                    <button onClick={() => {
                      const allIds = [...review.weaknesses.map(w => w.id), ...(review.linkedinGaps || []).map(g => g.id)];
                      setSelectedWeaknesses(new Set(allIds));
                    }} className="text-[10px] uppercase font-bold text-accent hover:underline">All</button>
                    <button onClick={() => setSelectedWeaknesses(new Set())}
                      className="text-[10px] uppercase font-bold text-gray-500 hover:underline">None</button>
                  </div>
                </div>
                <ul className="space-y-4">
                  {review.weaknesses.map((w) => (
                    <li key={w.id} className="text-xs bg-paper border border-gray-700 p-3 hover:border-red-500 transition-colors group">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedWeaknesses.has(w.id)}
                          onChange={() => toggleWeakness(w.id)}
                          className="mt-1 rounded border-gray-500 text-red-500 focus:ring-red-500"
                        />
                        <div>
                          <span className="font-bold text-ink block mb-1 group-hover:text-red-400 transition-colors">{w.area}</span>
                          <p className="text-gray-400 mb-2 font-mono leading-tight">{w.detail}</p>
                          <p className="text-accent italic font-mono border-l-2 border-accent pl-2">💡 {w.suggestion}</p>
                        </div>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>

              {/* LinkedIn Gaps - only shown if LinkedIn content was provided */}
              {review.linkedinGaps && review.linkedinGaps.length > 0 && (
                <div>
                  <h3 className="font-bold font-serif text-blue-500 mb-3 text-sm border-b-2 border-blue-500 inline-block">LINKEDIN GAPS</h3>
                  <p className="text-xs text-gray-500 mb-3 font-mono">Experience on LinkedIn missing from your resume:</p>
                  <ul className="space-y-4">
                    {review.linkedinGaps.map((g) => (
                      <li key={g.id} className="text-xs bg-paper border border-gray-700 p-3 hover:border-blue-500 transition-colors group">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedWeaknesses.has(g.id)}
                            onChange={() => toggleWeakness(g.id)}
                            className="mt-1 rounded border-gray-500 text-blue-500 focus:ring-blue-500"
                          />
                          <div>
                            <span className="font-bold text-ink block mb-1 group-hover:text-blue-400 transition-colors">{g.area}</span>
                            <p className="text-gray-400 mb-2 font-mono leading-tight">{g.detail}</p>
                            <p className="text-accent italic font-mono border-l-2 border-accent pl-2">💡 {g.suggestion}</p>
                          </div>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-xs text-gray-500 mt-2 font-mono text-right">{selectedWeaknesses.size} selected</p>

              {/* Generate button */}
              <button
                onClick={generateImproved}
                disabled={isImproving || selectedWeaknesses.size === 0}
                className="w-full py-3 bg-accent text-black font-bold border-2 border-ink shadow-hard-sm hover:shadow-hard hover:-translate-y-1 transition-all disabled:opacity-50"
              >
                {isImproving ? 'Generating...' : `IMPROVE SELECTED (${selectedWeaknesses.size})`}
              </button>
            </div>
          )}
        </div>

        {/* Right Panel - Resume Editor / Diff */}
        <div className="flex-1 flex overflow-hidden bg-[#0f0f0f]">
          {/* Diff View */}
          {improvedResume && (viewMode === 'diff' || viewMode === 'both') && (
            <div className={`${viewMode === 'both' ? 'w-1/2' : 'w-full'} p-4 overflow-auto border-r-2 border-ink`}>
              <h3 className="font-bold font-serif mb-2 text-sm text-gray-500 uppercase tracking-wider">Changes (Diff)</h3>
              <div className="bg-paper border-2 border-ink p-4 h-[calc(100%-2rem)] overflow-auto font-mono text-xs shadow-inner">
                {renderDiff()}
              </div>
            </div>
          )}

          {/* Editor */}
          {(viewMode === 'edit' || viewMode === 'both' || !improvedResume) && (
            <div className={`${viewMode === 'both' && improvedResume ? 'w-1/2' : 'w-full'} p-4 flex flex-col`}>
              <h3 className="font-bold font-serif mb-2 text-sm text-gray-500 uppercase tracking-wider">
                {improvedResume ? 'Improved Resume (Editable)' : 'Current Resume'}
              </h3>
              <textarea
                value={improvedResume || resume}
                onChange={(e) => improvedResume ? setImprovedResume(e.target.value) : setResume(e.target.value)}
                className="flex-1 px-4 py-3 bg-paper border-2 border-ink focus:outline-none focus:border-accent focus:shadow-hard-sm transition-all font-mono text-xs resize-none leading-relaxed"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
