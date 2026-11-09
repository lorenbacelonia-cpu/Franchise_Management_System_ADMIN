import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  ImageRun,
  AlignmentType,
  WidthType,
  BorderStyle,
  ShadingType
} from 'docx';
import type { FranchiseRecord } from '../types';
import { formatExpDate } from './fareUtils';

/**
 * Fetch image bytes as Uint8Array from URL for docx ImageRun embedding
 */
async function fetchImageBytes(url: string): Promise<Uint8Array | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    return new Uint8Array(buffer);
  } catch (err) {
    console.warn('Could not fetch image for docx embedding:', err);
    return null;
  }
}

/**
 * Creates and downloads an editable Microsoft Word (.docx) document
 * for the selected Franchise Unit QR Badge & Credentials.
 */
export async function downloadFranchiseDocx(
  franchise: FranchiseRecord,
  qrImageUrl: string
): Promise<void> {
  const plate = franchise.cityPlateNumber || franchise.mtopNumber || '—';
  const category = franchise.vehicleCategory || 'Tricycle';

  // Fetch QR Code image as bytes
  const qrBytes = await fetchImageBytes(qrImageUrl);

  // Border style helper for clean tables
  const thinBorder = {
    style: BorderStyle.SINGLE,
    size: 1,
    color: 'CBD5E1',
  };
  const tableBorders = {
    top: thinBorder,
    bottom: thinBorder,
    left: thinBorder,
    right: thinBorder,
    insideHorizontal: thinBorder,
    insideVertical: thinBorder,
  };

  // Compact 4-field Key Credentials Table
  const summaryTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBorders,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'AUTHORIZED DRIVER\n', bold: true, size: 16, color: '64748B', font: 'Arial' }),
                  new TextRun({ text: franchise.driverName || '—', bold: true, size: 22, color: '0F172A', font: 'Arial' }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'FRANCHISE OWNER / OPERATOR\n', bold: true, size: 16, color: '64748B', font: 'Arial' }),
                  new TextRun({ text: franchise.ownerName || franchise.operatorName || '—', bold: true, size: 22, color: '0F172A', font: 'Arial' }),
                ],
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            shading: { fill: 'FFFFFF', type: ShadingType.CLEAR },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'AUTHORIZED ROUTE / PARADA\n', bold: true, size: 16, color: '64748B', font: 'Arial' }),
                  new TextRun({ text: franchise.routeParada || 'Sua-Igot 24 Tabaco', bold: true, size: 20, color: '1E293B', font: 'Arial' }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            shading: { fill: 'FFFFFF', type: ShadingType.CLEAR },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'PERMIT EXPIRATION DATE\n', bold: true, size: 16, color: '64748B', font: 'Arial' }),
                  new TextRun({ text: formatExpDate(franchise.expirationDate), bold: true, size: 20, color: '1E293B', font: 'Arial' }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // Construct Document Elements
  const docElements: any[] = [
    // Header
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 20 },
      children: [
        new TextRun({ text: 'REPUBLIC OF THE PHILIPPINES', size: 16, bold: true, color: '475569', font: 'Arial' }),
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 20 },
      children: [
        new TextRun({ text: 'PROVINCE OF ALBAY • CITY OF TABACO', size: 18, bold: true, color: '1E293B', font: 'Arial' }),
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 50 },
      children: [
        new TextRun({ text: 'OFFICE OF THE TRANSPORTATION REGULATION DIVISION (TRD)', size: 20, bold: true, color: '059669', font: 'Arial' }),
      ]
    }),

    // Document Title Banner
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 30, after: 30 },
      children: [
        new TextRun({ text: `OFFICIAL ${category.toUpperCase()} SYSTEM QR BADGE`, size: 24, bold: true, color: '0F172A', font: 'Arial' }),
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 50 },
      children: [
        new TextRun({ text: `CITY PLATE NUMBER: ${plate}`, size: 22, bold: true, color: '059669', font: 'Arial' }),
        new TextRun({ text: `   •   PERMIT STATUS: ${franchise.status.toUpperCase()}`, size: 16, bold: true, color: franchise.status === 'Active' ? '059669' : 'DC2626', font: 'Arial' }),
      ]
    }),
  ];

  // Embed QR Image if fetched
  if (qrBytes) {
    docElements.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 30, after: 20 },
        children: [
          new ImageRun({
            data: qrBytes,
            type: 'png',
            transformation: {
              width: 175,
              height: 175,
            },
          }),
        ],
      })
    );
  }

  docElements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: 'Scan with Google Lens or any smartphone camera to verify live official franchise credentials & fare matrix.',
          italics: true,
          size: 15,
          color: '64748B',
          font: 'Arial',
        }),
      ],
    }),

    // Summary Credentials Table
    summaryTable,

    // Official Verification Notice
    new Paragraph({
      spacing: { before: 60, after: 20 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'Official Municipal Conveyance Permit • City Government of Tabaco • Scannable by citizens, enforcers, and passengers.',
          italics: true,
          size: 14,
          color: '64748B',
          font: 'Arial',
        }),
      ],
    })
  );

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 480,    // ~0.33 inch tight margin for clean 1-sheet fit
              right: 540,
              bottom: 480,
              left: 540,
            },
          },
        },
        children: docElements,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const safeFilename = `${category}_QR_Badge_Plate_${plate.replace(/[^a-zA-Z0-9_-]/g, '_')}.docx`;

  const downloadUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  anchor.download = safeFilename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(downloadUrl);
}
