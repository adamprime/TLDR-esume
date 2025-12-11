'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Application, ApplicationQuestion } from '@/lib/types';
import LoadingText from '@/components/LoadingText';
import { v4 as uuidv4 } from 'uuid';

export default function QuestionsEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [application, setApplication] = useState<Application | null>(null);
  const [questions, setQuestions] = useState<ApplicationQuestion[]>([]);
  const [hasResume, setHasResume] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [newQuestion, setNewQuestion] = useState('');

  useEffect(() => {
    fetchData();
  }, [id]);

  async function fetchData() {
    try {
      const res = await fetch(`/api/applications/${id}`);
      if (!res.ok) {
        router.push('/');
        return;
      }
      const data = await res.json();
      setApplication(data.application);
      setQuestions(data.questions || []);
      setHasResume(!!data.resume);
    } catch (error) {
      console.error('Error fetching:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await fetch(`/api/applications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions }),
      });
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function addQuestion() {
    if (!newQuestion.trim()) return;
    const question: ApplicationQuestion = {
      id: uuidv4(),
      question: newQuestion.trim(),
      answer: '',
    };
    setQuestions([...questions, question]);
    setNewQuestion('');
  }

  function updateAnswer(questionId: string, answer: string) {
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, answer } : q
    ));
  }

  function removeQuestion(questionId: string) {
    setQuestions(questions.filter(q => q.id !== questionId));
  }

  async function generateAnswer(questionId: string) {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    setGeneratingId(questionId);
    try {
      const res = await fetch('/api/generate-answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: id,
          question: question.question,
        }),
      });
      if (!res.ok) throw new Error('Generation failed');
      const data = await res.json();
      updateAnswer(questionId, data.answer);
    } catch (error) {
      console.error('Error generating:', error);
      alert('Failed to generate answer. Please try again.');
    } finally {
      setGeneratingId(null);
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
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href={`/application/${id}`} 
              className="text-gray-400 hover:text-gray-200"
            >
              &larr; Back
            </Link>
            <div>
              <h1 className="font-semibold text-gray-100">
                Questions: {application?.company}
              </h1>
              <p className="text-xs text-gray-400">{application?.role}</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save All'}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Add New Question */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 mb-6">
          <h2 className="font-medium text-gray-100 mb-3">Add Question</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="Enter application question..."
              className="flex-1 px-3 py-2 border border-[#3a3a3a] bg-[#1a1a1a] text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => e.key === 'Enter' && addQuestion()}
            />
            <button
              onClick={addQuestion}
              disabled={!newQuestion.trim()}
              className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>

        {/* Questions List */}
        {questions.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No questions added yet. Add your first question above.
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q, index) => (
              <div
                key={q.id}
                className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-medium text-gray-100">
                    Q{index + 1}: {q.question}
                  </h3>
                  <button
                    onClick={() => removeQuestion(q.id)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Remove
                  </button>
                </div>
                <textarea
                  value={q.answer}
                  onChange={(e) => updateAnswer(q.id, e.target.value)}
                  placeholder="Your answer..."
                  rows={4}
                  className="w-full px-3 py-2 border border-[#3a3a3a] bg-[#1a1a1a] text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={() => generateAnswer(q.id)}
                    disabled={generatingId === q.id || !hasResume}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-500 disabled:opacity-50"
                  >
                    {generatingId === q.id ? <LoadingText text="Generating" /> : 'Draft Answer with AI'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!hasResume && questions.length > 0 && (
          <p className="text-center text-sm text-gray-500 mt-4">
            Create a resume first to enable AI answer generation.
          </p>
        )}
      </main>
    </div>
  );
}
