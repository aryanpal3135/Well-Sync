const mongoose = require('mongoose');

const cycleLogSchema = new mongoose.Schema(
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
    startDate: {
      type: String,
      required: [true, 'Cycle start date is required'],
    },
    endDate: {
      type: String,
      default: null,
    },
    cycleLength: {
      type: Number,
      default: 28,
      min: 15,
      max: 60,
    },
    periodLength: {
      type: Number,
      default: 5,
      min: 1,
      max: 15,
    },
    flow: {
      type: String,
      enum: ['light', 'medium', 'heavy', 'spotting'],
      default: 'medium',
    },
    symptoms: {
      type: [String],
      default: [],
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

cycleLogSchema.index({ userId: 1, profileId: 1, startDate: -1 });

module.exports = mongoose.model('CycleLog', cycleLogSchema);
