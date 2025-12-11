// Client-safe types and constants for preferences
// This file can be imported by both client and server components

export type AIProvider = 'anthropic' | 'openai';

export type AnthropicModel = 'claude-opus-4-5-20251101' | 'claude-sonnet-4-5-20250929' | 'claude-haiku-4-5-20251001';
export type OpenAIModel = 'gpt-5.1' | 'gpt-5-pro' | 'gpt-5-mini' | 'gpt-5-nano';
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
  aiModel: 'claude-sonnet-4-5-20250929',
  tonePreference: 'balanced',
  defaultPdfStyle: 'modern',
  isConfigured: false,
};

export const ANTHROPIC_MODELS: { value: AnthropicModel; label: string; description: string }[] = [
  { value: 'claude-opus-4-5-20251101', label: 'Claude Opus 4.5', description: 'Most capable, best quality (expensive)' },
  { value: 'claude-sonnet-4-5-20250929', label: 'Claude Sonnet 4.5', description: 'Great balance of quality and cost' },
  { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5', description: 'Fast and affordable' },
];

export const OPENAI_MODELS: { value: OpenAIModel; label: string; description: string }[] = [
  { value: 'gpt-5.1', label: 'GPT-5.1', description: 'Latest GPT model' },
  { value: 'gpt-5-pro', label: 'GPT-5 Pro', description: 'Most capable, best quality (expensive)' },
  { value: 'gpt-5-mini', label: 'GPT-5 Mini', description: 'Great balance of quality and cost' },
  { value: 'gpt-5-nano', label: 'GPT-5 Nano', description: 'Fast and affordable' },
];

export function getDefaultModelForProvider(provider: AIProvider): AIModel {
  return provider === 'anthropic' ? 'claude-sonnet-4-5-20250929' : 'gpt-5-mini';
}
