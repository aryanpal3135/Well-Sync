const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Profile name is required'],
      trim: true,
    },
    relation: {
      type: String,
      default: 'self',
      trim: true,
    },
    age: {
      type: Number,
      required: [true, 'Age is required'],
      min: [1, 'Age must be at least 1'],
      max: [120, 'Age must be under 120'],
    },
    gender: {
      type: String,
      default: 'men',
    },
    height: {
      type: Number,
      required: [true, 'Height is required (cm)'],
    },
    weight: {
      type: Number,
      required: [true, 'Weight is required (kg)'],
    },
    bmi: {
      type: Number,
      default: null,
    },
    activityLevel: {
      type: String,
      default: 'sedentary',
    },
    goal: {
      type: String,
      default: 'general_wellness',
    },
    goals: {
      type: [String],
      default: [],
    },
    dietaryPreference: {
      type: String,
      default: 'vegetarian',
    },
    allergies: {
      type: [String],
      default: [],
    },
    conditions: {
      type: [String],
      default: [],
    },
    cycleData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-calculate BMI before saving
profileSchema.pre('save', function (next) {
  if (this.weight && this.height && this.height > 0) {
    const heightInMeters = this.height / 100;
    this.bmi = parseFloat((this.weight / (heightInMeters * heightInMeters)).toFixed(1));
  }
  next();
});

module.exports = mongoose.model('Profile', profileSchema);
