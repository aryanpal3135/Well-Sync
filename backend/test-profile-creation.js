/**
 * Verify profile creation end-to-end against MongoDB Atlas
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const BASE_URL = 'http://localhost:5000/api';

const runVerification = async () => {
  console.log('Testing frontend-style profile creation against backend...');

  // 1. Login as demo user
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'ayush@wellsync.com', password: 'Password@123' }),
  });
  const loginData = await loginRes.json();
  if (!loginData.success || !loginData.token) {
    console.error('Login failed:', loginData);
    process.exit(1);
  }
  console.log('✔ Logged in successfully, token captured.');

  // 2. Test child profile creation (the exact payload frontend profile.js sends)
  const childProfilePayload = {
    name: 'Aarav (Child)',
    relation: 'son',
    age: 10,
    gender: 'child',
    height: 135,
    weight: 32,
    activityLevel: 'moderately_active',
    goal: 'general_wellness',
    goals: ['general_wellness'],
    dietaryPreference: 'vegetarian',
    allergies: ['dairy'],
  };

  console.log('Creating child profile with frontend form payload...');
  const createRes = await fetch(`${BASE_URL}/profiles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${loginData.token}`,
    },
    body: JSON.stringify(childProfilePayload),
  });
  const createData = await createRes.json();

  if (!createData.success || !createData.data?._id) {
    console.error('❌ Profile creation failed:', createData);
    process.exit(1);
  }
  console.log('✔ Profile created in API:', createData.data._id);

  // 3. Directly check MongoDB Atlas to confirm document exists
  await mongoose.connect(process.env.MONGO_URI);
  const Profile = require('./models/Profile');
  const doc = await Profile.findById(createData.data._id);

  if (doc && doc.name === 'Aarav (Child)' && doc.gender === 'child') {
    console.log('🎉 CONFIRMED IN MONGODB ATLAS: Document exists with ID:', doc._id.toString());
    console.log('Name:', doc.name);
    console.log('Gender:', doc.gender);
    console.log('Goal:', doc.goal);
    console.log('BMI Auto-calculated:', doc.bmi);
  } else {
    console.error('❌ Document not found in Atlas database!');
    process.exit(1);
  }

  // Cleanup test profile
  await Profile.deleteOne({ _id: createData.data._id });
  console.log('✔ Cleaned up test profile.');
  process.exit(0);
};

runVerification();
