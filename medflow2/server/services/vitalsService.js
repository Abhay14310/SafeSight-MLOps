// services/vitalsService.js
const { VitalLog, Patient, Alert } = require('../models/index');

const THRESHOLDS = {
  hr:   { low:45, high:130, warn_low:55, warn_high:110 },
  spo2: { low:90, warn_low:94 },
  resp: { low:8,  high:30,  warn_low:10, warn_high:25 },
  sbp:  { low:80, high:200, warn_low:90, warn_high:180 },
  temp: { high:38.5, warn_high:38.0 },
};

class VitalsService {
  constructor(io){ this.io=io; this.patients=[]; this.tick=0; }

  async start(){
    this.patients = await Patient.find({ status:{ $ne:'discharged' } }).lean().catch(()=>[]);
    if (!this.patients.length){
      console.warn('[Vitals] No patients — seeding first. Run: node services/seedService.js');
    }
    setInterval(()=>this._tick(), 1000);   // 1s ECG points
    setInterval(()=>this._broadcastSummary(), 3000); // 3s full summary
    setInterval(()=>this._refreshPatients(), 30000); // 30s patient refresh
    console.log('[Vitals] Service started');
  }

  async _refreshPatients(){
    this.patients = await Patient.find({ status:{ $ne:'discharged' } }).lean().catch(()=>this.patients);
  }

  _jitter(base, amp){ return +(base + (Math.random()-.5)*2*amp).toFixed(1); }

  _ecgPoint(hr, t){
    // Simplified ECG shape: P-QRS-T complex
    const period = 60/hr;
    const phase  = (t % period) / period;
    if (phase < 0.1)  return Math.sin(phase/0.1*Math.PI)*0.1;
    if (phase < 0.2)  return 0;
    if (phase < 0.25) return -0.15;
    if (phase < 0.3)  return Math.sin((phase-0.25)/0.05*Math.PI)*1.2;  // QRS spike
    if (phase < 0.35) return -0.1;
    if (phase < 0.45) return 0;
    if (phase < 0.6)  return Math.sin((phase-0.45)/0.15*Math.PI)*0.25; // T wave
    return 0;
  }

  _tick(){
    this.tick++;
    const t = this.tick * 0.04; // 40ms per tick → ECG timeline

    this.patients.forEach(p=>{
      const b = p.baseline||{};
      const hr   = this._jitter(b.hr||72, 3);
      const ecg  = this._ecgPoint(hr, t);
      const resp = Math.sin(t*0.5 + p._id.toString().charCodeAt(0))*0.5; // resp wave

      this.io.to(`patient:${p._id}`).emit('ecg_point',{
        patientId: String(p._id),
        bedId:     p.bedId,
        ecg:       +ecg.toFixed(4),
        resp:      +resp.toFixed(4),
        t,
      });
    });
  }

  async _broadcastSummary(){
    if (!this.patients.length) return;

    const summaries = await Promise.all(this.patients.map(async p=>{
      const b = p.baseline||{};
      const hr   = this._jitter(b.hr||72, 8);
      const spo2 = this._jitter(b.spo2||98, 1.5);
      const resp = this._jitter(b.resp||16, 2);
      const sbp  = this._jitter(b.sbp||120, 10);
      const dbp  = this._jitter(b.dbp||80, 6);
      const temp = this._jitter(b.temp||37.0, 0.3);
      const etco2= this._jitter(35, 3);

      // Auto-alert logic
      if (hr < THRESHOLDS.hr.low || hr > THRESHOLDS.hr.high){
        const type = hr < THRESHOLDS.hr.low ? 'BRADYCARDIA' : 'TACHYCARDIA';
        const sev  = (hr < 40 || hr > 150) ? 'critical' : 'warning';
        const msg  = `${p.name} — HR ${Math.round(hr)} bpm (${type})`;
        const alert = await Alert.create({ patientId:p._id, bedId:p.bedId, type, severity:sev, message:msg, value:hr, threshold:type==='BRADYCARDIA'?THRESHOLDS.hr.low:THRESHOLDS.hr.high }).catch(()=>null);
        if (alert) this.io.to('ward').emit('new_alert',alert);
      }
      if (spo2 < THRESHOLDS.spo2.warn_low){
        const sev = spo2 < THRESHOLDS.spo2.low ? 'critical' : 'warning';
        const alert = await Alert.create({ patientId:p._id, bedId:p.bedId, type:'SPO2_LOW', severity:sev, message:`${p.name} — SpO₂ ${spo2.toFixed(0)}%`, value:spo2, threshold:THRESHOLDS.spo2.warn_low }).catch(()=>null);
        if (alert) this.io.to('ward').emit('new_alert',alert);
      }

      // Persist sample (every 5th broadcast)
      if (this.tick % 5 === 0){
        VitalLog.create({ patientId:p._id, bedId:p.bedId, hr, spo2, resp, sbp, dbp, temp, etco2 }).catch(()=>{});
      }

      return { patientId:String(p._id), bedId:p.bedId, name:p.name, status:p.status, hr, spo2, resp, sbp, dbp, temp, etco2, ts:new Date().toISOString() };
    }));

    this.io.to('ward').emit('vitals_summary', summaries);
    summaries.forEach(s=> this.io.to(`patient:${s.patientId}`).emit('vitals_detail', s));
  }
}

module.exports = VitalsService;
