import React from 'react';
import { Document, Page, View, Text, StyleSheet, Image } from '@react-pdf/renderer';
import { PdfTemplateExtras, safeText, safeCurrency } from '@/components/pdf-templates/pdf-template-helpers';
import type { ReceiptDraft } from '@/types/receipt';

const styles = StyleSheet.create({
  page: { padding: 20, fontSize: 11, fontFamily: 'Helvetica', backgroundColor: '#fff' },
  hero: { padding: 12, borderRadius: 8, backgroundColor: '#eff6ff', marginBottom: 12 },
  title: { fontSize: 16, fontWeight: 800, color: '#0f172a' },
  amount: { fontSize: 22, fontWeight: 900, color: '#0ea5a4' },
});

export function StartupPdf({ draft, watermarkUrl, qrCodeUrl }: { draft: ReceiptDraft; watermarkUrl?: string; qrCodeUrl?: string }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.hero}>
          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 44, height: 44, borderRadius: 10, border: '1px solid #d1d5db', justifyContent: 'center', alignItems: 'center', marginRight: 10, backgroundColor: '#ffffff' }}>
                {draft.companyLogoUrl ? <Image src={draft.companyLogoUrl} style={{ width: 36, height: 36 }} /> : <Text style={{ fontSize: 8, color: '#475569' }}>Logo</Text>}
              </View>
              <View>
                <Text style={styles.title}>{safeText(draft.companyName) || 'Startup Inc.'}</Text>
                <Text style={{ fontSize: 9, color: '#475569' }}>{safeText(draft.paymentPurpose)}</Text>
              </View>
            </View>
          </View>
        </View>

        <View>
          <Text style={{ fontSize: 9, color: '#64748b' }}>Customer</Text>
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
