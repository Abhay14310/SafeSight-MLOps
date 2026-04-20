// services/vitalsMockService.js
// Simulates real-time vitals for all active patients
// Replace individual streams with real device SDKs later

const Patient  = require('../models/Patient');
const { VitalLog, MedicalAlert: Alert } = require('../models/index');

// ─── NORMAL RANGES ────────────────────────────────────────────
const RANGES = {
  stable:   { bpm:[60,85],   spo2:[96,100], o2:[95,100], sys:[110,130], dia:[70,85],  temp:[36.1,37.2], resp:[12,20] },
  warning:  { bpm:[90,105],  spo2:[91,95],  o2:[88,94],  sys:[135,150], dia:[86,95],  temp:[37.3,38.5], resp:[20,26] },
  critical: { bpm:[110,140], spo2:[85,90],  o2:[80,87],  sys:[155,180], dia:[96,110], temp:[38.6,40.2], resp:[26,35] },
};

function rand(min, max, decimals = 0) {
  const val = Math.random() * (max - min) + min;
  return decimals > 0 ? parseFloat(val.toFixed(decimals)) : Math.round(val);
}

function jitter(base, pct = 0.03) {
  return base * (1 + (Math.random() - 0.5) * pct);
}

class VitalsMockService {
  constructor(io) {
    this.io        = io;
    this.intervals = new Map();
    this.state     = new Map(); // patientId → current vitals
    this.alertCooldowns = new Map(); // prevent alert spam
  }

  start() {
    // Refresh patient list every 30s, start streams for each
    this._loadAndStream();
    setInterval(() => this._loadAndStream(), 30000);
    console.log('[VitalsMock] Service started');
  }

  async _loadAndStream() {
    try {
      const patients = await Patient.find({ status: { $ne: 'discharged' } }).select('_id status');
      patients.forEach(p => {
        if (!this.intervals.has(p._id.toString())) {
          this._startStream(p._id.toString(), p.status);
        }
      });
    } catch (err) {
      console.error('[VitalsMock] Load error:', err.message);
    }
  }

  _startStream(patientId, status) {
    // Initialise vitals state based on patient status
    const range = RANGES[status] || RANGES.stable;
    this.state.set(patientId, {
      bpm:      rand(...range.bpm),
      spo2:     rand(...range.spo2),
      o2:       rand(...range.o2),
      systolic: rand(...range.sys),
      diastolic:rand(...range.dia),
      temp:     rand(...range.temp, 1),
      respRate: rand(...range.resp),
    });

    const interval = setInterval(async () => {
      const current = this.state.get(patientId);
      if (!current) return;

      // Drift vitals slightly each tick
      const next = {
        bpm:      Math.round(Math.max(30, Math.min(200, jitter(current.bpm, 0.04)))),
        spo2:     Math.round(Math.max(70, Math.min(100, jitter(current.spo2, 0.015)))),
        o2:       Math.round(Math.max(60, Math.min(100, jitter(current.o2, 0.02)))),
        systolic: Math.round(Math.max(60, Math.min(220, jitter(current.systolic, 0.03)))),
        diastolic:Math.round(Math.max(40, Math.min(140, jitter(current.diastolic, 0.03)))),
        temp:     parseFloat(Math.max(34, Math.min(42, jitter(current.temp, 0.005))).toFixed(1)),
        respRate: Math.round(Math.max(5, Math.min(50, jitter(current.respRate, 0.05)))),
        timestamp: new Date().toISOString(),
      };

      this.state.set(patientId, next);

      // Emit to subscribed clients
      this.io.to(`patient:${patientId}`).emit('vitals_update', {
        patientId,
        ...next,
      });

      // Also emit to nurse overview room
      this.io.to('nurses').emit('vitals_brief', {
        patientId,
        bpm:  next.bpm,
        spo2: next.spo2,
        temp: next.temp,
      });

      // Persist every 10th reading (avoid DB flood)
      if (Math.random() < 0.1) {
        await VitalLog.create({ patientId, source: 'mock', ...next }).catch(() => {});
      }

      // Auto-generate vitals alerts
      await this._checkThresholds(patientId, next);

    }, 2000); // emit every 2s

    this.intervals.set(patientId, interval);
  }

  async _checkThresholds(patientId, v) {
    const cooldownKey = (patientId, type) => `${patientId}:${type}`;
    const isCoolingDown = (key) => {
      const t = this.alertCooldowns.get(key);
      return t && (Date.now() - t) < 60000; // 1 min cooldown
    };

    const checks = [
      { cond: v.spo2 < 90,  type: 'SPO2_LOW',    sev: 'critical', msg: `SpO₂ critical: ${v.spo2}%` },
      { cond: v.spo2 < 94,  type: 'SPO2_LOW',    sev: 'warning',  msg: `SpO₂ low: ${v.spo2}%` },
      { cond: v.bpm > 120,  type: 'BPM_HIGH',    sev: 'critical', msg: `Tachycardia: ${v.bpm} BPM` },
      { cond: v.bpm > 100,  type: 'BPM_HIGH',    sev: 'warning',  msg: `Elevated HR: ${v.bpm} BPM` },
      { cond: v.bpm < 45,   type: 'BPM_LOW',     sev: 'critical', msg: `Bradycardia: ${v.bpm} BPM` },
      { cond: v.temp > 39,  type: 'TEMP_HIGH',   sev: 'warning',  msg: `Fever: ${v.temp}°C` },
    ];

    for (const chk of checks) {
      if (!chk.cond) continue;
      const key = cooldownKey(patientId, chk.type);
      if (isCoolingDown(key)) continue;

      this.alertCooldowns.set(key, Date.now());
      try {
        const alert = await Alert.create({
          patientId,
          type:     chk.type,
          severity: chk.sev,
          message:  chk.msg,
          source:   'vitals_engine',
          metadata: { vitals: v },
        });
        this.io.to(`patient:${patientId}`).emit('new_alert', alert);
        this.io.to('nurses').emit('new_alert', alert);
      } catch (_) {}
    }
  }

  stop(patientId) {
    const id = this.intervals.get(patientId);
    if (id) { clearInterval(id); this.intervals.delete(patientId); }
  }

  stopAll() {
    this.intervals.forEach(id => clearInterval(id));
    this.intervals.clear();
  }
}

module.exports = VitalsMockService;
