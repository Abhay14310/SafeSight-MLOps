// services/seedService.js
require('dotenv').config({ path:'../.env' });
const mongoose = require('mongoose');
const { Patient, User, Task, Alert } = require('../models/index');

const MONGO = process.env.MONGO_URI||'mongodb://mfuser:mfpass@localhost:27020/medflow2?authSource=admin';

const PATIENTS = [
  { bedId:'BED-01', name:'Rajesh Kapoor',   age:68, gender:'M', diagnosis:'Post-CABG Day 3',         ward:'ICU-4A', status:'critical', morseScore:45, bloodType:'A+', weight:74, height:170, nurseAssigned:'Nurse Lakshmi',
    baseline:{ hr:102, spo2:92, resp:22, sbp:88, dbp:60, temp:38.7 } },
  { bedId:'BED-02', name:'Priya Nair',      age:52, gender:'F', diagnosis:'ARDS — Bilateral Pneumonia',ward:'ICU-4A', status:'warning',  morseScore:30, bloodType:'O+', weight:58, height:162, nurseAssigned:'Nurse Lakshmi',
    baseline:{ hr:95,  spo2:94, resp:24, sbp:110,dbp:72, temp:38.2 } },
  { bedId:'BED-03', name:'Arvind Singh',    age:44, gender:'M', diagnosis:'Traumatic Brain Injury',   ward:'ICU-4A', status:'stable',   morseScore:20, bloodType:'B+', weight:82, height:175, nurseAssigned:'Nurse Preethi',
    baseline:{ hr:72,  spo2:98, resp:15, sbp:128,dbp:84, temp:37.1 } },
  { bedId:'BED-04', name:'Meena Patel',     age:61, gender:'F', diagnosis:'Septic Shock — GI origin', ward:'ICU-4A', status:'warning',  morseScore:35, bloodType:'AB+',weight:63, height:158, nurseAssigned:'Nurse Preethi',
    baseline:{ hr:110, spo2:95, resp:20, sbp:98, dbp:62, temp:38.9 } },
  { bedId:'BED-05', name:'Suresh Iyer',     age:75, gender:'M', diagnosis:'Acute MI — Killip III',    ward:'ICU-4A', status:'critical', morseScore:50, bloodType:'A-', weight:70, height:168, nurseAssigned:'Nurse Anita',
    baseline:{ hr:118, spo2:91, resp:26, sbp:82, dbp:55, temp:37.5 } },
];

async function seed(){
  if (mongoose.connection.readyState !== 1){
    await mongoose.connect(MONGO);
    console.log('[Seed] Connected');
  }
  await Promise.all([Patient.deleteMany({}),User.deleteMany({}),Task.deleteMany({}),Alert.deleteMany({})]);

  const patients = await Patient.insertMany(PATIENTS);
  console.log(`[Seed] ${patients.length} patients`);

  await Task.insertMany([
    { bedId:'BED-01', patientId:patients[0]._id, type:'MEDICATION',      description:'IV Dopamine 5 mcg/kg/min — titrate',      urgency:'stat',    status:'pending',  dueAt:new Date(Date.now()+900000) },
    { bedId:'BED-01', patientId:patients[0]._id, type:'VITALS_CHECK',    description:'ABG check — target PaO₂ > 70',           urgency:'urgent',  status:'pending',  dueAt:new Date(Date.now()+1800000) },
    { bedId:'BED-02', patientId:patients[1]._id, type:'POSITION_CHANGE', description:'Prone positioning — 16h session',         urgency:'urgent',  status:'in_progress',dueAt:new Date(Date.now()+3600000) },
    { bedId:'BED-02', patientId:patients[1]._id, type:'LAB_DRAW',        description:'CRP, Procalcitonin, CBC',                 urgency:'routine', status:'pending',  dueAt:new Date(Date.now()+5400000) },
    { bedId:'BED-03', patientId:patients[2]._id, type:'CONSULT',         description:'Neurosurgery review — ICP trending up',   urgency:'urgent',  status:'pending',  dueAt:new Date(Date.now()+2700000) },
    { bedId:'BED-04', patientId:patients[3]._id, type:'MEDICATION',      description:'Noradrenaline rate increase 0.1 mcg/kg',  urgency:'stat',    status:'pending',  dueAt:new Date(Date.now()+600000) },
    { bedId:'BED-05', patientId:patients[4]._id, type:'WOUND_CARE',      description:'Femoral access site check post-cath',     urgency:'routine', status:'pending',  dueAt:new Date(Date.now()+7200000) },
  ]);

  await Alert.insertMany([
    { patientId:patients[0]._id, bedId:'BED-01', type:'SPO2_LOW',    severity:'critical', message:'Rajesh Kapoor — SpO₂ 92% — below threshold', value:92, threshold:94 },
    { patientId:patients[4]._id, bedId:'BED-05', type:'BRADYCARDIA', severity:'critical', message:'Suresh Iyer — HR 38 bpm — Emergency', value:38, threshold:45 },
    { patientId:patients[1]._id, bedId:'BED-02', type:'RESP_ABNORMAL',severity:'warning', message:'Priya Nair — Resp 24/min — elevated', value:24, threshold:20 },
  ]);

  await User.create({ name:'Nurse Lakshmi', email:'nurse@medflow.io',  password:'medflow123', role:'nurse',    ward:'ICU-4A', shiftStart:'07:00', shiftEnd:'19:00' });
  await User.create({ name:'Dr. Ananya Iyer',email:'doctor@medflow.io',password:'medflow123', role:'doctor',   ward:'ICU-4A' });
  await User.create({ name:'Admin User',    email:'admin@medflow.io',  password:'medflow123', role:'admin',    ward:'ICU-4A' });

  console.log('[Seed] Done. Login: nurse@medflow.io / medflow123');
  return true;
}

module.exports = seed;

if (require.main === module){
  seed().then(()=>process.exit(0)).catch(e=>{ console.error(e); process.exit(1); });
}
