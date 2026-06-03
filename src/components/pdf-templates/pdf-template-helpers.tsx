import React from 'react';
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import type { ReceiptDraft } from '@/types/receipt';

const styles = StyleSheet.create({
  watermark: {
    position: 'absolute',
    top: '30%',
    left: '10%',
    width: '80%',
    opacity: 0.07,
    zIndex: 0,
  },
  footerRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 22,
  },
  qr: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
  },
  signatureBox: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    borderRadius: 10,
    padding: 8,
    minHeight: 80,
    width: '48%',
    border: '1px solid #e2e8f0',
  },
  stampBox: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    borderRadius: 10,
    padding: 8,
    minHeight: 80,
    width: '48%',
    border: '1px solid #e2e8f0',
  },
  signatureImage: {
    width: '100%',
    height: 60,
    objectFit: 'contain',
  },
  stampImage: {
    width: '100%',
    height: 60,
    objectFit: 'contain',
  },
  authGroup: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    width: '100%',
  },
  signatureLabel: {
    fontSize: 8,
    color: '#64748b',
    marginBottom: 4,
  },
  signatureText: {
    fontSize: 10,
    color: '#0f172a',
    fontWeight: 600,
  },
});

interface PdfExtrasProps {
  draft: ReceiptDraft;
  watermarkUrl?: string;
  qrCodeUrl?: string;
}

export function safeText(value?: unknown, fallback = ''): string {
  if (value === undefined || value === null) return fallback;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map((item) => safeText(item, '')).filter(Boolean).join(' ');
  if (typeof value === 'object' && 'toString' in value) return String(value);
  return fallback;
}

export function safeCurrency(currency?: string, amount?: number, fallbackCurrency = 'BDT'): string {
  const safeAmount = typeof amount === 'number' ? amount : 0;
  return `${safeText(currency, fallbackCurrency)} ${safeAmount.toLocaleString()}`.trim();
}

export function PdfTemplateExtras({ draft, watermarkUrl, qrCodeUrl }: PdfExtrasProps) {
  return (
    <>
      {watermarkUrl ? <Image src={watermarkUrl} style={styles.watermark} /> : null}
      <View style={styles.footerRow}>
        {qrCodeUrl ? <Image src={qrCodeUrl} style={styles.qr} /> : (
          <View style={[styles.qr, { justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={styles.signatureLabel}>QR</Text>
          </View>
        )}
        <View style={styles.authGroup}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Authorized Signature</Text>
            {draft.signatureUrl ? <Image src={safeText(draft.signatureUrl)} style={styles.signatureImage} /> : <Text style={styles.signatureText}>Signature</Text>}
          </View>
          <View style={styles.stampBox}>
            <Text style={styles.signatureLabel}>Official Stamp</Text>
            {draft.stampUrl ? <Image src={safeText(draft.stampUrl)} style={styles.stampImage} /> : <Text style={styles.signatureText}>Stamp</Text>}
          </View>
        </View>
      </View>
    </>
  );
}
