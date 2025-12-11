// Client-safe types and constants for preferences
// This file can be imported by both client and server components

export type AIProvider = 'anthropic' | 'openai';

export type AnthropicModel = 'claude-sonnet-4-20250514' | 'claude-opus-4-20250514' | 'claude-3-5-haiku-20241022';
export type OpenAIModel = 'gpt-4o' | 'gpt-4o-mini' | 'gpt-4-turbo' | 'o1' | 'o1-mini';
export type AIModel = AnthropicModel | OpenAIModel;

export type TonePreference = 'quirky' | 'professional' | 'balanced';

export interface UserPreferences {
  // User profile
  userName: string;
  userEmail: string;
  userPhone: string;
  userLocation: string;
  linkedInUrl: string;
  githubUrl: string;
  personalWebsite: string;
  
  // Target roles
  targetRoleTypes: string;
  targetIndustries: string;
  
  // AI settings
  aiProvider: AIProvider;
  aiModel: AIModel;
  
  // Style preferences
  tonePreference: TonePreference;
  defaultPdfStyle: string;
  
  // Setup tracking
  isConfigured: boolean;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  userName: '',
  userEmail: '',
  userPhone: '',
  userLocation: '',
  linkedInUrl: '',
  githubUrl: '',
  personalWebsite: '',
  targetRoleTypes: '',
  targetIndustries: '',
  aiProvider: 'anthropic',
  aiModel: 'claude-sonnet-4-20250514',
  tonePreference: 'balanced',
  defaultPdfStyle: 'modern',
  isConfigured: false,
};

export const ANTHROPIC_MODELS: { value: AnthropicModel; label: string; description: string }[] = [
  { value: 'claude-opus-4-20250514', label: 'Claude Opus 4', description: 'Most capable, best quality (expensive)' },
  { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4', description: 'Great balance of quality and cost' },
  { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku', description: 'Fast and affordable' },
];

export const OPENAI_MODELS: { value: OpenAIModel; label: string; description: string }[] = [
  { value: 'gpt-4o', label: 'GPT-4o', description: 'Most capable OpenAI model' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini', description: 'Fast and affordable' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', description: 'Previous generation, still excellent' },
  { value: 'o1', label: 'o1', description: 'Advanced reasoning (expensive)' },
  { value: 'o1-mini', label: 'o1 Mini', description: 'Reasoning model, more affordable' },
];

export function getDefaultModelForProvider(provider: AIProvider): AIModel {
  return provider === 'anthropic' ? 'claude-sonnet-4-20250514' : 'gpt-4o';
}
