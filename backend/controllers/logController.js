const mongoose = require('mongoose');
const HealthLog = require('../models/HealthLog');

// @desc    Get all health logs for user or specific profile
// @route   GET /api/logs
// @access  Private
const getLogs = async (req, res, next) => {
  try {
    const { profileId, date, days } = req.query;
    const query = { userId: req.user._id };

    if (profileId && profileId !== 'undefined' && profileId !== 'null' && profileId.trim() !== '') {
      if (mongoose.Types.ObjectId.isValid(profileId.trim())) {
        query.profileId = profileId.trim();
      } else {
        return res.status(200).json({ success: true, count: 0, data: [] });
      }
    }

    if (date) {
      query.date = date;
    } else if (days) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - parseInt(days));
      const cutoffStr = cutoff.toISOString().split('T')[0];
      query.date = { $gte: cutoffStr };
    }

    const logs = await HealthLog.find(query)
      .populate('profileId', 'name gender relation isPrimary')
      .sort({ date: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create or update health log for today / specific date
// @route   POST /api/logs
// @access  Private
const createLog = async (req, res, next) => {
  try {
    const {
      profileId,
      date,
      waterIntake,
      sleepHours,
      workoutMinutes,
      caloriesBurned,
      mood,
      notes,
    } = req.body;

    if (!profileId || !mongoose.Types.ObjectId.isValid(String(profileId))) {
      return res.status(400).json({
        success: false,
        message: 'A valid 24-character Profile ID is required to log health metrics',
      });
    }

    const logDate = date || new Date().toISOString().split('T')[0];

    // Check if a log already exists for this profile on this date; update if exists, or create new
    let log = await HealthLog.findOne({
      userId: req.user._id,
      profileId,
      date: logDate,
    });

    if (log) {
      if (waterIntake !== undefined) log.waterIntake = Number(waterIntake);
      if (sleepHours !== undefined) log.sleepHours = Number(sleepHours);
      if (workoutMinutes !== undefined) log.workoutMinutes = Number(workoutMinutes);
      if (caloriesBurned !== undefined) log.caloriesBurned = Number(caloriesBurned);
      if (mood) log.mood = mood;
      if (notes !== undefined) log.notes = notes;
      await log.save();

      const populated = await HealthLog.findById(log._id).populate('profileId', 'name gender relation isPrimary');

      return res.status(200).json({
        success: true,
        message: 'Health log updated successfully',
        data: populated || log,
      });
    }

    log = await HealthLog.create({
      userId: req.user._id,
      profileId,
      date: logDate,
      waterIntake: Number(waterIntake) || 0,
      sleepHours: Number(sleepHours) || 0,
      workoutMinutes: Number(workoutMinutes) || 0,
      caloriesBurned: Number(caloriesBurned) || 0,
      mood: mood || 'good',
      notes: notes || '',
    });

    const populated = await HealthLog.findById(log._id).populate('profileId', 'name gender relation isPrimary');

    res.status(201).json({
      success: true,
      message: 'Health log recorded successfully',
      data: populated || log,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get aggregate health log statistics (for dashboard and charts)
// @route   GET /api/logs/stats
// @access  Private
const getLogStats = async (req, res, next) => {
  try {
    const { profileId, days = 7 } = req.query;
    const query = { userId: req.user._id };

    if (profileId && profileId !== 'undefined' && profileId !== 'null' && profileId.trim() !== '') {
      if (mongoose.Types.ObjectId.isValid(profileId.trim())) {
        query.profileId = profileId.trim();
      }
    }

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - parseInt(days));
    query.date = { $gte: cutoff.toISOString().split('T')[0] };

    const logs = await HealthLog.find(query);

    const totalDays = logs.length;
    const totals = logs.reduce(
      (acc, log) => {
        acc.water += log.waterIntake || 0;
        acc.sleep += log.sleepHours || 0;
        acc.workout += log.workoutMinutes || 0;
        acc.calories += log.caloriesBurned || 0;
        return acc;
      },
      { water: 0, sleep: 0, workout: 0, calories: 0 }
    );

    const averages = totalDays > 0 ? {
      avgWater: parseFloat((totals.water / totalDays).toFixed(1)),
      avgSleep: parseFloat((totals.sleep / totalDays).toFixed(1)),
      avgWorkout: Math.round(totals.workout / totalDays),
      avgCalories: Math.round(totals.calories / totalDays),
    } : { avgWater: 0, avgSleep: 0, avgWorkout: 0, avgCalories: 0 };

    res.status(200).json({
      success: true,
      data: {
        totalDaysLogged: totalDays,
        averages,
        totals,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete health log by ID
// @route   DELETE /api/logs/:id
// @access  Private
const deleteLog = async (req, res, next) => {
  try {
    const log = await HealthLog.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Log not found',
      });
    }

    await log.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Health log deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLogs,
  createLog,
  getLogStats,
  deleteLog,
};
