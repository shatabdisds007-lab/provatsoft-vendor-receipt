import React from 'react';
import { Document, Page, View, Text, StyleSheet, Image } from '@react-pdf/renderer';
import { PdfTemplateExtras, safeText, safeCurrency } from '@/components/pdf-templates/pdf-template-helpers';
import type { ReceiptDraft } from '@/types/receipt';

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 11, fontFamily: 'Helvetica', backgroundColor: '#ffffff' },
  header: { marginBottom: 18 },
  title: { fontSize: 16, fontWeight: 700 },
  amount: { fontSize: 22, fontWeight: 800, color: '#111827' },
});

export function MinimalPdf({ draft, watermarkUrl, qrCodeUrl }: { draft: ReceiptDraft; watermarkUrl?: string; qrCodeUrl?: string }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ width: 40, height: 40, borderRadius: 10, border: '1px solid #e2e8f0', justifyContent: 'center', alignItems: 'center', marginRight: 10, backgroundColor: '#ffffff' }}>
            {draft.companyLogoUrl ? <Image src={safeText(draft.companyLogoUrl)} style={{ width: 32, height: 32 }} /> : <Text style={{ fontSize: 8, color: '#64748b' }}>Logo</Text>}
          </View>
          <View>
            <Text style={styles.title}>{safeText(draft.companyName) || 'Minimal'}</Text>
            <Text style={{ fontSize: 9, color: '#64748b' }}>{safeText(draft.companyAddress)}</Text>
          </View>
        </View>
        </View>

        <View>
          <Text style={{ fontSize: 9, color: '#64748b' }}>To</Text>
          <Text style={{ fontSize: 11, fontWeight: 700 }}>{safeText(draft.customerName)}</Text>
        </View>

        <View style={{ marginTop: 28, textAlign: 'right' }}>
          <Text style={styles.amount}>{safeCurrency(draft.currency, draft.amount)}</Text>
        </View>
        <PdfTemplateExtras draft={draft} watermarkUrl={watermarkUrl} qrCodeUrl={qrCodeUrl} />
      </Page>
    </Document>
  );
}
