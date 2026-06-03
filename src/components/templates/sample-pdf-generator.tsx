'use client';

import { useEffect, useState } from 'react';

type BatchResult = {
  template: string;
  name: string;
  status: 'success' | 'failed';
  pdfUrl?: string;
  receiptNumber?: string;
  error?: string;
};

type LogEntry = {
  id: string;
  template_name: string;
  template_slug: string;
  status: string;
  receipt_number: string;
  pdf_url: string | null;
  file_name: string;
  message: string | null;
  generated_at: string;
};

export default function SamplePdfGenerator() {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<BatchResult[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [error, setError] = useState('');

  const fetchLogs = async () => {
    const response = await fetch('/api/admin/sample-pdf-logs');
    const data = await response.json();
    if (data.logs) setLogs(data.logs);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const generateBatch = async () => {
    setRunning(true);
    setError('');
    setResults([]);
    setProgress(0);

    try {
      const response = await fetch('/api/admin/generate-sample-pdfs', { method: 'POST' });
      const data = await response.json();
      if (data.error) {
        setError(data.error);
        setRunning(false);
        return;
      }

      const batchResults: BatchResult[] = data.results || [];
      setResults(batchResults);
      setProgress(100);
      await fetchLogs();
    } catch (err: any) {
      setError(err?.message || 'Batch generation failed');
    } finally {
      setRunning(false);
    }
  };

  const successCount = results.filter((r) => r.status === 'success').length;
  const failedCount = results.filter((r) => r.status === 'failed').length;

  return (
    <div className="mb-10 rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 shadow-glow backdrop-blur-xl sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-white">Generate Sample PDFs</h2>
          <p className="mt-1 text-sm text-slate-400">Create sample receipts for every available template and save them to storage.</p>
        </div>
        <button
          type="button"
          onClick={generateBatch}
          disabled={running}
          className="inline-flex items-center justify-center rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700"
        >
          {running ? 'Generating…' : 'Generate All Sample PDFs'}
        </button>
      </div>

      <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-950/90 p-4">
        <div className="mb-4 flex items-center justify-between gap-4 text-sm text-slate-300">
          <div>Progress</div>
          <div>{running ? 'Running...' : `${successCount + failedCount} completed`}</div>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full rounded-full bg-sky-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {error ? <p className="mt-4 text-sm text-rose-400">{error}</p> : null}

      {results.length > 0 ? (
        <div className="mt-6 space-y-3">
          <div className="text-sm text-slate-400">Batch results</div>
          <div className="grid gap-3">
            {results.map((result) => (
              <div key={result.template} className="rounded-3xl border border-slate-800 bg-slate-950/90 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-white">{result.name}</div>
                    <div className="text-xs text-slate-500">{result.template}</div>
                  </div>
                  <div className={`rounded-full px-3 py-1 text-xs ${result.status === 'success' ? 'bg-emerald-500 text-black' : 'bg-rose-500 text-white'}`}>
                    {result.status}
                  </div>
                </div>
                {result.pdfUrl ? (
                  <a href={result.pdfUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-sky-400 underline">
                    View PDF
                  </a>
                ) : null}
                {result.error ? <p className="mt-2 text-sm text-rose-400">{result.error}</p> : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {logs.length > 0 ? (
        <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-950/90 p-4">
          <div className="text-sm font-semibold text-white">Recent generated samples</div>
          <div className="mt-4 space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="grid gap-2 rounded-3xl border border-slate-800 bg-slate-900 p-4 sm:grid-cols-[1.5fr_1fr_1fr]">
                <div>
                  <div className="text-sm font-semibold text-white">{log.template_name}</div>
                  <div className="text-xs text-slate-500">{log.template_slug}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Status</div>
                  <div className="mt-1 text-sm text-white">{log.status}</div>
                </div>
                <div className="flex items-center gap-3">
                  {log.pdf_url ? (
                    <a href={log.pdf_url} target="_blank" rel="noreferrer" className="text-sm text-sky-400 underline">
                      Open PDF
                    </a>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
