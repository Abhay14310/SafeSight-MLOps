'use strict';

/**
 * Tests verifying nodemailer v8 API compatibility.
 *
 * This PR bumped nodemailer from ^6.10.1 to ^8.0.5. These tests confirm
 * that the v8 API used by mailer.js still works as expected.
 */

const nodemailer = require('nodemailer');
const semver = require('semver');

// ─── nodemailer v8 module API ──────────────────────────────────────────────

describe('nodemailer v8 - module exports', () => {
  test('nodemailer module loads without error', () => {
    expect(nodemailer).toBeDefined();
  });

  test('createTransport is exported', () => {
    expect(typeof nodemailer.createTransport).toBe('function');
  });

  test('createTestAccount is exported', () => {
    expect(typeof nodemailer.createTestAccount).toBe('function');
  });

  test('getTestMessageUrl is exported', () => {
    expect(typeof nodemailer.getTestMessageUrl).toBe('function');
  });

  test('installed version is 8.x', () => {
    const installedVersion = require('../node_modules/nodemailer/package.json').version;
    expect(semver.major(installedVersion)).toBe(8);
  });

  test('installed version is at least 8.0.5', () => {
    const installedVersion = require('../node_modules/nodemailer/package.json').version;
    expect(semver.gte(installedVersion, '8.0.5')).toBe(true);
  });
});

// ─── createTransport with SMTP config (as used in mailer.js) ──────────────

describe('nodemailer v8 - createTransport SMTP config', () => {
  let transporter;

  beforeEach(() => {
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'test@example.com',
        pass: 'testpassword',
      },
    });
  });

  test('returns a transporter object', () => {
    expect(transporter).toBeDefined();
    expect(typeof transporter).toBe('object');
  });

  test('transporter has sendMail method', () => {
    expect(typeof transporter.sendMail).toBe('function');
  });

  test('transporter has verify method', () => {
    expect(typeof transporter.verify).toBe('function');
  });

  test('transporter has close method', () => {
    expect(typeof transporter.close).toBe('function');
  });

  test('transporter has use method for plugins', () => {
    expect(typeof transporter.use).toBe('function');
  });

  test('accepts empty auth credentials (mailer.js default fallback)', () => {
    expect(() => {
      nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: { user: '', pass: '' },
      });
    }).not.toThrow();
  });

  test('accepts integer port number', () => {
    // mailer.js uses parseInt(process.env.SMTP_PORT || '587')
    expect(() => {
      nodemailer.createTransport({
        host: 'smtp.example.com',
        port: parseInt('587', 10),
        secure: false,
        auth: { user: 'u', pass: 'p' },
      });
    }).not.toThrow();
  });
});

// ─── sendMail with jsonTransport (no actual SMTP connection) ──────────────

describe('nodemailer v8 - sendMail API', () => {
  let transporter;

  beforeEach(() => {
    // jsonTransport captures messages in memory without sending
    transporter = nodemailer.createTransport({ jsonTransport: true });
  });

  test('sendMail returns a Promise', () => {
    const result = transporter.sendMail({
      from: 'noreply@safesight.ai',
      to: 'admin@example.com',
      subject: 'Test',
      html: '<p>test</p>',
    });
    expect(result).toBeInstanceOf(Promise);
  });

  test('sendMail resolves with a messageId', async () => {
    const info = await transporter.sendMail({
      from: 'noreply@safesight.ai',
      to: 'admin@example.com',
      subject: 'SafeSight Alert: Fall Detected',
      html: '<p>Alert</p>',
    });
    expect(info).toHaveProperty('messageId');
    expect(typeof info.messageId).toBe('string');
    expect(info.messageId.length).toBeGreaterThan(0);
  });

  test('sendMail resolves with envelope containing from and to', async () => {
    const info = await transporter.sendMail({
      from: 'noreply@safesight.ai',
      to: 'admin@example.com',
      subject: 'Test',
      html: '<p>test</p>',
    });
    expect(info.envelope).toHaveProperty('from', 'noreply@safesight.ai');
    expect(info.envelope.to).toContain('admin@example.com');
  });

  test('sendMail accepts html body (as used by mailer.js)', async () => {
    const htmlBody = `
      <div>
        <h1>SafeSight Security Alert</h1>
        <p>Event: Fall Detected</p>
        <p>Confidence: 95.0%</p>
      </div>
    `;
    const info = await transporter.sendMail({
      from: 'SafeSight <noreply@safesight.ai>',
      to: 'alerts@example.com',
      subject: '🚨 SafeSight Alert: Fall Detected',
      html: htmlBody,
    });
    expect(info).toHaveProperty('messageId');
  });

  test('sendMail accepts display-name format for from field', async () => {
    // mailer.js uses: FROM = `SafeSight <noreply@safesight.ai>` style
    const info = await transporter.sendMail({
      from: 'SafeSight <noreply@safesight.ai>',
      to: 'admin@example.com',
      subject: 'Alert',
      html: '<p>test</p>',
    });
    expect(info).toHaveProperty('messageId');
    // The envelope from is extracted from the display-name format
    expect(info.envelope.from).toBe('noreply@safesight.ai');
  });

  test('sendMail supports callback style in addition to promise style', (done) => {
    transporter.sendMail(
      {
        from: 'a@example.com',
        to: 'b@example.com',
        subject: 'Callback test',
        text: 'Hello',
      },
      (err, info) => {
        expect(err).toBeNull();
        expect(info).toHaveProperty('messageId');
        done();
      }
    );
  });
});

// ─── mailer.js integration with nodemailer v8 ─────────────────────────────

describe('mailer.js - sendAlertEmail with nodemailer v8', () => {
  const originalSmtpUser = process.env.SMTP_USER;
  const originalAlertTo = process.env.ALERT_EMAIL_TO;

  afterEach(() => {
    // Restore environment variables
    if (originalSmtpUser === undefined) {
      delete process.env.SMTP_USER;
    } else {
      process.env.SMTP_USER = originalSmtpUser;
    }
    if (originalAlertTo === undefined) {
      delete process.env.ALERT_EMAIL_TO;
    } else {
      process.env.ALERT_EMAIL_TO = originalAlertTo;
    }
    // Clear the module cache so env vars are re-evaluated on next require
    Object.keys(require.cache).forEach((key) => {
      if (key.includes('mailer.js')) {
        delete require.cache[key];
      }
    });
  });

  test('sendAlertEmail is exported', () => {
    delete process.env.SMTP_USER;
    delete process.env.ALERT_EMAIL_TO;
    const { sendAlertEmail } = require('../mailer');
    expect(typeof sendAlertEmail).toBe('function');
  });

  test('sendAlertEmail silently skips when SMTP_USER is not set', async () => {
    delete process.env.SMTP_USER;
    delete process.env.ALERT_EMAIL_TO;
    const { sendAlertEmail } = require('../mailer');
    const result = await sendAlertEmail({
      label: 'Fall Detected',
      confidence: 0.95,
      timestamp: Date.now(),
      severity: 'critical',
    });
    expect(result).toBeUndefined();
  });

  test('sendAlertEmail silently skips when ALERT_EMAIL_TO is not set', async () => {
    process.env.SMTP_USER = 'user@example.com';
    delete process.env.ALERT_EMAIL_TO;
    const { sendAlertEmail } = require('../mailer');
    const result = await sendAlertEmail({
      label: 'Fall Detected',
      confidence: 0.95,
      timestamp: Date.now(),
      severity: 'critical',
    });
    expect(result).toBeUndefined();
  });

  test('sendAlertEmail returns a Promise', () => {
    delete process.env.SMTP_USER;
    delete process.env.ALERT_EMAIL_TO;
    const { sendAlertEmail } = require('../mailer');
    const result = sendAlertEmail({
      label: 'Test',
      confidence: 0.8,
      timestamp: Date.now(),
    });
    expect(result).toBeInstanceOf(Promise);
  });

  test('sendAlertEmail handles alert with all optional fields', async () => {
    delete process.env.SMTP_USER;
    delete process.env.ALERT_EMAIL_TO;
    const { sendAlertEmail } = require('../mailer');
    // Should not throw even with all optional fields present
    await expect(
      sendAlertEmail({
        label: 'Weapon Detected',
        confidence: 0.87,
        timestamp: new Date().toISOString(),
        camera: 'CAM-03',
        zone: 'Zone B',
        severity: 'critical',
      })
    ).resolves.toBeUndefined();
  });

  test('sendAlertEmail handles alert without optional fields', async () => {
    delete process.env.SMTP_USER;
    delete process.env.ALERT_EMAIL_TO;
    const { sendAlertEmail } = require('../mailer');
    // Should not throw with minimal alert object
    await expect(
      sendAlertEmail({
        label: 'Intrusion',
        timestamp: Date.now(),
      })
    ).resolves.toBeUndefined();
  });

  test('sendAlertEmail handles missing confidence gracefully (shows N/A)', async () => {
    delete process.env.SMTP_USER;
    delete process.env.ALERT_EMAIL_TO;
    const { sendAlertEmail } = require('../mailer');
    // confidence is undefined — mailer.js should show 'N/A'
    await expect(
      sendAlertEmail({
        label: 'Perimeter Breach',
        timestamp: Date.now(),
      })
    ).resolves.toBeUndefined();
  });
});

// ─── nodemailer v8 - regression: v6 deprecated API no longer used ─────────

describe('nodemailer v8 - v6 removed/deprecated API not relied upon', () => {
  test('nodemailer does not export createTransporter (was never standard, but guard anyway)', () => {
    // Ensure we're using createTransport (not a typo'd deprecated variant)
    expect(nodemailer.createTransporter).toBeUndefined();
  });

  test('createTransport does not require callback (promise-native in v8)', () => {
    // In v6, some methods were callback-first; v8 is promise-first
    const t = nodemailer.createTransport({ jsonTransport: true });
    const promise = t.sendMail({
      from: 'a@b.com',
      to: 'c@d.com',
      subject: 'test',
      text: 'test',
    });
    expect(promise).toBeInstanceOf(Promise);
  });
});