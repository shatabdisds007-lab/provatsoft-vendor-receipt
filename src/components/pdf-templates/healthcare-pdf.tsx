import React from 'react';
import { Document, Page, View, Text, StyleSheet, Image } from '@react-pdf/renderer';
import { PdfTemplateExtras, safeText, safeCurrency } from '@/components/pdf-templates/pdf-template-helpers';
import type { ReceiptDraft } from '@/types/receipt';

const styles = StyleSheet.create({
  page: { padding: 26, fontSize: 11, fontFamily: 'Helvetica', backgroundColor: '#ffffff' },
  header: { marginBottom: 14, paddingBottom: 10, borderBottom: '1 solid #d1d5db' },
  title: { fontSize: 18, fontWeight: 800, color: '#0f172a' },
  subtitle: { fontSize: 10, color: '#475569', marginTop: 4 },
  section: { marginTop: 16 },
  label: { fontSize: 9, color: '#6b7280', textTransform: 'uppercase', marginBottom: 4 },
  value: { fontSize: 12, fontWeight: 700, color: '#111827' },
  amountBox: { marginTop: 12, padding: 12, borderRadius: 8, backgroundColor: '#effaf5' },
  amount: { fontSize: 24, fontWeight: 900, color: '#047857' },
});

export function HealthcarePdf({ draft, watermarkUrl, qrCodeUrl }: { draft: ReceiptDraft; watermarkUrl?: string; qrCodeUrl?: string }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 44, height: 44, borderRadius: 10, border: '1px solid #d1d5db', justifyContent: 'center', alignItems: 'center', marginRight: 10, backgroundColor: '#ffffff' }}>
            {draft.companyLogoUrl ? <Image src={draft.companyLogoUrl} style={{ width: 36, height: 36 }} /> : <Text style={{ fontSize: 8, color: '#475569' }}>Logo</Text>}
          </View>
          <View>
            <Text style={styles.title}>{safeText(draft.companyName) || 'Healthcare Clinic'}</Text>
            <Text style={styles.subtitle}>{safeText(draft.companyAddress)}</Text>
          </View>
        </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Patient</Text>
          <Text style={styles.value}>{safeText(draft.customerName)}</Text>
          <Text style={{ fontSize: 9, color: '#6b7280', marginTop: 2 }}>{safeText(draft.customerEmail)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Services</Text>
          <Text style={styles.value}>{safeText(draft.paymentPurpose) || 'Medical Consultation'}</Text>
        </View>

        <View style={[styles.section, styles.amountBox]}>
          <Text style={styles.label}>Amount</Text>
          <Text style={styles.amount}>{safeCurrency(draft.currency, draft.amount)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={{ fontSize: 9, color: '#6b7280' }}>This receipt is issued for healthcare services. Please retain for insurance and medical records.</Text>
        </View>
        <PdfTemplateExtras draft={draft} watermarkUrl={watermarkUrl} qrCodeUrl={qrCodeUrl} />
      </Page>
    </Document>
  );
}
