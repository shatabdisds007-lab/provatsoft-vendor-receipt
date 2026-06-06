'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ChevronDown, Mail, AlertCircle } from 'lucide-react';
import type { EmailQueueStatus, EmailQueueItem } from '@/types/infrastructure';

export default function AdminEmailLogsPage() {
  const [emails, setEmails] = useState<EmailQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<EmailQueueStatus | 'all'>('all');

  useEffect(() => {
    fetchEmails();
    // Refresh every 30 seconds
    const interval = setInterval(fetchEmails, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchEmails = async () => {
    try {
      const { data, error } = await supabase
        .from('email_queue')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      setEmails(data || []);
    } catch (err) {
      console.error('Failed to fetch email logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: EmailQueueStatus) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'processing':
        return 'bg-blue-100 text-blue-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      case 'retrying':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const filteredEmails = emails.filter((e) => filter === 'all' || e.status === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-600">Loading email logs...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Email Logs</h1>
        <p className="mt-2 text-slate-600">Monitor email delivery status and communications</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'pending', 'processing', 'sent', 'failed', 'retrying'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === f
                ? 'bg-sky-500 text-white'
                : 'bg-slate-200 text-slate-900 hover:bg-slate-300'
            }`}
          >
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            <span className="ml-2">
              ({
                f === 'all'
                  ? emails.length
                  : emails.filter((e) => e.status === f).length
              })
            </span>
          </button>
        ))}
      </div>

      {/* Email List */}
      <div className="space-y-2">
        {filteredEmails.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No email logs found</p>
          </div>
        ) : (
          filteredEmails.map((email) => (
            <div key={email.id} className="rounded-lg border border-slate-200 bg-white">
              <button
                onClick={() => setExpandedId(expandedId === email.id ? null : email.id)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition"
              >
                <div className="flex-1 text-left min-w-0">
                  <p className="font-medium text-slate-900 truncate">{email.recipient_email}</p>
                  <p className="text-sm text-slate-600 truncate">{email.subject}</p>
                </div>

                <div className="flex items-center gap-3 ml-4">
                  <div className="text-right flex-shrink-0">
                    <span className={`text-xs font-medium px-2 py-1 rounded ${getStatusColor(email.status)}`}>
                      {email.status.charAt(0).toUpperCase() + email.status.slice(1)}
                    </span>
                    <p className="text-xs text-slate-600 mt-1">
                      {new Date(email.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-slate-400 transition flex-shrink-0 ${
                      expandedId === email.id ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </button>

              {expandedId === email.id && (
                <div className="border-t border-slate-200 px-6 py-4 bg-slate-50 space-y-4">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-slate-600">Attempts</p>
                      <p className="text-sm font-medium text-slate-900">{email.attempts}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Created</p>
                      <p className="text-sm font-medium text-slate-900">
                        {new Date(email.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Updated</p>
                      <p className="text-sm font-medium text-slate-900">
                        {new Date(email.updated_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {email.next_try_at && (
                    <div>
                      <p className="text-xs text-slate-600">Next Retry</p>
                      <p className="text-sm font-medium text-slate-900">
                        {new Date(email.next_try_at).toLocaleString()}
                      </p>
                    </div>
                  )}

                  {email.last_error && (
                    <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-red-900">Last Error</p>
                          <p className="text-xs text-red-700 mt-1 break-words">{email.last_error}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {email.pdf_url && (
                    <div>
                      <p className="text-xs text-slate-600 mb-2">Attachment</p>
                      <a
                        href={email.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-sky-500 hover:text-sky-600 break-all"
                      >
                        {email.file_name || 'View PDF'}
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5 mt-8">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-600">Total</p>
          <p className="text-2xl font-bold text-slate-900">{emails.length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-600">Sent</p>
          <p className="text-2xl font-bold text-green-600">
            {emails.filter((e) => e.status === 'sent').length}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-600">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">
            {emails.filter((e) => e.status === 'pending').length}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-600">Failed</p>
          <p className="text-2xl font-bold text-red-600">
            {emails.filter((e) => e.status === 'failed').length}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-600">Retrying</p>
          <p className="text-2xl font-bold text-orange-600">
            {emails.filter((e) => e.status === 'retrying').length}
          </p>
        </div>
      </div>
    </div>
  );
}
