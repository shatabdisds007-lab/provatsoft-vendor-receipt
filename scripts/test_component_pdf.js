const React = require('react');
const { pdf } = require('@react-pdf/renderer');
const mod = require('../src/components/pdf-templates/premium-receipt-pdf');
const ModernEducationPdf = mod.ModernEducationPdf || mod.ModernEducationPdf;
(async () => {
  const draft = { receiptNumber: 'C-001', companyName: 'TestCo', customerName: 'Zed', amount: 100, currency: 'USD' };
  try {
    const element = React.createElement(ModernEducationPdf, { draft, watermarkUrl: '', qrCodeUrl: '' });
    console.log('Created element type', typeof element, Object.keys(element));
    const p = pdf(element);
    const blob = await p.toBlob();
    const ab = await blob.arrayBuffer();
    require('fs').writeFileSync('tmp_component.pdf', Buffer.from(ab));
    console.log('Wrote tmp_component.pdf');
  } catch (err) {
    console.error('Component render error', err);
  }
})();
