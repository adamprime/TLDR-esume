// Server-only imports - this file should only be used in API routes
import fs from 'fs/promises';
import path from 'path';

// Re-export types from the shared types file
export type { 
  AIProvider, 
  AIModel, 
  AnthropicModel, 
  OpenAIModel, 
  TonePreference, 
  UserPreferences 
} from './preference-types';

export { 
  ANTHROPIC_MODELS, 
  OPENAI_MODELS, 
  DEFAULT_PREFERENCES,
  getDefaultModelForProvider 
} from './preference-types';

import { DEFAULT_PREFERENCES, UserPreferences } from './preference-types';

const PROJECT_PATH = process.env.RESUME_PROJECT_PATH || process.cwd().replace('/resume-app', '');

function getPreferencesPath(): string {
  return path.join(PROJECT_PATH, 'preferences.json');
}

export async function getPreferences(): Promise<UserPreferences> {
  try {
    const content = await fs.readFile(getPreferencesPath(), 'utf-8');
    const saved = JSON.parse(content);
    return { ...DEFAULT_PREFERENCES, ...saved };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export async function savePreferences(preferences: Partial<UserPreferences>): Promise<UserPreferences> {
  const current = await getPreferences();
  const updated = { ...current, ...preferences };
  await fs.writeFile(getPreferencesPath(), JSON.stringify(updated, null, 2));
  return updated;
}

export async function isFirstRun(): Promise<boolean> {
  const prefs = await getPreferences();
  return !prefs.isConfigured;
}
