const mongoose = require('mongoose');

const healthLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
      required: true,
      index: true,
    },
    date: {
      type: String, // Stored as YYYY-MM-DD for simple day matching
      required: [true, 'Log date is required'],
      default: () => new Date().toISOString().split('T')[0],
      index: true,
    },
    waterIntake: {
      type: Number,
      default: 0,
      min: 0,
      max: 20000, // Supports both glasses (e.g., 8) and milliliters (e.g., 2000 ml)
    },
    sleepHours: {
      type: Number,
      default: 0,
      min: 0,
      max: 24,
    },
    workoutMinutes: {
      type: Number,
      default: 0,
      min: 0,
      max: 1440,
    },
    caloriesBurned: {
      type: Number,
      default: 0,
      min: 0,
      max: 20000,
    },
    mood: {
      type: String,
      enum: ['great', 'good', 'neutral', 'low'],
      default: 'good',
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to quickly find logs by user and profile
healthLogSchema.index({ userId: 1, profileId: 1, date: -1 });

module.exports = mongoose.model('HealthLog', healthLogSchema);
