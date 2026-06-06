import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import type { ReceiptDraft } from '@/types/receipt';

export function MinimalTestPdf({ 
  draft, 
  watermarkUrl, 
  qrCodeUrl 
}: { 
  draft: ReceiptDraft;
  watermarkUrl?: string;
  qrCodeUrl?: string;
}) {
  console.log('[MinimalTestPdf] rendering with draft:', draft?.companyName);
  
  // Use React.createElement instead of JSX to avoid any compilation issues
  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: 'A4' },
      React.createElement(
        View,
        { style: { padding: 30 } },
        React.createElement(Text, null, `Receipt #: ${draft?.receiptNumber || 'N/A'}`),
        React.createElement(Text, null, `Company: ${draft?.companyName || 'Company'}`),
        React.createElement(Text, null, `Amount: ${draft?.amount || 0}`)
      )
    )
  );
}
