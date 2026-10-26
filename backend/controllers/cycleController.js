const mongoose = require('mongoose');
const CycleLog = require('../models/CycleLog');

// @desc    Get all cycle logs for a profile
// @route   GET /api/cycle
// @access  Private
const getCycleLogs = async (req, res, next) => {
  try {
    const { profileId } = req.query;
    const query = { userId: req.user._id };

    if (profileId && profileId !== 'undefined' && profileId !== 'null' && profileId.trim() !== '') {
      if (mongoose.Types.ObjectId.isValid(profileId.trim())) {
        query.profileId = profileId.trim();
      } else {
        return res.status(200).json({ success: true, count: 0, data: [] });
      }
    }

    const cycleLogs = await CycleLog.find(query)
      .populate('profileId', 'name gender relation isPrimary')
      .sort({ startDate: -1 });

    res.status(200).json({
      success: true,
      count: cycleLogs.length,
      data: cycleLogs,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record new menstrual cycle entry
// @route   POST /api/cycle
// @access  Private
const createCycleLog = async (req, res, next) => {
  try {
    const {
      profileId,
      startDate,
      endDate,
      cycleLength,
      periodLength,
      flow,
      symptoms,
      notes,
    } = req.body;

    if (!profileId || !mongoose.Types.ObjectId.isValid(String(profileId))) {
      return res.status(400).json({
        success: false,
        message: 'A valid 24-character Profile ID is required',
      });
    }

    if (!startDate) {
      return res.status(400).json({
        success: false,
        message: 'Cycle start date is required',
      });
    }

    const log = await CycleLog.create({
      userId: req.user._id,
      profileId,
      startDate,
      endDate: endDate || null,
      cycleLength: Number(cycleLength) || 28,
      periodLength: Number(periodLength) || 5,
      flow: flow || 'medium',
      symptoms: Array.isArray(symptoms) ? symptoms : [],
      notes: notes || '',
    });

    const populated = await CycleLog.findById(log._id).populate('profileId', 'name gender relation isPrimary');

    res.status(201).json({
      success: true,
      message: 'Cycle log saved successfully',
      data: populated || log,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an existing cycle log
// @route   PUT /api/cycle/:id
// @access  Private
const updateCycleLog = async (req, res, next) => {
  try {
    let log = await CycleLog.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Cycle log not found',
      });
    }

    Object.assign(log, req.body);
    log = await log.save();

    res.status(200).json({
      success: true,
      message: 'Cycle log updated successfully',
      data: log,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a cycle log
// @route   DELETE /api/cycle/:id
// @access  Private
const deleteCycleLog = async (req, res, next) => {
  try {
    const log = await CycleLog.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Cycle log not found',
      });
    }

    await log.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Cycle log removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCycleLogs,
  createCycleLog,
  updateCycleLog,
  deleteCycleLog,
};
