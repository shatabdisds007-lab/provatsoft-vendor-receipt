'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Download, Search } from 'lucide-react';

interface ReceiptHistoryRecord {
  id: string;
  receipt_number: string;
  template_id: string;
  status: string;
  amount: number;
  currency: string;
  created_at: string;
  company_data: { companyName?: string; customerName?: string };
  customer_data: { customerName?: string };
  pdfUrl?: string | null;
}

export function ReceiptHistory() {
  const [history, setHistory] = useState<ReceiptHistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    async function loadHistory() {
      setLoading(true);
      setError('');

      try {
        const authHeaders = await getAuthHeaders();
        const response = await fetch('/api/receipts', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json', ...authHeaders } as Record<string, string>,
        });
        const data = await response.json();
        if (!response.ok) {
          setError(data.error || 'Unable to load receipt history.');
          return;
        }

        setHistory(data.receipts || []);
      } catch (err: any) {
        setError(err?.message || 'Unable to load history.');
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, []);

  const filtered = history.filter((receipt) =>
    `${receipt.receipt_number} ${receipt.customer_data?.customerName || receipt.company_data?.companyName || ''} ${receipt.template_id} ${receipt.status}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const pageSize = 8;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);

  const exportCsv = () => {
    const rows = filtered.map((receipt) => ({
      receipt_number: receipt.receipt_number,
      customer: receipt.customer_data?.customerName || receipt.company_data?.customerName || 'N/A',
      amount: `${receipt.currency || ''} ${receipt.amount || 0}`.trim(),
      status: receipt.status,
      template: receipt.template_id,
      date: receipt.created_at,
      pdf_url: receipt.pdfUrl || '',
    }));

    const csv = ['receipt_number,customer,amount,currency,status,template,date,pdf_url',
      ...rows.map((row) => Object.values(row).map((value) => `"${String(value || '').replace(/"/g, '""')}"`).join(',')).join('\n'),
    ].join('\n');

    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'receipt-history.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Receipt History</h1>
          <p className="mt-2 text-sm text-slate-500">All saved receipts for your vendor account.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} className="saaS-input pl-10" placeholder="Search receipts..." type="search" />
          </div>
          <button type="button" onClick={exportCsv} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {loading ? <div className="grid gap-3">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="saaS-skeleton h-14" />)}</div> : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Receipt #</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Customer</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Template</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Created</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
            {visible.map((receipt) => (
              <tr key={receipt.id} className="transition hover:bg-slate-50">
                <td className="whitespace-nowrap px-4 py-4 font-medium text-slate-950">{receipt.receipt_number}</td>
                <td className="whitespace-nowrap px-4 py-4">{receipt.customer_data?.customerName || receipt.company_data?.companyName || 'N/A'}</td>
                <td className="whitespace-nowrap px-4 py-4">{receipt.currency} {receipt.amount}</td>
                <td className="whitespace-nowrap px-4 py-4">{receipt.template_id}</td>
                <td className="whitespace-nowrap px-4 py-4">{receipt.status}</td>
                <td className="whitespace-nowrap px-4 py-4">{new Date(receipt.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-4 space-x-2">
                  <a
                    href={receipt.pdfUrl || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    View
                  </a>
                  <button
                    type="button"
                    onClick={() => receipt.pdfUrl && window.open(receipt.pdfUrl, '_blank')}
                    className="inline-flex items-center rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                    disabled={!receipt.pdfUrl}
                  >
                    Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>Showing {visible.length} of {filtered.length}</span>
        <div className="flex gap-2">
          <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-xl border border-slate-200 px-3 py-2 font-semibold text-slate-700 disabled:opacity-50" disabled={page === 1}>Previous</button>
          <span className="rounded-xl bg-slate-100 px-3 py-2 font-semibold text-slate-700">{page} / {pageCount}</span>
          <button type="button" onClick={() => setPage((value) => Math.min(pageCount, value + 1))} className="rounded-xl border border-slate-200 px-3 py-2 font-semibold text-slate-700 disabled:opacity-50" disabled={page === pageCount}>Next</button>
        </div>
      </div>
    </div>
  );
}
