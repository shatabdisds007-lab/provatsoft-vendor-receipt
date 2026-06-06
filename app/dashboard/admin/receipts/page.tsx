'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ChevronDown, FileText } from 'lucide-react';

interface Receipt {
  id: string;
  receipt_number: string;
  vendor_id: string;
  template_id: string;
  status: 'draft' | 'finalized';
  amount: number;
  currency: string;
  created_at: string;
  updated_at: string;
  company_data?: Record<string, any>;
  customer_data?: Record<string, any>;
}

interface VendorInfo {
  id: string;
  email: string;
}

interface ReceiptRow {
  id: string;
  receipt_number: string;
  vendor_id: string;
  template_id: string;
  status: 'draft' | 'finalized';
  amount: number;
  currency: string;
  created_at: string;
  updated_at: string;
  company_data?: Record<string, unknown>;
  customer_data?: Record<string, unknown>;
}

export default function AdminReceiptsPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [vendorMap, setVendorMap] = useState<Record<string, VendorInfo>>({});
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'draft' | 'finalized'>('all');

  useEffect(() => {
    fetchReceiptsAndVendors();
  }, []);

  const fetchReceiptsAndVendors = async () => {
    try {
      // Fetch receipts
      const { data: receiptsData, error: receiptsError } = await supabase
        .from('receipts')
        .select('*')
        .order('created_at', { ascending: false });

      if (receiptsError) throw receiptsError;

      // Fetch vendor info
      const vendorIds = new Set((receiptsData || []).map((r: ReceiptRow) => r.vendor_id));
      const { data: vendorsData, error: vendorsError } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', Array.from(vendorIds));

      if (vendorsError) throw vendorsError;

      const vendorMapData: Record<string, VendorInfo> = {};
      (vendorsData || []).forEach((v: VendorInfo) => {
        vendorMapData[v.id] = v;
      });

      setReceipts(receiptsData || []);
      setVendorMap(vendorMapData);
    } catch (err) {
      console.error('Failed to fetch receipts:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredReceipts = receipts.filter((r) => filter === 'all' || r.status === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-600">Loading receipts...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Receipts Monitoring</h1>
        <p className="mt-2 text-slate-600">View all receipts created by vendors</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'draft', 'finalized'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === f
                ? 'bg-sky-500 text-white'
                : 'bg-slate-200 text-slate-900 hover:bg-slate-300'
            }`}
          >
            {f === 'all' ? 'All' : f === 'draft' ? 'Drafts' : 'Finalized'}
            <span className="ml-2">
              ({
                f === 'all'
                  ? receipts.length
                  : receipts.filter((r) => r.status === f).length
              })
            </span>
          </button>
        ))}
      </div>

      {/* Receipts List */}
      <div className="space-y-2">
        {filteredReceipts.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No receipts found</p>
          </div>
        ) : (
          filteredReceipts.map((receipt) => {
            const vendor = vendorMap[receipt.vendor_id];
            return (
              <div key={receipt.id} className="rounded-lg border border-slate-200 bg-white">
                <button
                  onClick={() =>
                    setExpandedId(expandedId === receipt.id ? null : receipt.id)
                  }
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition"
                >
                  <div className="flex-1 text-left">
                    <p className="font-medium text-slate-900">
                      Receipt #{receipt.receipt_number}
                    </p>
                    <p className="text-sm text-slate-600">
                      Vendor: {vendor?.email || 'Unknown'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">
                        {receipt.currency} {receipt.amount.toFixed(2)}
                      </p>
                      <span className={`text-xs font-medium px-2 py-1 rounded ${
                        receipt.status === 'draft'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {receipt.status === 'draft' ? 'Draft' : 'Finalized'}
                      </span>
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 text-slate-400 transition ${
                        expandedId === receipt.id ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </button>

                {expandedId === receipt.id && (
                  <div className="border-t border-slate-200 px-6 py-4 bg-slate-50 space-y-4">
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                      <div>
                        <p className="text-xs text-slate-600">Template</p>
                        <p className="text-sm font-medium text-slate-900">
                          {receipt.template_id}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600">Created</p>
                        <p className="text-sm font-medium text-slate-900">
                          {new Date(receipt.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600">Updated</p>
                        <p className="text-sm font-medium text-slate-900">
                          {new Date(receipt.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {receipt.company_data && (
                      <div className="pt-2">
                        <p className="text-xs font-medium text-slate-700 mb-2">
                          Company Information
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-slate-600">Name</p>
                            <p className="text-slate-900">
                              {receipt.company_data.companyName || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-600">Branch</p>
                            <p className="text-slate-900">
                              {receipt.company_data.branchName || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mt-8">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-600">Total Receipts</p>
          <p className="text-2xl font-bold text-slate-900">{receipts.length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-600">Draft</p>
          <p className="text-2xl font-bold text-yellow-600">
            {receipts.filter((r) => r.status === 'draft').length}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-600">Finalized</p>
          <p className="text-2xl font-bold text-green-600">
            {receipts.filter((r) => r.status === 'finalized').length}
          </p>
        </div>
      </div>
    </div>
  );
}
