'use client';

import Link from 'next/link';
import { Application, STATUS_OPTIONS } from '@/lib/types';

interface ApplicationCardProps {
  application: Application;
}

export default function ApplicationCard({ application }: ApplicationCardProps) {
  const status = STATUS_OPTIONS.find(s => s.value === application.status) || STATUS_OPTIONS[0];
  const updatedDate = new Date(application.updatedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Link href={`/application/${application.id}`}>
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 hover:border-[#3a3a3a] hover:bg-[#1f1f1f] transition-all cursor-pointer">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-100 truncate pr-2">
            {application.company}
          </h3>
          <span className={`${status.color} text-white text-xs px-2 py-0.5 rounded-full whitespace-nowrap`}>
            {status.label}
          </span>
        </div>
        <p className="text-sm text-gray-400 mb-3 line-clamp-2">
          {application.role}
        </p>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Updated {updatedDate}</span>
          {application.jobUrl && (
            <span className="text-blue-400">Has link</span>
          )}
        </div>
      </div>
    </Link>
  );
}
