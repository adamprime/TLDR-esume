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
      const result = await validateApiKey(provider, apiKey);
      
      if (!result.valid) {
        setError(result.error || 'Invalid API key. Please check and try again.');
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
    <div className="min-h-screen flex items-center justify-center p-6 bg-paper">
      <div className="max-w-lg w-full">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <div className="w-10 h-10 rounded-full bg-green-500 text-black border-2 border-green-500 flex items-center justify-center text-sm font-bold shadow-hard-sm">✓</div>
          <div className="w-16 h-0.5 bg-green-500" />
          <div className="w-10 h-10 rounded-full bg-accent text-black border-2 border-ink flex items-center justify-center text-sm font-bold shadow-hard-sm">2</div>
          <div className="w-16 h-0.5 bg-ink" />
          <div className="w-10 h-10 rounded-full bg-paper border-2 border-ink text-gray-500 flex items-center justify-center text-sm font-bold">3</div>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-serif font-black mb-6">Connect Your AI Provider</h1>
          <p className="text-gray-400 font-mono text-sm leading-relaxed">
            TL;DResume uses your own AI API key. Your key stays on your computer
            and goes directly to the AI provider.
          </p>
        </div>

        {/* Provider selection */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setProvider('anthropic')}
            className={`flex-1 p-4 border-2 transition-all shadow-sm group ${
              provider === 'anthropic'
                ? 'border-accent bg-accent text-black shadow-hard-sm transform -translate-y-1'
                : 'border-ink bg-paper text-ink hover:border-accent hover:text-accent'
            }`}
          >
            <div className="font-serif font-bold text-lg">Anthropic</div>
            <div className={`text-xs font-mono mt-1 ${provider === 'anthropic' ? 'text-black' : 'text-gray-400'}`}>Claude (Recommended)</div>
          </button>
          <button
            onClick={() => setProvider('openai')}
            className={`flex-1 p-4 border-2 transition-all shadow-sm group ${
              provider === 'openai'
                ? 'border-accent bg-accent text-black shadow-hard-sm transform -translate-y-1'
                : 'border-ink bg-paper text-ink hover:border-accent hover:text-accent'
            }`}
          >
            <div className="font-serif font-bold text-lg">OpenAI</div>
            <div className={`text-xs font-mono mt-1 ${provider === 'openai' ? 'text-black' : 'text-gray-400'}`}>GPT</div>
          </button>
        </div>

        {/* Instructions */}
        <div className="bg-paper border-2 border-ink shadow-inner p-6 mb-8">
          <p className="text-sm font-bold font-serif mb-4 text-ink uppercase tracking-wider">
            {provider === 'anthropic' 
              ? "To use Claude, you'll need an Anthropic API key:"
              : "To use GPT, you'll need an OpenAI API key:"}
          </p>
          <ol className="text-sm text-gray-400 space-y-3 list-decimal list-inside font-mono text-xs">
            {provider === 'anthropic' ? (
              <>
                <li>Go to <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener" className="text-accent hover:underline">console.anthropic.com/settings/keys</a></li>
                <li>Create an account or sign in</li>
                <li>Click "Create Key" and give it a name</li>
                <li>Copy the key (starts with <code className="text-accent bg-black px-1 border border-gray-700">sk-ant-</code>)</li>
                <li>Paste it below</li>
              </>
            ) : (
              <>
                <li>Go to <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener" className="text-accent hover:underline">platform.openai.com/api-keys</a></li>
                <li>Create an account or sign in</li>
                <li>Click "Create new secret key"</li>
                <li>Copy the key (starts with <code className="text-accent bg-black px-1 border border-gray-700">sk-</code>)</li>
                <li>Paste it below</li>
              </>
            )}
          </ol>
          <p className="text-[10px] text-gray-500 mt-4 font-mono border-t border-gray-700 pt-3 uppercase tracking-wider">
            💡 Typical cost: $0.05–$0.20 per application
          </p>
        </div>

        {/* API key input */}
        <div className="mb-8">
          <label className="block text-xs font-bold mb-2 uppercase tracking-wider font-serif">
            {provider === 'anthropic' ? 'Anthropic' : 'OpenAI'} API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={provider === 'anthropic' ? 'sk-ant-...' : 'sk-...'}
            className="w-full px-4 py-3 bg-paper border-2 border-ink focus:outline-none focus:border-accent focus:shadow-hard-sm transition-all font-mono text-sm"
          />
        </div>

        <button
          onClick={handleContinue}
          disabled={isValidating || !apiKey.trim()}
          className="w-full py-4 bg-accent text-black text-xl font-bold border-2 border-ink shadow-hard-sm hover:shadow-hard hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
        >
          {isValidating ? 'Validating...' : 'Continue'}
        </button>

        {error && (
          <p className="mt-6 text-red-500 font-bold font-mono text-center bg-red-100/10 p-2 border-2 border-red-500">{error}</p>
        )}

        <p className="mt-8 text-xs text-gray-500 text-center font-mono uppercase tracking-widest">
          Your API key is stored locally in your data folder, never on our servers.
        </p>
      </div>
    </div>
  );
}
