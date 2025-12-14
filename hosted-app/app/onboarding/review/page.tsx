'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { readFile, writeFile } from '@/lib/browser-fs';
import { getSavedFolderHandle } from '@/lib/folder-handle';
import { callAI } from '@/lib/browser-ai';

const REVIEW_PROMPT = `You are a professional resume reviewer. Review this resume and provide:

1. An overall grade (A, B, C, D, or F)
2. A brief summary of strengths (2-3 points)
3. A list of specific weaknesses that should be fixed (3-5 points)
4. For each weakness, provide a concrete suggestion for improvement

Be honest and constructive. Focus on:
- Clarity and impact of accomplishments
- Quantifiable achievements
- Action verbs and strong language
- Relevance and organization
- Missing information that should be included

Format your response as JSON:
{
  "grade": "B",
  "summary": "Brief overall assessment",
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": [
    {"issue": "description of weakness", "suggestion": "how to fix it"},
    ...
  ]
}

Resume to review:
`;

interface ReviewResult {
  grade: string;
  summary: string;
  strengths: string[];
  weaknesses: { issue: string; suggestion: string }[];
}

export default function ReviewPage() {
  const router = useRouter();
  const [isReviewing, setIsReviewing] = useState(false);
  const [review, setReview] = useState<ReviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [handle, setHandle] = useState<FileSystemDirectoryHandle | null>(null);

  useEffect(() => {
    async function init() {
      const h = await getSavedFolderHandle();
      if (!h) {
        router.push('/onboarding/folder');
        return;
      }
      setHandle(h);
    }
    init();
  }, [router]);

  async function runReview() {
    if (!handle) return;

    setError(null);
    setIsReviewing(true);

    try {
      const resume = await readFile(handle, 'resume.md');
      const configContent = await readFile(handle, 'config.json');
      const config = JSON.parse(configContent);

      const response = await callAI(config, REVIEW_PROMPT + resume);
      
      // Parse the JSON response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format');
      }
      
      const reviewData = JSON.parse(jsonMatch[0]) as ReviewResult;
      setReview(reviewData);
    } catch (err) {
      setError('Failed to review resume. Please try again.');
      console.error(err);
    } finally {
      setIsReviewing(false);
    }
  }

  async function finishOnboarding() {
    if (!handle) return;

    try {
      const configContent = await readFile(handle, 'config.json');
      const config = JSON.parse(configContent);
      config.onboardingComplete = true;
      await writeFile(handle, 'config.json', JSON.stringify(config, null, 2));
      
      router.push('/dashboard');
    } catch (err) {
      setError('Failed to complete setup');
      console.error(err);
    }
  }

  function getGradeColor(grade: string) {
    switch (grade.toUpperCase()) {
      case 'A': return 'text-green-500 border-green-500 bg-green-100/10';
      case 'B': return 'text-blue-500 border-blue-500 bg-blue-100/10';
      case 'C': return 'text-yellow-500 border-yellow-500 bg-yellow-100/10';
      case 'D': return 'text-orange-500 border-orange-500 bg-orange-100/10';
      case 'F': return 'text-red-500 border-red-500 bg-red-100/10';
      default: return 'text-gray-500 border-gray-500 bg-gray-100/10';
    }
  }

  // Initial state - offer to run review
  if (!review && !isReviewing) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-paper">
        <div className="max-w-lg w-full text-center border-2 border-ink p-8 shadow-hard bg-paper">
          <h1 className="text-3xl font-serif font-black mb-4">AI Resume Review</h1>
          <p className="text-gray-400 mb-8 font-mono text-sm leading-relaxed">
            Get honest feedback on your resume from AI. This helps identify
            areas to strengthen before you start applying.
          </p>

          <button
            onClick={runReview}
            className="w-full py-4 bg-accent text-black text-xl font-bold border-2 border-ink shadow-hard-sm hover:shadow-hard hover:-translate-y-1 transition-all mb-4"
          >
            Run AI Review
          </button>

          <button
            onClick={finishOnboarding}
            className="w-full py-3 bg-paper text-ink border-2 border-ink font-bold hover:bg-ink hover:text-black shadow-sm transition-all"
          >
            Skip and Go to Dashboard
          </button>

          {error && (
            <p className="mt-4 text-red-500 font-bold font-mono">{error}</p>
          )}
        </div>
      </div>
    );
  }

  // Loading state
  if (isReviewing) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-paper">
        <div className="text-center">
          <h1 className="text-2xl font-serif font-bold mb-4 animate-pulse">Analyzing Your Resume...</h1>
          <p className="text-gray-400 font-mono text-sm">This may take a moment.</p>
        </div>
      </div>
    );
  }

  // Review results
  return (
    <div className="min-h-screen p-6 bg-paper">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif font-black mb-2">Resume Review Results</h1>
          <div className={`text-6xl font-black font-serif px-6 py-2 border-4 transform -rotate-6 inline-block shadow-hard-sm mt-6 mb-4 ${getGradeColor(review!.grade)}`}>
            {review!.grade}
          </div>
          <p className="text-gray-400 mt-2 font-mono text-sm italic border-t border-gray-700 pt-4 max-w-lg mx-auto">{review!.summary}</p>
        </div>

        {/* Strengths */}
        <div className="bg-paper border-2 border-ink p-6 mb-6 shadow-hard-sm">
          <h2 className="font-serif font-bold text-green-500 mb-4 text-lg border-b-2 border-green-500 inline-block">STRENGTHS</h2>
          <ul className="space-y-3 font-mono text-sm">
            {review!.strengths.map((strength, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="text-green-500 font-bold">✓</span>
                <span className="text-gray-300">{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Weaknesses */}
        <div className="bg-paper border-2 border-ink p-6 mb-8 shadow-hard-sm">
          <h2 className="font-serif font-bold text-yellow-500 mb-4 text-lg border-b-2 border-yellow-500 inline-block">AREAS TO IMPROVE</h2>
          <ul className="space-y-6 font-mono text-sm">
            {review!.weaknesses.map((weakness, i) => (
              <li key={i} className="border-l-4 border-yellow-500 pl-4 bg-yellow-900/10 py-2">
                <div className="flex items-start gap-2 mb-1">
                  <span className="text-yellow-500 font-bold">!</span>
                  <span className="text-gray-200 font-bold">{weakness.issue}</span>
                </div>
                <div className="ml-5 text-gray-400 italic mt-1">
                  💡 {weakness.suggestion}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-gray-500 text-sm text-center mb-6 font-mono uppercase tracking-widest">
          You can improve your resume later from the dashboard. 
          For now, let&apos;s get you set up to start applying.
        </p>

        <button
          onClick={finishOnboarding}
          className="w-full py-4 bg-accent text-black text-xl font-bold border-2 border-ink shadow-hard-sm hover:shadow-hard hover:-translate-y-1 transition-all"
        >
          Go to Dashboard
        </button>

        {error && (
          <p className="mt-6 text-red-500 font-bold font-mono text-center bg-red-100/10 p-2 border-2 border-red-500">{error}</p>
        )}
      </div>
    </div>
  );
}
