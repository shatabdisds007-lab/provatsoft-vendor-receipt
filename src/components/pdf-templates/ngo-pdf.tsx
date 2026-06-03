import React from 'react';
import { Document, Page, View, Text, StyleSheet, Image } from '@react-pdf/renderer';
import { PdfTemplateExtras, safeText, safeCurrency } from '@/components/pdf-templates/pdf-template-helpers';
import type { ReceiptDraft } from '@/types/receipt';

const styles = StyleSheet.create({
  page: { padding: 26, fontSize: 11, fontFamily: 'Helvetica', backgroundColor: '#ffffff' },
  header: { marginBottom: 12 },
  title: { fontSize: 16, fontWeight: 800, color: '#065f46' },
  note: { fontSize: 10, color: '#6b7280' },
  amount: { fontSize: 22, fontWeight: 900, color: '#065f46' },
});

export function NgoPdf({ draft, watermarkUrl, qrCodeUrl }: { draft: ReceiptDraft; watermarkUrl?: string; qrCodeUrl?: string }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 44, height: 44, borderRadius: 10, border: '1px solid #d1d5db', justifyContent: 'center', alignItems: 'center', marginRight: 10, backgroundColor: '#ffffff' }}>
            {draft.companyLogoUrl ? <Image src={draft.companyLogoUrl} style={{ width: 36, height: 36 }} /> : <Text style={{ fontSize: 8, color: '#6b7280' }}>Logo</Text>}
          </View>
          <View>
            <Text style={styles.title}>{safeText(draft.companyName) || 'Charity Org'}</Text>
            <Text style={styles.note}>{safeText(draft.companyAddress)}</Text>
          </View>
        </View>
        </View>

        <View>
          <Text style={{ fontSize: 9, color: '#475569' }}>Donor</Text>
          <Text style={{ fontSize: 12, fontWeight: 700 }}>{safeText(draft.customerName)}</Text>
        </View>

        <View style={{ marginTop: 18 }}>
          <Text style={styles.amount}>{safeCurrency(draft.currency, draft.amount)}</Text>
          <Text style={{ marginTop: 8, fontSize: 10, color: '#6b7280' }}>Donation for: {safeText(draft.paymentPurpose)}</Text>
        </View>
        <PdfTemplateExtras draft={draft} watermarkUrl={watermarkUrl} qrCodeUrl={qrCodeUrl} />
      </Page>
    </Document>
  );
}
