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
      case 'A': return 'text-green-400';
      case 'B': return 'text-blue-400';
      case 'C': return 'text-yellow-400';
      case 'D': return 'text-orange-400';
      case 'F': return 'text-red-400';
      default: return 'text-gray-400';
    }
  }

  // Initial state - offer to run review
  if (!review && !isReviewing) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-lg w-full text-center">
          <h1 className="text-2xl font-bold mb-4">AI Resume Review</h1>
          <p className="text-gray-400 mb-8">
            Get honest feedback on your resume from AI. This helps identify
            areas to strengthen before you start applying.
          </p>

          <button
            onClick={runReview}
            className="w-full py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-500 transition-colors mb-4"
          >
            Run AI Review
          </button>

          <button
            onClick={finishOnboarding}
            className="w-full py-3 bg-[#2a2a2a] text-white rounded-lg hover:bg-[#3a3a3a] transition-colors"
          >
            Skip and Go to Dashboard
          </button>

          {error && (
            <p className="mt-4 text-red-400">{error}</p>
          )}
        </div>
      </div>
    );
  }

  // Loading state
  if (isReviewing) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Analyzing Your Resume...</h1>
          <p className="text-gray-400">This may take a moment.</p>
        </div>
      </div>
    );
  }

  // Review results
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Resume Review Results</h1>
          <div className={`text-6xl font-bold ${getGradeColor(review!.grade)}`}>
            {review!.grade}
          </div>
          <p className="text-gray-400 mt-2">{review!.summary}</p>
        </div>

        {/* Strengths */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 mb-6">
          <h2 className="font-semibold text-green-400 mb-3">Strengths</h2>
          <ul className="space-y-2">
            {review!.strengths.map((strength, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span className="text-gray-300">{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Weaknesses */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 mb-8">
          <h2 className="font-semibold text-yellow-400 mb-3">Areas to Improve</h2>
          <ul className="space-y-4">
            {review!.weaknesses.map((weakness, i) => (
              <li key={i}>
                <div className="flex items-start gap-2 mb-1">
                  <span className="text-yellow-400">!</span>
                  <span className="text-gray-300">{weakness.issue}</span>
                </div>
                <div className="ml-5 text-sm text-gray-500">
                  💡 {weakness.suggestion}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-gray-500 text-sm text-center mb-6">
          You can improve your resume later from the dashboard. 
          For now, let&apos;s get you set up to start applying.
        </p>

        <button
          onClick={finishOnboarding}
          className="w-full py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-500 transition-colors"
        >
          Go to Dashboard
        </button>

        {error && (
          <p className="mt-4 text-red-400 text-center">{error}</p>
        )}
      </div>
    </div>
  );
}
