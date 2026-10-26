const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ['food', 'exercise', 'yoga'],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    targetGoals: {
      type: [String],
      default: ['overall_wellness'],
    },
    targetGenders: {
      type: [String],
      default: ['all'],
    },
    intensity: {
      type: String,
      default: 'moderate',
    },
    calories: {
      type: Number,
      default: 0,
    },
    duration: {
      type: String,
      default: '',
    },
    benefits: {
      type: [String],
      default: [],
    },
    icon: {
      type: String,
      default: '🌿',
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Recommendation', recommendationSchema);
