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
    const code = (data.code || '').trim();

    if (!toEmail || !code) {
      res.status(400).json({ success: false, error: 'Recipient email and code are required.' });
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
        sender: senderEmail,
        receiver: toEmail,
        message: `Simulated dispatch: Code ${code} dispatched from ${senderEmail} to ${toEmail}.`,
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
      from: `"TRD Tabaco Admin System" <${senderEmail}>`,
      to: toEmail,
      subject: `TRD Admin Verification Code: ${code}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
          <div style="background: #0f172a; padding: 16px; border-radius: 8px; text-align: center; color: white;">
            <h2 style="margin: 0; font-size: 18px;">TRD Tabaco City Admin Portal</h2>
            <p style="margin: 4px 0 0; font-size: 12px; color: #94a3b8;">Transportation Regulation Division Security</p>
          </div>
          <div style="padding: 24px 8px; text-align: center;">
            <p style="font-size: 14px; color: #334155;">You requested an administrative access verification code for:</p>
            <p style="font-weight: bold; color: #0f172a; font-size: 15px;">${toEmail}</p>
            <div style="margin: 20px auto; padding: 16px; background: #f0fdf4; border: 2px dashed #22c55e; border-radius: 8px; font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #15803d; font-family: monospace;">
              ${code}
            </div>
            <p style="font-size: 12px; color: #64748b;">This code expires in 10 minutes. Do not share this code with anyone.</p>
          </div>
          <div style="border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 11px; color: #94a3b8; text-align: center;">
            Official security dispatch sent from <strong>${senderEmail}</strong> to <strong>${toEmail}</strong> via Gmail SMTP.
          </div>
        </div>
      `,
    });

    res.status(200).json({
      success: true,
      delivered: true,
      sender: senderEmail,
      receiver: toEmail,
    });
  } catch (err) {
    console.error('Admin verification dispatch error:', err);
    res.status(500).json({ success: false, error: err?.message || 'Failed to dispatch email' });
  }
}
