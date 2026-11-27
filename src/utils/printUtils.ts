/**
 * Utility functions for generating clean, official printable slips and documents
 * for the Tabaco City Transportation Regulation Division (TRD).
 * 
 * Uses standalone print window / iframe fallback to guarantee printing works
 * reliably across all browsers without modal backdrop clipping or #root suppression.
 */

export interface DriverRegistryUpdateSlipData {
  plate: string;
  mtopNumber?: string;
  previousDriver: string;
  newDriver: string;
  previousOperator: string;
  newOperator: string;
  routeParada: string;
  touristGuide: string;
  status: string;
  processedAt: string;
  driverPhoto?: string;
}

export interface RenewalSlipData {
  mtopNumber: string;
  vehicleCategory?: string;
  operatorName: string;
  driverName: string;
  previousExpiry: string;
  newExpiry: string;
  orNumber: string;
  applicationNo: string;
  amountPaid: string;
  paymentDate: string;
  processedAt: string;
}

/**
 * Dispatches an HTML document for printing via a new window, falling back to a hidden iframe.
 */
export const printHtmlDocument = (title: string, bodyContent: string) => {
  const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm 15mm 15mm 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 10px;
      font-size: 12px;
      line-height: 1.4;
    }
    .slip-container {
      width: 100%;
      max-width: 740px;
      margin: 0 auto;
      border: 2px solid #0f172a;
      border-radius: 12px;
      padding: 24px;
      background: #ffffff;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 18px;
    }
    .header .republic {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #475569;
      margin: 0 0 2px 0;
    }
    .header .lgu {
      font-size: 13px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #0f172a;
      margin: 0 0 4px 0;
    }
    .header .office {
      font-size: 15px;
      font-weight: 900;
      text-transform: uppercase;
      color: #047857;
      margin: 0 0 8px 0;
    }
    .header .badge {
      display: inline-block;
      background: #0f172a;
      color: #ffffff;
      padding: 5px 16px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .title-banner {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 10px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .title-banner .main-title {
      font-size: 15px;
      font-weight: 900;
      color: #0f172a;
      text-transform: uppercase;
    }
    .title-banner .ref-no {
      font-size: 11px;
      font-weight: 700;
      color: #475569;
      font-family: monospace;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 12px;
    }
    .grid-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 12px;
      margin-bottom: 12px;
    }
    .card {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 10px 12px;
    }
    .card-title {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 5px;
    }
    .card-value {
      font-size: 13px;
      font-weight: 800;
      color: #0f172a;
    }
    .change-flow {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .old-value {
      color: #64748b;
      text-decoration: line-through;
      font-size: 12px;
    }
    .arrow {
      color: #94a3b8;
      font-weight: bold;
    }
    .new-value {
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
      padding: 2px 8px;
      border-radius: 6px;
      font-weight: 800;
      font-size: 13px;
    }
    .audit-bar {
      background: #f8fafc;
      border: 1px dashed #94a3b8;
      border-radius: 8px;
      padding: 8px 12px;
      text-align: center;
      font-size: 11px;
      color: #475569;
      font-style: italic;
      margin: 16px 0;
    }
    .signatures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-top: 32px;
      padding-top: 8px;
    }
    .sign-box {
      text-align: center;
    }
    .sign-line {
      border-top: 1.5px solid #0f172a;
      margin-top: 48px;
      padding-top: 4px;
    }
    .sign-name {
      font-weight: 800;
      font-size: 11px;
      text-transform: uppercase;
      color: #0f172a;
    }
    .sign-role {
      font-size: 10px;
      color: #64748b;
    }
    .footer {
      border-top: 1px solid #e2e8f0;
      margin-top: 20px;
      padding-top: 8px;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #94a3b8;
    }
    .photo-thumb {
      width: 44px;
      height: 44px;
      border-radius: 8px;
      object-fit: cover;
      border: 1.5px solid #059669;
      margin-right: 8px;
      float: left;
    }
  </style>
</head>
<body>
  <div class="slip-container">
    ${bodyContent}
  </div>
  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>`;

  // 1. Try opening dedicated print window
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(fullHtml);
    printWindow.document.close();
    return;
  }

  // 2. Fallback: invisible iframe if popup was blocked
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.top = '-10000px';
  iframe.style.left = '-10000px';
  iframe.style.width = '0px';
  iframe.style.height = '0px';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(fullHtml);
    doc.close();
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 3000);
  }
};

/**
 * Prints the official Franchise Update Acknowledgment & Assignment Record
 */
export const printDriverRegistryUpdateSlip = (summary: DriverRegistryUpdateSlipData) => {
  const currentDate = new Date().toLocaleDateString('en-PH', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const photoHtml = summary.driverPhoto
    ? `<img src="${summary.driverPhoto}" class="photo-thumb" alt="Driver Photo" />`
    : '';

  const bodyContent = `
    <div class="header">
      <p class="republic">Republic of the Philippines</p>
      <p class="lgu">Province of Albay • City of Tabaco</p>
      <h1 class="office">Transportation Regulation Division (TRD)</h1>
      <span class="badge">Official Municipal Conveyance Registry</span>
    </div>

    <div class="title-banner">
      <div>
        <div class="main-title">Franchise Record Updated — Plate ${summary.plate}</div>
        <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
          MTOP / Unit ID: <strong>${summary.mtopNumber || summary.plate}</strong>
        </div>
      </div>
      <div class="ref-no">
        TRD-UPD-${summary.plate.replace(/[^a-zA-Z0-9]/g, '')}
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-title">Driver Assignment</div>
        <div style="overflow: hidden;">
          ${photoHtml}
          <div class="change-flow" style="margin-top: 6px;">
            <span class="old-val old-value">${summary.previousDriver || 'None Assigned'}</span>
            <span class="arrow">➜</span>
            <span class="new-val new-value">${summary.newDriver}</span>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">Operator Assignment</div>
        <div class="change-flow" style="margin-top: 10px;">
          <span class="old-val old-value">${summary.previousOperator || 'None Assigned'}</span>
          <span class="arrow">➜</span>
          <span class="new-val new-value">${summary.newOperator}</span>
        </div>
      </div>
    </div>

    <div class="grid-3">
      <div class="card">
        <div class="card-title">Route / Parada</div>
        <div class="card-value">${summary.routeParada || 'Sua-Igot 24 Tabaco'}</div>
      </div>

      <div class="card">
        <div class="card-title">Accredited Tourist Guide</div>
        <div class="card-value" style="color: #065f46;">${summary.touristGuide || 'Yes'}</div>
      </div>

      <div class="card">
        <div class="card-title">Status</div>
        <div class="card-value" style="color: #047857;">${summary.status || 'Active'}</div>
      </div>
    </div>

    <div class="audit-bar">
      ✓ Recorded in TRD database &amp; operator/driver audit history at ${summary.processedAt} on ${currentDate}
    </div>

    <div class="signatures">
      <div class="sign-box">
        <div class="sign-line">
          <div class="sign-name">${summary.newOperator || summary.newDriver}</div>
          <div class="sign-role">Registered Driver / Operator Conforme</div>
        </div>
      </div>
      <div class="sign-box">
        <div class="sign-line">
          <div class="sign-name">TRD Records &amp; Licensing Officer</div>
          <div class="sign-role">Transportation Regulation Division • Tabaco City</div>
        </div>
      </div>
    </div>

    <div class="footer">
      <span>Official Municipal Conveyance Registry • Tabaco City TRD</span>
      <span>Date Issued: ${currentDate}</span>
    </div>
  `;

  printHtmlDocument(`Franchise Update Record - Plate ${summary.plate}`, bodyContent);
};

/**
 * Prints the official Franchise Renewal Certificate / Receipt Slip
 */
export const printRenewalSlip = (summary: RenewalSlipData) => {
  const currentDate = new Date().toLocaleDateString('en-PH', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const bodyContent = `
    <div class="header">
      <p class="republic">Republic of the Philippines</p>
      <p class="lgu">Province of Albay • City of Tabaco</p>
      <h1 class="office">Transportation Regulation Division (TRD)</h1>
      <span class="badge">Official Municipal Conveyance Renewal Slip</span>
    </div>

    <div class="title-banner">
      <div>
        <div class="main-title">Franchise Permit Renewed — Unit MTOP ${summary.mtopNumber}</div>
        <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
          Category: <strong>${summary.vehicleCategory || 'Tricycle'}</strong>
        </div>
      </div>
      <div class="ref-no">
        APP: ${summary.applicationNo}
      </div>
    </div>

    <div class="card" style="margin-bottom: 12px; background: #ecfdf5; border-color: #a7f3d0;">
      <div class="card-title" style="color: #065f46;">Validity Extension (1-Year Franchise Renewal)</div>
      <div class="change-flow" style="margin-top: 4px;">
        <span class="old-val old-value">${summary.previousExpiry}</span>
        <span class="arrow">➜</span>
        <span class="new-val new-value" style="font-size: 14px;">VALID UNTIL ${summary.newExpiry}</span>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-title">Registered Operator</div>
        <div class="card-value">${summary.operatorName}</div>
      </div>

      <div class="card">
        <div class="card-title">Authorized Driver</div>
        <div class="card-value">${summary.driverName}</div>
      </div>
    </div>

    <div class="grid-3">
      <div class="card">
        <div class="card-title">Official Receipt (O.R.) No.</div>
        <div class="card-value" style="font-family: monospace;">${summary.orNumber}</div>
      </div>

      <div class="card">
        <div class="card-title">Amount Paid</div>
        <div class="card-value" style="color: #047857; font-size: 14px;">₱${summary.amountPaid}</div>
      </div>

      <div class="card">
        <div class="card-title">Payment Date</div>
        <div class="card-value">${summary.paymentDate}</div>
      </div>
    </div>

    <div class="audit-bar">
      ✓ System verification updated in Supabase cloud database &amp; recorded to Audit Trail at ${summary.processedAt} on ${currentDate}
    </div>

    <div class="signatures">
      <div class="sign-box">
        <div class="sign-line">
          <div class="sign-name">City Treasury Collection Officer</div>
          <div class="sign-role">City Treasurer's Office • Tabaco City</div>
        </div>
      </div>
      <div class="sign-box">
        <div class="sign-line">
          <div class="sign-name">TRD Chief Licensing Officer</div>
          <div class="sign-role">Transportation Regulation Division • Tabaco City</div>
        </div>
      </div>
    </div>

    <div class="footer">
      <span>Official Municipal Conveyance Renewal Slip • Tabaco City TRD</span>
      <span>Printed: ${currentDate}</span>
    </div>
  `;

  printHtmlDocument(`Franchise Renewal Slip - MTOP ${summary.mtopNumber}`, bodyContent);
};
