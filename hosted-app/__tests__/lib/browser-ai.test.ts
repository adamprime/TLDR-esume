import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  callAnthropic,
  callOpenAI,
  callAI,
  validateApiKey,
} from '@/lib/browser-ai';

// Mock fetch
const mockFetch = vi.fn();
(globalThis as any).fetch = mockFetch;

describe('browser-ai', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('callAnthropic', () => {
    it('should make request to Anthropic API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [{ type: 'text', text: 'Hello from Claude' }],
        }),
      });

      const result = await callAnthropic(
        'sk-ant-test-key',
        'claude-sonnet-4-5-20250929',
        'Say hello'
      );

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'x-api-key': 'sk-ant-test-key',
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          }),
        })
      );
      expect(result).toBe('Hello from Claude');
    });

    it('should throw on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Invalid API key' } }),
      });

      await expect(
        callAnthropic('bad-key', 'claude-sonnet-4-5-20250929', 'test')
      ).rejects.toThrow('Invalid API key');
    });
  });

  describe('callOpenAI', () => {
    it('should make request to OpenAI API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Hello from GPT' } }],
        }),
      });

      const result = await callOpenAI(
        'sk-openai-test-key',
        'gpt-5-mini',
        'Say hello'
      );

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer sk-openai-test-key',
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(result).toBe('Hello from GPT');
    });

    it('should throw on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Invalid API key' } }),
      });

      await expect(
        callOpenAI('bad-key', 'gpt-5-mini', 'test')
      ).rejects.toThrow('Invalid API key');
    });
  });

  describe('callAI', () => {
    it('should route to Anthropic when provider is anthropic', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [{ type: 'text', text: 'Response' }],
        }),
      });

      const config = {
        aiProvider: 'anthropic' as const,
        aiModel: 'claude-sonnet-4-5-20250929',
        anthropicApiKey: 'sk-ant-key',
        openaiApiKey: '',
      };

      await callAI(config, 'test prompt');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.anything()
      );
    });

    it('should route to OpenAI when provider is openai', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Response' } }],
        }),
      });

      const config = {
        aiProvider: 'openai' as const,
        aiModel: 'gpt-5-mini',
        anthropicApiKey: '',
        openaiApiKey: 'sk-openai-key',
      };

      await callAI(config, 'test prompt');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.anything()
      );
    });

    it('should throw if API key is missing', async () => {
      const config = {
        aiProvider: 'anthropic' as const,
        aiModel: 'claude-sonnet-4-5-20250929',
        anthropicApiKey: '',
        openaiApiKey: '',
      };

      await expect(callAI(config, 'test')).rejects.toThrow('API key not configured');
    });
  });

  describe('validateApiKey', () => {
    it('should return true for valid Anthropic key', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [{ type: 'text', text: 'test' }],
        }),
      });

      const result = await validateApiKey('anthropic', 'sk-ant-valid');
      expect(result).toBe(true);
    });

    it('should return false for invalid Anthropic key', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Invalid' } }),
      });

      const result = await validateApiKey('anthropic', 'sk-ant-invalid');
      expect(result).toBe(false);
    });

    it('should return true for valid OpenAI key', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'test' } }],
        }),
      });

      const result = await validateApiKey('openai', 'sk-openai-valid');
      expect(result).toBe(true);
    });

    it('should return false for invalid OpenAI key', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Invalid' } }),
      });

      const result = await validateApiKey('openai', 'sk-openai-invalid');
      expect(result).toBe(false);
    });
  });
});
