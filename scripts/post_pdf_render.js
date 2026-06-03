const fs = require('fs');
const path = require('path');
async function main() {
  const payloadPath = path.resolve(process.cwd(), 'tmp_payload.json');
  if (!fs.existsSync(payloadPath)) {
    console.error('Payload file not found:', payloadPath);
    process.exit(1);
  }
  const payload = fs.readFileSync(payloadPath, 'utf8');
  try {
    const res = await fetch('http://localhost:3000/api/pdf/render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    });

    const contentType = res.headers.get('content-type') || '';
    if (!res.ok) {
      const txt = await res.text();
      console.error('Server returned', res.status, txt);
      process.exit(1);
    }

    if (contentType.includes('application/pdf')) {
      const ab = await res.arrayBuffer();
      const buffer = Buffer.from(ab);
      fs.writeFileSync('tmp_node_test_receipt.pdf', buffer);
      console.log('Wrote tmp_node_test_receipt.pdf length', buffer.length);
      process.exit(0);
    } else {
      const txt = await res.text();
      console.log('Response content-type:', contentType);
      console.log(txt);
      process.exit(0);
    }
  } catch (err) {
    console.error('Fetch error', err);
    process.exit(1);
  }
}

main();
