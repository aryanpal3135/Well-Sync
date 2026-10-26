/**
 * WellSync Automated Backend API Test Suite
 * Tests all RESTful endpoints, JWT Authentication, and MongoDB CRUD operations.
 */

const dotenv = require('dotenv');
dotenv.config();

const BASE_URL = process.env.TEST_URL || `http://localhost:${process.env.PORT || 5000}`;

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

const runTests = async () => {
  console.log(`\n${colors.bold}${colors.cyan}══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}    🧪 WellSync Automated REST API Test Suite        ${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}══════════════════════════════════════════════════════${colors.reset}\n`);
  console.log(`Target Host: ${BASE_URL}\n`);

  let passed = 0;
  let failed = 0;
  let jwtToken = '';
  let createdProfileId = '';
  let createdLogId = '';
  let createdCycleId = '';

  const assert = (condition, title, details = '') => {
    if (condition) {
      console.log(`  ${colors.green}✔ PASS${colors.reset} - ${title}`);
      passed++;
    } else {
      console.log(`  ${colors.red}✖ FAIL${colors.reset} - ${title} ${details ? `(${details})` : ''}`);
      failed++;
    }
  };

  const randomSuffix = Math.floor(Math.random() * 10000);
  const testUser = {
    name: 'Test Student',
    email: `student_${Date.now()}_${randomSuffix}@chitkara.edu.in`,
    password: 'password123',
  };

  try {
    // 1. Health Check
    console.log(`${colors.yellow}1. Testing Health Check Endpoint...${colors.reset}`);
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.success === true, 'GET /api/health returned 200 OK');

    // 2. User Registration
    console.log(`\n${colors.yellow}2. Testing User Registration (POST /api/auth/register)...${colors.reset}`);
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser),
    });
    const regData = await regRes.json();
    assert(regRes.status === 201 && regData.token, 'User registered successfully and received JWT token');
    jwtToken = regData.token;

    // 3. User Login
    console.log(`\n${colors.yellow}3. Testing User Login (POST /api/auth/login)...${colors.reset}`);
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser.email, password: testUser.password }),
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200 && loginData.token, 'User logged in successfully with valid credentials');
    jwtToken = loginData.token;

    // 4. Get Current User (Protected route)
    console.log(`\n${colors.yellow}4. Testing Protected Route Authentication (GET /api/auth/me)...${colors.reset}`);
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${jwtToken}` },
    });
    const meData = await meRes.json();
    assert(meRes.status === 200 && meData.user.email === testUser.email.toLowerCase(), 'Protected user data retrieved via Bearer Token');

    // 5. Create Family Profile
    console.log(`\n${colors.yellow}5. Testing Profile Creation (POST /api/profiles)...${colors.reset}`);
    const profilePayload = {
      name: 'Ayush Sharma',
      relation: 'self',
      age: 21,
      gender: 'men',
      height: 175,
      weight: 68,
      activityLevel: 'moderately_active',
      goal: 'muscle_gain',
      dietaryPreference: 'vegetarian',
    };
    const profRes = await fetch(`${BASE_URL}/api/profiles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwtToken}`,
      },
      body: JSON.stringify(profilePayload),
    });
    const profData = await profRes.json();
    assert(profRes.status === 201 && profData.data._id, 'Profile created and BMI auto-calculated in MongoDB');
    createdProfileId = profData.data?._id;

    // 6. Get Profiles List
    console.log(`\n${colors.yellow}6. Testing Profile Listing (GET /api/profiles)...${colors.reset}`);
    const listProfRes = await fetch(`${BASE_URL}/api/profiles`, {
      headers: { Authorization: `Bearer ${jwtToken}` },
    });
    const listProfData = await listProfRes.json();
    assert(listProfRes.status === 200 && Array.isArray(listProfData.data) && listProfData.data.length > 0, 'Profiles retrieved for user');

    // 7. Create Daily Health Log
    console.log(`\n${colors.yellow}7. Testing Health Log Creation (POST /api/logs)...${colors.reset}`);
    const logPayload = {
      profileId: createdProfileId,
      date: new Date().toISOString().split('T')[0],
      waterIntake: 8,
      sleepHours: 7.5,
      workoutMinutes: 45,
      caloriesBurned: 420,
      mood: 'great',
      notes: 'Completed 5km morning run and healthy oats breakfast',
    };
    const logRes = await fetch(`${BASE_URL}/api/logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwtToken}`,
      },
      body: JSON.stringify(logPayload),
    });
    const logData = await logRes.json();
    assert(logRes.status === 201 && logData.data._id, 'Health log entry recorded for today');
    createdLogId = logData.data?._id;

    // 8. Health Log Stats
    console.log(`\n${colors.yellow}8. Testing Health Log Statistics (GET /api/logs/stats)...${colors.reset}`);
    const statsRes = await fetch(`${BASE_URL}/api/logs/stats?profileId=${createdProfileId}&days=7`, {
      headers: { Authorization: `Bearer ${jwtToken}` },
    });
    const statsData = await statsRes.json();
    assert(statsRes.status === 200 && statsData.data.averages, 'Health log statistics and averages calculated');

    // 9. Menstrual Cycle Log
    console.log(`\n${colors.yellow}9. Testing Menstrual Cycle Log (POST /api/cycle)...${colors.reset}`);
    const cyclePayload = {
      profileId: createdProfileId,
      startDate: '2026-10-01',
      cycleLength: 28,
      periodLength: 5,
      flow: 'medium',
      symptoms: ['cramps', 'bloating'],
      notes: 'Day 1 mild discomfort',
    };
    const cycleRes = await fetch(`${BASE_URL}/api/cycle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwtToken}`,
      },
      body: JSON.stringify(cyclePayload),
    });
    const cycleData = await cycleRes.json();
    assert(cycleRes.status === 201 && cycleData.data._id, 'Menstrual cycle entry recorded');
    createdCycleId = cycleData.data?._id;

    // 10. Recommendations API
    console.log(`\n${colors.yellow}10. Testing Wellness Recommendations (GET /api/recommendations/foods)...${colors.reset}`);
    const foodsRes = await fetch(`${BASE_URL}/api/recommendations/foods`);
    const foodsData = await foodsRes.json();
    assert(foodsRes.status === 200 && Array.isArray(foodsData.data), 'Food recommendations fetched successfully');

    // 11. Algorithmic Plan Calculation
    console.log(`\n${colors.yellow}11. Testing Algorithmic Wellness Plan (POST /api/recommendations/plan)...${colors.reset}`);
    const planRes = await fetch(`${BASE_URL}/api/recommendations/plan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwtToken}`,
      },
      body: JSON.stringify(profilePayload),
    });
    const planData = await planRes.json();
    assert(planRes.status === 200 && planData.data?.metrics?.bmr, 'BMR, TDEE, and targets algorithmically computed');

    // 12. Cleanup Created Profile
    console.log(`\n${colors.yellow}12. Testing Profile Deletion & Cascade Cleanup (DELETE /api/profiles/:id)...${colors.reset}`);
    const delRes = await fetch(`${BASE_URL}/api/profiles/${createdProfileId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${jwtToken}` },
    });
    assert(delRes.status === 200, 'Profile and cascaded data cleaned up successfully');

  } catch (err) {
    console.error(`\n${colors.red}❌ Test execution error:${colors.reset}`, err.message);
    failed++;
  }

  console.log(`\n${colors.bold}══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}Test Results:${colors.reset} Total: ${passed + failed} | ${colors.green}Passed: ${passed}${colors.reset} | ${colors.red}Failed: ${failed}${colors.reset}`);
  console.log(`${colors.bold}══════════════════════════════════════════════════════${colors.reset}\n`);

  process.exit(failed > 0 ? 1 : 0);
};

runTests();
