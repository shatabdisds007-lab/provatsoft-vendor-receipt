import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReceiptDraft } from '@/types/receipt';
import { receiptEntityToDraft } from '@/types/receipt';

const STORAGE_KEY = 'receipt_draft_v1';

type StoredReceiptDraft = {
  draft: ReceiptDraft;
  receiptId?: string;
  updatedAt: string;
};

export function defaultReceiptDraft(): ReceiptDraft {
  return {
    id: undefined,
    templateId: undefined,
    status: 'draft',
    receiptNumber: '',
    referenceNumber: '',
    date: new Date().toISOString().slice(0, 10),
    companyName: '',
    branchName: '',
    companyLogoUrl: '',
    watermarkUrl: '',
    companyAddress: '',
    phone: '',
    email: '',
    website: '',
    customerName: '',
    customerEmail: '',
    gender: '',
    nationality: '',
    fatherName: '',
    dateOfBirth: '',
    university: '',
    course: '',
    amount: 0,
    totalAmount: 0,
    paidAmount: 0,
    amountInWords: '',
    currency: 'INR',
    paymentType: 'Cash',
    paymentPurpose: '',
    paymentPeriod: '',
    chequeNumber: '',
    notes: '',
    terms: '',
    receivedBy: '',
    designation: '',
    signatureUrl: '',
    stampUrl: '',
    vendorId: undefined,
    pdfId: null,
  };
}

function getStoredDraft(): StoredReceiptDraft {
  if (typeof window === 'undefined') {
    return { draft: defaultReceiptDraft(), updatedAt: new Date().toISOString() };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredReceiptDraft;
      return {
        draft: parsed.draft || defaultReceiptDraft(),
        receiptId: parsed.receiptId,
        updatedAt: parsed.updatedAt || new Date().toISOString(),
      };
    }
  } catch (error) {
    console.error('Failed to load stored receipt draft', error);
  }

  return { draft: defaultReceiptDraft(), updatedAt: new Date().toISOString() };
}

function saveStoredDraft(draft: ReceiptDraft, receiptId?: string) {
  if (typeof window === 'undefined') return;

  const stored: StoredReceiptDraft = {
    draft,
    receiptId,
    updatedAt: new Date().toISOString(),
  };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch (error) {
    console.error('Failed to persist receipt draft', error);
  }
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  return {};
}

export function useReceiptDraft() {
  const initialStored = getStoredDraft();
  const [draft, setDraft] = useState<ReceiptDraft>(initialStored.draft);
  const [receiptId, setReceiptId] = useState<string | undefined>(initialStored.receiptId);
  const [isDirty, setIsDirty] = useState(false);
  const saveTimer = useRef<number | null>(null);

  const syncDraftToServer = useCallback(async (value: ReceiptDraft, existingId?: string) => {
    if (typeof window === 'undefined') return;
    const headers = await getAuthHeaders();

    const url = existingId ? `/api/receipts/${existingId}` : '/api/receipts';
    const method = existingId ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(value),
    });

    const result = await response.json();
    if (!response.ok) {
      console.error('Receipt sync failed', result);
      return;
    }

    if (result.receipt?.id) {
      setReceiptId(result.receipt.id);
      saveStoredDraft(value, result.receipt.id);
      setIsDirty(false);
    }
  }, []);

  const save = useCallback(
    async (value?: ReceiptDraft, sync = true) => {
      if (typeof window === 'undefined') {
        return;
      }

      const toSave = value || draft;
      saveStoredDraft(toSave, receiptId);
      setDraft(toSave);
      if (sync) {
        await syncDraftToServer(toSave, receiptId);
      }
    },
    [draft, receiptId, syncDraftToServer],
  );

  const saveDebounced = useCallback(
    (value?: ReceiptDraft, delay = 1000) => {
      if (typeof window === 'undefined') {
        save(value, false);
        return;
      }

      const toSave = value || draft;
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      saveStoredDraft(toSave, receiptId);
      setDraft(toSave);
      setIsDirty(true);
      saveTimer.current = window.setTimeout(() => {
        void syncDraftToServer(toSave, receiptId);
      }, delay) as unknown as number;
    },
    [draft, receiptId, syncDraftToServer, save],
  );

  const load = useCallback(() => {
    const stored = getStoredDraft();
    setDraft(stored.draft);
    setReceiptId(stored.receiptId);
    setIsDirty(false);
    return stored.draft;
  }, []);

  const clear = useCallback(async () => {
    try {
      if (receiptId) {
        const headers = await getAuthHeaders();
        await fetch(`/api/receipts/${receiptId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
        });
      }
    } catch (error) {
      console.error('Failed to delete server draft', error);
    }

    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to remove draft from local storage', error);
    }

    setDraft(defaultReceiptDraft());
    setReceiptId(undefined);
    setIsDirty(false);
  }, [receiptId]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const hydrate = async () => {
      const headers = await getAuthHeaders();

      try {
        const response = await fetch('/api/receipts?status=draft&latest=true', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
        });

        const body = await response.json();
        const serverReceipt = body.receipt;
        if (!serverReceipt) {
          if (receiptId) {
            setReceiptId(undefined);
            saveStoredDraft(draft, undefined);
          }
          return;
        }

        const serverUpdatedAt = new Date(serverReceipt.updatedAt).getTime();
        const localUpdatedAt = new Date(initialStored.updatedAt).getTime();

        if (serverUpdatedAt > localUpdatedAt) {
          const serverDraft = receiptEntityToDraft(serverReceipt);
          setDraft(serverDraft);
          setReceiptId(serverReceipt.id);
          saveStoredDraft(serverDraft, serverReceipt.id);
          setIsDirty(false);
        } else {
          void syncDraftToServer(initialStored.draft, initialStored.receiptId);
        }
      } catch (error) {
        console.error('Failed to hydrate receipt draft from server', error);
      }
    };

    hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isDirty) {
        void syncDraftToServer(draft, receiptId);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [draft, isDirty, receiptId, syncDraftToServer]);

  const api = useMemo(
    () => ({
      draft,
      receiptId,
      setDraft,
      setReceiptId,
      save,
      saveDebounced,
      load,
      clear,
      isDirty,
      setIsDirty,
    }),
    [draft, receiptId, save, saveDebounced, load, clear, isDirty],
  );

  return api;
}
