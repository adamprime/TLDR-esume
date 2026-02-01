/**
 * Browser-based AI API calls
 * Direct calls to Anthropic/OpenAI from the browser (no backend needed)
 */

export interface AIConfig {
  aiProvider: 'anthropic' | 'openai';
  aiModel: string;
  anthropicApiKey: string;
  openaiApiKey: string;
}

/**
 * Call Anthropic Claude API directly from browser
 */
export async function callAnthropic(
  apiKey: string,
  model: string,
  prompt: string,
  maxTokens: number = 4096
): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Anthropic API error');
  }

  const data = await response.json();
  return data.content[0].text;
}

/**
 * Call OpenAI API directly from browser
 */
export async function callOpenAI(
  apiKey: string,
  model: string,
  prompt: string,
  maxTokens: number = 4096
): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_completion_tokens: maxTokens,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'OpenAI API error');
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Unified AI call that routes to the appropriate provider
 */
export async function callAI(
  config: AIConfig,
  prompt: string,
  maxTokens: number = 4096
): Promise<string> {
  if (config.aiProvider === 'anthropic') {
    if (!config.anthropicApiKey) {
      throw new Error('API key not configured for Anthropic');
    }
    return callAnthropic(config.anthropicApiKey, config.aiModel, prompt, maxTokens);
  } else if (config.aiProvider === 'openai') {
    if (!config.openaiApiKey) {
      throw new Error('API key not configured for OpenAI');
    }
    return callOpenAI(config.openaiApiKey, config.aiModel, prompt, maxTokens);
  }

  throw new Error(`Unknown AI provider: ${config.aiProvider}`);
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate an API key by making a minimal test request
 */
export async function validateApiKey(
  provider: 'anthropic' | 'openai',
  apiKey: string
): Promise<ValidationResult> {
  try {
    if (provider === 'anthropic') {
      await callAnthropic(apiKey, 'claude-haiku-4-5-20251001', 'Say "ok"', 10);
    } else {
      await callOpenAI(apiKey, 'gpt-5-nano', 'Say "ok"', 10);
    }
    return { valid: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { valid: false, error: message };
  }
}
