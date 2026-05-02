// services/poseService.js — MEDPOSE-v2 skeleton simulation
const { PoseFrame, Patient, Alert } = require('../models/index');

const JOINTS = ['nose','left_eye','right_eye','left_ear','right_ear',
  'left_shoulder','right_shoulder','left_elbow','right_elbow',
  'left_wrist','right_wrist','left_hip','right_hip',
  'left_knee','right_knee','left_ankle','right_ankle'];

const POSTURES = ['SLEEPING','SLEEPING','SLEEPING','SLEEPING','RESTLESS','SITTING_UP'];

class PoseService {
  constructor(io){ this.io=io; this.tick=0; }

  start(){
    setInterval(()=>this._emitPose(), 2500);
    console.log('[Pose] MEDPOSE-v2 service started');
  }

  _baseJoint(name, posture){
    const bases = {
      nose:           {x:0.5, y:0.08},
      left_shoulder:  {x:0.38,y:0.22},
      right_shoulder: {x:0.62,y:0.22},
      left_elbow:     {x:0.30,y:0.38},
      right_elbow:    {x:0.70,y:0.38},
      left_wrist:     {x:0.26,y:0.52},
      right_wrist:    {x:0.74,y:0.52},
      left_hip:       {x:0.40,y:0.55},
      right_hip:      {x:0.60,y:0.55},
      left_knee:      {x:0.38,y:0.72},
      right_knee:     {x:0.62,y:0.72},
      left_ankle:     {x:0.36,y:0.88},
      right_ankle:    {x:0.64,y:0.88},
      left_eye:       {x:0.46,y:0.05},
      right_eye:      {x:0.54,y:0.05},
      left_ear:       {x:0.43,y:0.07},
      right_ear:      {x:0.57,y:0.07},
    };
    const b = bases[name]||{x:0.5,y:0.5};
    const jitter = posture==='RESTLESS' ? 0.04 : posture==='SITTING_UP' ? 0.02 : 0.008;
    return { x: +(b.x+(Math.random()-.5)*jitter).toFixed(3), y: +(b.y+(Math.random()-.5)*jitter).toFixed(3) };
  }

  async _emitPose(){
    this.tick++;
    const patients = await Patient.find({ status:{$ne:'discharged'} }).lean().catch(()=>[]);
    if (!patients.length) return;

    const p        = patients[this.tick % patients.length];
    const posture  = POSTURES[Math.floor(Math.random()*POSTURES.length)];
    const hipDev   = +(Math.random()*12).toFixed(1);
    const morseScore = Math.floor(Math.random()*55);
    const fallRisk = morseScore>=45?'HIGH':morseScore>=25?'MEDIUM':'LOW';

    const keypoints = JOINTS.map(name=>({
      name,
      ...this._baseJoint(name, posture),
      score: +(0.72 + Math.random()*0.27).toFixed(2),
    }));

    const jointScores = {};
    JOINTS.forEach(j=>{ jointScores[j] = +(0.72+Math.random()*0.27).toFixed(2); });

    const frame = { patientId:String(p._id), bedId:p.bedId, keypoints, posture, morseScore, hipDeviation:hipDev, fallRisk, jointScores, timestamp:new Date().toISOString() };

    this.io.to('ward').emit('pose_frame', frame);
    this.io.to(`patient:${p._id}`).emit('pose_frame', frame);

    // Fall risk alert
    if (fallRisk==='HIGH' && Math.random()<0.15){
      const alert = await Alert.create({ patientId:p._id, bedId:p.bedId, type:'FALL_RISK', severity:'critical', message:`${p.name} — HIGH fall risk (Morse: ${morseScore})`, value:morseScore }).catch(()=>null);
      if (alert) this.io.to('ward').emit('new_alert',alert);
    }

    PoseFrame.create({ patientId:p._id, bedId:p.bedId, keypoints, posture, morseScore, hipDeviation:hipDev, fallRisk, jointScores }).catch(()=>{});
  }
}

module.exports = PoseService;
