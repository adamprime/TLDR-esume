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

For weaknesses, be SPECIFIC and provide actionable suggestions.

Output as JSON:
{
  "grade": "B+",
  "summary": "2-3 sentence honest assessment",
  "strengths": [{ "area": "string", "detail": "string" }],
  "weaknesses": [{ "id": "w1", "area": "string", "detail": "string", "suggestion": "string" }]
}

--- Resume to Review ---
`;

const IMPROVE_PROMPT = `You are an expert resume writer. Improve this resume by addressing the selected weaknesses.

CRITICAL RULES:
1. NEVER invent statistics, numbers, or metrics not in the original
2. NEVER fabricate accomplishments or experiences
3. Only use information from the original resume
4. Maintain the same markdown format including YAML frontmatter
5. Keep the authentic voice - don't make it generic

--- Original Resume ---
{resume}

--- Weaknesses to Address ---
{weaknesses}

Output ONLY the improved markdown resume, no explanations.`;

interface ReviewResult {
  grade: string;
  summary: string;
  strengths: { area: string; detail: string }[];
  weaknesses: { id: string; area: string; detail: string; suggestion: string }[];
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

      const response = await callAI(config, REVIEW_PROMPT + resume);
      
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Invalid response format');
      
      const reviewData = JSON.parse(jsonMatch[0]) as ReviewResult;
      setReview(reviewData);
      // Select all weaknesses by default
      setSelectedWeaknesses(new Set(reviewData.weaknesses.map(w => w.id)));
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

      const prompt = IMPROVE_PROMPT
        .replace('{resume}', resume)
        .replace('{weaknesses}', selectedWeaknessDetails);

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
    if (grade.startsWith('A')) return 'text-green-400 bg-green-900/30';
    if (grade.startsWith('B')) return 'text-blue-400 bg-blue-900/30';
    if (grade.startsWith('C')) return 'text-yellow-400 bg-yellow-900/30';
    return 'text-red-400 bg-red-900/30';
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
        diffElements.push(<div key={i} className="text-gray-400 font-mono text-xs">{orig || ' '}</div>);
      } else if (!orig && impr) {
        diffElements.push(<div key={i} className="bg-green-900/30 text-green-300 font-mono text-xs border-l-2 border-green-500 pl-2">+ {impr}</div>);
      } else if (orig && !impr) {
        diffElements.push(<div key={i} className="bg-red-900/30 text-red-300 font-mono text-xs border-l-2 border-red-500 pl-2 line-through">- {orig}</div>);
      } else {
        diffElements.push(<div key={`${i}-old`} className="bg-red-900/30 text-red-300 font-mono text-xs border-l-2 border-red-500 pl-2 line-through">- {orig}</div>);
        diffElements.push(<div key={`${i}-new`} className="bg-green-900/30 text-green-300 font-mono text-xs border-l-2 border-green-500 pl-2">+ {impr}</div>);
      }
    }
    
    return <div className="overflow-auto">{diffElements}</div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#2a2a2a] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-white">← Back</button>
          <h1 className="text-xl font-bold">Resume Review</h1>
        </div>
        <div className="flex items-center gap-2">
          {improvedResume && (
            <>
              <select value={viewMode} onChange={(e) => setViewMode(e.target.value as 'edit' | 'diff' | 'both')}
                className="px-3 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-sm">
                <option value="both">Both Views</option>
                <option value="diff">Diff Only</option>
                <option value="edit">Edit Only</option>
              </select>
              <button onClick={applyImprovements} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500">
                Apply Improvements
              </button>
            </>
          )}
          <button onClick={runReview} disabled={isReviewing} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50">
            {isReviewing ? 'Reviewing...' : review ? 'Re-run Review' : 'Get AI Review'}
          </button>
        </div>
      </div>

      {error && <div className="p-4 bg-red-900/20 border-b border-red-900 text-red-400 text-center">{error}</div>}

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Review Results */}
        <div className="w-80 border-r border-[#2a2a2a] overflow-y-auto p-4">
          {!review && !isReviewing && (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">Click &quot;Get AI Review&quot; to analyze your resume</p>
            </div>
          )}

          {isReviewing && (
            <div className="text-center py-8">
              <p className="text-gray-400">Analyzing resume...</p>
            </div>
          )}

          {review && (
            <div className="space-y-4">
              {/* Grade */}
              <div className="text-center py-4">
                <span className={`text-4xl font-bold px-4 py-2 rounded-lg ${getGradeColor(review.grade)}`}>
                  {review.grade}
                </span>
                <p className="text-gray-400 text-sm mt-3">{review.summary}</p>
              </div>

              {/* Strengths */}
              <div>
                <h3 className="font-semibold text-green-400 mb-2 text-sm">Strengths</h3>
                <ul className="space-y-1">
                  {review.strengths.map((s, i) => (
                    <li key={i} className="text-xs text-gray-300">
                      <span className="text-green-400">✓</span> {s.area}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Weaknesses with checkboxes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-yellow-400 text-sm">Weaknesses to Fix</h3>
                  <div className="flex gap-2">
                    <button onClick={() => setSelectedWeaknesses(new Set(review.weaknesses.map(w => w.id)))}
                      className="text-xs text-blue-400 hover:underline">All</button>
                    <button onClick={() => setSelectedWeaknesses(new Set())}
                      className="text-xs text-gray-400 hover:underline">None</button>
                  </div>
                </div>
                <ul className="space-y-2">
                  {review.weaknesses.map((w) => (
                    <li key={w.id} className="text-xs">
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedWeaknesses.has(w.id)}
                          onChange={() => toggleWeakness(w.id)}
                          className="mt-1 rounded"
                        />
                        <div>
                          <span className="font-medium text-gray-200">{w.area}</span>
                          <p className="text-gray-400">{w.detail}</p>
                          <p className="text-gray-500 italic">💡 {w.suggestion}</p>
                        </div>
                      </label>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-gray-500 mt-2">{selectedWeaknesses.size} selected</p>
              </div>

              {/* Generate button */}
              <button
                onClick={generateImproved}
                disabled={isImproving || selectedWeaknesses.size === 0}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50"
              >
                {isImproving ? 'Generating...' : `Generate Improved Resume (${selectedWeaknesses.size})`}
              </button>
            </div>
          )}
        </div>

        {/* Right Panel - Resume Editor / Diff */}
        <div className="flex-1 flex overflow-hidden">
          {/* Diff View */}
          {improvedResume && (viewMode === 'diff' || viewMode === 'both') && (
            <div className={`${viewMode === 'both' ? 'w-1/2' : 'w-full'} p-4 overflow-auto border-r border-[#2a2a2a]`}>
              <h3 className="font-semibold mb-2 text-sm text-gray-400">Changes (Diff)</h3>
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-3 h-[calc(100%-2rem)] overflow-auto">
                {renderDiff()}
              </div>
            </div>
          )}

          {/* Editor */}
          {(viewMode === 'edit' || viewMode === 'both' || !improvedResume) && (
            <div className={`${viewMode === 'both' && improvedResume ? 'w-1/2' : 'w-full'} p-4 flex flex-col`}>
              <h3 className="font-semibold mb-2 text-sm text-gray-400">
                {improvedResume ? 'Improved Resume (Editable)' : 'Current Resume'}
              </h3>
              <textarea
                value={improvedResume || resume}
                onChange={(e) => improvedResume ? setImprovedResume(e.target.value) : setResume(e.target.value)}
                className="flex-1 px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg focus:outline-none focus:border-blue-600 font-mono text-xs resize-none"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
