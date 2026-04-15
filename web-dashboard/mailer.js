/**
 * SafeSight Email Service (Nodemailer)
 * Reads SMTP config from environment variables.
 * Set these in docker-compose.yml or a .env file:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, ALERT_EMAIL_TO
 */
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

const ALERT_TO = process.env.ALERT_EMAIL_TO || '';
const FROM    = process.env.SMTP_USER || 'SafeSight <noreply@safesight.ai>';

/**
 * Send a critical alert email notification.
 * Silently skips if SMTP is not configured.
 */
async function sendAlertEmail(alert) {
  if (!ALERT_TO || !process.env.SMTP_USER) return; // Not configured

  const conf = alert.confidence
    ? `${(alert.confidence * 100).toFixed(1)}%`
    : 'N/A';
  const time = new Date(alert.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  try {
    await transporter.sendMail({
      from: FROM,
      to: ALERT_TO,
      subject: `🚨 SafeSight Alert: ${alert.label} Detected`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#0a0f1a;color:#e2e8f0;border-radius:12px;overflow:hidden">
          <div style="background:linear-gradient(135deg,#1e3a5f,#0f172a);padding:24px;border-bottom:2px solid #F43F5E">
            <h1 style="margin:0;font-size:22px;color:#38BDF8">⚠ SafeSight Security Alert</h1>
          </div>
          <div style="padding:24px">
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:8px 0;color:#94a3b8;width:140px">Event</td><td style="color:#F43F5E;font-weight:bold;font-size:16px">${alert.label}</td></tr>
              <tr><td style="padding:8px 0;color:#94a3b8">Confidence</td><td style="color:#e2e8f0">${conf}</td></tr>
              <tr><td style="padding:8px 0;color:#94a3b8">Camera</td><td style="color:#e2e8f0">${alert.camera || 'CAM-01'}</td></tr>
              <tr><td style="padding:8px 0;color:#94a3b8">Zone</td><td style="color:#e2e8f0">${alert.zone || 'Zone A'}</td></tr>
              <tr><td style="padding:8px 0;color:#94a3b8">Severity</td><td style="color:#F43F5E;text-transform:uppercase">${alert.severity || 'critical'}</td></tr>
              <tr><td style="padding:8px 0;color:#94a3b8">Time</td><td style="color:#e2e8f0;font-family:monospace">${time}</td></tr>
            </table>
            <div style="margin-top:20px;padding:16px;background:#1e293b;border-radius:8px;border-left:4px solid #F43F5E">
              <p style="margin:0;font-size:13px;color:#94a3b8">This is an automated alert from your SafeSight AI Surveillance Engine. Log in to your dashboard for more details.</p>
            </div>
          </div>
        </div>
      `,
    });
    console.log(`📧 Alert email sent to ${ALERT_TO}`);
  } catch (err) {
    console.error('📧 Email send failed:', err.message);
  }
}

module.exports = { sendAlertEmail };
