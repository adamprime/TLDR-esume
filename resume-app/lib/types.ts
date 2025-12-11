export interface Application {
  id: string;
  company: string;
  role: string;
  jobUrl: string;
  jobDescription: string;
  baseResume: string;
  style: StyleOption;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export type ApplicationStatus = 
  | 'draft' 
  | 'submitted' 
  | 'interviewing' 
  | 'rejected' 
  | 'offer';

export type StyleOption = 
  | 'courier-new'
  | 'ibm-plex-mono'
  | 'courier-prime'
  | 'jetbrains-mono'
  | 'modern';

export interface BaseResume {
  filename: string;
  name: string;
  path: string;
}

export interface ApplicationQuestion {
  id: string;
  question: string;
  answer: string;
}

export interface FitStrength {
  area: string;
  evidence: string;
}

export interface FitGap {
  id: string;
  area: string;
  concern: string;
  question: string;
  userContext: string;
}

export interface FitAssessment {
  overallAssessment: string;
  fitScore: number; // 1-10
  recommendation: 'strong_fit' | 'worth_applying' | 'stretch' | 'long_shot' | 'not_recommended';
  strengths: FitStrength[];
  gaps: FitGap[];
  dealbreakers: string[];
  assessedAt: string;
}

export interface ResumeStrength {
  area: string;
  detail: string;
}

export interface ResumeWeakness {
  id: string;
  area: string;
  detail: string;
  suggestion: string;
}

export interface ResumeQuestion {
  id: string;
  question: string;
  context: string;
  answer: string;
}

export interface ResumeReview {
  resumeFile: string;
  overallGrade: string;
  overallFeedback: string;
  strengths: ResumeStrength[];
  weaknesses: ResumeWeakness[];
  questions: ResumeQuestion[];
  reviewedAt: string;
  improvedResume?: string;
  improvementsAppliedAt?: string;
}

export const STYLE_OPTIONS: { value: StyleOption; label: string; font: string }[] = [
  { value: 'ibm-plex-mono', label: 'IBM Plex Mono', font: 'IBM Plex Mono' },
  { value: 'jetbrains-mono', label: 'JetBrains Mono', font: 'JetBrains Mono' },
  { value: 'courier-prime', label: 'Courier Prime', font: 'Courier Prime' },
  { value: 'courier-new', label: 'Courier New', font: 'Courier New' },
  { value: 'modern', label: 'Modern (Inter)', font: 'Inter' },
];

export const STATUS_OPTIONS: { value: ApplicationStatus; label: string; color: string }[] = [
  { value: 'draft', label: 'Draft', color: 'bg-gray-500' },
  { value: 'submitted', label: 'Submitted', color: 'bg-blue-500' },
  { value: 'interviewing', label: 'Interviewing', color: 'bg-yellow-500' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-500' },
  { value: 'offer', label: 'Offer', color: 'bg-green-500' },
];
