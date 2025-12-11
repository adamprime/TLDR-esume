'use client';

import { ApplicationStatus, STATUS_OPTIONS } from '@/lib/types';

interface StatusSelectorProps {
  value: ApplicationStatus;
  onChange: (value: ApplicationStatus) => void;
  className?: string;
}

export default function StatusSelector({ value, onChange, className = '' }: StatusSelectorProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as ApplicationStatus)}
      className={`px-3 py-2 border border-[#3a3a3a] bg-[#1a1a1a] text-gray-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    >
      {STATUS_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
