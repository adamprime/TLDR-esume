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
    return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400 font-mono animate-pulse">Loading settings...</p></div>;
  }

  const currentModels = config.aiProvider === 'anthropic' ? ANTHROPIC_MODELS : OPENAI_MODELS;

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.push('/dashboard')} className="text-gray-500 hover:text-accent font-bold transition-colors">← Back</button>
          <h1 className="text-3xl font-serif font-black">Settings</h1>
        </div>

        <div className="space-y-8">
          {/* AI Provider */}
          <section className="bg-paper border-2 border-ink shadow-hard p-6">
            <h2 className="font-serif font-bold text-xl mb-6 border-b-2 border-ink pb-2 inline-block">AI CONFIGURATION</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold mb-2 uppercase tracking-wider text-ink">Provider</label>
                <div className="flex gap-4">
                  <button
                    onClick={() => updateConfig({ aiProvider: 'anthropic', aiModel: 'claude-sonnet-4-5-20250929' })}
                    className={`flex-1 p-4 border-2 transition-all shadow-sm ${config.aiProvider === 'anthropic' ? 'border-accent bg-accent text-black shadow-hard-sm transform -translate-y-1' : 'border-ink bg-paper text-ink hover:border-accent hover:text-accent'}`}
                  >
                    <div className="font-bold font-serif text-lg">Anthropic</div>
                    <div className={`text-xs font-mono ${config.aiProvider === 'anthropic' ? 'text-black' : 'text-gray-400'}`}>Claude</div>
                  </button>
                  <button
                    onClick={() => updateConfig({ aiProvider: 'openai', aiModel: 'gpt-5-mini' })}
                    className={`flex-1 p-4 border-2 transition-all shadow-sm ${config.aiProvider === 'openai' ? 'border-accent bg-accent text-black shadow-hard-sm transform -translate-y-1' : 'border-ink bg-paper text-ink hover:border-accent hover:text-accent'}`}
                  >
                    <div className="font-bold font-serif text-lg">OpenAI</div>
                    <div className={`text-xs font-mono ${config.aiProvider === 'openai' ? 'text-black' : 'text-gray-400'}`}>GPT</div>
                  </button>
                </div>
              </div>

              {/* API Key Instructions */}
              <div className="bg-paper border-2 border-gray-700 p-4 shadow-inner">
                <p className="text-sm text-gray-300 mb-3 font-mono">
                  {config.aiProvider === 'anthropic' 
                    ? "To use Claude, you'll need an Anthropic API key:"
                    : "To use GPT, you'll need an OpenAI API key:"}
                </p>
                <ol className="text-sm text-gray-400 space-y-2 list-decimal list-inside font-mono">
                  {config.aiProvider === 'anthropic' ? (
                    <>
                      <li>Go to <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener" className="text-accent hover:underline">console.anthropic.com/settings/keys</a></li>
                      <li>Create an account or sign in</li>
                      <li>Click "Create Key" and give it a name</li>
                      <li>Copy the key (starts with <code className="text-accent bg-black px-1 border border-gray-700">sk-ant-</code>)</li>
                      <li>Paste it in the API Key field below</li>
                    </>
                  ) : (
                    <>
                      <li>Go to <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener" className="text-accent hover:underline">platform.openai.com/api-keys</a></li>
                      <li>Create an account or sign in</li>
                      <li>Click "Create new secret key"</li>
                      <li>Copy the key (starts with <code className="text-accent bg-black px-1 border border-gray-700">sk-</code>)</li>
                      <li>Paste it in the API Key field below</li>
                    </>
                  )}
                </ol>
                <p className="text-xs text-gray-500 mt-3 font-mono border-t border-gray-700 pt-2">
                  💡 Typical cost: $0.05–$0.20 per application (resume + cover letter)
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 uppercase tracking-wider text-ink">Model</label>
                <div className="relative">
                  <select
                    value={config.aiModel}
                    onChange={(e) => updateConfig({ aiModel: e.target.value })}
                    className="w-full px-4 py-3 bg-paper border-2 border-ink appearance-none focus:outline-none focus:border-accent focus:shadow-hard-sm transition-all font-mono text-sm"
                  >
                    {currentModels.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-ink">▼</div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 uppercase tracking-wider text-ink">
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
                    className="flex-1 px-4 py-3 bg-paper border-2 border-ink focus:outline-none focus:border-accent focus:shadow-hard-sm transition-all font-mono text-sm"
                  />
                  <button
                    onClick={validateKey}
                    disabled={isValidating}
                    className="px-6 py-2 bg-ink text-black font-bold border-2 border-ink hover:bg-accent hover:border-accent transition-all disabled:opacity-50"
                  >
                    {isValidating ? 'Testing...' : 'Test'}
                  </button>
                </div>
                {validationResult === 'valid' && <p className="text-green-500 text-sm mt-2 font-bold font-mono">✓ API KEY IS VALID</p>}
                {validationResult === 'invalid' && <p className="text-red-500 text-sm mt-2 font-bold font-mono">✗ API KEY IS INVALID</p>}
              </div>
            </div>
          </section>

          {/* User Info */}
          <section className="bg-paper border-2 border-ink shadow-hard p-6">
            <h2 className="font-serif font-bold text-xl mb-6 border-b-2 border-ink pb-2 inline-block">YOUR DOSSIER</h2>
            <p className="text-gray-400 text-sm mb-6 font-mono">Used for PDF headers and contact info.</p>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold mb-2 uppercase tracking-wider text-ink">Name</label>
                <input type="text" value={config.userName} onChange={(e) => updateConfig({ userName: e.target.value })}
                  className="w-full px-3 py-2 bg-paper border-2 border-gray-600 focus:border-accent focus:outline-none focus:shadow-hard-sm transition-all text-sm font-mono" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-2 uppercase tracking-wider text-ink">Email</label>
                <input type="email" value={config.userEmail} onChange={(e) => updateConfig({ userEmail: e.target.value })}
                  className="w-full px-3 py-2 bg-paper border-2 border-gray-600 focus:border-accent focus:outline-none focus:shadow-hard-sm transition-all text-sm font-mono" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-2 uppercase tracking-wider text-ink">Phone</label>
                <input type="tel" value={config.userPhone} onChange={(e) => updateConfig({ userPhone: e.target.value })}
                  className="w-full px-3 py-2 bg-paper border-2 border-gray-600 focus:border-accent focus:outline-none focus:shadow-hard-sm transition-all text-sm font-mono" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-2 uppercase tracking-wider text-ink">Location</label>
                <input type="text" value={config.userLocation} onChange={(e) => updateConfig({ userLocation: e.target.value })}
                  className="w-full px-3 py-2 bg-paper border-2 border-gray-600 focus:border-accent focus:outline-none focus:shadow-hard-sm transition-all text-sm font-mono" />
              </div>
            </div>
          </section>

          {/* Cover Letter Tone */}
          <section className="bg-paper border-2 border-ink shadow-hard p-6">
            <h2 className="font-serif font-bold text-xl mb-6 border-b-2 border-ink pb-2 inline-block">TONE OF VOICE</h2>
            <p className="text-gray-400 text-sm mb-6 font-mono">How should your cover letters sound?</p>
            
            <div className="flex gap-4">
              {[
                { id: 'professional', name: 'Professional', desc: 'Traditional, formal tone' },
                { id: 'balanced', name: 'Balanced', desc: 'Professional with personality' },
                { id: 'quirky', name: 'Quirky', desc: 'Witty, personality-forward' },
              ].map(tone => (
                <button
                  key={tone.id}
                  onClick={() => updateConfig({ tonePreference: tone.id })}
                  className={`flex-1 p-4 border-2 transition-all shadow-sm ${
                    config.tonePreference === tone.id 
                      ? 'border-accent bg-accent text-black shadow-hard-sm transform -translate-y-1' 
                      : 'border-ink bg-paper text-ink hover:border-accent hover:text-accent'
                  }`}
                >
                  <div className="font-bold font-serif text-lg">{tone.name}</div>
                  <div className={`text-xs font-mono mt-1 ${config.tonePreference === tone.id ? 'text-black' : 'text-gray-400'}`}>{tone.desc}</div>
                </button>
              ))}
            </div>
          </section>

          {/* PDF Style */}
          <section className="bg-paper border-2 border-ink shadow-hard p-6">
            <h2 className="font-serif font-bold text-xl mb-6 border-b-2 border-ink pb-2 inline-block">EXPORT STYLE</h2>
            <p className="text-gray-400 text-sm mb-6 font-mono">Choose the default style for exported PDFs.</p>
            
            <div className="flex gap-4">
              {PDF_STYLES.map(style => (
                <button
                  key={style.id}
                  onClick={() => updateConfig({ defaultPdfStyle: style.id })}
                  className={`flex-1 p-4 border-2 transition-all shadow-sm ${
                    config.defaultPdfStyle === style.id 
                      ? 'border-accent bg-accent text-black shadow-hard-sm transform -translate-y-1' 
                      : 'border-ink bg-paper text-ink hover:border-accent hover:text-accent'
                  }`}
                >
                  <div className="font-bold font-serif text-lg">{style.name}</div>
                  <div className={`text-xs font-mono mt-1 ${config.defaultPdfStyle === style.id ? 'text-black' : 'text-gray-400'}`}>{style.desc}</div>
                </button>
              ))}
            </div>
          </section>

          {/* Save Button */}
          <button
            onClick={saveConfig}
            disabled={isSaving}
            className="w-full py-4 bg-accent text-black text-xl font-bold border-2 border-ink shadow-hard-sm hover:shadow-hard hover:-translate-y-1 transition-all disabled:opacity-50"
          >
            {isSaving ? 'SAVING...' : 'SAVE SETTINGS'}
          </button>
        </div>
      </div>
    </div>
  );
}
