import nodemailer from 'nodemailer';

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
    const toEmail = (data.to || '').trim();
    const driverName = data.driverName || 'Driver';
    const operatorName = data.operatorName || 'Operator';
    const plateNumber = data.plateNumber || 'N/A';
    const category = data.category || 'Tricycle';
    const expirationDate = data.expirationDate || 'N/A';
    const daysRemaining = data.daysRemaining;
    const subject = data.subject || `[TRD Tabaco City Official] Franchise Permit Expiration Reminder: Unit ${plateNumber}`;
    const htmlContent = data.html || '';

    if (!toEmail || !toEmail.includes('@')) {
      res.status(400).json({ success: false, error: 'Valid Gmail/Email address is required.' });
      return;
    }

    const senderEmail = (process.env.GMAIL_USER || 'tabacocitytrd@gmail.com').trim();
    const appPassword = (
      process.env.GMAIL_APP_PASSWORD ||
      process.env.VITE_GMAIL_APP_PASSWORD ||
      'ffbl cbsv kmjx tjjg'
    ).trim().replace(/\s+/g, '');

    if (!appPassword) {
      res.status(200).json({
        success: true,
        delivered: false,
        simulated: true,
        provider: 'gmail_smtp',
        sender: senderEmail,
        receiver: toEmail,
        message: 'GMAIL_APP_PASSWORD not configured. Simulated dispatch recorded.',
      });
      return;
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: senderEmail,
        pass: appPassword,
      },
    });

    await transporter.sendMail({
      from: `"TRD Tabaco City Franchise Administration" <${senderEmail}>`,
      to: toEmail,
      subject,
      html: htmlContent,
    });

    res.status(200).json({
      success: true,
      delivered: true,
      provider: 'Nodemailer Gmail SMTP (tabacocitytrd@gmail.com)',
      sender: senderEmail,
      receiver: toEmail,
      driverName,
      operatorName,
      plateNumber,
    });
  } catch (err) {
    console.error('Driver email reminder error in serverless handler:', err);
    res.status(500).json({ success: false, error: err?.message || 'Failed to dispatch email' });
  }
}
