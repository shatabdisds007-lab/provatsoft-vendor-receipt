import React from 'react';
import { Document, Page, View, Text, StyleSheet, Image } from '@react-pdf/renderer';
import { PdfTemplateExtras, safeText, safeCurrency } from '@/components/pdf-templates/pdf-template-helpers';
import type { ReceiptDraft } from '@/types/receipt';

const styles = StyleSheet.create({
  page: { padding: 26, fontSize: 10, fontFamily: 'Helvetica', backgroundColor: '#ffffff' },
  header: { borderBottom: '1 solid #cbd5e1', paddingBottom: 8, marginBottom: 10 },
  title: { fontSize: 14, fontWeight: 800, color: '#0f172a' },
  tableRow: { display: 'flex', flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
});

export function GovernmentPdf({ draft, watermarkUrl, qrCodeUrl }: { draft: ReceiptDraft; watermarkUrl?: string; qrCodeUrl?: string }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 44, height: 44, borderRadius: 10, border: '1px solid #cbd5e1', justifyContent: 'center', alignItems: 'center', marginRight: 10, backgroundColor: '#ffffff' }}>
            {draft.companyLogoUrl ? <Image src={draft.companyLogoUrl} style={{ width: 36, height: 36 }} /> : <Text style={{ fontSize: 8, color: '#475569' }}>Logo</Text>}
          </View>
          <View>
            <Text style={styles.title}>{safeText(draft.companyName) || 'Government Office'}</Text>
            <Text style={{ fontSize: 9, color: '#475569' }}>{safeText(draft.companyAddress)}</Text>
          </View>
        </View>
        </View>

        <View>
          <View style={styles.tableRow}>
            <Text style={{ fontSize: 9, color: '#64748b' }}>Receipt No</Text>
            <Text style={{ fontSize: 9 }}>{safeText(draft.receiptNumber)}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={{ fontSize: 9, color: '#64748b' }}>Date</Text>
            <Text style={{ fontSize: 9 }}>{safeText(draft.date)}</Text>
          </View>
        </View>

        <View style={{ marginTop: 14 }}>
          <Text style={{ fontSize: 9, color: '#64748b' }}>Received From</Text>
          <Text style={{ fontSize: 11, fontWeight: 700 }}>{safeText(draft.customerName)}</Text>
        </View>

        <View style={{ marginTop: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: 800 }}>{safeCurrency(draft.currency, draft.amount)}</Text>
        </View>
        <PdfTemplateExtras draft={draft} watermarkUrl={watermarkUrl} qrCodeUrl={qrCodeUrl} />
      </Page>
    </Document>
  );
}
