import React from 'react';
import { Document, Page, View, Text, StyleSheet, Image } from '@react-pdf/renderer';
import { PdfTemplateExtras, safeText, safeCurrency } from '@/components/pdf-templates/pdf-template-helpers';
import type { ReceiptDraft } from '@/types/receipt';

const styles = StyleSheet.create({
  page: { padding: 26, fontSize: 11, fontFamily: 'Helvetica', backgroundColor: '#ffffff' },
  header: { borderBottom: '2 solid #0b63d7', paddingBottom: 8, marginBottom: 12, display: 'flex', flexDirection: 'row', justifyContent: 'space-between' },
  title: { fontSize: 18, fontWeight: 800, color: '#0b63d7' },
  sub: { fontSize: 9, color: '#475569' },
  section: { marginVertical: 8 },
  label: { fontSize: 8, color: '#475569', marginBottom: 4 },
  value: { fontSize: 11, fontWeight: 700 },
  amountBlock: { marginTop: 10, padding: 10, borderRadius: 8, backgroundColor: '#f8fafc' },
});

export function UniversityPdf({ draft, watermarkUrl, qrCodeUrl }: { draft: ReceiptDraft; watermarkUrl?: string; qrCodeUrl?: string }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 44, height: 44, borderRadius: 10, border: '1px solid #d1d5db', justifyContent: 'center', alignItems: 'center', marginRight: 10, backgroundColor: '#ffffff' }}>
              {draft.companyLogoUrl ? <Image src={draft.companyLogoUrl} style={{ width: 36, height: 36 }} /> : <Text style={{ fontSize: 8, color: '#475569' }}>Logo</Text>}
            </View>
            <View>
              <Text style={styles.title}>{safeText(draft.companyName) || 'University'}</Text>
              <Text style={styles.sub}>{safeText(draft.companyAddress)}</Text>
            </View>
          </View>
          <View style={{ textAlign: 'right' }}>
            <Text style={{ fontSize: 10, fontWeight: 700 }}>{safeText(draft.receiptNumber)}</Text>
            <Text style={styles.sub}>{safeText(draft.date)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Student</Text>
          <Text style={styles.value}>{safeText(draft.customerName)}</Text>
        </View>

        <View style={styles.amountBlock}>
          <Text style={{ fontSize: 9, color: '#475569' }}>Tuition / Fees</Text>
          <Text style={{ fontSize: 20, fontWeight: 800 }}>{safeCurrency(draft.currency, draft.amount)}</Text>
        </View>

        <View style={{ marginTop: 20 }}>
          <Text style={{ fontSize: 9, color: '#475569' }}>Reference: {safeText(draft.referenceNumber)}</Text>
        </View>
        <PdfTemplateExtras draft={draft} watermarkUrl={watermarkUrl} qrCodeUrl={qrCodeUrl} />
      </Page>
    </Document>
  );
}
