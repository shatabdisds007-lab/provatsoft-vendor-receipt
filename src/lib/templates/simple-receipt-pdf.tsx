import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { ReceiptDraft } from '@/types/receipt';

const styles = StyleSheet.create({ page: { padding: 30, fontSize: 12 }, header: { fontSize: 16, marginBottom: 10 } });

export function SimpleReceiptPdf({ draft }: { draft: ReceiptDraft }) {
  return (
    <Document>
      <Page style={styles.page} size="A4">
        <View>
          <Text style={styles.header}>Receipt: {draft.receiptNumber || 'N/A'}</Text>
          <Text>Company: {draft.companyName || 'Company'}</Text>
          <Text>Customer: {draft.customerName || 'Customer'}</Text>
          <Text>Amount: {draft.currency || ''} {draft.amount || 0}</Text>
        </View>
      </Page>
    </Document>
  );
}
