const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

const Recommendation = require('./models/Recommendation');

const seedData = async () => {
  const primaryUri = process.env.MONGO_URI;
  const localFallbackUri = 'mongodb://127.0.0.1:27017/wellsync';

  try {
    try {
      console.log('Connecting to Primary MongoDB...');
      await mongoose.connect(primaryUri, { serverSelectionTimeoutMS: 5000 });
      console.log('Connected to Primary MongoDB Atlas!');
    } catch (atlasErr) {
      console.warn(`Atlas connection failed (${atlasErr.message}). Falling back to local MongoDB...`);
      await mongoose.connect(localFallbackUri, { serverSelectionTimeoutMS: 3000 });
      console.log('Connected to Local MongoDB!');
    }

    // Clear existing recommendations
    await Recommendation.deleteMany();
    console.log('Cleared existing recommendations.');

    const dataDir = path.join(__dirname, '..', 'frontend', 'data');
    const itemsToInsert = [];

    // 1. Seed Foods
    const foodsPath = path.join(dataDir, 'foods.json');
    if (fs.existsSync(foodsPath)) {
      const foods = JSON.parse(fs.readFileSync(foodsPath, 'utf8'));
      foods.forEach((item) => {
        itemsToInsert.push({
          category: 'food',
          title: item.name || item.title,
          description: item.description || item.benefits || '',
          targetGoals: item.goals || ['overall_wellness'],
          calories: item.calories || 0,
          benefits: item.keyBenefits || [],
          icon: '🥗',
          tags: item.tags || [item.category || 'healthy'],
        });
      });
    }

    // 2. Seed Exercises
    const exercisesPath = path.join(dataDir, 'exercises.json');
    if (fs.existsSync(exercisesPath)) {
      const exercises = JSON.parse(fs.readFileSync(exercisesPath, 'utf8'));
      exercises.forEach((item) => {
        itemsToInsert.push({
          category: 'exercise',
          title: item.name || item.title,
          description: item.instructions || item.description || '',
          targetGoals: item.goals || ['overall_wellness'],
          intensity: item.intensity || 'moderate',
          calories: item.caloriesBurned || 150,
          duration: item.duration || '20 mins',
          benefits: item.benefits || [],
          icon: '🏋️',
          tags: [item.level || 'all', item.type || 'fitness'],
        });
      });
    }

    // 3. Seed Yoga
    const yogaPath = path.join(dataDir, 'yoga.json');
    if (fs.existsSync(yogaPath)) {
      const yoga = JSON.parse(fs.readFileSync(yogaPath, 'utf8'));
      yoga.forEach((item) => {
        itemsToInsert.push({
          category: 'yoga',
          title: item.name || item.sanskritName || item.title,
          description: item.instructions || item.description || '',
          targetGoals: item.goals || ['overall_wellness'],
          duration: item.duration || '15 mins',
          benefits: item.benefits || [],
          icon: '🧘',
          tags: [item.level || 'all', 'mindfulness'],
        });
      });
    }

    if (itemsToInsert.length > 0) {
      await Recommendation.insertMany(itemsToInsert);
      console.log(`✅ Successfully seeded ${itemsToInsert.length} wellness items into MongoDB!`);
    } else {
      console.log('⚠️ No items found to seed.');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Error:', error.message);
    process.exit(1);
  }
};

seedData();
