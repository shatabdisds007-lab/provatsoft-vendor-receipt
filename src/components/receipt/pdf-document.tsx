import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import type { ReceiptDraft } from '@/types/receipt';
import { currencySymbols } from '@/lib/currency';

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#f8fafc',
  },
  watermark: {
    position: 'absolute',
    width: '80%',
    opacity: 0.08,
    top: '35%',
    left: '10%',
    transform: 'rotate(-25deg)',
  },
  container: {
    border: '1px solid #e2e8f0',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: 12,
    marginBottom: 12,
  },
  logoSection: {
    display: 'flex',
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  logoBox: {
    width: 72,
    height: 72,
    border: '1px solid #cbd5e1',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  companyTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: '#0f172a',
  },
  companyText: {
    fontSize: 8,
    color: '#475569',
  },
  receiptMeta: {
    width: 160,
    border: '1px solid #cbd5e1',
    borderRadius: 12,
    padding: 10,
    backgroundColor: '#f8fafc',
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 700,
    marginBottom: 6,
    color: '#0f172a',
  },
  card: {
    border: '1px solid #e2e8f0',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#f8fafc',
  },
  label: {
    fontSize: 8,
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  value: {
    fontSize: 10,
    color: '#0f172a',
    fontWeight: 600,
  },
  amountBox: {
    border: '1px solid #cbd5e1',
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#eef2ff',
    marginBottom: 12,
  },
  amountValue: {
    fontSize: 22,
    fontWeight: 700,
    color: '#1d4ed8',
  },
  summaryGrid: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  summaryCard: {
    flex: 1,
    minWidth: 116,
    border: '1px solid #e2e8f0',
    borderRadius: 14,
    padding: 10,
    backgroundColor: '#ffffff',
  },
  signatureStamp: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 12,
  },
  signatureBox: {
    border: '1px solid #cbd5e1',
    borderRadius: 12,
    width: '60%',
    minHeight: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stampBox: {
    border: '1px solid #cbd5e1',
    borderRadius: 12,
    width: '35%',
    minHeight: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    marginTop: 16,
    paddingTop: 12,
    borderTop: '1px solid #e2e8f0',
  },
  footerText: {
    fontSize: 8,
    color: '#475569',
  },
  qrSection: {
    display: 'flex',
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  qrImage: {
    width: 80,
    height: 80,
  },
});

interface PdfDocumentProps {
  draft: ReceiptDraft;
  watermarkUrl?: string;
  qrCodeUrl?: string;
}

export function PdfDocument({ draft, watermarkUrl, qrCodeUrl }: PdfDocumentProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.container}>
          {watermarkUrl ? <Image src={watermarkUrl} style={styles.watermark} /> : null}
          <View style={styles.header}>
            <View style={styles.logoSection}>
              <View style={styles.logoBox}>
                {draft.companyLogoUrl ? <Image src={draft.companyLogoUrl} style={{ width: 56, height: 56 }} /> : <Text style={styles.label}>LOGO</Text>}
              </View>
              <View>
                <Text style={styles.companyTitle}>{draft.companyName}</Text>
                <Text style={styles.companyText}>{draft.branchName}</Text>
                <Text style={styles.companyText}>{draft.companyAddress}</Text>
                <Text style={styles.companyText}>{draft.phone} • {draft.email}</Text>
                <Text style={styles.companyText}>{draft.website}</Text>
              </View>
            </View>
            <View style={styles.receiptMeta}>
              <Text style={styles.label}>Receipt Number</Text>
              <Text style={styles.value}>{draft.receiptNumber}</Text>
              <Text style={[styles.label, { marginTop: 6 }]}>Reference</Text>
              <Text style={styles.value}>{draft.referenceNumber}</Text>
              <Text style={[styles.label, { marginTop: 6 }]}>Date</Text>
              <Text style={styles.value}>{draft.date}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Student Information</Text>
            <View style={styles.row}>
              <View>
                <Text style={styles.label}>Student Name</Text>
                <Text style={styles.value}>{draft.customerName}</Text>
              </View>
              <View>
                <Text style={styles.label}>Gender</Text>
                <Text style={styles.value}>{draft.gender}</Text>
              </View>
            </View>
            <View style={styles.row}>
              <View>
                <Text style={styles.label}>Father Name</Text>
                <Text style={styles.value}>{draft.fatherName}</Text>
              </View>
              <View>
                <Text style={styles.label}>Date of Birth</Text>
                <Text style={styles.value}>{draft.dateOfBirth}</Text>
              </View>
            </View>
            <View style={styles.row}>
              <View>
                <Text style={styles.label}>Nationality</Text>
                <Text style={styles.value}>{draft.nationality}</Text>
              </View>
              <View>
                <Text style={styles.label}>University</Text>
                <Text style={styles.value}>{draft.university}</Text>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Payment Summary</Text>
            <Text style={styles.label}>Amount in Words</Text>
            <Text style={styles.value}>{draft.amountInWords}</Text>
            <View style={[styles.row, { marginTop: 10 }]}> 
              <View>
                <Text style={styles.label}>Payment Purpose</Text>
                <Text style={styles.value}>{draft.paymentPurpose}</Text>
              </View>
              <View>
                <Text style={styles.label}>Payment Period</Text>
                <Text style={styles.value}>{draft.paymentPeriod}</Text>
              </View>
            </View>
          </View>

          <View style={styles.amountBox}>
            <Text style={styles.amountValue}>{currencySymbols[draft.currency] ?? draft.currency} {draft.amount.toLocaleString()}</Text>
          </View>

          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.label}>Total Amount</Text>
              <Text style={styles.value}>{currencySymbols[draft.currency] ?? draft.currency} {draft.totalAmount.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.label}>Paid Amount</Text>
              <Text style={styles.value}>{currencySymbols[draft.currency] ?? draft.currency} {draft.paidAmount.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.label}>Due Amount</Text>
              <Text style={styles.value}>{currencySymbols[draft.currency] ?? draft.currency} {(draft.totalAmount - draft.paidAmount).toLocaleString()}</Text>
            </View>
          </View>

          <View style={styles.signatureStamp}>
            <View style={styles.signatureBox}>
              {draft.signatureUrl ? <Image src={draft.signatureUrl} style={{ width: '100%', height: '100%' }} /> : <Text style={styles.label}>Signature</Text>}
            </View>
            <View style={styles.stampBox}>
              {draft.stampUrl ? <Image src={draft.stampUrl} style={{ width: '100%', height: '100%' }} /> : <Text style={styles.label}>Stamp</Text>}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.value}>{draft.notes}</Text>
          </View>

          <View style={styles.row}>
            <View>
              <Text style={styles.label}>Received By</Text>
              <Text style={styles.value}>{draft.receivedBy}</Text>
            </View>
            <View>
              <Text style={styles.label}>Designation</Text>
              <Text style={styles.value}>{draft.designation}</Text>
            </View>
          </View>

          <View style={styles.qrSection}>
            {qrCodeUrl ? <Image src={qrCodeUrl} style={styles.qrImage} /> : null}
            <View>
              <Text style={styles.label}>QR Code</Text>
              <Text style={styles.value}>Receipt data encoded for verification.</Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Generated by SaaS Receipt Management System. This document is a professionally formatted proof of payment and complies with institutional receipt standards.
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
