'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { readFile, writeFile } from '@/lib/browser-fs';
import { getSavedFolderHandle } from '@/lib/folder-handle';
import { validateApiKey } from '@/lib/browser-ai';
import { PDF_STYLES, PdfStyle } from '@/lib/pdf-styles';

interface Config {
  userName: string;
  userEmail: string;
  userPhone: string;
  userLocation: string;
  linkedInUrl: string;
  githubUrl: string;
  personalWebsite: string;
  aiProvider: 'anthropic' | 'openai';
  aiModel: string;
  anthropicApiKey: string;
  openaiApiKey: string;
  tonePreference: string;
  defaultPdfStyle: string;
  onboardingComplete: boolean;
}

const ANTHROPIC_MODELS = [
  { id: 'claude-opus-4-5-20251101', name: 'Claude Opus 4.5 (Best)' },
  { id: 'claude-sonnet-4-5-20250929', name: 'Claude Sonnet 4.5 (Recommended)' },
  { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5 (Fast)' },
];

const OPENAI_MODELS = [
  { id: 'gpt-5.1', name: 'GPT-5.1 (Latest)' },
  { id: 'gpt-5-pro', name: 'GPT-5 Pro (Best)' },
  { id: 'gpt-5-mini', name: 'GPT-5 Mini (Recommended)' },
  { id: 'gpt-5-nano', name: 'GPT-5 Nano (Fast)' },
];

export default function SettingsPage() {
  const router = useRouter();
  const [config, setConfig] = useState<Config | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<'valid' | 'invalid' | null>(null);
  const [handle, setHandle] = useState<FileSystemDirectoryHandle | null>(null);

  useEffect(() => {
    async function init() {
      const h = await getSavedFolderHandle();
      if (!h) { router.push('/'); return; }
      setHandle(h);
      
      try {
        const configJson = await readFile(h, 'config.json');
        setConfig(JSON.parse(configJson));
      } catch {
        router.push('/');
      }
    }
    init();
  }, [router]);

  async function saveConfig() {
    if (!handle || !config) return;
    setIsSaving(true);
    try {
      await writeFile(handle, 'config.json', JSON.stringify(config, null, 2));
    } catch (err) {
      console.error('Failed to save config:', err);
    } finally {
      setIsSaving(false);
    }
  }

  async function validateKey() {
    if (!config) return;
    const key = config.aiProvider === 'anthropic' ? config.anthropicApiKey : config.openaiApiKey;
    if (!key) return;

    setIsValidating(true);
    setValidationResult(null);
    
    const isValid = await validateApiKey(config.aiProvider, key);
    setValidationResult(isValid ? 'valid' : 'invalid');
    setIsValidating(false);
  }

  function updateConfig(updates: Partial<Config>) {
    if (!config) return;
    setConfig({ ...config, ...updates });
    setValidationResult(null);
  }

  if (!config) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Loading...</p></div>;
  }

  const currentModels = config.aiProvider === 'anthropic' ? ANTHROPIC_MODELS : OPENAI_MODELS;

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-white">← Back</button>
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>

        <div className="space-y-8">
          {/* AI Provider */}
          <section className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
            <h2 className="font-semibold mb-4">AI Configuration</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Provider</label>
                <div className="flex gap-4">
                  <button
                    onClick={() => updateConfig({ aiProvider: 'anthropic', aiModel: 'claude-sonnet-4-5-20250929' })}
                    className={`flex-1 p-3 rounded-lg border transition-colors ${config.aiProvider === 'anthropic' ? 'border-blue-600 bg-blue-600/10' : 'border-[#2a2a2a] hover:border-gray-600'}`}
                  >
                    <div className="font-medium">Anthropic</div>
                    <div className="text-xs text-gray-400">Claude</div>
                  </button>
                  <button
                    onClick={() => updateConfig({ aiProvider: 'openai', aiModel: 'gpt-5-mini' })}
                    className={`flex-1 p-3 rounded-lg border transition-colors ${config.aiProvider === 'openai' ? 'border-blue-600 bg-blue-600/10' : 'border-[#2a2a2a] hover:border-gray-600'}`}
                  >
                    <div className="font-medium">OpenAI</div>
                    <div className="text-xs text-gray-400">GPT</div>
                  </button>
                </div>
              </div>

              {/* API Key Instructions */}
              <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4">
                <p className="text-sm text-gray-300 mb-3">
                  {config.aiProvider === 'anthropic' 
                    ? "To use Claude, you'll need an Anthropic API key:"
                    : "To use GPT, you'll need an OpenAI API key:"}
                </p>
                <ol className="text-sm text-gray-400 space-y-2 list-decimal list-inside">
                  {config.aiProvider === 'anthropic' ? (
                    <>
                      <li>Go to <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener" className="text-blue-400 hover:text-blue-300">console.anthropic.com/settings/keys</a></li>
                      <li>Create an account or sign in</li>
                      <li>Click "Create Key" and give it a name</li>
                      <li>Copy the key (starts with <code className="text-gray-300 bg-[#2a2a2a] px-1 rounded">sk-ant-</code>)</li>
                      <li>Paste it in the API Key field below</li>
                    </>
                  ) : (
                    <>
                      <li>Go to <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener" className="text-blue-400 hover:text-blue-300">platform.openai.com/api-keys</a></li>
                      <li>Create an account or sign in</li>
                      <li>Click "Create new secret key"</li>
                      <li>Copy the key (starts with <code className="text-gray-300 bg-[#2a2a2a] px-1 rounded">sk-</code>)</li>
                      <li>Paste it in the API Key field below</li>
                    </>
                  )}
                </ol>
                <p className="text-xs text-gray-500 mt-3">
                  💡 Typical cost: $0.05–$0.20 per application (resume + cover letter)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Model</label>
                <select
                  value={config.aiModel}
                  onChange={(e) => updateConfig({ aiModel: e.target.value })}
                  className="w-full px-4 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg focus:outline-none focus:border-blue-600"
                >
                  {currentModels.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {config.aiProvider === 'anthropic' ? 'Anthropic' : 'OpenAI'} API Key
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={config.aiProvider === 'anthropic' ? config.anthropicApiKey : config.openaiApiKey}
                    onChange={(e) => updateConfig(config.aiProvider === 'anthropic' 
                      ? { anthropicApiKey: e.target.value } 
                      : { openaiApiKey: e.target.value }
                    )}
                    placeholder={config.aiProvider === 'anthropic' ? 'sk-ant-...' : 'sk-...'}
                    className="flex-1 px-4 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg focus:outline-none focus:border-blue-600"
                  />
                  <button
                    onClick={validateKey}
                    disabled={isValidating}
                    className="px-4 py-2 bg-[#2a2a2a] text-white rounded-lg hover:bg-[#3a3a3a] disabled:opacity-50"
                  >
                    {isValidating ? 'Testing...' : 'Test'}
                  </button>
                </div>
                {validationResult === 'valid' && <p className="text-green-400 text-sm mt-1">API key is valid</p>}
                {validationResult === 'invalid' && <p className="text-red-400 text-sm mt-1">API key is invalid</p>}
              </div>
            </div>
          </section>

          {/* User Info */}
          <section className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
            <h2 className="font-semibold mb-4">Your Information</h2>
            <p className="text-gray-400 text-sm mb-4">Used for PDF headers and contact info.</p>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input type="text" value={config.userName} onChange={(e) => updateConfig({ userName: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg focus:outline-none focus:border-blue-600 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input type="email" value={config.userEmail} onChange={(e) => updateConfig({ userEmail: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg focus:outline-none focus:border-blue-600 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input type="tel" value={config.userPhone} onChange={(e) => updateConfig({ userPhone: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg focus:outline-none focus:border-blue-600 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input type="text" value={config.userLocation} onChange={(e) => updateConfig({ userLocation: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg focus:outline-none focus:border-blue-600 text-sm" />
              </div>
            </div>
          </section>

          {/* Cover Letter Tone */}
          <section className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
            <h2 className="font-semibold mb-4">Cover Letter Tone</h2>
            <p className="text-gray-400 text-sm mb-4">How should your cover letters sound?</p>
            
            <div className="flex gap-4">
              {[
                { id: 'professional', name: 'Professional', desc: 'Traditional, formal tone' },
                { id: 'balanced', name: 'Balanced', desc: 'Professional with personality' },
                { id: 'quirky', name: 'Quirky', desc: 'Witty, personality-forward' },
              ].map(tone => (
                <button
                  key={tone.id}
                  onClick={() => updateConfig({ tonePreference: tone.id })}
                  className={`flex-1 p-4 rounded-lg border transition-colors ${
                    config.tonePreference === tone.id 
                      ? 'border-blue-600 bg-blue-600/10' 
                      : 'border-[#2a2a2a] hover:border-gray-600'
                  }`}
                >
                  <div className="font-medium">{tone.name}</div>
                  <div className="text-xs text-gray-400 mt-1">{tone.desc}</div>
                </button>
              ))}
            </div>
          </section>

          {/* PDF Style */}
          <section className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
            <h2 className="font-semibold mb-4">PDF Export Style</h2>
            <p className="text-gray-400 text-sm mb-4">Choose the default style for exported PDFs.</p>
            
            <div className="flex gap-4">
              {PDF_STYLES.map(style => (
                <button
                  key={style.id}
                  onClick={() => updateConfig({ defaultPdfStyle: style.id })}
                  className={`flex-1 p-4 rounded-lg border transition-colors ${
                    config.defaultPdfStyle === style.id 
                      ? 'border-blue-600 bg-blue-600/10' 
                      : 'border-[#2a2a2a] hover:border-gray-600'
                  }`}
                >
                  <div className="font-medium">{style.name}</div>
                  <div className="text-xs text-gray-400 mt-1">{style.desc}</div>
                </button>
              ))}
            </div>
          </section>

          {/* Save Button */}
          <button
            onClick={saveConfig}
            disabled={isSaving}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
