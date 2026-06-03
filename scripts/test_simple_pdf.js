const React = require('react');
const { pdf, Document, Page, Text } = require('@react-pdf/renderer');
(async () => {
  try {
    const doc = React.createElement(Document, null, React.createElement(Page, null, React.createElement(Text, null, 'Hello PDF')));
    const p = pdf(doc);
    console.log('pdf(...) returned type', typeof p, Object.keys(p || {}));
    if (typeof p.toBlob === 'function') {
      const blob = await p.toBlob();
      if (typeof blob.arrayBuffer === 'function') {
        const ab = await blob.arrayBuffer();
        require('fs').writeFileSync('tmp_simple.pdf', Buffer.from(ab));
        console.log('Wrote tmp_simple.pdf (from blob)');
      } else {
        console.error('Blob does not support arrayBuffer');
      }
    } else if (typeof p.toBuffer === 'function') {
      const raw = await p.toBuffer();
      try{
        require('fs').writeFileSync('tmp_simple.pdf', Buffer.from(raw));
        console.log('Wrote tmp_simple.pdf (from toBuffer)');
      }catch(e){
        console.error('Failed to write buffer from toBuffer', e.message);
        console.error('toBuffer returned constructor', raw && raw.constructor && raw.constructor.name);
      }
    } else if (typeof p.pipe === 'function') {
      const fs = require('fs');
      const out = fs.createWriteStream('tmp_simple.pdf');
      p.pipe(out);
      p.end();
      out.on('finish', () => console.log('Wrote tmp_simple.pdf via stream'));
    } else {
      console.error('pdf(doc) returned unexpected object', p);
    }
  } catch (err) {
    console.error('Simple PDF error', err);
    process.exit(1);
  }
})();
