'use client';

import { BaseResume } from '@/lib/types';

interface ResumeSelectorProps {
  resumes: BaseResume[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function ResumeSelector({ resumes, value, onChange, className = '' }: ResumeSelectorProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`px-3 py-2 border border-[#3a3a3a] bg-[#1a1a1a] text-gray-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    >
      <option value="">Select a base resume...</option>
      {resumes.map((resume) => (
        <option key={resume.filename} value={resume.filename}>
          {resume.name}
        </option>
      ))}
    </select>
  );
}
