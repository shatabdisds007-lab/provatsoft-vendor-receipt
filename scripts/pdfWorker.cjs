const React = require('react');
const { renderToBuffer, Document, Page, Text, View, StyleSheet } = require('@react-pdf/renderer');

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 12 },
  header: { fontSize: 16, marginBottom: 12, fontWeight: 'bold' },
  line: { marginBottom: 6 },
  section: { marginBottom: 15 },
});

function createDocument(draft) {
  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: 'A4', style: styles.page },
      React.createElement(View, null,
        React.createElement(Text, { style: styles.header }, `Receipt: ${draft?.receiptNumber || 'N/A'}`),
        React.createElement(View, { style: styles.section },
          React.createElement(Text, { style: styles.line }, `Company: ${draft?.companyName || 'Company'}`),
          React.createElement(Text, { style: styles.line }, `Branch: ${draft?.branchName || ''}`),
          React.createElement(Text, { style: styles.line }, `Customer: ${draft?.customerName || 'Customer'}`),
          React.createElement(Text, { style: styles.line }, `Amount: ${draft?.currency || ''} ${draft?.amount || 0}`),
          React.createElement(Text, { style: styles.line }, `Date: ${draft?.date || ''}`),
          React.createElement(Text, { style: styles.line }, `Payment Type: ${draft?.paymentType || ''}`),
          React.createElement(Text, { style: styles.line }, `Description: ${draft?.description || ''}`),
        ),
      ),
    ),
  );
}

function respond(message) {
  if (process.send) {
    process.send(message);
  } else {
    process.stdout.write(JSON.stringify(message));
  }
}

async function run(payload) {
  try {
    const doc = createDocument(payload.draft || {});
    const buffer = await renderToBuffer(doc);
    respond({ data: buffer.toString('base64') });
  } catch (error) {
    respond({ error: String(error?.message || error) });
  }
}

if (process.send) {
  process.on('message', (payload) => {
    run(payload);
  });
} else {
  let json = '';
  process.stdin.on('data', (chunk) => { json += chunk; });
  process.stdin.on('end', async () => {
    try {
      const payload = JSON.parse(json);
      await run(payload);
    } catch (error) {
      respond({ error: String(error?.message || error) });
    }
  });
}
