import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import nodemailer from 'nodemailer';

function emailDispatchPlugin() {
  return {
    name: 'email-dispatch-plugin',
    configureServer(server: any) {
      server.middlewares.use('/api/send-verification', (req: any, res: any) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        let body = '';
        req.on('data', (chunk: any) => {
          body += chunk;
        });

        req.on('end', async () => {
          try {
            const data = JSON.parse(body || '{}');
            const toEmail = (data.to || '').trim();
            const code = (data.code || '').trim();

            if (!toEmail || !code) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: 'Recipient email and code are required.' }));
              return;
            }

            const senderEmail = 'lorenbacelonia@gmail.com';
            const appPassword = process.env.GMAIL_APP_PASSWORD || process.env.VITE_GMAIL_APP_PASSWORD;

            console.log(`\n========================================`);
            console.log(`📧 [TRD VERIFICATION DISPATCH]`);
            console.log(`FROM (SENDER):   ${senderEmail}`);
            console.log(`TO (RECEIVER):   ${toEmail}`);
            console.log(`CODE:            ${code}`);
            console.log(`========================================\n`);

            if (appPassword) {
              const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                  user: senderEmail,
                  pass: appPassword.replace(/\s+/g, ''),
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
                      Official security dispatch sent from <strong>${senderEmail}</strong> to <strong>${toEmail}</strong>.
                    </div>
                  </div>
                `,
              });

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, delivered: true, sender: senderEmail, receiver: toEmail }));
              return;
            }

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: true,
              delivered: false,
              sender: senderEmail,
              receiver: toEmail,
              message: `Code dispatched from ${senderEmail} to ${toEmail}.`
            }));
          } catch (err: any) {
            console.error('Email dispatch error:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: err?.message || 'Failed to dispatch email' }));
          }
        });
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss(), emailDispatchPlugin()],
  server: {
    host: true,
    port: 5173,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-dom/client'],
  },
});
