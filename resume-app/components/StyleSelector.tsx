'use client';

import { StyleOption, STYLE_OPTIONS } from '@/lib/types';

interface StyleSelectorProps {
  value: StyleOption;
  onChange: (value: StyleOption) => void;
  className?: string;
}

export default function StyleSelector({ value, onChange, className = '' }: StyleSelectorProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as StyleOption)}
      className={`px-3 py-2 border border-[#3a3a3a] bg-[#1a1a1a] text-gray-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    >
      {STYLE_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
