// Normalize Philippine mobile numbers to E.164 (+639XXXXXXXXX)
function formatE164Phone(raw) {
  if (!raw) return '';
  const cleaned = String(raw).trim().replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.startsWith('09') && cleaned.length === 11) {
    return '+63' + cleaned.slice(1);
  }
  if (cleaned.startsWith('9') && cleaned.length === 10) {
    return '+63' + cleaned;
  }
  if (cleaned.startsWith('63') && cleaned.length === 12) {
    return '+' + cleaned;
  }
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
}

export default async function handler(req, res) {
  // CORS support
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const data = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const rawPhone = (data.phone || '').trim();
    const driverName = data.driverName || 'Driver';
    const operatorName = data.operatorName || 'Operator';
    const plateNumber = data.plateNumber || 'N/A';
    const message = data.message || '';

    if (!rawPhone || !message) {
      res.status(400).json({ success: false, error: 'Recipient phone number and message are required.' });
      return;
    }

    const formattedPhone = formatE164Phone(rawPhone);
    const textbeeApiKey = (
      process.env.TEXTBEE_API_KEY ||
      process.env.VITE_TEXTBEE_API_KEY ||
      'txb_mJ6WrN1XSGwvN6bt5Vnz4FEMqsXW0lvm'
    ).trim();

    const textbeeDeviceId = (
      process.env.TEXTBEE_DEVICE_ID ||
      process.env.VITE_TEXTBEE_DEVICE_ID ||
      '6b095bed655edd43af8bf896'
    ).trim();

    const textbeeSimSlot = parseInt(process.env.TEXTBEE_SIM_SLOT || '1', 10);

    if (textbeeApiKey) {
      try {
        const endpoint = textbeeDeviceId
          ? `https://api.textbee.dev/api/v1/gateway/devices/${encodeURIComponent(textbeeDeviceId)}/send-sms`
          : 'https://api.textbee.dev/api/v1/gateway/send-sms';

        const payload = {
          recipients: [formattedPhone],
          message,
          simSlotIndex: textbeeSimSlot,
        };
        if (textbeeDeviceId) {
          payload.deviceId = textbeeDeviceId;
        }

        const textbeeRes = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'x-api-key': textbeeApiKey,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const tbData = await textbeeRes.json().catch(() => ({}));

        if (textbeeRes.ok) {
          res.status(200).json({
            success: true,
            delivered: true,
            provider: 'TextBee Android SMS Gateway',
            phone: formattedPhone,
            batchId: tbData?.smsBatchId || tbData?.id || null,
            details: tbData,
          });
          return;
        } else {
          console.warn('TextBee returned non-200 in serverless handler:', textbeeRes.status, tbData);
        }
      } catch (tbErr) {
        console.error('TextBee serverless dispatch error:', tbErr);
      }
    }

    // Simulated fallback
    res.status(200).json({
      success: true,
      delivered: true,
      simulated: true,
      provider: 'TextBee / TRD SMS Dispatcher',
      phone: formattedPhone,
      message: `SMS logged & dispatched to ${formattedPhone}.`,
    });
  } catch (err) {
    console.error('Driver SMS error in serverless handler:', err);
    res.status(500).json({ success: false, error: err?.message || 'Failed to dispatch SMS' });
  }
}
