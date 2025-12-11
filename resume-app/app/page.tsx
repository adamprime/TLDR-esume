'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ApplicationCard from '@/components/ApplicationCard';
import { Application, ApplicationStatus, STATUS_OPTIONS } from '@/lib/types';

export default function Dashboard() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<ApplicationStatus>('closed');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    checkFirstRun();
    fetchApplications();
  }, []);

  async function checkFirstRun() {
    try {
      const res = await fetch('/api/first-run');
      const data = await res.json();
      if (data.isFirstRun) {
        router.push('/settings');
      }
    } catch (error) {
      console.error('Error checking first run:', error);
    }
  }

  async function fetchApplications() {
    try {
      const res = await fetch('/api/applications');
      const data = await res.json();
      setApplications(data.applications || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredApplications = applications.filter(app => {
    const matchesSearch = 
      app.company.toLowerCase().includes(search.toLowerCase()) ||
      app.role.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = applications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  function toggleSelection(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function selectAllVisible() {
    setSelectedIds(new Set(filteredApplications.map(a => a.id)));
  }

  function deselectAll() {
    setSelectedIds(new Set());
  }

  async function bulkUpdateStatus() {
    if (selectedIds.size === 0) return;
    
    setUpdating(true);
    try {
      const res = await fetch('/api/applications/bulk-update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds), status: bulkStatus }),
      });
      
      if (!res.ok) throw new Error('Bulk update failed');
      
      const data = await res.json();
      alert(data.message);
      
      // Refresh and clear selection
      await fetchApplications();
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Error bulk updating:', error);
      alert('Failed to update applications.');
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <header className="bg-[#1a1a1a] border-b border-[#2a2a2a]">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-100">TLDR;esume</h1>
            <div className="flex items-center gap-3">
              <Link
                href="/settings"
                className="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors"
              >
                Settings
              </Link>
              <Link
                href="/review"
                className="px-4 py-2 bg-gray-700 text-gray-200 rounded-md hover:bg-gray-600 transition-colors"
              >
                Review Resumes
              </Link>
              <Link
                href="/new"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors"
              >
                New Application
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {STATUS_OPTIONS.map(status => (
            <div
              key={status.value}
              className={`bg-[#1a1a1a] rounded-lg p-4 border cursor-pointer transition-all ${
                statusFilter === status.value 
                  ? 'border-blue-500 ring-2 ring-blue-500/30' 
                  : 'border-[#2a2a2a] hover:border-[#3a3a3a]'
              }`}
              onClick={() => setStatusFilter(statusFilter === status.value ? 'all' : status.value)}
            >
              <div className="text-2xl font-bold text-gray-100">
                {statusCounts[status.value] || 0}
              </div>
              <div className="text-sm text-gray-400">{status.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Search companies or roles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 border border-[#3a3a3a] bg-[#1a1a1a] text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ApplicationStatus | 'all')}
            className="px-4 py-2 border border-[#3a3a3a] bg-[#1a1a1a] text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            {STATUS_OPTIONS.map(status => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        {/* Bulk Actions Bar */}
        <div className="flex items-center justify-between mb-4 p-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
          <div className="flex items-center gap-4">
            <button
              onClick={selectedIds.size === filteredApplications.length ? deselectAll : selectAllVisible}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              {selectedIds.size === filteredApplications.length ? 'Deselect All' : `Select All (${filteredApplications.length})`}
            </button>
            {selectedIds.size > 0 && (
              <span className="text-sm text-gray-400">
                {selectedIds.size} selected
              </span>
            )}
          </div>
          
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Set status to:</span>
              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value as ApplicationStatus)}
                className="px-3 py-1.5 text-sm border border-[#3a3a3a] bg-[#0f0f0f] text-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STATUS_OPTIONS.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
              <button
                onClick={bulkUpdateStatus}
                disabled={updating}
                className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-50"
              >
                {updating ? 'Updating...' : 'Apply'}
              </button>
            </div>
          )}
        </div>

        {/* Applications Grid */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading applications...</div>
        ) : filteredApplications.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">
              {applications.length === 0 
                ? 'No applications yet. Create your first one!'
                : 'No applications match your filters.'}
            </p>
            {applications.length === 0 && (
              <Link
                href="/new"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500"
              >
                Create Application
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredApplications.map(app => (
              <div 
                key={app.id} 
                className={`bg-[#1a1a1a] border rounded-lg hover:border-[#3a3a3a] hover:bg-[#1f1f1f] transition-all ${
                  selectedIds.has(app.id) ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-[#2a2a2a]'
                }`}
              >
                <div className="flex items-start p-4 gap-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(app.id)}
                    onChange={() => toggleSelection(app.id)}
                    className="mt-1 w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500 cursor-pointer flex-shrink-0"
                  />
                  <Link href={`/application/${app.id}`} className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-100 truncate pr-2">
                        {app.company}
                      </h3>
                      <span className={`${STATUS_OPTIONS.find(s => s.value === app.status)?.color || 'bg-gray-500'} text-white text-xs px-2 py-0.5 rounded-full whitespace-nowrap`}>
                        {STATUS_OPTIONS.find(s => s.value === app.status)?.label || app.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                      {app.role}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Updated {new Date(app.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      {app.jobUrl && <span className="text-blue-400">Has link</span>}
                    </div>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
