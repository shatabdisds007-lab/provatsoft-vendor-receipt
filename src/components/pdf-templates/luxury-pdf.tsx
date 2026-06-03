import React from 'react';
import { Document, Page, View, Text, StyleSheet, Image } from '@react-pdf/renderer';
import { PdfTemplateExtras, safeText, safeCurrency } from '@/components/pdf-templates/pdf-template-helpers';
import type { ReceiptDraft } from '@/types/receipt';

const styles = StyleSheet.create({
  page: { padding: 28, fontSize: 11, fontFamily: 'Helvetica', backgroundColor: '#000000' },
  title: { fontSize: 20, fontWeight: 900, color: '#f5e9c3' },
  info: { fontSize: 9, color: '#d1c7a8' },
  amount: { fontSize: 26, fontWeight: 900, color: '#f5e9c3' },
});

export function LuxuryPdf({ draft, watermarkUrl, qrCodeUrl }: { draft: ReceiptDraft; watermarkUrl?: string; qrCodeUrl?: string }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 44, height: 44, borderRadius: 10, border: '1px solid #f5e9c3', justifyContent: 'center', alignItems: 'center', marginRight: 10, backgroundColor: '#ffffff' }}>
            {draft.companyLogoUrl ? <Image src={draft.companyLogoUrl} style={{ width: 36, height: 36 }} /> : <Text style={{ fontSize: 8, color: '#d1c7a8' }}>Logo</Text>}
          </View>
          <View>
            <Text style={styles.title}>{safeText(draft.companyName) || 'Luxury Co.'}</Text>
            <Text style={styles.info}>{safeText(draft.companyAddress)}</Text>
          </View>
        </View>

        <View style={{ marginTop: 36, textAlign: 'right' }}>
          <Text style={styles.amount}>{safeCurrency(draft.currency, draft.amount)}</Text>
        </View>

        <View style={{ marginTop: 36 }}>
          <Text style={{ fontSize: 9, color: '#d1c7a8' }}>Authorized signature</Text>
        </View>
        <PdfTemplateExtras draft={draft} watermarkUrl={watermarkUrl} qrCodeUrl={qrCodeUrl} />
      </Page>
    </Document>
  );
}
