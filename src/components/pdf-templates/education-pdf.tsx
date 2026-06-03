import React from 'react';
import { Document, Page, View, Text, StyleSheet, Image } from '@react-pdf/renderer';
import type { ReceiptDraft } from '@/types/receipt';
import { PdfTemplateExtras, safeText, safeCurrency } from '@/components/pdf-templates/pdf-template-helpers';

const styles = StyleSheet.create({
  page: { padding: 28, fontSize: 11, fontFamily: 'Helvetica', backgroundColor: '#f1f5f9' },
  header: { display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  logoTitle: { display: 'flex', flexDirection: 'row', gap: 8, alignItems: 'center' },
  title: { fontSize: 16, fontWeight: 700, color: '#0b5dd7' },
  metaBox: { width: 150, padding: 8, borderRadius: 8, backgroundColor: '#e6f0ff' },
  section: { marginVertical: 8, padding: 10, borderRadius: 8, backgroundColor: '#ffffff' },
  label: { fontSize: 8, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 },
  value: { fontSize: 11, color: '#0f172a', fontWeight: 600 },
  amount: { fontSize: 24, fontWeight: 800, color: '#0754c8' },
  footer: { marginTop: 14, fontSize: 9, color: '#475569' },
});

export function EducationPdf({ draft, watermarkUrl, qrCodeUrl }: { draft: ReceiptDraft; watermarkUrl?: string; qrCodeUrl?: string }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.logoTitle}>
            <View style={{ width: 56, height: 56, borderRadius: 8, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center' }}>
              {draft.companyLogoUrl ? <Image src={draft.companyLogoUrl} style={{ width: 48, height: 48 }} /> : <Text style={{ fontSize: 10 }}>Logo</Text>}
            </View>
            <View>
              <Text style={styles.title}>{safeText(draft.companyName) || 'Academic Institute'}</Text>
              <Text style={{ fontSize: 9, color: '#475569' }}>{safeText(draft.branchName)}</Text>
            </View>
          </View>
          <View style={styles.metaBox}>
            <Text style={styles.label}>Receipt</Text>
            <Text style={styles.value}>{safeText(draft.receiptNumber)}</Text>
            <Text style={[styles.label, { marginTop: 6 }]}>Date</Text>
            <Text style={styles.value}>{safeText(draft.date)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Student</Text>
          <Text style={styles.value}>{safeText(draft.customerName)}</Text>
          <Text style={{ fontSize: 10, color: '#64748b' }}>{safeText(draft.customerEmail)}</Text>
        </View>

        <View style={[styles.section, { display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}> 
          <View>
            <Text style={styles.label}>Payment Purpose</Text>
            <Text style={styles.value}>{safeText(draft.paymentPurpose)}</Text>
          </View>
          <View style={{ textAlign: 'right' }}>
            <Text style={{ fontSize: 9, color: '#64748b' }}>Amount</Text>
            <Text style={styles.amount}>{safeCurrency(draft.currency, draft.amount)}</Text>
          </View>
        </View>

        <View style={{ marginTop: 18 }}>
          <Text style={styles.footer}>This is an academic receipt issued by the institution. Please keep for records.</Text>
        </View>
        <PdfTemplateExtras draft={draft} watermarkUrl={watermarkUrl} qrCodeUrl={qrCodeUrl} />
      </Page>
    </Document>
  );
}
