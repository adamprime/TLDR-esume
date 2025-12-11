import Anthropic from '@anthropic-ai/sdk';
import { RESUME_PROMPT, COVER_LETTER_PROMPT, QUESTION_ANSWER_PROMPT, FIT_ASSESSMENT_PROMPT, RESUME_REVIEW_PROMPT, RESUME_IMPROVEMENT_PROMPT } from './prompts';
import { FitAssessment, FitGap, ResumeReview, ResumeWeakness, ResumeQuestion } from './types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = 'claude-opus-4-20250514';

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] || '');
}

export async function generateResume(params: {
  baseResume: string;
  jobDescription: string;
  company: string;
  role: string;
  gapContext?: string;
}): Promise<string> {
  const prompt = interpolate(RESUME_PROMPT, { ...params, gapContext: params.gapContext || '' });
  
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });
  
  const textBlock = response.content.find(block => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude');
  }
  
  return textBlock.text;
}

export async function generateCoverLetter(params: {
  resume: string;
  jobDescription: string;
  company: string;
  role: string;
  jobUrl: string;
  gapContext?: string;
  hookContext?: string;
}): Promise<string> {
  const prompt = interpolate(COVER_LETTER_PROMPT, { 
    ...params, 
    gapContext: params.gapContext || '',
    hookContext: params.hookContext || '',
  });
  
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });
  
  const textBlock = response.content.find(block => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude');
  }
  
  return textBlock.text;
}

export async function generateQuestionAnswer(params: {
  resume: string;
  jobDescription: string;
  company: string;
  role: string;
  question: string;
}): Promise<string> {
  const prompt = interpolate(QUESTION_ANSWER_PROMPT, params);
  
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });
  
  const textBlock = response.content.find(block => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude');
  }
  
  return textBlock.text;
}

export async function assessFit(params: {
  resume: string;
  jobDescription: string;
  company: string;
  role: string;
}): Promise<FitAssessment> {
  const prompt = interpolate(FIT_ASSESSMENT_PROMPT, params);
  
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });
  
  const textBlock = response.content.find(block => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude');
  }
  
  // Parse JSON response
  const jsonText = textBlock.text.trim();
  const parsed = JSON.parse(jsonText);
  
  // Add IDs to gaps
  const { v4: uuidv4 } = await import('uuid');
  const gaps: FitGap[] = (parsed.gaps || []).map((gap: { area: string; concern: string; question: string }) => ({
    ...gap,
    id: uuidv4(),
    userContext: '',
  }));
  
  return {
    overallAssessment: parsed.overallAssessment,
    fitScore: parsed.fitScore,
    recommendation: parsed.recommendation,
    strengths: parsed.strengths || [],
    gaps,
    dealbreakers: parsed.dealbreakers || [],
    assessedAt: new Date().toISOString(),
  };
}

export async function reviewResume(params: {
  resume: string;
}): Promise<Omit<ResumeReview, 'resumeFile' | 'reviewedAt'>> {
  const prompt = interpolate(RESUME_REVIEW_PROMPT, params);
  
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });
  
  const textBlock = response.content.find(block => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude');
  }
  
  const jsonText = textBlock.text.trim();
  const parsed = JSON.parse(jsonText);
  
  const { v4: uuidv4 } = await import('uuid');
  
  const weaknesses: ResumeWeakness[] = (parsed.weaknesses || []).map((w: { area: string; detail: string; suggestion: string }) => ({
    ...w,
    id: uuidv4(),
  }));
  
  const questions: ResumeQuestion[] = (parsed.questions || []).map((q: { question: string; context: string }) => ({
    ...q,
    id: uuidv4(),
    answer: '',
  }));
  
  return {
    overallGrade: parsed.overallGrade,
    overallFeedback: parsed.overallFeedback,
    strengths: parsed.strengths || [],
    weaknesses,
    questions,
  };
}

export async function generateImprovedResume(params: {
  originalResume: string;
  reviewFeedback: string;
  questionAnswers: string;
}): Promise<string> {
  const prompt = interpolate(RESUME_IMPROVEMENT_PROMPT, params);
  
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });
  
  const textBlock = response.content.find(block => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude');
  }
  
  return textBlock.text;
}
