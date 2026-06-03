import React from 'react';
import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import type { ReceiptDraft } from '@/types/receipt';
import { getPremiumTemplateDesign, type PremiumTemplateKey } from '@/lib/templates/premium-template-designs';
import { PdfTemplateExtras, safeText, safeCurrency } from '@/components/pdf-templates/pdf-template-helpers';

type PremiumReceiptPdfProps = {
  draft: ReceiptDraft;
  watermarkUrl?: string;
  qrCodeUrl?: string;
  design: PremiumTemplateKey | string;
};

const styles = StyleSheet.create({
  page: {
    padding: 26,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  shell: {
    borderRadius: 20,
    padding: 22,
    minHeight: '100%',
    borderWidth: 1,
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  logoRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  company: {
    fontSize: 14,
    fontWeight: 700,
  },
  small: {
    fontSize: 9,
    lineHeight: 1.45,
  },
  eyebrow: {
    fontSize: 8,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: 700,
  },
  amount: {
    fontSize: 34,
    fontWeight: 700,
    lineHeight: 1.05,
  },
  h1: {
    fontSize: 28,
    fontWeight: 700,
    lineHeight: 1.08,
  },
  terms: {
    fontSize: 7.5,
    color: '#94a3b8',
    marginTop: 8,
  },
  card: {
    borderRadius: 15,
    borderWidth: 1,
    padding: 14,
  },
  detailGrid: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
  },
  detail: {
    width: '32%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 8,
    marginRight: 6,
    marginBottom: 6,
  },
  detailValue: {
    marginTop: 4,
    fontSize: 9,
    fontWeight: 700,
  },
  qr: {
    width: 82,
    height: 82,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sign: {
    minHeight: 76,
    borderRadius: 16,
    borderWidth: 1,
    padding: 10,
  },
  footer: {
    marginTop: 16,
    borderTopWidth: 1,
    paddingTop: 12,
  },
});

function money(draft: ReceiptDraft) {
  return safeCurrency(draft.currency, draft.amount);
}

function due(draft: ReceiptDraft) {
  return safeCurrency(draft.currency, Math.max((draft.totalAmount || 0) - (draft.paidAmount || 0), 0));
}

function LogoPdf({ draft, accent, ink, muted, light }: { draft: ReceiptDraft; accent: string; ink: string; muted: string; light?: boolean }) {
  return (
    <View style={styles.logoRow}>
      <View style={{ textAlign: 'right', maxWidth: 220 }}>
        <Text style={[styles.company, { color: ink }]}>{safeText(draft.companyName) || 'Provatsoft'}</Text>
        <Text style={[styles.small, { color: muted, marginTop: 2 }]}>{safeText(draft.branchName) || safeText(draft.companyAddress)}</Text>
        <Text style={[styles.small, { color: muted, marginTop: 2 }]}>{safeText(draft.phone)} / {safeText(draft.email)}</Text>
      </View>
      <View style={[styles.logo, { borderColor: accent, backgroundColor: light ? '#ffffff22' : '#ffffff' }]}>
        {draft.companyLogoUrl ? <Image src={safeText(draft.companyLogoUrl)} style={{ width: 28, height: 28 }} /> : <Text style={{ color: accent, fontWeight: 700 }}>{(draft.companyName || 'P').slice(0, 1)}</Text>}
      </View>
    </View>
  );
}

function DetailsPdf({ draft, dark, accent }: { draft: ReceiptDraft; dark?: boolean; accent: string }) {
  const bg = dark ? '#ffffff12' : '#ffffff';
  const border = dark ? '#ffffff26' : '#e2e8f0';
  const label = dark ? '#cbd5e1' : '#64748b';
  const ink = dark ? '#ffffff' : '#0f172a';
  const items = [
    ['Receipt No', draft.receiptNumber],
    ['Reference', draft.referenceNumber],
    ['Date', draft.date],
    ['Payment', draft.paymentType],
    ['Purpose', draft.paymentPurpose],
    ['Due', due(draft)],
  ];

  return (
    <>
      <View style={styles.detailGrid}>
        {items.map(([name, value]) => (
          <View key={name} style={[styles.detail, { backgroundColor: bg, borderColor: border }]}> 
            <Text style={[styles.eyebrow, { color: label, letterSpacing: 1.2 }]}>{name}</Text>
            <Text style={[styles.detailValue, { color: ink }]}>{safeText(value)}</Text>
          </View>
        ))}
      </View>
      {(draft.amountInWords || draft.notes) ? (
        <View style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {draft.amountInWords ? (
            <View style={[styles.card, { borderColor: border, backgroundColor: bg }]}> 
              <Text style={[styles.eyebrow, { color: label, letterSpacing: 1.2 }]}>Amount in words</Text>
              <Text style={[styles.detailValue, { color: ink, marginTop: 4, fontSize: 9, fontWeight: 400 }]}>{safeText(draft.amountInWords)}</Text>
            </View>
          ) : null}
          {draft.notes ? (
            <View style={[styles.card, { borderColor: border, backgroundColor: bg }]}> 
              <Text style={[styles.eyebrow, { color: label, letterSpacing: 1.2 }]}>Notes</Text>
              <Text style={[styles.detailValue, { color: ink, marginTop: 4, fontSize: 9, fontWeight: 400 }]}>{safeText(draft.notes)}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </>
  );
}

function FooterPdf({ draft, qrCodeUrl, dark, accent }: { draft: ReceiptDraft; qrCodeUrl?: string; dark?: boolean; accent: string }) {
  const ink = dark ? '#ffffff' : '#0f172a';
  const muted = dark ? '#cbd5e1' : '#64748b';
  const border = dark ? '#ffffff26' : '#e2e8f0';
  const bg = dark ? '#ffffff12' : '#ffffff';

  return (
    <>
      <View style={[styles.row, { marginTop: 18, alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }]}> 
        <View style={[styles.sign, { width: '32%', borderColor: border, backgroundColor: bg }]}> 
          <Text style={[styles.eyebrow, { color: muted, letterSpacing: 1.2 }]}>Authorized by</Text>
          {draft.signatureUrl ? <Image src={safeText(draft.signatureUrl)} style={{ width: 110, height: 38, marginTop: 8 }} /> : <View style={{ width: 110, height: 1, backgroundColor: accent, marginTop: 30, marginBottom: 8 }} />}
          <Text style={{ color: ink, fontWeight: 700 }}>{safeText(draft.receivedBy) || 'Accounts Lead'}</Text>
          <Text style={[styles.small, { color: muted }]}>{safeText(draft.designation) || 'Finance Manager'}</Text>
        </View>
        <View style={[styles.sign, { width: '32%', borderColor: border, backgroundColor: bg }]}> 
          <Text style={[styles.eyebrow, { color: muted, letterSpacing: 1.2 }]}>Official stamp</Text>
          {draft.stampUrl ? (
            <Image src={safeText(draft.stampUrl)} style={{ width: 110, height: 44, marginTop: 8 }} />
          ) : (
            <View style={{ width: 110, minHeight: 44, marginTop: 8, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={[styles.small, { color: muted }]}>Official stamp</Text>
            </View>
          )}
          <Text style={[styles.small, { color: ink, marginTop: 10, fontWeight: 700 }]}>{safeText(draft.companyName) || 'Company seal'}</Text>
          <Text style={[styles.small, { color: muted }]}>{safeText(draft.companyAddress) || 'Registered office'}</Text>
        </View>
        <View style={[styles.sign, { width: '32%', borderColor: border, backgroundColor: bg }]}> 
          <Text style={[styles.eyebrow, { color: muted, letterSpacing: 1.2 }]}>QR Verification</Text>
          <View style={[styles.row, { marginTop: 8, alignItems: 'center' }]}> 
            {qrCodeUrl ? <Image src={qrCodeUrl} style={{ width: 62, height: 62 }} /> : <View style={[styles.qr, { width: 62, height: 62, borderColor: accent }]}><Text style={{ color: accent }}>QR</Text></View>}
            <Text style={[styles.small, { color: muted, width: 110 }]}>Receipt data encoded for customer verification.</Text>
          </View>
        </View>
      </View>
      <View style={[styles.footer, { borderTopColor: border }]}> 
        <Text style={[styles.small, styles.terms, { color: muted }]}>Beautifully generated receipt. Terms: {safeText(draft.terms) || 'Generated for official payment records.'}</Text>
      </View>
    </>
  );
}

function ContactPdf({ draft, dark }: { draft: ReceiptDraft; dark?: boolean }) {
  const muted = dark ? '#cbd5e1' : '#64748b';
  const contactItems = [draft.phone, draft.email, draft.website, draft.companyAddress].map((value) => safeText(value)).filter(Boolean);
  return (
    <Text style={[styles.small, { color: muted, marginTop: 10 }]}> 
      {contactItems.join('  |  ')}
    </Text>
  );
}

export function PremiumReceiptPdf({ draft, watermarkUrl, qrCodeUrl, design }: PremiumReceiptPdfProps) {
  console.log('[premium-receipt-pdf] render start', { design, draft, watermarkUrl, qrCodeUrl });
  const spec = getPremiumTemplateDesign(design);
  console.log('[premium-receipt-pdf] design spec', { design, spec });
  const dark = ['luxury-black-gold', 'neo-glass', 'ultra-modern'].includes(spec.key);
  const pageBg = spec.key === 'canva-modern' ? '#fff7ed' : spec.paper;
  const shellBg = dark ? spec.surface : '#ffffff';
  const border = dark ? '#ffffff26' : spec.border;
  const ink = spec.ink;
  const muted = spec.muted;

  return (
    <Document>
      <Page size="A4" style={[styles.page, { backgroundColor: pageBg }]}>
        <View style={[styles.shell, { backgroundColor: shellBg, borderColor: border }]}>
          {watermarkUrl ? <Image src={watermarkUrl} style={{ position: 'absolute', width: 360, top: 230, left: 78, opacity: 0.05 }} /> : null}

          {spec.key === 'canva-modern' ? (
            <>
              <View style={styles.row}>
                <View style={{ width: '48%', borderRadius: 22, padding: 18, backgroundColor: spec.accent }}>
                  <Text style={[styles.eyebrow, { color: '#cffafe' }]}>{spec.eyebrow}</Text>
                  <Text style={[styles.h1, { color: '#ffffff', marginTop: 28 }]}>Payment received</Text>
                  <View style={{ marginTop: 28, borderRadius: 18, padding: 14, backgroundColor: '#ffffff' }}>
                    <Text style={[styles.eyebrow, { color: '#64748b' }]}>Amount</Text>
                    <Text style={[styles.amount, { color: '#111827', marginTop: 5 }]}>{money(draft)}</Text>
                  </View>
                </View>
                <View style={{ width: '48%' }}>
                  <LogoPdf draft={draft} accent={spec.accent} ink="#111827" muted="#64748b" />
                  <View style={[styles.card, { marginTop: 20, backgroundColor: '#cffafe', borderColor: '#a5f3fc' }]}>
                    <Text style={[styles.eyebrow, { color: '#155e75' }]}>Billed customer</Text>
                    <Text style={[styles.h1, { color: '#111827', marginTop: 12 }]}>{safeText(draft.customerName)}</Text>
                    <Text style={[styles.small, { color: '#475569', marginTop: 6 }]}>{safeText(draft.customerEmail)}</Text>
                  </View>
                </View>
              </View>
              <DetailsPdf draft={draft} accent={spec.accent} />
              <FooterPdf draft={draft} qrCodeUrl={qrCodeUrl} accent={spec.accent} />
            </>
          ) : spec.key === 'apple-minimal' ? (
            <>
              <View style={styles.row}>
                <LogoPdf draft={draft} accent={spec.accent} ink={ink} muted={muted} />
                <View style={{ textAlign: 'right' }}>
                  <Text style={[styles.eyebrow, { color: '#9ca3af' }]}>{spec.eyebrow}</Text>
                  <Text style={{ color: ink, marginTop: 8, fontWeight: 700 }}>{safeText(draft.receiptNumber)}</Text>
                </View>
              </View>
              <View style={[styles.row, { marginTop: 76 }]}>
                <View style={{ width: '45%' }}>
                  <Text style={[styles.small, { color: muted }]}>Received from</Text>
                  <Text style={[styles.h1, { color: ink, marginTop: 10 }]}>{safeText(draft.customerName)}</Text>
                  <Text style={[styles.small, { color: muted, marginTop: 14 }]}>{safeText(draft.paymentPurpose)}. {safeText(draft.notes)}</Text>
                </View>
                <View style={{ width: '50%', textAlign: 'right' }}>
                  <Text style={[styles.small, { color: muted }]}>Amount paid</Text>
                  <Text style={[styles.amount, { color: ink, marginTop: 8 }]}>{money(draft)}</Text>
                </View>
              </View>
              <DetailsPdf draft={draft} accent={spec.accent} />
              <FooterPdf draft={draft} qrCodeUrl={qrCodeUrl} accent={spec.accent} />
            </>
          ) : spec.key === 'luxury-black-gold' ? (
            <>
              <View style={[styles.row, { borderBottomWidth: 1, borderBottomColor: '#d6b25e55', paddingBottom: 22 }]}>
                <LogoPdf draft={draft} accent={spec.accent} ink="#ffffff" muted="#cbd5e1" light />
                <Text style={[styles.eyebrow, { color: '#f7e6a7', borderWidth: 1, borderColor: '#d6b25e66', borderRadius: 20, padding: 8 }]}>Settled</Text>
              </View>
              <View style={[styles.row, { marginTop: 34 }]}>
                <View style={{ width: '42%' }}>
                  <Text style={[styles.eyebrow, { color: spec.accent }]}>{spec.eyebrow}</Text>
                  <Text style={[styles.h1, { color: '#ffffff', marginTop: 12 }]}>{safeText(draft.customerName)}</Text>
                </View>
                <View style={{ width: '56%', textAlign: 'right' }}>
                  <Text style={[styles.small, { color: '#cbd5e1' }]}>Premium amount</Text>
                  <Text style={[styles.amount, { color: '#f7e6a7', marginTop: 8 }]}>{money(draft)}</Text>
                </View>
              </View>
              <DetailsPdf draft={draft} dark accent={spec.accent} />
              <FooterPdf draft={draft} qrCodeUrl={qrCodeUrl} dark accent={spec.accent} />
            </>
          ) : spec.key === 'modern-education' ? (
            <>
              <View style={styles.row}>
                <View style={{ width: 58, minHeight: 690, backgroundColor: '#1d4ed8', borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#ffffff', fontSize: 21, fontWeight: 700, textAlign: 'center' }}>PAYMENT{"\n"}RECEIPT</Text>
                </View>
                <View style={{ width: 470 }}>
                  <View style={[styles.row, { borderBottomWidth: 1.6, borderBottomColor: '#1d4ed8', paddingBottom: 12 }]}>
                    <View style={{ width: 250 }}>
                      <Text style={{ color: '#1d4ed8', fontSize: 10, fontWeight: 700 }}>{safeText(draft.branchName) || 'Education Branch'}</Text>
                      <Text style={{ color: '#16a34a', fontSize: 27, fontWeight: 700, marginTop: 2 }}>ProvatSoft</Text>
                      <Text style={{ color: '#334155', fontSize: 23, fontWeight: 700 }}>Ecosystem</Text>
                      <Text style={{ color: '#0284c7', fontSize: 8, fontWeight: 700, marginTop: 4 }}>Knowledge, Analyze, Decision, Execute</Text>
                      <ContactPdf draft={draft} />
                    </View>
                    <View style={{ width: 200, alignItems: 'flex-end' }}>
                      <LogoPdf draft={draft} accent={spec.accent} ink={ink} muted={muted} />
                      <View style={{ marginTop: 10, width: 190, borderWidth: 1, borderColor: '#2563eb', borderRadius: 8 }}>
                        <View style={styles.row}>
                          <Text style={{ width: 76, backgroundColor: '#1d4ed8', color: '#ffffff', fontSize: 7, fontWeight: 700, padding: 6 }}>AUTO GENERATED{"\n"}RECEIPT NO.</Text>
                          <Text style={{ width: 112, color: '#dc2626', fontSize: 13, fontWeight: 700, padding: 7, textAlign: 'center' }}>{safeText(draft.receiptNumber)}</Text>
                        </View>
                      </View>
                      <Text style={[styles.small, { color: '#0f172a', marginTop: 8 }]}>Ref No.: {safeText(draft.referenceNumber)}</Text>
                      <Text style={[styles.small, { color: '#0f172a', marginTop: 3 }]}>Date: {safeText(draft.date)}</Text>
                    </View>
                  </View>

                  <View style={{ marginTop: 12, borderWidth: 1, borderColor: '#93c5fd', borderRadius: 12, padding: 12, backgroundColor: '#eff6ff' }}>
                    <View style={styles.row}>
                      <View style={{ width: '48%' }}>
                        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'baseline' }}>
                          <Text style={[styles.small, { color: '#0f172a' }]}>Name of the Student :</Text>
                          <Text style={{ color: '#1d4ed8', fontWeight: 700, marginLeft: 6 }}>{safeText(draft.customerName)}</Text>
                        </View>
                        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'baseline', marginTop: 7 }}>
                          <Text style={[styles.small, { color: '#0f172a' }]}>Gender :</Text>
                          <Text style={{ color: '#1d4ed8', fontWeight: 700, marginLeft: 6 }}>{safeText(draft.gender)}</Text>
                        </View>
                        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'baseline', marginTop: 7 }}>
                          <Text style={[styles.small, { color: '#0f172a' }]}>Father\'s Name :</Text>
                          <Text style={{ color: '#1d4ed8', fontWeight: 700, marginLeft: 6 }}>{safeText(draft.fatherName)}</Text>
                        </View>
                      </View>
                      <View style={{ width: '48%', borderLeftWidth: 1, borderLeftColor: '#93c5fd', paddingLeft: 14 }}>
                        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'baseline' }}>
                          <Text style={[styles.small, { color: '#0f172a' }]}>Date of Birth :</Text>
                          <Text style={{ color: '#1d4ed8', fontWeight: 700, marginLeft: 6 }}>{safeText(draft.dateOfBirth)}</Text>
                        </View>
                        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'baseline', marginTop: 7 }}>
                          <Text style={[styles.small, { color: '#0f172a' }]}>Nationality :</Text>
                          <Text style={{ color: '#1d4ed8', fontWeight: 700, marginLeft: 6 }}>{safeText(draft.nationality)}</Text>
                        </View>
                        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'baseline', marginTop: 7 }}>
                          <Text style={[styles.small, { color: '#0f172a' }]}>University :</Text>
                          <Text style={{ color: '#1d4ed8', fontWeight: 700, marginLeft: 6 }}>{safeText(draft.university)}</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View style={[styles.row, { marginTop: 14 }]}>
                    <View style={{ width: 286 }}>
                      <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'baseline' }}>
                        <Text style={[styles.small, { color: '#0f172a' }]}>Amount (In Word) :</Text>
                        <Text style={{ color: '#1d4ed8', fontWeight: 700, marginLeft: 6 }}>{safeText(draft.amountInWords)}</Text>
                      </View>
                      <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'baseline', marginTop: 7 }}>
                        <Text style={[styles.small, { color: '#0f172a' }]}>For Payment of :</Text>
                        <Text style={{ color: '#1d4ed8', fontWeight: 700, marginLeft: 6 }}>{safeText(draft.paymentPurpose)}</Text>
                      </View>
                      <Text style={[styles.small, { color: '#0f172a', marginTop: 7 }]}>From {safeText(draft.paymentPeriod) || safeText(draft.date)} to {safeText(draft.date)}</Text>
                      <Text style={[styles.small, { color: '#0f172a', marginTop: 7 }]}>Paid by: {safeText(draft.paymentType)}    Cheque No.: {safeText(draft.chequeNumber) || '-'}</Text>
                    </View>
                    <View style={{ width: 170, borderWidth: 1.5, borderColor: '#2563eb', borderRadius: 9, padding: 12, textAlign: 'right' }}>
                      <Text style={{ color: '#0f172a', fontSize: 10, fontWeight: 700 }}>Amount</Text>
                      <Text style={{ color: '#1d4ed8', fontSize: 27, fontWeight: 700, marginTop: 5 }}>{money(draft)}</Text>
                    </View>
                  </View>

                  <View style={[styles.row, { marginTop: 14 }]}>
                    <View style={{ width: 214, borderWidth: 1, borderColor: '#93c5fd', borderRadius: 10, padding: 10 }}>
                      <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'baseline' }}>
                        <Text style={[styles.small, { color: '#0f172a' }]}>Received by :</Text>
                        <Text style={{ color: '#1d4ed8', fontWeight: 700, marginLeft: 6 }}>{safeText(draft.receivedBy)}</Text>
                      </View>
                      <Text style={[styles.small, { color: '#0f172a', marginTop: 3 }]}>{safeText(draft.designation)}</Text>
                      {draft.signatureUrl ? <Image src={safeText(draft.signatureUrl)} style={{ width: 120, height: 38, marginTop: 8 }} /> : <View style={{ width: 120, height: 1, backgroundColor: '#1d4ed8', marginTop: 28 }} />}
                      <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'baseline', marginTop: 6 }}>
                        <Text style={[styles.small, { color: '#0f172a' }]}>Date :</Text>
                        <Text style={{ color: '#1d4ed8', fontWeight: 700, marginLeft: 6 }}>{safeText(draft.date)}</Text>
                      </View>
                    </View>
                    <View style={{ width: 108, borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 10, padding: 10, backgroundColor: '#eff6ff' }}>
                      <Text style={{ color: '#1d4ed8', fontSize: 13, fontWeight: 700 }}>Note:</Text>
                      <Text style={[styles.small, { color: '#334155', marginTop: 8 }]}>No file can be withdrawn.</Text>
                      <Text style={[styles.small, { color: '#334155', marginTop: 5 }]}>{safeText(draft.notes) || 'No refund are paid.'}</Text>
                    </View>
                    <View style={{ width: 132, borderWidth: 1, borderColor: '#93c5fd', borderRadius: 10 }}>
                      {[
                        ['Account Amount', draft.totalAmount || draft.amount],
                        ['This Payment', draft.paidAmount || draft.amount],
                        ['Balance Due', Math.max((draft.totalAmount || 0) - (draft.paidAmount || 0), 0)],
                      ].map(([label, value]) => (
                        <View key={label} style={styles.row}>
                          <Text style={{ width: 72, borderBottomWidth: 1, borderBottomColor: '#bfdbfe', backgroundColor: '#eff6ff', color: '#0f172a', fontSize: 8, fontWeight: 700, padding: 7 }}>{label}</Text>
                          <Text style={{ width: 60, borderBottomWidth: 1, borderBottomColor: '#bfdbfe', color: '#1d4ed8', fontSize: 10, fontWeight: 700, padding: 7 }}>{safeText(draft.currency) || 'BDT'} {Number(value).toLocaleString()}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View style={{ marginTop: 14, textAlign: 'center' }}>
                    <Text style={{ color: '#1d4ed8', fontSize: 12, fontStyle: 'italic', fontWeight: 700 }}>Empowering Education, Enabling Excellence</Text>
                    <Text style={[styles.small, { color: '#334155', marginTop: 6 }]}>This payment receipt is generated and approved by Provatsoft Payment System Software.</Text>
                  </View>
                </View>
              </View>
            </>
          ) : spec.key === 'creative-agency' ? (
            <>
              <View style={styles.row}>
                <View style={{ width: 150, borderRadius: 22, padding: 16, backgroundColor: '#111827', minHeight: 420 }}>
                  <Text style={[styles.eyebrow, { color: '#fdba74' }]}>{spec.eyebrow}</Text>
                  <Text style={{ color: spec.accent, fontSize: 48, fontWeight: 700, marginTop: 42 }}>PAID</Text>
                  <Text style={[styles.small, { color: '#cbd5e1', marginTop: 44 }]}>{safeText(draft.companyAddress)}</Text>
                </View>
                <View style={{ width: 350 }}>
                  <LogoPdf draft={draft} accent={spec.accent} ink={ink} muted={muted} />
                  <View style={{ marginTop: 28, borderRadius: 22, padding: 18, backgroundColor: spec.accent }}>
                    <Text style={[styles.eyebrow, { color: '#ffedd5' }]}>Amount paid</Text>
                    <Text style={[styles.amount, { color: '#ffffff', marginTop: 8 }]}>{money(draft)}</Text>
                  </View>
                  <View style={[styles.card, { marginTop: 18, borderColor: '#e2e8f0', backgroundColor: '#ffffff' }]}>
                    <Text style={[styles.eyebrow, { color: '#64748b' }]}>Client</Text>
                    <Text style={[styles.h1, { color: ink, marginTop: 8 }]}>{safeText(draft.customerName)}</Text>
                    <Text style={[styles.small, { color: muted, marginTop: 8 }]}>{safeText(draft.paymentPurpose)}</Text>
                  </View>
                </View>
              </View>
              <DetailsPdf draft={draft} accent={spec.accent} />
              <FooterPdf draft={draft} qrCodeUrl={qrCodeUrl} accent={spec.accent} />
            </>
          ) : (
            <>
              <View style={styles.row}>
                <LogoPdf draft={draft} accent={spec.accent} ink={ink} muted={muted} light={dark} />
                <View style={{ width: 220, borderRadius: 22, padding: 16, backgroundColor: spec.accent }}>
                  <Text style={[styles.eyebrow, { color: '#ffffffcc' }]}>Premium amount</Text>
                  <Text style={[styles.amount, { color: '#ffffff', marginTop: 8 }]}>{money(draft)}</Text>
                  <Text style={[styles.small, { color: '#ffffffcc', marginTop: 8 }]}>{safeText(draft.amountInWords)}</Text>
                </View>
              </View>
              <View style={[styles.row, { marginTop: 24 }]}>
                <View style={[styles.card, { width: '45%', backgroundColor: dark ? '#ffffff12' : '#ffffff', borderColor: dark ? '#ffffff26' : '#e2e8f0' }]}>
                  <Text style={[styles.eyebrow, { color: muted }]}>Billed customer</Text>
                  <Text style={[styles.h1, { color: ink, marginTop: 10 }]}>{safeText(draft.customerName)}</Text>
                  <Text style={[styles.small, { color: muted, marginTop: 8 }]}>{safeText(draft.customerEmail)}</Text>
                  <Text style={[styles.small, { color: muted, marginTop: 16 }]}>{safeText(draft.paymentPurpose)}</Text>
                </View>
                <View style={{ width: '52%' }}>
                  <DetailsPdf draft={draft} dark={dark} accent={spec.accent} />
                </View>
              </View>
              <FooterPdf draft={draft} qrCodeUrl={qrCodeUrl} dark={dark} accent={spec.accent} />
            </>
          )}
        </View>
      </Page>
    </Document>
  );
}

export function ExecutiveGlassPdf(props: Omit<PremiumReceiptPdfProps, 'design'>) {
  return <PremiumReceiptPdf {...props} design="executive-glass" />;
}

export function CanvaModernPdf(props: Omit<PremiumReceiptPdfProps, 'design'>) {
  return <PremiumReceiptPdf {...props} design="canva-modern" />;
}

export function StripeProfessionalPdf(props: Omit<PremiumReceiptPdfProps, 'design'>) {
  return <PremiumReceiptPdf {...props} design="stripe-professional" />;
}

export function AppleMinimalPdf(props: Omit<PremiumReceiptPdfProps, 'design'>) {
  return <PremiumReceiptPdf {...props} design="apple-minimal" />;
}

export function LuxuryBlackGoldPdf(props: Omit<PremiumReceiptPdfProps, 'design'>) {
  return <PremiumReceiptPdf {...props} design="luxury-black-gold" />;
}

export function ModernEducationPdf(props: Omit<PremiumReceiptPdfProps, 'design'>) {
  return <PremiumReceiptPdf {...props} design="modern-education" />;
}

export function CreativeAgencyPdf(props: Omit<PremiumReceiptPdfProps, 'design'>) {
  return <PremiumReceiptPdf {...props} design="creative-agency" />;
}

export function NeoGlassPdf(props: Omit<PremiumReceiptPdfProps, 'design'>) {
  return <PremiumReceiptPdf {...props} design="neo-glass" />;
}

export function PremiumHealthcarePdf(props: Omit<PremiumReceiptPdfProps, 'design'>) {
  return <PremiumReceiptPdf {...props} design="premium-healthcare" />;
}

export function UltraModernPdf(props: Omit<PremiumReceiptPdfProps, 'design'>) {
  return <PremiumReceiptPdf {...props} design="ultra-modern" />;
}
