'use client';

import { useState } from 'react';
import MDEditor from '@uiw/react-md-editor';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave?: () => void;
  onExportPDF?: () => void;
  onRegenerate?: () => void;
  saving?: boolean;
  exporting?: boolean;
  regenerating?: boolean;
}

export default function MarkdownEditor({
  value,
  onChange,
  onSave,
  onExportPDF,
  onRegenerate,
  saving = false,
  exporting = false,
  regenerating = false,
}: MarkdownEditorProps) {
  const [preview, setPreview] = useState<'edit' | 'live' | 'preview'>('live');

  return (
    <div className="flex flex-col h-full" data-color-mode="dark">
      <div className="flex items-center justify-between px-4 py-2 bg-paper border-b-2 border-ink shadow-sm z-10">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreview('edit')}
            className={`px-3 py-1 text-sm font-bold border-2 transition-all ${
              preview === 'edit' 
                ? 'bg-accent text-black border-accent shadow-hard-sm transform -translate-y-0.5' 
                : 'bg-paper text-gray-400 border-gray-600 hover:border-accent hover:text-accent'
            }`}
          >
            Edit
          </button>
          <button
            onClick={() => setPreview('live')}
            className={`px-3 py-1 text-sm font-bold border-2 transition-all ${
              preview === 'live' 
                ? 'bg-accent text-black border-accent shadow-hard-sm transform -translate-y-0.5' 
                : 'bg-paper text-gray-400 border-gray-600 hover:border-accent hover:text-accent'
            }`}
          >
            Split
          </button>
          <button
            onClick={() => setPreview('preview')}
            className={`px-3 py-1 text-sm font-bold border-2 transition-all ${
              preview === 'preview' 
                ? 'bg-accent text-black border-accent shadow-hard-sm transform -translate-y-0.5' 
                : 'bg-paper text-gray-400 border-gray-600 hover:border-accent hover:text-accent'
            }`}
          >
            Preview
          </button>
        </div>
        <div className="flex items-center gap-2">
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              disabled={regenerating}
              className="px-4 py-1.5 text-sm bg-paper text-yellow-500 border-2 border-yellow-500 font-bold hover:bg-yellow-500 hover:text-black shadow-sm transition-all disabled:opacity-50"
            >
              {regenerating ? 'Regenerating...' : 'Regenerate'}
            </button>
          )}
          {onSave && (
            <button
              onClick={onSave}
              disabled={saving}
              className="px-4 py-1.5 text-sm bg-paper text-ink border-2 border-ink font-bold hover:bg-ink hover:text-black shadow-sm transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          )}
          {onExportPDF && (
            <button
              onClick={onExportPDF}
              disabled={exporting}
              className="px-4 py-1.5 text-sm bg-accent text-black font-bold border-2 border-ink shadow-hard-sm hover:shadow-hard hover:-translate-y-0.5 transition-all disabled:opacity-50"
            >
              {exporting ? 'Exporting...' : 'Export PDF'}
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-hidden bg-[#0f0f0f]">
        <MDEditor
          value={value}
          onChange={(val) => onChange(val || '')}
          preview={preview}
          height="100%"
          visibleDragbar={false}
          hideToolbar={false}
          className="!bg-[#0f0f0f] !border-0"
        />
      </div>
    </div>
  );
}
