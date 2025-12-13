'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { readFile, writeFile } from '@/lib/browser-fs';
import { getSavedFolderHandle } from '@/lib/folder-handle';
import { callAI } from '@/lib/browser-ai';

const REVIEW_PROMPT = `You are a brutally honest resume reviewer. Review this resume and provide:

1. An overall grade (A+, A, A-, B+, B, B-, C+, C, C-, D, or F)
2. A brief summary of your assessment
3. Specific strengths (2-3)
4. Specific weaknesses that should be fixed (3-5)

For weaknesses, be SPECIFIC and provide actionable suggestions.

Output as JSON:
{
  "grade": "B+",
  "summary": "2-3 sentence honest assessment",
  "strengths": [{ "area": "string", "detail": "string" }],
  "weaknesses": [{ "area": "string", "detail": "string", "suggestion": "string" }]
}

--- Resume to Review ---
`;

interface ReviewResult {
  grade: string;
  summary: string;
  strengths: { area: string; detail: string }[];
  weaknesses: { area: string; detail: string; suggestion: string }[];
}

export default function ReviewPage() {
  const router = useRouter();
  const [resume, setResume] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);
  const [review, setReview] = useState<ReviewResult | null>(null);
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

    try {
      const configJson = await readFile(handle, 'config.json');
      const config = JSON.parse(configJson);

      const response = await callAI(config, REVIEW_PROMPT + resume);
      
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Invalid response format');
      
      setReview(JSON.parse(jsonMatch[0]) as ReviewResult);
    } catch (err) {
      setError('Failed to review resume. Please try again.');
      console.error(err);
    } finally {
      setIsReviewing(false);
    }
  }

  async function saveResume() {
    if (!handle || !resume.trim()) return;
    try {
      await writeFile(handle, 'resume.md', resume);
    } catch (err) {
      console.error('Failed to save resume:', err);
    }
  }

  function getGradeColor(grade: string) {
    if (grade.startsWith('A')) return 'text-green-400';
    if (grade.startsWith('B')) return 'text-blue-400';
    if (grade.startsWith('C')) return 'text-yellow-400';
    return 'text-red-400';
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-white">← Back</button>
            <h1 className="text-2xl font-bold">Resume Review</h1>
          </div>
          <button
            onClick={runReview}
            disabled={isReviewing || !resume.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50"
          >
            {isReviewing ? 'Reviewing...' : review ? 'Re-run Review' : 'Get AI Review'}
          </button>
        </div>

        {error && <div className="mb-4 p-4 bg-red-900/20 border border-red-900 rounded-lg text-red-400">{error}</div>}

        <div className="grid grid-cols-2 gap-6">
          {/* Resume Editor */}
          <div>
            <h2 className="font-semibold mb-2">Your Base Resume</h2>
            <textarea
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              onBlur={saveResume}
              className="w-full h-[70vh] px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg focus:outline-none focus:border-blue-600 font-mono text-sm resize-none"
            />
          </div>

          {/* Review Results */}
          <div>
            <h2 className="font-semibold mb-2">Review Results</h2>
            {!review && !isReviewing && (
              <div className="h-[70vh] flex items-center justify-center bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
                <p className="text-gray-500">Click &quot;Get AI Review&quot; to analyze your resume</p>
              </div>
            )}

            {isReviewing && (
              <div className="h-[70vh] flex items-center justify-center bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
                <p className="text-gray-400">Analyzing your resume...</p>
              </div>
            )}

            {review && !isReviewing && (
              <div className="h-[70vh] overflow-y-auto bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 space-y-4">
                {/* Grade */}
                <div className="text-center py-4 border-b border-[#2a2a2a]">
                  <div className={`text-5xl font-bold ${getGradeColor(review.grade)}`}>{review.grade}</div>
                  <p className="text-gray-400 mt-2">{review.summary}</p>
                </div>

                {/* Strengths */}
                <div>
                  <h3 className="font-semibold text-green-400 mb-2">Strengths</h3>
                  <ul className="space-y-2">
                    {review.strengths.map((s, i) => (
                      <li key={i} className="text-sm">
                        <span className="text-green-400">✓</span> <strong>{s.area}:</strong> {s.detail}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Weaknesses */}
                <div>
                  <h3 className="font-semibold text-yellow-400 mb-2">Areas to Improve</h3>
                  <ul className="space-y-3">
                    {review.weaknesses.map((w, i) => (
                      <li key={i} className="text-sm">
                        <div><span className="text-yellow-400">!</span> <strong>{w.area}:</strong> {w.detail}</div>
                        <div className="ml-4 text-gray-500 text-xs mt-1">💡 {w.suggestion}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
