import React from 'react';
import { Document, Page, View, Text, StyleSheet, Image } from '@react-pdf/renderer';
import { PdfTemplateExtras, safeText, safeCurrency } from '@/components/pdf-templates/pdf-template-helpers';
import type { ReceiptDraft } from '@/types/receipt';

const styles = StyleSheet.create({
  page: { padding: 28, fontSize: 11, fontFamily: 'Helvetica', backgroundColor: '#fffaf0' },
  header: { display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  brand: { fontSize: 18, fontWeight: 800, color: '#1f2937' },
  amount: { fontSize: 22, fontWeight: 900, color: '#92400e' },
});

export function ElegantPdf({ draft, watermarkUrl, qrCodeUrl }: { draft: ReceiptDraft; watermarkUrl?: string; qrCodeUrl?: string }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 44, height: 44, borderRadius: 10, border: '1px solid #e2e8f0', justifyContent: 'center', alignItems: 'center', marginRight: 10, backgroundColor: '#ffffff' }}>
              {draft.companyLogoUrl ? <Image src={draft.companyLogoUrl} style={{ width: 36, height: 36 }} /> : <Text style={{ fontSize: 8, color: '#6b7280' }}>Logo</Text>}
            </View>
            <View>
              <Text style={styles.brand}>{safeText(draft.companyName) || 'Elegant Ltd.'}</Text>
              <Text style={{ fontSize: 9, color: '#6b7280' }}>{safeText(draft.companyAddress)}</Text>
            </View>
          </View>
          <View style={{ textAlign: 'right' }}>
            <Text style={{ fontSize: 10, fontWeight: 700 }}>{safeText(draft.receiptNumber)}</Text>
            <Text style={{ fontSize: 9, color: '#6b7280' }}>{safeText(draft.date)}</Text>
          </View>
        </View>

        <View style={{ marginTop: 18 }}>
          <Text style={{ fontSize: 9, color: '#6b7280' }}>For</Text>
          <Text style={{ fontSize: 12, fontWeight: 700 }}>{safeText(draft.customerName)}</Text>
        </View>

        <View style={{ marginTop: 24, textAlign: 'right' }}>
          <Text style={styles.amount}>{safeCurrency(draft.currency, draft.amount)}</Text>
        </View>
        <PdfTemplateExtras draft={draft} watermarkUrl={watermarkUrl} qrCodeUrl={qrCodeUrl} />
      </Page>
    </Document>
  );
}
