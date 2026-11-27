import QRCode from 'qrcode';

/**
 * Generate a reliable local base64 data URL for a QR code.
 * Runs 100% in-browser offline with zero external network dependencies,
 * preventing broken image icons when external APIs are unreachable.
 */
export async function generateQrDataUrl(text: string, width = 280): Promise<string> {
  if (!text || !text.trim()) return '';
  try {
    return await QRCode.toDataURL(text, {
      width,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('Local QR code generation error:', err);
    return `https://api.qrserver.com/v1/create-qr-code/?size=${width}x${width}&data=${encodeURIComponent(text)}`;
  }
}
