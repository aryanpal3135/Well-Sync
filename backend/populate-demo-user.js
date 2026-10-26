/**
 * Populate Demo User with 1 Full Year (365 Days) of Comprehensive Health & Wellness Data
 * Specifically designed for Chitkara University Assessment 2 presentation & testing.
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const User = require('./models/User');
const Profile = require('./models/Profile');
const HealthLog = require('./models/HealthLog');
const CycleLog = require('./models/CycleLog');

const DEMO_USER = {
  name: 'Ayush Singh Tomar',
  email: 'ayush@wellsync.com',
  password: 'Password@123',
};

const notesTemplates = [
  'Morning workout completed with great energy. Drank plenty of water.',
  'Leg day at gym + 30 mins cardio. Felt strong throughout the day.',
  'Rest day today. Focused on stretching and clean hydration.',
  'Evening yoga and meditation session. Sleep quality was optimal.',
  'Full body functional training. Tracked meals and hit protein goal.',
  'Busy college schedule today, but managed a 5km evening jog.',
  'Hydration goal achieved early in the afternoon. Feeling refreshed.',
  'Great session of HIIT cardio and core strengthening.',
];

const populateOneYearData = async () => {
  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas!');

    // 1. Remove existing demo user if present to ensure clean slate
    const existingUser = await User.findOne({ email: DEMO_USER.email });
    if (existingUser) {
      console.log('Cleaning up previous demo user data...');
      await Profile.deleteMany({ userId: existingUser._id });
      await HealthLog.deleteMany({ userId: existingUser._id });
      await CycleLog.deleteMany({ userId: existingUser._id });
      await User.deleteOne({ _id: existingUser._id });
    }

    // 2. Create User
    console.log(`👤 Creating Demo User (${DEMO_USER.email})...`);
    const user = await User.create({
      name: DEMO_USER.name,
      email: DEMO_USER.email,
      password: DEMO_USER.password,
    });
    console.log(`✔ User created with ID: ${user._id}`);

    // 3. Create Primary Profile (Self: Ayush)
    console.log('👤 Creating Primary Profile (Ayush)...');
    const primaryProfile = await Profile.create({
      userId: user._id,
      name: 'Ayush Singh Tomar',
      relation: 'self',
      age: 21,
      gender: 'men',
      height: 175,
      weight: 70,
      activityLevel: 'moderately_active',
      goal: 'muscle_gain',
      dietaryPreference: 'vegetarian',
      isPrimary: true,
      allergies: ['peanuts'],
    });

    // 4. Create Secondary Family Profile (Sister: Priya - for Menstrual Cycle demonstration)
    console.log('🌸 Creating Family Profile (Priya - for Women\'s Wellness)...');
    const sisterProfile = await Profile.create({
      userId: user._id,
      name: 'Priya Tomar',
      relation: 'sister',
      age: 23,
      gender: 'women',
      height: 162,
      weight: 54,
      activityLevel: 'lightly_active',
      goal: 'overall_wellness',
      dietaryPreference: 'vegetarian',
      isPrimary: false,
    });

    // 5. Generate 1 Full Year (365 Days) of Health Logs for Primary Profile
    console.log('📅 Generating 365 Days (1 Full Year) of Daily Health Logs...');
    const healthLogs = [];
    const today = new Date();

    for (let i = 365; i >= 0; i--) {
      const logDate = new Date(today);
      logDate.setDate(logDate.getDate() - i);
      const dateString = logDate.toISOString().split('T')[0];

      // Realistic variations
      const dayOfWeek = logDate.getDay(); // 0 is Sunday, 6 is Saturday
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      const waterIntake = Math.round((7 + Math.random() * 4) * 10) / 10; // 7 to 11 glasses
      const sleepHours = isWeekend
        ? Math.round((7.5 + Math.random() * 1.5) * 10) / 10 // 7.5 to 9.0 hrs on weekends
        : Math.round((6.5 + Math.random() * 1.5) * 10) / 10; // 6.5 to 8.0 hrs on weekdays

      const isRestDay = dayOfWeek === 0; // Sunday rest day
      const workoutMinutes = isRestDay
        ? (Math.random() > 0.5 ? 15 : 0)
        : Math.round(35 + Math.random() * 25); // 35 to 60 mins

      const caloriesBurned = workoutMinutes > 0
        ? Math.round(workoutMinutes * 7.5 + Math.random() * 60)
        : Math.round(80 + Math.random() * 50);

      const moods = ['great', 'good', 'good', 'neutral'];
      const mood = moods[Math.floor(Math.random() * moods.length)];
      const notes = Math.random() > 0.4
        ? notesTemplates[Math.floor(Math.random() * notesTemplates.length)]
        : '';

      healthLogs.push({
        userId: user._id,
        profileId: primaryProfile._id,
        date: dateString,
        waterIntake,
        sleepHours,
        workoutMinutes,
        caloriesBurned,
        mood,
        notes,
      });
    }

    await HealthLog.insertMany(healthLogs);
    console.log(`✔ Successfully inserted ${healthLogs.length} days of continuous health logs!`);

    // 6. Generate 1 Full Year of Menstrual Cycle Logs (approx 13 cycles, every 28 days)
    console.log('🌸 Generating 1 Full Year of Menstrual Cycle Logs for Priya...');
    const cycleLogs = [];
    for (let c = 12; c >= 0; c--) {
      const cycleStart = new Date(today);
      cycleStart.setDate(cycleStart.getDate() - (c * 28 + Math.floor(Math.random() * 3)));
      const cycleEnd = new Date(cycleStart);
      cycleEnd.setDate(cycleEnd.getDate() + 5);

      cycleLogs.push({
        userId: user._id,
        profileId: sisterProfile._id,
        startDate: cycleStart.toISOString().split('T')[0],
        endDate: cycleEnd.toISOString().split('T')[0],
        cycleLength: 28,
        periodLength: 5,
        flow: c % 3 === 0 ? 'light' : 'medium',
        symptoms: c % 2 === 0 ? ['cramps', 'fatigue'] : ['mild_bloating'],
        notes: `Cycle ${13 - c} logged with regular symptoms.`,
      });
    }

    await CycleLog.insertMany(cycleLogs);
    console.log(`✔ Successfully inserted ${cycleLogs.length} menstrual cycles across the past year!`);

    console.log('\n══════════════════════════════════════════════════════════');
    console.log('🎉 1-YEAR DEMO ACCOUNT SUCCESSFULLY CREATED IN MONGODB ATLAS!');
    console.log('══════════════════════════════════════════════════════════');
    console.log(`📧 Email:    ${DEMO_USER.email}`);
    console.log(`🔑 Password: ${DEMO_USER.password}`);
    console.log(`👤 Profiles: 1. Ayush (Self - Primary)`);
    console.log(`             2. Priya (Sister - Cycle Tracking)`);
    console.log(`📊 Data:     366 Health Log entries (from ${healthLogs[0].date} to ${healthLogs[healthLogs.length - 1].date})`);
    console.log(`🌸 Cycles:   13 Full Menstrual Cycles across the year`);
    console.log('══════════════════════════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error populating 1-year data:', error.message);
    process.exit(1);
  }
};

populateOneYearData();
