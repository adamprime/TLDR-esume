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
      <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a1a] border-b border-[#2a2a2a]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreview('edit')}
            className={`px-3 py-1 text-sm rounded ${
              preview === 'edit' 
                ? 'bg-blue-500 text-white' 
                : 'bg-[#2a2a2a] border border-[#3a3a3a] text-gray-300 hover:bg-[#3a3a3a]'
            }`}
          >
            Edit
          </button>
          <button
            onClick={() => setPreview('live')}
            className={`px-3 py-1 text-sm rounded ${
              preview === 'live' 
                ? 'bg-blue-500 text-white' 
                : 'bg-[#2a2a2a] border border-[#3a3a3a] text-gray-300 hover:bg-[#3a3a3a]'
            }`}
          >
            Split
          </button>
          <button
            onClick={() => setPreview('preview')}
            className={`px-3 py-1 text-sm rounded ${
              preview === 'preview' 
                ? 'bg-blue-500 text-white' 
                : 'bg-[#2a2a2a] border border-[#3a3a3a] text-gray-300 hover:bg-[#3a3a3a]'
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
              className="px-4 py-1.5 text-sm bg-amber-600 text-white rounded hover:bg-amber-500 disabled:opacity-50"
            >
              {regenerating ? 'Regenerating...' : 'Regenerate'}
            </button>
          )}
          {onSave && (
            <button
              onClick={onSave}
              disabled={saving}
              className="px-4 py-1.5 text-sm bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          )}
          {onExportPDF && (
            <button
              onClick={onExportPDF}
              disabled={exporting}
              className="px-4 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-500 disabled:opacity-50"
            >
              {exporting ? 'Exporting...' : 'Export PDF'}
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <MDEditor
          value={value}
          onChange={(val) => onChange(val || '')}
          preview={preview}
          height="100%"
          visibleDragbar={false}
          hideToolbar={false}
        />
      </div>
    </div>
  );
}
