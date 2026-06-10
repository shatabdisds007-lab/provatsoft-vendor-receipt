'use client';

import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

type Toast = { id?: string; title: string; description?: string; type?: 'success' | 'error' | 'info' };

const ToastContext = createContext<(t: Omit<Toast, 'id'>) => void>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastCounter = useRef(0);

  const add = useCallback((t: Omit<Toast, 'id'>) => {
    toastCounter.current += 1;
    const id = `${Date.now()}-${toastCounter.current}`;
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 5000);
  }, []);

  return (
    <ToastContext.Provider value={add}>
      {children}
      <div className="fixed right-6 top-6 z-50 flex flex-col gap-3">
        {toasts.map((t) => (
          <div key={t.id} className={`rounded-lg p-3 shadow-md ${t.type === 'error' ? 'bg-rose-50 border border-rose-200 text-rose-800' : t.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-slate-50 border border-slate-200 text-slate-800'}`}>
            <div className="font-semibold">{t.title}</div>
            {t.description ? <div className="text-sm">{t.description}</div> : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
