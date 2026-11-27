import QRCode from 'qrcode';

/**
 * Generate a reliable local base64 data URL for a QR code.
 * Runs 100% in-browser offline with zero external network dependencies,
 * preventing broken image icons when external APIs are unreachable.
 */
export async function generateQrDataUrl(text: string, width = 280): Promise<string> {
  if (!text || !text.trim()) return '';
  const cleanInput = text.trim();
  try {
    return await QRCode.toDataURL(cleanInput, {
      width,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('Local QR generation failed with level M, retrying with level L:', err);
    try {
      // Level L allows more data capacity (up to 2,953 bytes)
      return await QRCode.toDataURL(cleanInput, {
        width,
        margin: 2,
        errorCorrectionLevel: 'L',
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
    } catch (err2) {
      console.error('Local QR generation failed with level L, retrying with sanitized URL:', err2);
      try {
        // Fallback: strip any bloated query parameters so QR generation never breaks
        const sanitized = cleanInput.includes('?')
          ? cleanInput.split('?')[0] + '?' + cleanInput.split('?')[1].substring(0, 800)
          : cleanInput.substring(0, 500);
        return await QRCode.toDataURL(sanitized, {
          width,
          margin: 2,
          errorCorrectionLevel: 'L',
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        });
      } catch (err3) {
        console.error('Final fallback local QR code generation error:', err3);
        return '';
      }
    }
  }
}
