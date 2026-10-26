

'use strict';

const DataCache = {
  foods:   null,
  exercises: null,
  yoga:    null,
  rules:   null,

  async loadAll() {
    if (this.foods) return;
    const [foods, exercises, yoga, rules] = await Promise.all([
      fetch('data/foods.json').then(r => r.json()),
      fetch('data/exercises.json').then(r => r.json()),
      fetch('data/yoga.json').then(r => r.json()),
      fetch('data/recommendations.json').then(r => r.json()),
    ]);
    this.foods     = foods;
    this.exercises = exercises;
    this.yoga      = yoga;
    this.rules     = rules;
  },
};

function calculateBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm || heightCm <= 0) return null;
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

function classifyBMI(bmi) {
  if (bmi === null) return { category: 'unknown', label: 'Unknown', color: 'muted' };
  if (bmi < 18.5)  return { category: 'underweight', label: 'Underweight', color: 'warning' };
  if (bmi < 25)    return { category: 'normal',      label: 'Healthy Weight', color: 'success' };
  if (bmi < 30)    return { category: 'overweight',  label: 'Overweight', color: 'warning' };
  return              { category: 'obese',       label: 'High BMI', color: 'danger' };
}

function classifyActivityLevel(level) {
  const map = {
    sedentary: 1,
    lightly_active: 2,
    moderately_active: 3,
    very_active: 4,
  };
  return map[level] || 1;
}

function calculateCalorieNeeds(profile) {
  const { age, weight, height, activityLevel, goal, gender } = profile;
  const w = parseFloat(weight);
  const h = parseFloat(height);
  const a = parseInt(age);

  if (!w || !h || !a) return { bmr: 2000, tdee: 2500, adjustedTdee: 2200 };

  let bmr;
  if (gender === 'men') {
    bmr = 10 * w + 6.25 * h - 5 * a + 5;
  } else if (gender === 'women') {
    bmr = 10 * w + 6.25 * h - 5 * a - 161;
  } else {

    bmr = 10 * w + 6.25 * h - 5 * a + 5;
  }

  const multipliers = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
  };
  const multiplier = multipliers[activityLevel] || 1.2;
  const tdee = Math.round(bmr * multiplier);

  const goalAdj = {
    weight_management: -300,
    general_wellness: 0,
    fitness: 100,
    strength: 200,
    flexibility: 0,
  };
  const adjustedTdee = tdee + (goalAdj[goal] || 0);

  return {
    bmr:          Math.round(bmr),
    tdee,
    adjustedTdee: Math.round(adjustedTdee),
  };
}

function calculateHydration(profile) {
  const w = parseFloat(profile.weight) || 60;
  const genderBase = {
    men: 35,
    women: 31,
    child: 40,
  };
  const activityBonus = {
    sedentary: 0,
    lightly_active: 200,
    moderately_active: 400,
    very_active: 600,
  };

  const base = genderBase[profile.gender] || 33;
  const bonus = activityBonus[profile.activityLevel] || 0;
  const ml = Math.round(base * w + bonus);
  const liters = (ml / 1000).toFixed(1);
  const glasses = Math.round(ml / 250);

  return { ml, liters: parseFloat(liters), glasses };
}

function getSleepRecommendation(age) {
  age = parseInt(age);
  if (age <= 5)  return { min: 10, max: 14, label: '10–14 hours' };
  if (age <= 12) return { min: 9,  max: 12, label: '9–12 hours' };
  if (age <= 18) return { min: 8,  max: 10, label: '8–10 hours' };
  if (age <= 64) return { min: 7,  max: 9,  label: '7–9 hours' };
  return              { min: 7,  max: 8,  label: '7–8 hours' };
}

function getAgeGroup(age, gender) {
  if (gender === 'child') return 'child';
  return parseInt(age) < 18 ? 'child' : 'adult';
}

function scoreFood(food, profile) {
  const { dietPreference, allergies = [], goal, age, gender } = profile;
  const ageGroup = getAgeGroup(age, gender);

  if (dietPreference === 'vegetarian' && !food.dietType.includes('vegetarian')) {
    return -Infinity;
  }
  if (dietPreference === 'vegan' &&
      !food.dietType.includes('vegan')) {
    return -Infinity;
  }

  const userAllergens = allergies.map(a => a.toLowerCase().trim());
  const hasAllergen = food.allergens.some(a =>
    userAllergens.includes(a.toLowerCase())
  );
  if (hasAllergen) return -Infinity;

  let score = 0;

  if (food.suitableGoals.includes(goal)) score += 40;
  else if (food.suitableGoals.includes('general_wellness')) score += 15;

  if (food.ageGroup.includes(ageGroup)) score += 20;

  if (food.dietType.includes(dietPreference)) score += 10;

  if (goal === 'weight_management' && food.calories < 250) score += 10;
  if (goal === 'strength' && food.protein >= 20) score += 10;

  return score;
}

function scoreExercise(exercise, profile) {
  const { goal, age, gender, activityLevel } = profile;
  const ageGroup = getAgeGroup(age, gender);

  if (!exercise.gender.includes(gender) && !exercise.gender.includes('men') && !exercise.gender.includes('women')) {
    if (!exercise.gender.includes(gender)) {

      const isGenderSpecific = exercise.gender.length === 1;
      if (isGenderSpecific && !exercise.gender.includes(gender)) return -Infinity;
    }
  }

  if (!exercise.ageGroup.includes(ageGroup)) return -Infinity;

  let score = 0;

  if (exercise.suitableGoals.includes(goal)) score += 40;
  else if (exercise.suitableGoals.includes('general_wellness')) score += 10;

  if (exercise.ageGroup.includes(ageGroup)) score += 20;

  const activityScore = classifyActivityLevel(activityLevel);
  const intensityMap = { low: 1, moderate: 2, high: 3 };
  const exIntensity = intensityMap[exercise.intensity] || 2;

  if (Math.abs(exIntensity - activityScore) <= 1) score += 10;

  const goalIntensity = {
    weight_management: ['low', 'moderate'],
    general_wellness:  ['low', 'moderate'],
    fitness:           ['moderate', 'high'],
    strength:          ['high', 'moderate'],
    flexibility:       ['low'],
  };
  if (goalIntensity[goal] && goalIntensity[goal].includes(exercise.intensity)) {
    score += 10;
  }

  if (goal === 'strength' && exercise.type === 'strength') score += 10;
  if (goal === 'flexibility' && exercise.type === 'flexibility') score += 10;
  if (goal === 'fitness' && exercise.type === 'cardio') score += 8;
  if (goal === 'weight_management' && exercise.type === 'cardio') score += 8;

  return score;
}

function scoreYoga(pose, profile) {
  const { goal, age, gender, activityLevel } = profile;
  const ageGroup = getAgeGroup(age, gender);

  if (!pose.ageGroup.includes(ageGroup)) return -Infinity;

  let score = 0;

  if (pose.suitableGoals.includes(goal)) score += 40;
  else if (pose.suitableGoals.includes('general_wellness')) score += 15;

  if (pose.ageGroup.includes(ageGroup)) score += 20;

  const difficultyMap = { beginner: 1, intermediate: 2, advanced: 3 };
  const actScore = classifyActivityLevel(activityLevel);
  const poseDiff = difficultyMap[pose.difficulty] || 1;

  if (actScore <= 1 && poseDiff === 1) score += 10;
  else if (actScore >= 3 && poseDiff >= 2) score += 10;
  else if (Math.abs(poseDiff - Math.ceil(actScore / 2)) <= 1) score += 5;

  const purposeGoalMap = {
    weight_management: ['full-body', 'strength', 'endurance'],
    general_wellness:  ['relaxation', 'stress-relief', 'recovery', 'balance'],
    fitness:           ['strength', 'full-body', 'balance'],
    strength:          ['strength', 'core-strength', 'endurance'],
    flexibility:       ['flexibility', 'hip-opening', 'hamstring-stretch', 'spine-health'],
  };

  const targetPurposes = purposeGoalMap[goal] || [];
  const hasMatchingPurpose = pose.purpose.some(p => targetPurposes.includes(p));
  if (hasMatchingPurpose) score += 20;

  if (gender === 'women' && pose.purpose.includes('recovery')) score += 5;

  return score;
}

function getDietRecommendations(foods, profile) {
  const mealTypes = ['breakfast', 'lunch', 'snack', 'dinner'];
  const result = {};

  mealTypes.forEach(meal => {
    const mealFoods = foods
      .filter(f => f.mealType === meal)
      .map(f => ({
        ...f,
        _score: scoreFood(f, profile),
        _reason: buildFoodReason(f, profile),
      }))
      .filter(f => f._score > -Infinity)
      .sort((a, b) => b._score - a._score)
      .slice(0, meal === 'snack' ? 1 : 2);

    result[meal] = mealFoods;
  });

  return result;
}

function getExerciseRecommendations(exercises, profile, count = 4) {
  return exercises
    .map(e => ({
      ...e,
      _score: scoreExercise(e, profile),
      _reason: buildExerciseReason(e, profile),
    }))
    .filter(e => e._score > -Infinity)
    .sort((a, b) => b._score - a._score)
    .slice(0, count);
}

function getYogaRecommendations(poses, profile, count = 4) {
  return poses
    .map(p => ({
      ...p,
      _score: scoreYoga(p, profile),
      _reason: buildYogaReason(p, profile),
    }))
    .filter(p => p._score > -Infinity)
    .sort((a, b) => b._score - a._score)
    .slice(0, count);
}

function getLifestyleRecommendations(profile, rules) {
  const tips = rules.lifestyleTips[profile.goal] || rules.lifestyleTips.general_wellness;
  const childTips = rules.childWellnessFocus;

  if (profile.gender === 'child') {
    return childTips.slice(0, 5);
  }
  return tips;
}

function buildFoodReason(food, profile) {
  const reasons = [];
  if (food.dietType.includes(profile.dietPreference)) {
    reasons.push(`matches your ${profile.dietPreference} diet`);
  }
  if (food.suitableGoals.includes(profile.goal)) {
    reasons.push(`supports your ${formatGoal(profile.goal)} goal`);
  }
  if (profile.goal === 'weight_management' && food.calories < 250) {
    reasons.push('low calorie option');
  }
  if (profile.goal === 'strength' && food.protein >= 20) {
    reasons.push('high in protein for muscle recovery');
  }
  return reasons.length > 0
    ? `✓ Selected: ${reasons.join(', ')}.`
    : '✓ Suitable for your wellness profile.';
}

function buildExerciseReason(exercise, profile) {
  const reasons = [];
  if (exercise.suitableGoals.includes(profile.goal)) {
    reasons.push(`aligned with your ${formatGoal(profile.goal)} goal`);
  }
  if (exercise.intensity === getIdealIntensity(profile.activityLevel, profile.goal)) {
    reasons.push(`${exercise.intensity} intensity matches your activity level`);
  }
  return reasons.length > 0
    ? `✓ Selected: ${reasons.join(', ')}.`
    : '✓ Suitable for your fitness level.';
}

function buildYogaReason(pose, profile) {
  const reasons = [];
  if (pose.suitableGoals.includes(profile.goal)) {
    reasons.push(`targets your ${formatGoal(profile.goal)} goal`);
  }
  const diffLabel = { beginner: 'beginner', intermediate: 'intermediate', advanced: 'advanced' };
  reasons.push(`${diffLabel[pose.difficulty] || 'suitable'} level`);
  return `✓ Selected: ${reasons.join(', ')}.`;
}

function formatGoal(goal) {
  const labels = {
    weight_management: 'Weight Management',
    general_wellness:  'General Wellness',
    fitness:           'Fitness',
    strength:          'Strength',
    flexibility:       'Flexibility',
  };
  return labels[goal] || goal;
}

function getIdealIntensity(activityLevel, goal) {
  const intensityGoalMap = {
    weight_management: 'low',
    general_wellness:  'low',
    fitness:           'moderate',
    strength:          'high',
    flexibility:       'low',
  };
  if (activityLevel === 'sedentary') return 'low';
  if (activityLevel === 'very_active') return 'high';
  return intensityGoalMap[goal] || 'moderate';
}

async function generatePersonalizedPlan(profile) {

  await DataCache.loadAll();
  const { foods, exercises, yoga, rules } = DataCache;

  const bmi      = calculateBMI(parseFloat(profile.weight), parseFloat(profile.height));
  const bmiClass = classifyBMI(bmi);
  const hydration = calculateHydration(profile);
  const sleep    = getSleepRecommendation(profile.age);
  const calorie  = calculateCalorieNeeds(profile);

  const exerciseCount = rules.exerciseCountByGoal[profile.goal] || 4;
  const yogaCount     = rules.yogaCountByGoal[profile.goal] || 3;

  const diet     = getDietRecommendations(foods, profile);
  const exercise = getExerciseRecommendations(exercises, profile, exerciseCount);
  const yogaPlan = getYogaRecommendations(yoga, profile, yogaCount);
  const lifestyle = getLifestyleRecommendations(profile, rules);

  return {
    profile,
    metrics: {
      bmi,
      bmiClass,
      ageGroup: getAgeGroup(profile.age, profile.gender),
    },
    diet,
    exercise,
    yoga:     yogaPlan,
    hydration,
    sleep,
    lifestyle,
    calorie,
    generatedAt: new Date().toISOString(),
  };
}

function calculateWellnessScore(profile, logs) {
  const today = new Date().toISOString().split('T')[0];
  const todayLogs = logs.filter(l => l.date === today);

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekLogs = logs.filter(l => new Date(l.date) >= weekAgo);

  const mealLogs = todayLogs.filter(l => l.type === 'meal');
  const nutritionScore = Math.min(100, (mealLogs.length / 4) * 100);

  const exerciseLogs = weekLogs.filter(l => l.type === 'exercise');
  const targetSessions = 4;
  const exerciseScore = Math.min(100, (exerciseLogs.length / targetSessions) * 100);

  const hydrationTarget = calculateHydration(profile).ml;
  const waterLogs = todayLogs.filter(l => l.type === 'water');
  const waterTotal = waterLogs.reduce((sum, l) => sum + (l.value || 0), 0);
  const hydrationScore = Math.min(100, (waterTotal / hydrationTarget) * 100);

  const sleepTarget = getSleepRecommendation(profile.age).min;
  const sleepLogs = logs.filter(l => l.type === 'sleep').slice(-3);
  const avgSleep = sleepLogs.length > 0
    ? sleepLogs.reduce((sum, l) => sum + (l.value || 0), 0) / sleepLogs.length
    : 0;
  const sleepScore = Math.min(100, (avgSleep / sleepTarget) * 100);

  const yogaLogs = weekLogs.filter(l => l.type === 'yoga');
  const mindfulnessScore = Math.min(100, (yogaLogs.length / 3) * 100);

  const weights = { nutrition: 0.25, exercise: 0.25, hydration: 0.20, sleep: 0.20, mindfulness: 0.10 };
  const total = Math.round(
    nutritionScore  * weights.nutrition +
    exerciseScore   * weights.exercise +
    hydrationScore  * weights.hydration +
    sleepScore      * weights.sleep +
    mindfulnessScore * weights.mindfulness
  );

  let grade;
  if (total >= 85) grade = 'Excellent';
  else if (total >= 70) grade = 'Good';
  else if (total >= 50) grade = 'Fair';
  else grade = 'Getting Started';

  return {
    total,
    grade,
    breakdown: {
      nutrition:    Math.round(nutritionScore),
      exercise:     Math.round(exerciseScore),
      hydration:    Math.round(hydrationScore),
      sleep:        Math.round(sleepScore),
      mindfulness:  Math.round(mindfulnessScore),
    },
  };
}

window.RecommendationEngine = {
  generatePersonalizedPlan,
  calculateWellnessScore,
  calculateBMI,
  classifyBMI,
  calculateHydration,
  getSleepRecommendation,
  calculateCalorieNeeds,
  formatGoal,
  DataCache,
};
