import React from 'react';
import { Document, Page, View, Text, StyleSheet, Image } from '@react-pdf/renderer';
import type { ReceiptDraft } from '@/types/receipt';
import { PdfTemplateExtras, safeText, safeCurrency } from '@/components/pdf-templates/pdf-template-helpers';

const styles = StyleSheet.create({
  page: { padding: 28, fontSize: 10, fontFamily: 'Helvetica', backgroundColor: '#ffffff' },
  header: { display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  company: { fontSize: 16, fontWeight: 800, color: '#0f172a' },
  info: { fontSize: 9, color: '#64748b' },
  section: { marginVertical: 10 },
  amountBox: { padding: 12, borderRadius: 8, backgroundColor: '#eef2ff' },
});

export function CorporatePdf({ draft, watermarkUrl, qrCodeUrl }: { draft: ReceiptDraft; watermarkUrl?: string; qrCodeUrl?: string }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 44, height: 44, borderRadius: 10, border: '1px solid #e2e8f0', justifyContent: 'center', alignItems: 'center', marginRight: 10, backgroundColor: '#ffffff' }}>
              {draft.companyLogoUrl ? <Image src={draft.companyLogoUrl} style={{ width: 36, height: 36 }} /> : <Text style={{ fontSize: 8, color: '#64748b' }}>Logo</Text>}
            </View>
            <View>
              <Text style={styles.company}>{safeText(draft.companyName) || 'Acme Corporation'}</Text>
              <Text style={styles.info}>{safeText(draft.companyAddress)}</Text>
            </View>
          </View>
          <View style={{ textAlign: 'right' }}>
            <Text style={{ fontSize: 12, fontWeight: 700 }}>{safeText(draft.receiptNumber)}</Text>
            <Text style={styles.info}>{safeText(draft.date)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={{ fontSize: 9, color: '#64748b' }}>Billed To</Text>
          <Text style={{ fontSize: 11, fontWeight: 700 }}>{safeText(draft.customerName)}</Text>
          <Text style={{ fontSize: 9, color: '#64748b' }}>{safeText(draft.customerEmail)}</Text>
        </View>

        <View style={[styles.section, styles.amountBox]}>
          <Text style={{ fontSize: 9, color: '#475569' }}>Description</Text>
          <Text style={{ fontSize: 18, fontWeight: 800 }}>{safeCurrency(draft.currency, draft.amount)}</Text>
        </View>

        <View style={{ marginTop: 20, fontSize: 9, color: '#64748b' }}>
          <Text>Payment Method: {safeText(draft.paymentType)}</Text>
        </View>
        <PdfTemplateExtras draft={draft} watermarkUrl={watermarkUrl} qrCodeUrl={qrCodeUrl} />
      </Page>
    </Document>
  );
}
