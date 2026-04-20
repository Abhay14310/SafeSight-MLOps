// models/Patient.js
const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
  mrn: {
    type: String,
    required: true,
    unique: true,
    default: () => `MRN-${Date.now()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
  },
  name:       { type: String, required: true, trim: true },
  age:        { type: Number, required: true, min: 0, max: 150 },
  gender:     { type: String, enum: ['male', 'female', 'other'], required: true },
  bloodType:  { type: String, enum: ['A+','A-','B+','B-','AB+','AB-','O+','O-','unknown'] },
  ward:       { type: String, default: 'ICU-4A' },
  bed:        { type: String, required: true },
  condition:  { type: String, required: true },
  status: {
    type: String,
    enum: ['critical', 'warning', 'stable', 'discharged'],
    default: 'stable',
  },
  admittedAt: { type: Date, default: Date.now },
  attendingDoctor: { type: String },
  emergencyContact: {
    name:  String,
    phone: String,
    relation: String,
  },
  tags:       [String],
  notes:      String,
  avatar:     String,
  isHomeUser: { type: Boolean, default: false },
  homeUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
});

PatientSchema.virtual('shortId').get(function () {
  return this._id.toString().slice(-6).toUpperCase();
});

module.exports = mongoose.model('Patient', PatientSchema);
