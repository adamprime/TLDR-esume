'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  UserPreferences, 
  AIProvider, 
  AIModel,
  TonePreference,
  ANTHROPIC_MODELS, 
  OPENAI_MODELS,
  getDefaultModelForProvider 
} from '@/lib/preference-types';
import { STYLE_OPTIONS } from '@/lib/types';

export default function SettingsPage() {
  const router = useRouter();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchPreferences();
  }, []);

  async function fetchPreferences() {
    try {
      const res = await fetch('/api/preferences');
      const data = await res.json();
      setPreferences(data);
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!preferences) return;
    
    setSaving(true);
    setMessage(null);
    
    try {
      const res = await fetch('/api/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...preferences, isConfigured: true }),
      });
      
      if (!res.ok) throw new Error('Failed to save');
      
      setMessage({ type: 'success', text: 'Preferences saved successfully!' });
      
      // If this was first run, redirect to dashboard
      if (!preferences.isConfigured) {
        setTimeout(() => router.push('/'), 1500);
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage({ type: 'error', text: 'Failed to save preferences.' });
    } finally {
      setSaving(false);
    }
  }

  function updateField<K extends keyof UserPreferences>(field: K, value: UserPreferences[K]) {
    if (!preferences) return;
    setPreferences({ ...preferences, [field]: value });
  }

  function handleProviderChange(provider: AIProvider) {
    if (!preferences) return;
    setPreferences({
      ...preferences,
      aiProvider: provider,
      aiModel: getDefaultModelForProvider(provider),
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-gray-400">Loading settings...</div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-red-400">Failed to load preferences</div>
      </div>
    );
  }

  const models = preferences.aiProvider === 'anthropic' ? ANTHROPIC_MODELS : OPENAI_MODELS;
  const isFirstRun = !preferences.isConfigured;

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <header className="bg-[#1a1a1a] border-b border-[#2a2a2a]">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-100">
              {isFirstRun ? 'Welcome to TLDR;esume' : 'Settings'}
            </h1>
            {!isFirstRun && (
              <Link
                href="/"
                className="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors"
              >
                Back to Dashboard
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {isFirstRun && (
          <div className="mb-8 p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
            <h2 className="text-lg font-semibold text-blue-300 mb-2">Let&apos;s get you set up!</h2>
            <p className="text-gray-300">
              Fill in your details below to personalize TLDR;esume. You&apos;ll need an API key from 
              Anthropic or OpenAI to use the AI features. Set that in your <code className="bg-[#2a2a2a] px-1 rounded">.env.local</code> file.
            </p>
          </div>
        )}

        <div className="space-y-8">
          {/* User Profile Section */}
          <section className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-100 mb-4">Your Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Full Name</label>
                <input
                  type="text"
                  value={preferences.userName}
                  onChange={(e) => updateField('userName', e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#3a3a3a] rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                <input
                  type="email"
                  value={preferences.userEmail}
                  onChange={(e) => updateField('userEmail', e.target.value)}
                  placeholder="jane@example.com"
                  className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#3a3a3a] rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Phone</label>
                <input
                  type="tel"
                  value={preferences.userPhone}
                  onChange={(e) => updateField('userPhone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#3a3a3a] rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Location</label>
                <input
                  type="text"
                  value={preferences.userLocation}
                  onChange={(e) => updateField('userLocation', e.target.value)}
                  placeholder="San Francisco, CA"
                  className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#3a3a3a] rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">LinkedIn URL</label>
                <input
                  type="url"
                  value={preferences.linkedInUrl}
                  onChange={(e) => updateField('linkedInUrl', e.target.value)}
                  placeholder="https://linkedin.com/in/janedoe"
                  className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#3a3a3a] rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">GitHub URL</label>
                <input
                  type="url"
                  value={preferences.githubUrl}
                  onChange={(e) => updateField('githubUrl', e.target.value)}
                  placeholder="https://github.com/janedoe"
                  className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#3a3a3a] rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-1">Personal Website</label>
                <input
                  type="url"
                  value={preferences.personalWebsite}
                  onChange={(e) => updateField('personalWebsite', e.target.value)}
                  placeholder="https://janedoe.com"
                  className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#3a3a3a] rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </section>

          {/* Target Roles Section */}
          <section className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-100 mb-4">Target Roles</h2>
            <p className="text-sm text-gray-400 mb-4">
              This helps the AI understand what types of roles you&apos;re pursuing for better tailored content.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Role Types</label>
                <input
                  type="text"
                  value={preferences.targetRoleTypes}
                  onChange={(e) => updateField('targetRoleTypes', e.target.value)}
                  placeholder="e.g., Product Management, Engineering Leadership, Technical Program Management"
                  className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#3a3a3a] rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Target Industries</label>
                <input
                  type="text"
                  value={preferences.targetIndustries}
                  onChange={(e) => updateField('targetIndustries', e.target.value)}
                  placeholder="e.g., Tech, Fintech, AI/ML, Healthcare"
                  className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#3a3a3a] rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </section>

          {/* AI Settings Section */}
          <section className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-100 mb-4">AI Settings</h2>
            <p className="text-sm text-gray-400 mb-4">
              Set your API key in <code className="bg-[#2a2a2a] px-1 rounded">.env.local</code>: 
              use <code className="bg-[#2a2a2a] px-1 rounded">ANTHROPIC_API_KEY</code> or <code className="bg-[#2a2a2a] px-1 rounded">OPENAI_API_KEY</code>
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">AI Provider</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="provider"
                      checked={preferences.aiProvider === 'anthropic'}
                      onChange={() => handleProviderChange('anthropic')}
                      className="w-4 h-4 text-blue-500"
                    />
                    <span className="text-gray-200">Anthropic (Claude)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="provider"
                      checked={preferences.aiProvider === 'openai'}
                      onChange={() => handleProviderChange('openai')}
                      className="w-4 h-4 text-blue-500"
                    />
                    <span className="text-gray-200">OpenAI (GPT)</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Model</label>
                <div className="space-y-2">
                  {models.map((model) => (
                    <label key={model.value} className="flex items-start gap-3 cursor-pointer p-2 rounded hover:bg-[#252525]">
                      <input
                        type="radio"
                        name="model"
                        checked={preferences.aiModel === model.value}
                        onChange={() => updateField('aiModel', model.value)}
                        className="w-4 h-4 mt-0.5 text-blue-500"
                      />
                      <div>
                        <div className="text-gray-200">{model.label}</div>
                        <div className="text-sm text-gray-500">{model.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Style Preferences Section */}
          <section className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-100 mb-4">Style Preferences</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Cover Letter Tone</label>
                <div className="flex gap-4">
                  {[
                    { value: 'quirky', label: 'Quirky', desc: 'Witty, personality-forward' },
                    { value: 'balanced', label: 'Balanced', desc: 'Professional with personality' },
                    { value: 'professional', label: 'Professional', desc: 'Traditional, formal' },
                  ].map((tone) => (
                    <label key={tone.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="tone"
                        checked={preferences.tonePreference === tone.value}
                        onChange={() => updateField('tonePreference', tone.value as TonePreference)}
                        className="w-4 h-4 text-blue-500"
                      />
                      <div>
                        <span className="text-gray-200">{tone.label}</span>
                        <span className="text-xs text-gray-500 ml-1">({tone.desc})</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Default PDF Style</label>
                <select
                  value={preferences.defaultPdfStyle}
                  onChange={(e) => updateField('defaultPdfStyle', e.target.value)}
                  className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#3a3a3a] rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {STYLE_OPTIONS.map((style) => (
                    <option key={style.value} value={style.value}>
                      {style.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Save Button */}
          <div className="flex items-center justify-between">
            {message && (
              <div className={`px-4 py-2 rounded ${message.type === 'success' ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
                {message.text}
              </div>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="ml-auto px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : isFirstRun ? 'Save & Get Started' : 'Save Preferences'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
