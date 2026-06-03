(function () {
  const root = document.getElementById('root');
  const template = window.__TEMPLATE || {};
  const data = window.__DEMO || {};

  const palettes = {
    'education-branch': {
      side: '#1d4ed8',
      accent: '#1d4ed8',
      accent2: '#16a34a',
      accent3: '#db2777',
      soft: '#eff6ff',
      border: '#93c5fd',
      title: 'Payment Receipt',
      tone: 'Empowering Education, Enabling Excellence',
    },
    'university-admission': {
      side: '#0f766e',
      accent: '#0f766e',
      accent2: '#f59e0b',
      accent3: '#dc2626',
      soft: '#ecfdf5',
      border: '#99f6e4',
      title: 'Admission Receipt',
      tone: 'Academic clarity with trusted payment records',
    },
    'corporate-blue': {
      side: '#0a2540',
      accent: '#2563eb',
      accent2: '#06b6d4',
      accent3: '#475569',
      soft: '#f1f5f9',
      border: '#bfdbfe',
      title: 'Corporate Receipt',
      tone: 'Professional finance record for business payments',
    },
    'executive-white': {
      side: '#334155',
      accent: '#475569',
      accent2: '#2563eb',
      accent3: '#94a3b8',
      soft: '#f8fafc',
      border: '#cbd5e1',
      title: 'Executive Receipt',
      tone: 'Approved executive payment documentation',
    },
    'minimal-modern': {
      side: '#111827',
      accent: '#111827',
      accent2: '#64748b',
      accent3: '#0ea5e9',
      soft: '#f8fafc',
      border: '#d1d5db',
      title: 'Premium Receipt',
      tone: 'Clean, calm, and client-ready payment proof',
    },
    'luxury-black': {
      side: '#050505',
      accent: '#b88a2e',
      accent2: '#f7e6a7',
      accent3: '#111827',
      soft: '#fffbeb',
      border: '#d6b25e',
      title: 'Luxury Receipt',
      tone: 'Private client receipt with premium assurance',
    },
    'startup-style': {
      side: '#f97316',
      accent: '#f97316',
      accent2: '#111827',
      accent3: '#06b6d4',
      soft: '#fff7ed',
      border: '#fdba74',
      title: 'Studio Receipt',
      tone: 'Creative payment record with bold brand energy',
    },
    'elegant-premium': {
      side: '#7c3aed',
      accent: '#7c3aed',
      accent2: '#14b8a6',
      accent3: '#06b6d4',
      soft: '#f5f3ff',
      border: '#c4b5fd',
      title: 'Elegant Receipt',
      tone: 'Verified premium payment experience',
    },
    'healthcare-receipt': {
      side: '#0284c7',
      accent: '#0284c7',
      accent2: '#10b981',
      accent3: '#0f766e',
      soft: '#f0f9ff',
      border: '#bae6fd',
      title: 'Patient Receipt',
      tone: 'Clear healthcare payment record with trust',
    },
    'government-style': {
      side: '#1e293b',
      accent: '#0891b2',
      accent2: '#a855f7',
      accent3: '#334155',
      soft: '#ecfeff',
      border: '#67e8f9',
      title: 'Official Receipt',
      tone: 'Secure official payment documentation',
    },
  };

  const slug = template.slug || template.id || 'education-branch';
  const p = palettes[slug] || palettes['education-branch'];
  const amount = Number(data.amount || 0).toLocaleString();
  const total = Number(data.totalAmount || data.amount || 0).toLocaleString();
  const paid = Number(data.paidAmount || data.amount || 0).toLocaleString();
  const due = Math.max(Number(data.totalAmount || 0) - Number(data.paidAmount || 0), 0).toLocaleString();
  const isCash = String(data.paymentType || '').toLowerCase().includes('cash');
  const isCheque = String(data.paymentType || '').toLowerCase().includes('cheque');

  function field(label, value, strong) {
    return `
      <div class="field">
        <div class="field-label">${label}</div>
        <div class="colon">:</div>
        <div class="field-value ${strong ? 'strong' : ''}">${value || '-'}</div>
      </div>
    `;
  }

  function checkbox(label, checked) {
    return `
      <span class="check-item">
        <span class="box ${checked ? 'checked' : ''}"></span>
        ${label}
      </span>
    `;
  }

  root.innerHTML = `
    <style>
      .receipt-shell{position:relative;overflow:hidden;background:#fff;border:1px solid ${p.border};border-radius:22px;box-shadow:0 28px 80px rgba(15,23,42,.16)}
      .receipt-grid{display:grid;grid-template-columns:86px 1fr;min-height:760px}
      .side{position:relative;background:${p.side}}
      .side-mark{position:absolute;top:24px;left:18px;width:50px;height:50px;border-radius:13px;background:#fff;box-shadow:0 12px 28px rgba(15,23,42,.18)}
      .side-title{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) rotate(-90deg);white-space:nowrap;color:#fff;font-size:42px;font-weight:900;letter-spacing:.18em;text-transform:uppercase}
      .content{position:relative;padding:28px}
      .corner{position:absolute;border-radius:999px;opacity:.24;pointer-events:none}
      .corner.a{right:-46px;top:-52px;width:140px;height:140px;background:${p.accent2}}
      .corner.b{left:-42px;bottom:-52px;width:150px;height:150px;background:${p.accent}}
      .corner.c{right:-36px;bottom:-48px;width:130px;height:130px;background:${p.accent3}}
      .top{position:relative;display:grid;grid-template-columns:1fr 330px;gap:24px;border-bottom:3px solid ${p.accent};padding-bottom:18px}
      .brand-kicker{font-size:16px;font-weight:900;color:${p.accent};line-height:1.1}
      .brand{margin-top:4px;font-size:46px;line-height:.92;font-weight:950;letter-spacing:-.01em}
      .brand .a{color:${p.accent2}} .brand .b{color:${p.accent3}} .brand .c{display:block;color:#334155;font-size:38px;margin-top:7px}
      .tagline{margin-top:12px;font-size:14px;font-weight:800;color:${p.accent}}
      .contacts{margin-top:15px;display:grid;gap:7px;color:#111827;font-size:13px;font-weight:700;line-height:1.35}
      .logo-row{display:flex;flex-direction:row-reverse;align-items:center;gap:12px;text-align:right;justify-content:flex-start}
      .logo-box{width:56px;height:56px;border-radius:14px;border:1px solid ${p.border};background:#fff;display:grid;place-items:center;color:${p.accent};font-size:22px;font-weight:950;box-shadow:0 10px 24px rgba(15,23,42,.08)}
      .company-name{font-size:17px;font-weight:950;color:#0f172a}
      .company-sub{margin-top:3px;font-size:12px;font-weight:700;color:#64748b;line-height:1.35}
      .receipt-no{margin-top:16px;border:1px solid ${p.accent};border-radius:10px;overflow:hidden;background:#fff}
      .receipt-no-inner{display:grid;grid-template-columns:118px 1fr}
      .receipt-no-label{background:${p.accent};color:#fff;padding:10px;font-size:11px;font-weight:950;line-height:1.25;text-transform:uppercase;letter-spacing:.08em}
      .receipt-no-value{display:grid;place-items:center;padding:10px;color:#dc2626;font-size:22px;font-weight:950}
      .ref-lines{margin-top:14px;display:grid;gap:10px}
      .student-box{position:relative;margin-top:18px;border:1px solid ${p.border};background:${p.soft};border-radius:12px;padding:20px;display:grid;grid-template-columns:1fr 1fr;gap:28px}
      .student-box .right{border-left:1px solid ${p.border};padding-left:28px}
      .field{display:grid;grid-template-columns:168px 12px 1fr;gap:7px;align-items:baseline;margin-bottom:13px;font-size:16px}
      .field-label{font-weight:900;color:#111827}.colon{font-weight:900;color:#475569}.field-value{font-weight:800;color:#334155}.field-value.strong{color:${p.accent};font-weight:950}
      .payment-row{position:relative;margin-top:18px;display:grid;grid-template-columns:1fr 280px;gap:22px}
      .payment-lines{display:grid;gap:12px}
      .period{display:grid;grid-template-columns:auto 1fr auto 1fr;gap:12px;align-items:end;font-size:16px;font-weight:900}
      .underline{border-bottom:1px solid #94a3b8;padding-bottom:4px;color:${p.accent};font-weight:950}
      .paid-by{display:flex;align-items:center;flex-wrap:wrap;gap:14px 24px;font-size:15px;font-weight:950}
      .check-item{display:inline-flex;align-items:center;gap:8px}.box{width:21px;height:21px;border:2px solid #64748b;background:#fff;display:inline-block;position:relative}.box.checked{border-color:${p.accent};background:${p.soft}}.box.checked:after{content:'';position:absolute;left:6px;top:1px;width:6px;height:13px;border-right:3px solid ${p.accent};border-bottom:3px solid ${p.accent};transform:rotate(45deg)}
      .amount-card{border:2px solid ${p.accent};border-radius:12px;background:#fff;padding:18px;text-align:right;box-shadow:0 12px 28px rgba(15,23,42,.08)}
      .amount-label{font-size:18px;font-weight:950;color:#111827}.amount-value{margin-top:8px;color:${p.accent};font-size:48px;line-height:1;font-weight:950}
      .bottom{position:relative;margin-top:18px;display:grid;grid-template-columns:1.08fr .62fr .98fr;gap:14px}
      .panel{border:1px solid ${p.border};border-radius:12px;background:#fff;padding:16px}
      .signature-line{height:54px;border-bottom:1px solid #94a3b8;display:flex;align-items:end;color:${p.accent};font-family:Georgia,serif;font-size:26px;font-style:italic}
      .note{background:${p.soft}.85}.note-title{font-size:24px;font-weight:950;color:${p.accent}}.note ul{margin:12px 0 0 18px;padding:0;color:#334155;font-size:13px;font-weight:700;line-height:1.75}
      .summary{overflow:hidden;padding:0}.sum-row{display:grid;grid-template-columns:1fr 1.15fr;border-bottom:1px solid ${p.border}}.sum-row:last-child{border-bottom:0}.sum-label{background:${p.soft};padding:13px 16px;font-weight:950}.sum-val{padding:13px 16px;color:${p.accent};font-size:22px;font-weight:950}
      .footer{position:relative;margin-top:18px;text-align:center}.footer-line{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:14px}.bar{height:4px;border-radius:999px}.bar.left{background:linear-gradient(90deg,${p.accent},${p.accent2})}.bar.right{background:linear-gradient(90deg,${p.accent3},${p.accent})}.motto{font-family:Georgia,serif;font-size:20px;font-style:italic;font-weight:800;color:${p.accent}}.terms{margin-top:10px;font-size:13px;font-weight:700;color:#334155}
      @media (max-width:900px){body{padding:12px}.receipt-grid{grid-template-columns:1fr}.side{display:none}.content{padding:18px}.top,.student-box,.payment-row,.bottom{grid-template-columns:1fr}.student-box .right{border-left:0;padding-left:0}.brand{font-size:36px}.brand .c{font-size:30px}.amount-value{font-size:36px}.field{grid-template-columns:135px 10px 1fr;font-size:14px}.receipt-no-inner{grid-template-columns:1fr}.footer-line{grid-template-columns:1fr}.bar{display:none}}
    </style>
    <article class="receipt-shell">
      <div class="receipt-grid">
        <aside class="side">
          <div class="side-mark"></div>
          <div class="side-title">${p.title}</div>
        </aside>
        <main class="content">
          <div class="corner a"></div><div class="corner b"></div><div class="corner c"></div>
          <header class="top">
            <section>
              <div class="brand-kicker">${template.name || data.branchName}</div>
              <div class="brand"><span class="a">Provat</span><span class="b">Soft</span><span class="c">Ecosystem</span></div>
              <div class="tagline">Knowledge, Analyze, Decision, Execute</div>
              <div class="contacts">
                <div>${data.phone} (WhatsApp) &nbsp; ${data.altPhone || ''} (Call)</div>
                <div>${data.email} &nbsp; ${data.website}</div>
                <div>${data.companyAddress}</div>
              </div>
            </section>
            <section>
              <div class="logo-row">
                <div class="logo-box">P</div>
                <div>
                  <div class="company-name">${data.companyName || 'ProvatSoft Ecosystem'}</div>
                  <div class="company-sub">${data.branchName || template.name}</div>
                </div>
              </div>
              <div class="receipt-no">
                <div class="receipt-no-inner">
                  <div class="receipt-no-label">Auto generated<br/>receipt no.</div>
                  <div class="receipt-no-value">${data.receiptNumber}</div>
                </div>
              </div>
              <div class="ref-lines">
                ${field('Ref No.', data.referenceNumber, false)}
                ${field('Date', data.date, true)}
                ${field('Account No.', data.chequeNumber || 'N/A', false)}
              </div>
            </section>
          </header>

          <section class="student-box">
            <div>
              ${field(slug === 'healthcare-receipt' ? 'Name of the Patient' : 'Name of the Student', data.customerName, true)}
              ${field('Gender', data.gender, true)}
              ${field("Father's Name", data.fatherName, true)}
            </div>
            <div class="right">
              ${field('Date of Birth', data.dateOfBirth, true)}
              ${field('Nationality', data.nationality, true)}
              ${field(slug === 'corporate-blue' ? 'Organization' : 'University', data.university, true)}
            </div>
          </section>

          <section class="payment-row">
            <div class="payment-lines">
              ${field('Amount (In Word)', data.amountInWords, true)}
              ${field('For Payment of', data.paymentPurpose, true)}
              <div class="period"><span>From</span><span class="underline">${data.paymentPeriod || data.date}</span><span>to</span><span class="underline">${data.date}</span></div>
              <div class="paid-by">
                <span>Paid by</span>
                ${checkbox('Cash', isCash || !isCheque)}
                ${checkbox('Other', !isCash && !isCheque)}
                ${checkbox('Cheque', isCheque)}
                <span class="underline" style="min-width:260px">Cheque No.: ${data.chequeNumber || '-'}</span>
              </div>
            </div>
            <div class="amount-card">
              <div class="amount-label">Amount</div>
              <div class="amount-value">${data.currency} ${amount}/-</div>
            </div>
          </section>

          <section class="bottom">
            <div class="panel">
              ${field('Received by', data.receivedBy, true)}
              <div style="margin-left:187px;margin-top:-8px;font-size:13px;font-weight:800;line-height:1.45">${data.designation || ''}</div>
              <div style="display:grid;grid-template-columns:96px 1fr;gap:12px;align-items:end;margin-top:16px">
                <div style="font-weight:900">Signature :</div><div class="signature-line">${data.receivedBy || 'Authorized'}</div>
                <div style="font-weight:900">Date :</div><div class="underline">${data.date}</div>
              </div>
            </div>
            <div class="panel note">
              <div class="note-title">Note:</div>
              <ul><li>No file can be withdrawn.</li><li>${data.notes || 'No refund are paid.'}</li></ul>
            </div>
            <div class="panel summary">
              <div class="sum-row"><div class="sum-label">Account Amount</div><div class="sum-val">${data.currency} ${total}/-</div></div>
              <div class="sum-row"><div class="sum-label">This Payment</div><div class="sum-val">${data.currency} ${paid}/-</div></div>
              <div class="sum-row"><div class="sum-label">Balance Due</div><div class="sum-val">${data.currency} ${due}/-</div></div>
            </div>
          </section>

          <footer class="footer">
            <div class="footer-line"><div class="bar left"></div><div class="motto">${p.tone}</div><div class="bar right"></div></div>
            <div class="terms">${data.terms}</div>
          </footer>
        </main>
      </div>
    </article>
  `;
})();
