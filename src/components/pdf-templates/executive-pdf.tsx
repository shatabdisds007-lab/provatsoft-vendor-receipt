import React from 'react';
import { Document, Page, View, Text, StyleSheet, Image } from '@react-pdf/renderer';
import type { ReceiptDraft } from '@/types/receipt';
import { PdfTemplateExtras, safeText, safeCurrency } from '@/components/pdf-templates/pdf-template-helpers';

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 11, fontFamily: 'Helvetica', backgroundColor: '#ffffff' },
  header: { display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 18, fontWeight: 900, color: '#111827' },
  sub: { fontSize: 9, color: '#6b7280' },
  amount: { fontSize: 26, fontWeight: 900, color: '#0f172a' },
});

export function ExecutivePdf({ draft, watermarkUrl, qrCodeUrl }: { draft: ReceiptDraft; watermarkUrl?: string; qrCodeUrl?: string }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 44, height: 44, borderRadius: 10, border: '1px solid #e2e8f0', justifyContent: 'center', alignItems: 'center', marginRight: 10, backgroundColor: '#ffffff' }}>
              {draft.companyLogoUrl ? <Image src={draft.companyLogoUrl} style={{ width: 36, height: 36 }} /> : <Text style={{ fontSize: 8, color: '#6b7280' }}>Logo</Text>}
            </View>
            <View>
              <Text style={styles.title}>{safeText(draft.companyName) || 'Executive Co.'}</Text>
              <Text style={styles.sub}>{safeText(draft.companyAddress)}</Text>
            </View>
          </View>
          <View style={{ textAlign: 'right' }}>
            <Text style={{ fontSize: 10, fontWeight: 700 }}>{safeText(draft.receiptNumber)}</Text>
            <Text style={styles.sub}>{safeText(draft.date)}</Text>
          </View>
        </View>

        <View style={{ marginTop: 18 }}>
          <Text style={{ fontSize: 9, color: '#6b7280' }}>Paid By</Text>
          <Text style={{ fontSize: 12, fontWeight: 700 }}>{safeText(draft.customerName)}</Text>
        </View>

        <View style={{ marginTop: 24, textAlign: 'right' }}>
          <Text style={styles.amount}>{safeCurrency(draft.currency, draft.amount)}</Text>
        </View>

        <View style={{ marginTop: 36 }}>
          <Text style={{ fontSize: 9, color: '#6b7280' }}>Authorized Signature</Text>
          <View style={{ height: 60 }} />
        </View>
      </Page>
    </Document>
  );
}
