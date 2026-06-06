'use client';

import { useEffect, useRef, useState } from 'react';
import { renderReceiptTemplate } from '@/lib/renderReceiptTemplate';
import type { ReceiptDraft } from '@/types/receipt';

interface PrintPreviewWrapperProps {
  slug: string | null;
  draft: ReceiptDraft;
  qrCodeUrl?: string;
  watermarkUrl?: string;
  active: boolean;
  onReady: () => void;
}

export function PrintPreviewWrapper({ slug, draft, qrCodeUrl, watermarkUrl, active, onReady }: PrintPreviewWrapperProps) {
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!active) {
      setMounted(false);
      return;
    }

    setMounted(true);
  }, [active, slug, draft, qrCodeUrl, watermarkUrl]);

  useEffect(() => {
    if (!active || !mounted) {
      return;
    }

    let resolved = false;
    let frameId: number;

    const checkReady = () => {
      if (resolved) {
        return;
      }

      const hasChildren = (containerRef.current?.children.length || 0) > 0;
      console.log('[PRINT] ready check', { slug, hasChildren });

      if (hasChildren) {
        resolved = true;
        console.log('[PRINT] template mounted:', slug);
        onReady();
        return;
      }

      frameId = window.requestAnimationFrame(checkReady);
    };

    frameId = window.requestAnimationFrame(checkReady);

    return () => {
      resolved = true;
      window.cancelAnimationFrame(frameId);
    };
  }, [active, mounted, slug, onReady]);

  return (
    <div ref={containerRef} className="print-preview-wrapper print-only">
      {active && mounted
        ? renderReceiptTemplate(slug, { ...draft, qrCodeUrl, watermarkUrl } as any, 'print')
        : null}
    </div>
  );
}
