import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { RESUME_PROMPT, getCoverLetterPrompt, QUESTION_ANSWER_PROMPT, FIT_ASSESSMENT_PROMPT, RESUME_REVIEW_PROMPT, RESUME_IMPROVEMENT_PROMPT } from './prompts';
import type { TonePreference } from './prompts';
import { FitAssessment, FitGap, ResumeReview, ResumeWeakness, ResumeQuestion } from './types';
import { getPreferences } from './preferences';
import { AIModel } from './preference-types';

let anthropicClient: Anthropic | null = null;
let openaiClient: OpenAI | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropicClient;
}

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] || '');
}

async function callAI(prompt: string, maxTokens: number = 4096): Promise<string> {
  const prefs = await getPreferences();
  const provider = prefs.aiProvider;
  const model = prefs.aiModel;
  
  if (provider === 'anthropic') {
    return callAnthropic(prompt, model, maxTokens);
  } else {
    return callOpenAI(prompt, model, maxTokens);
  }
}

async function callAnthropic(prompt: string, model: AIModel, maxTokens: number): Promise<string> {
  const client = getAnthropicClient();
  
  const response = await client.messages.create({
    model: model,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  });
  
  const textBlock = response.content.find(block => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude');
  }
  
  return textBlock.text;
}

async function callOpenAI(prompt: string, model: AIModel, maxTokens: number): Promise<string> {
  const client = getOpenAIClient();
  
  // Handle o1 models differently - they don't support system messages or max_tokens the same way
  const isO1Model = model.startsWith('o1');
  
  if (isO1Model) {
    const response = await client.chat.completions.create({
      model: model,
      messages: [{ role: 'user', content: prompt }],
    });
    
    return response.choices[0]?.message?.content || '';
  }
  
  const response = await client.chat.completions.create({
    model: model,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  });
  
  return response.choices[0]?.message?.content || '';
}

export async function generateResume(params: {
  baseResume: string;
  jobDescription: string;
  company: string;
  role: string;
  professionalContext?: string;
  gapContext?: string;
}): Promise<string> {
  const prompt = interpolate(RESUME_PROMPT, { ...params, professionalContext: params.professionalContext || '', gapContext: params.gapContext || '' });
  return callAI(prompt, 4096);
}

export async function generateCoverLetter(params: {
  resume: string;
  jobDescription: string;
  company: string;
  role: string;
  jobUrl: string;
  professionalContext?: string;
  gapContext?: string;
  hookContext?: string;
  tone?: TonePreference;
}): Promise<string> {
  const template = getCoverLetterPrompt(params.tone || 'balanced');
  const prompt = interpolate(template, { 
    ...params, 
    professionalContext: params.professionalContext || '',
    gapContext: params.gapContext || '',
    hookContext: params.hookContext || '',
  });
  return callAI(prompt, 2048);
}

export async function generateQuestionAnswer(params: {
  resume: string;
  jobDescription: string;
  company: string;
  role: string;
  question: string;
}): Promise<string> {
  const prompt = interpolate(QUESTION_ANSWER_PROMPT, params);
  return callAI(prompt, 1024);
}

export async function assessFit(params: {
  resume: string;
  jobDescription: string;
  company: string;
  role: string;
  professionalContext?: string;
}): Promise<FitAssessment> {
  const prompt = interpolate(FIT_ASSESSMENT_PROMPT, { ...params, professionalContext: params.professionalContext || '' });
  const response = await callAI(prompt, 4096);
  
  // Parse JSON response
  const jsonText = response.trim();
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
  const response = await callAI(prompt, 4096);
  
  const jsonText = response.trim();
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
  return callAI(prompt, 4096);
}
