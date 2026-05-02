// services/seedService.js
require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Patient  = require('../models/Patient');
const { Alert, LabReport, User } = require('../models/index');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://medflow:medflow_secret@localhost:27017/medflow?authSource=admin';

const PATIENTS = [
  { name:'Rajesh Kapoor',  age:54, gender:'male',   bloodType:'B+', ward:'ICU-4A', bed:'4A-01', condition:'Post-Op Cardiac',  status:'critical', attendingDoctor:'Dr. Ananya Iyer',   tags:['cardiac','post-op'] },
  { name:'Priya Sharma',   age:42, gender:'female',  bloodType:'O+', ward:'ICU-4A', bed:'4A-02', condition:'Orthopaedic Recovery', status:'warning', attendingDoctor:'Dr. Vikram Nair',   tags:['ortho'] },
  { name:'Amit Desai',     age:61, gender:'male',   bloodType:'A+', ward:'ICU-4A', bed:'4A-03', condition:'Pneumonia',           status:'stable',  attendingDoctor:'Dr. Sneha Kulkarni', tags:['respiratory'] },
  { name:'Sunita Patel',   age:38, gender:'female',  bloodType:'AB+',ward:'ICU-4A', bed:'4A-04', condition:'Post-partum Care',    status:'stable',  attendingDoctor:'Dr. Meena Joshi',   tags:['obstetrics'] },
  { name:'Kiran Mehta',    age:58, gender:'male',   bloodType:'O-', ward:'ICU-4A', bed:'4A-05', condition:'Hypertension Crisis', status:'warning', attendingDoctor:'Dr. Ananya Iyer',   tags:['cardiac','hypertension'] },
  { name:'Deepa Iyer',     age:70, gender:'female',  bloodType:'A-', ward:'ICU-4A', bed:'4A-06', condition:'Neurological Obs.',   status:'stable',  attendingDoctor:'Dr. Rajan Pillai',  tags:['neuro'] },
  { name:'Home User Demo', age:45, gender:'male',   bloodType:'B-', ward:'HOME',   bed:'HOME-01',condition:'Hypertension Monitor',status:'stable',  attendingDoctor:'Dr. Suresh Gupta',  tags:['home','hypertension'], isHomeUser:true },
];

const LAB_REPORT_TEMPLATES = (patientId) => [
  {
    patientId, title:'Complete Blood Count (CBC)', type:'blood', status:'completed',
    reportedBy:'Lab Tech Arun Kumar', summary:'Mild anaemia noted. WBC within normal range.',
    values:[
      { label:'Haemoglobin',  value:10.8, unit:'g/dL',  normalMin:13.5,normalMax:17.5, flag:'low' },
      { label:'WBC',          value:7200, unit:'/µL',   normalMin:4000, normalMax:11000,flag:'normal' },
      { label:'Platelets',    value:285000,unit:'/µL',  normalMin:150000,normalMax:400000,flag:'normal' },
      { label:'RBC',          value:3.9,  unit:'M/µL',  normalMin:4.5,  normalMax:5.9,  flag:'low' },
    ],
  },
  {
    patientId, title:'Lipid Profile', type:'blood', status:'flagged',
    reportedBy:'Lab Tech Preethi Nair', summary:'Elevated LDL cholesterol. Dietary review recommended.',
    values:[
      { label:'Total Cholesterol', value:240, unit:'mg/dL', normalMin:0,   normalMax:200, flag:'high' },
      { label:'LDL',               value:165, unit:'mg/dL', normalMin:0,   normalMax:130, flag:'high' },
      { label:'HDL',               value:38,  unit:'mg/dL', normalMin:40,  normalMax:100, flag:'low' },
      { label:'Triglycerides',     value:190, unit:'mg/dL', normalMin:0,   normalMax:150, flag:'high' },
    ],
  },
  {
    patientId, title:'ECG Report', type:'ecg', status:'completed',
    reportedBy:'Dr. Ananya Iyer', summary:'Sinus tachycardia. No ST changes. QTc within limits.',
  },
];

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('[Seed] Connected to MongoDB');

  // Clear existing
  await Promise.all([
    Patient.deleteMany({}),
    Alert.deleteMany({}),
    LabReport.deleteMany({}),
    User.deleteMany({}),
  ]);
  console.log('[Seed] Cleared existing data');

  // Create patients
  const patients = await Patient.insertMany(PATIENTS);
  console.log(`[Seed] Created ${patients.length} patients`);

  // Create lab reports for first 3 patients
  const labs = [];
  for (const pt of patients.slice(0, 3)) {
    labs.push(...LAB_REPORT_TEMPLATES(pt._id));
  }
  await LabReport.insertMany(labs);
  console.log(`[Seed] Created ${labs.length} lab reports`);

  // Create demo user (nurse)
  await User.create({
    name:     'Nurse Lakshmi',
    email:    'nurse@medflow.io',
    password: 'medflow123',
    role:     'nurse',
    ward:     'ICU-4A',
  });
  await User.create({
    name:     'Admin',
    email:    'admin@medflow.io',
    password: 'admin123',
    role:     'admin',
  });
  console.log('[Seed] Created demo users (nurse@medflow.io / medflow123)');

  // Seed some historical alerts
  const alertSeeds = patients.slice(0,3).flatMap(pt => ([
    { patientId:pt._id, type:'BPM_HIGH',  severity:'warning', message:`Elevated HR detected: 108 BPM`, source:'vitals_engine', acknowledged:true },
    { patientId:pt._id, type:'SPO2_LOW',  severity:'info',    message:`SpO₂ borderline: 94%`,         source:'vitals_engine', acknowledged:true },
  ]));
  await Alert.insertMany(alertSeeds);
  console.log('[Seed] Created seed alerts');

  console.log('\n[Seed] ✅ Database seeded successfully');
  console.log('  Login: nurse@medflow.io / medflow123');
  console.log('  Login: admin@medflow.io / admin123');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('[Seed] FAILED:', err);
  process.exit(1);
});
