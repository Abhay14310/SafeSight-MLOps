const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

// ── Patient ───────────────────────────────────────────────────
const PatientSchema = new mongoose.Schema({
  bedId:       { type:String, required:true, unique:true },
  name:        { type:String, required:true },
  age:         Number,
  gender:      { type:String, enum:['M','F','Other'] },
  diagnosis:   String,
  admittedAt:  { type:Date, default:Date.now },
  ward:        { type:String, default:'ICU-4A' },
  status:      { type:String, enum:['stable','warning','critical','discharged'], default:'stable' },
  nurseAssigned: String,
  morseScore:  { type:Number, default:0 },  // fall risk
  allergies:   [String],
  bloodType:   String,
  weight:      Number,
  height:      Number,
  // baseline vitals
  baseline: {
    hr:   { type:Number, default:75 },
    spo2: { type:Number, default:98 },
    resp: { type:Number, default:16 },
    sbp:  { type:Number, default:120 },
    dbp:  { type:Number, default:80 },
    temp: { type:Number, default:37.0 },
  },
}, { timestamps:true });

// ── VitalLog ──────────────────────────────────────────────────
const VitalLogSchema = new mongoose.Schema({
  patientId:  { type:String, required:true, index:true },
  bedId:      { type:String, required:true },
  timestamp:  { type:Date, default:Date.now, index:true },
  hr:         Number,   // heart rate bpm
  spo2:       Number,   // %
  resp:       Number,   // breaths/min
  sbp:        Number,   // systolic mmHg
  dbp:        Number,   // diastolic mmHg
  temp:       Number,   // °C
  etco2:      Number,   // mmHg
  ecgRhythm:  { type:String, default:'Sinus' },
}, { timestamps:false });
VitalLogSchema.index({ timestamp:1 },{ expireAfterSeconds:86400 }); // 24h TTL

// ── Alert ─────────────────────────────────────────────────────
const AlertSchema = new mongoose.Schema({
  patientId:  String,
  bedId:      String,
  type:       { type:String, enum:['BRADYCARDIA','TACHYCARDIA','SPO2_LOW','RESP_ABNORMAL','FALL_RISK','POSE_ALERT','TEMP_HIGH','BP_CRITICAL','SYSTEM'], required:true },
  severity:   { type:String, enum:['info','warning','critical'], default:'warning' },
  message:    { type:String, required:true },
  value:      Number,
  threshold:  Number,
  acknowledged: { type:Boolean, default:false },
  resolved:     { type:Boolean, default:false },
}, { timestamps:true });

// ── Task ─────────────────────────────────────────────────────
const TaskSchema = new mongoose.Schema({
  bedId:      String,
  patientId:  String,
  type:       { type:String, enum:['MEDICATION','VITALS_CHECK','POSITION_CHANGE','LAB_DRAW','WOUND_CARE','CONSULT','CUSTOM'], default:'CUSTOM' },
  description:{ type:String, required:true },
  urgency:    { type:String, enum:['routine','urgent','stat'], default:'routine' },
  assignedTo: String,
  dueAt:      Date,
  completedAt:Date,
  status:     { type:String, enum:['pending','in_progress','completed','cancelled'], default:'pending' },
  notes:      String,
}, { timestamps:true });

// ── PoseFrame ─────────────────────────────────────────────────
const PoseFrameSchema = new mongoose.Schema({
  patientId:   String,
  bedId:       String,
  timestamp:   { type:Date, default:Date.now },
  keypoints:   [{ name:String, x:Number, y:Number, score:Number }],
  posture:     { type:String, enum:['SLEEPING','RESTLESS','SITTING_UP','STANDING','FALL_DETECTED','UNKNOWN'], default:'SLEEPING' },
  morseScore:  Number,
  hipDeviation:Number,
  fallRisk:    { type:String, enum:['LOW','MEDIUM','HIGH','CRITICAL'], default:'LOW' },
  jointScores: mongoose.Schema.Types.Mixed,
});
PoseFrameSchema.index({ timestamp:1 },{ expireAfterSeconds:21600 }); // 6h TTL

// ── User ─────────────────────────────────────────────────────
const UserSchema = new mongoose.Schema({
  name:      { type:String, required:true },
  email:     { type:String, required:true, unique:true, lowercase:true },
  password:  { type:String, required:true, select:false },
  role:      { type:String, enum:['admin','nurse','doctor','supervisor'], default:'nurse' },
  ward:      { type:String, default:'ICU-4A' },
  shiftStart:String,
  shiftEnd:  String,
  phone:     String,
  avatar:    String,
  isActive:  { type:Boolean, default:true },
  lastLogin: Date,
  preferences:{ alerts:{ type:Boolean, default:true }, sound:{ type:Boolean, default:true } },
}, { timestamps:true });

UserSchema.pre('save', async function(next){
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
UserSchema.methods.comparePassword = function(p){ return bcrypt.compare(p, this.password); };

module.exports = {
  Patient:   mongoose.model('Patient',   PatientSchema),
  VitalLog:  mongoose.model('VitalLog',  VitalLogSchema),
  Alert:     mongoose.model('Alert',     AlertSchema),
  Task:      mongoose.model('Task',      TaskSchema),
  PoseFrame: mongoose.model('PoseFrame', PoseFrameSchema),
  User:      mongoose.model('User',      UserSchema),
};
