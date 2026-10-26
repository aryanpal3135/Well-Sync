const fs = require('fs');
const path = require('path');
const Recommendation = require('../models/Recommendation');

// Helper to safely load JSON fallback data from frontend/data
const loadLocalJson = (filename) => {
  try {
    const filePath = path.join(__dirname, '..', '..', 'frontend', 'data', filename);
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (err) {
    console.error(`Error reading ${filename}:`, err.message);
  }
  return [];
};

// @desc    Get food recommendations with optional goal filtering
// @route   GET /api/recommendations/foods
// @access  Public
const getFoods = async (req, res, next) => {
  try {
    const { goal } = req.query;
    let foods = await Recommendation.find({ category: 'food' });

    if (!foods || foods.length === 0) {
      foods = loadLocalJson('foods.json');
    }

    if (goal && Array.isArray(foods)) {
      foods = foods.filter(
        (f) => !f.targetGoals || f.targetGoals.includes(goal) || f.targetGoals.includes('all')
      );
    }

    res.status(200).json({ success: true, count: foods.length, data: foods });
  } catch (error) {
    next(error);
  }
};

// @desc    Get exercises with intensity/goal filtering
// @route   GET /api/recommendations/exercises
// @access  Public
const getExercises = async (req, res, next) => {
  try {
    const { goal, intensity } = req.query;
    let exercises = await Recommendation.find({ category: 'exercise' });

    if (!exercises || exercises.length === 0) {
      exercises = loadLocalJson('exercises.json');
    }

    res.status(200).json({ success: true, count: exercises.length, data: exercises });
  } catch (error) {
    next(error);
  }
};

// @desc    Get yoga routines
// @route   GET /api/recommendations/yoga
// @access  Public
const getYoga = async (req, res, next) => {
  try {
    let yoga = await Recommendation.find({ category: 'yoga' });

    if (!yoga || yoga.length === 0) {
      yoga = loadLocalJson('yoga.json');
    }

    res.status(200).json({ success: true, count: yoga.length, data: yoga });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate personalized wellness plan based on user metrics
// @route   POST /api/recommendations/plan
// @access  Private
const generatePersonalizedPlan = async (req, res, next) => {
  try {
    const { age, weight, height, activityLevel, goal, gender } = req.body;

    const w = parseFloat(weight) || 70;
    const h = parseFloat(height) || 170;
    const a = parseInt(age) || 25;

    // Calculate BMR using Mifflin-St Jeor formula
    let bmr = 10 * w + 6.25 * h - 5 * a;
    if (gender === 'women') {
      bmr -= 161;
    } else {
      bmr += 5;
    }

    const activityMultipliers = {
      sedentary: 1.2,
      lightly_active: 1.375,
      moderately_active: 1.55,
      very_active: 1.725,
    };

    const multiplier = activityMultipliers[activityLevel] || 1.2;
    const tdee = Math.round(bmr * multiplier);

    // Goal adjustment
    let targetCalories = tdee;
    if (goal === 'weight_loss') targetCalories -= 450;
    else if (goal === 'muscle_gain') targetCalories += 350;

    const bmi = parseFloat((w / Math.pow(h / 100, 2)).toFixed(1));

    res.status(200).json({
      success: true,
      data: {
        metrics: {
          bmr: Math.round(bmr),
          tdee,
          targetCalories: Math.max(1200, targetCalories),
          bmi,
          waterTargetLiters: parseFloat((w * 0.035).toFixed(1)),
          sleepTargetHours: 8,
          workoutTargetMins: activityLevel === 'sedentary' ? 30 : 45,
        },
        recommendationsSummary: {
          nutritionFocus: goal === 'weight_loss' ? 'High Protein, Calorie Deficit' : 'Balanced Macronutrients',
          fitnessFocus: goal === 'muscle_gain' ? 'Strength & Progressive Resistance' : 'Cardiovascular & Functional Mobility',
          mindfulness: '15 minutes of Pranayama and restorative Yoga daily',
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFoods,
  getExercises,
  getYoga,
  generatePersonalizedPlan,
};
