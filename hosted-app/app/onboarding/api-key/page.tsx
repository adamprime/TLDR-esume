'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { readFile, writeFile } from '@/lib/browser-fs';
import { getSavedFolderHandle } from '@/lib/folder-handle';
import { validateApiKey } from '@/lib/browser-ai';

type Provider = 'anthropic' | 'openai';

export default function ApiKeyPage() {
  const router = useRouter();
  const [provider, setProvider] = useState<Provider>('anthropic');
  const [apiKey, setApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if we have a folder handle
    async function checkHandle() {
      const handle = await getSavedFolderHandle();
      if (!handle) {
        router.push('/onboarding/folder');
      }
    }
    checkHandle();
  }, [router]);

  async function handleContinue() {
    if (!apiKey.trim()) {
      setError('Please enter an API key');
      return;
    }

    setError(null);
    setIsValidating(true);

    try {
      // Validate the API key
      const isValid = await validateApiKey(provider, apiKey);
      
      if (!isValid) {
        setError('Invalid API key. Please check and try again.');
        setIsValidating(false);
        return;
      }

      // Save to config
      const handle = await getSavedFolderHandle();
      if (!handle) {
        router.push('/onboarding/folder');
        return;
      }

      const configContent = await readFile(handle, 'config.json');
      const config = JSON.parse(configContent);
      
      config.aiProvider = provider;
      config.aiModel = provider === 'anthropic' ? 'claude-sonnet-4-5-20250929' : 'gpt-5-mini';
      if (provider === 'anthropic') {
        config.anthropicApiKey = apiKey;
      } else {
        config.openaiApiKey = apiKey;
      }

      await writeFile(handle, 'config.json', JSON.stringify(config, null, 2));

      router.push('/onboarding/resume');
    } catch (err) {
      setError('Failed to save API key. Please try again.');
      console.error(err);
    } finally {
      setIsValidating(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-sm">✓</div>
          <div className="w-12 h-0.5 bg-blue-600" />
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">2</div>
          <div className="w-12 h-0.5 bg-gray-700" />
          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm">3</div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-4">Connect Your AI Provider</h1>
          <p className="text-gray-400">
            TLDR;esume uses your own AI API key. Your key stays on your computer
            and goes directly to the AI provider.
          </p>
        </div>

        {/* Provider selection */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setProvider('anthropic')}
            className={`flex-1 p-4 rounded-lg border transition-colors ${
              provider === 'anthropic'
                ? 'border-blue-600 bg-blue-600/10'
                : 'border-[#2a2a2a] bg-[#1a1a1a] hover:border-gray-600'
            }`}
          >
            <div className="font-semibold">Anthropic</div>
            <div className="text-sm text-gray-400">Claude (Recommended)</div>
          </button>
          <button
            onClick={() => setProvider('openai')}
            className={`flex-1 p-4 rounded-lg border transition-colors ${
              provider === 'openai'
                ? 'border-blue-600 bg-blue-600/10'
                : 'border-[#2a2a2a] bg-[#1a1a1a] hover:border-gray-600'
            }`}
          >
            <div className="font-semibold">OpenAI</div>
            <div className="text-sm text-gray-400">GPT</div>
          </button>
        </div>

        {/* Instructions */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-300 mb-3">
            {provider === 'anthropic' 
              ? "To use Claude, you'll need an Anthropic API key:"
              : "To use GPT, you'll need an OpenAI API key:"}
          </p>
          <ol className="text-sm text-gray-400 space-y-2 list-decimal list-inside">
            {provider === 'anthropic' ? (
              <>
                <li>Go to <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener" className="text-blue-400 hover:text-blue-300">console.anthropic.com/settings/keys</a></li>
                <li>Create an account or sign in</li>
                <li>Click "Create Key" and give it a name</li>
                <li>Copy the key (starts with <code className="text-gray-300 bg-[#2a2a2a] px-1 rounded">sk-ant-</code>)</li>
                <li>Paste it below</li>
              </>
            ) : (
              <>
                <li>Go to <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener" className="text-blue-400 hover:text-blue-300">platform.openai.com/api-keys</a></li>
                <li>Create an account or sign in</li>
                <li>Click "Create new secret key"</li>
                <li>Copy the key (starts with <code className="text-gray-300 bg-[#2a2a2a] px-1 rounded">sk-</code>)</li>
                <li>Paste it below</li>
              </>
            )}
          </ol>
          <p className="text-xs text-gray-500 mt-3">
            💡 Typical cost: $0.05–$0.20 per application (resume + cover letter)
          </p>
        </div>

        {/* API key input */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            {provider === 'anthropic' ? 'Anthropic' : 'OpenAI'} API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={provider === 'anthropic' ? 'sk-ant-...' : 'sk-...'}
            className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg focus:outline-none focus:border-blue-600"
          />
        </div>

        <button
          onClick={handleContinue}
          disabled={isValidating || !apiKey.trim()}
          className="w-full py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isValidating ? 'Validating...' : 'Continue'}
        </button>

        {error && (
          <p className="mt-4 text-red-400 text-center">{error}</p>
        )}

        <p className="mt-6 text-sm text-gray-500 text-center">
          Your API key is stored locally in your data folder, never on our servers.
        </p>
      </div>
    </div>
  );
}
