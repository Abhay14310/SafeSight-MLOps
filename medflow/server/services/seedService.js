// services/seedService.js
const { User, Patient } = require('../models');

async function seedDatabase() {
  try {
    // 1. Seed Default Nurse
    const nurseCount = await User.countDocuments({ email: 'nurse@medflow.io' });
    if (nurseCount === 0) {
      await User.create({
        name: 'Head Nurse Sarah',
        email: 'nurse@medflow.io',
        password: 'medflow123',
        role: 'nurse',
        ward: 'ICU-North',
      });
      console.log('[SEED] Default nurse created: nurse@medflow.io');
    }

    // 2. Seed Initial Patients if empty
    const patientCount = await Patient.countDocuments();
    if (patientCount === 0) {
      const demoPatients = [
        {
          name: 'James Wilson',
          age: 64,
          gender: 'male',
          bloodType: 'A+',
          bed: '101',
          condition: 'Post-Op Recovery',
          status: 'stable',
          attendingDoctor: 'Dr. Gregory House',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
        },
        {
          name: 'Elena Rodriguez',
          age: 42,
          gender: 'female',
          bloodType: 'O-',
          bed: '105',
          condition: 'Chronic Hypertension',
          status: 'warning',
          attendingDoctor: 'Dr. Meredith Grey',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena',
        },
        {
          name: 'Robert Chen',
          age: 78,
          gender: 'male',
          bloodType: 'B+',
          bed: '202',
          condition: 'Severe Pneumonia',
          status: 'critical',
          attendingDoctor: 'Dr. Shaun Murphy',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Robert',
        }
      ];
      await Patient.insertMany(demoPatients);
      console.log(`[SEED] ${demoPatients.length} demo patients created`);
    }

  } catch (err) {
    console.error('[SEED] Seeding failed:', err.message);
  }
}

module.exports = { seedDatabase };
