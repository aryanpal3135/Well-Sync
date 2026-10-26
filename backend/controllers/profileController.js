const Profile = require('../models/Profile');
const HealthLog = require('../models/HealthLog');
const CycleLog = require('../models/CycleLog');

// @desc    Get all profiles for the logged-in user
// @route   GET /api/profiles
// @access  Private
const getProfiles = async (req, res, next) => {
  try {
    const profiles = await Profile.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: profiles.length,
      data: profiles,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single profile by ID
// @route   GET /api/profiles/:id
// @access  Private
const getProfileById = async (req, res, next) => {
  try {
    const profile = await Profile.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found or access denied',
      });
    }

    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new profile (Self or Family Member)
// @route   POST /api/profiles
// @access  Private
const createProfile = async (req, res, next) => {
  try {
    const {
      name,
      relation,
      age,
      gender,
      height,
      weight,
      activityLevel,
      goal,
      dietaryPreference,
      allergies,
      conditions,
      isPrimary,
    } = req.body;

    if (!name || !age || !height || !weight) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, age, height, and weight',
      });
    }

    // Check if this is the first profile for user; if so, make it primary
    const existingCount = await Profile.countDocuments({ userId: req.user._id });
    const shouldBePrimary = existingCount === 0 || isPrimary === true;

    // If marked as primary, un-mark existing primary profiles
    if (shouldBePrimary) {
      await Profile.updateMany({ userId: req.user._id }, { isPrimary: false });
    }

    const profile = await Profile.create({
      userId: req.user._id,
      name: name.trim(),
      relation: relation || 'self',
      age: Number(age),
      gender: gender || 'men',
      height: Number(height),
      weight: Number(weight),
      activityLevel: activityLevel || 'sedentary',
      goal: goal || (Array.isArray(req.body.goals) ? req.body.goals[0] : 'general_wellness'),
      goals: Array.isArray(req.body.goals) ? req.body.goals : (goal ? [goal] : []),
      dietaryPreference: dietaryPreference || 'vegetarian',
      allergies: Array.isArray(allergies) ? allergies : [],
      conditions: Array.isArray(conditions) ? conditions : [],
      cycleData: req.body.cycleData || null,
      isPrimary: shouldBePrimary,
    });

    res.status(201).json({
      success: true,
      message: 'Profile created successfully',
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a profile
// @route   PUT /api/profiles/:id
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    let profile = await Profile.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found',
      });
    }

    if (req.body.isPrimary === true) {
      await Profile.updateMany({ userId: req.user._id }, { isPrimary: false });
    }

    // Assign updates
    Object.assign(profile, req.body);

    // Re-save to trigger pre-save hooks (like BMI re-calc)
    profile = await profile.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a profile and its associated logs
// @route   DELETE /api/profiles/:id
// @access  Private
const deleteProfile = async (req, res, next) => {
  try {
    const profile = await Profile.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found',
      });
    }

    // Cascade delete associated health logs and cycle logs
    await HealthLog.deleteMany({ profileId: profile._id });
    await CycleLog.deleteMany({ profileId: profile._id });

    await profile.deleteOne();

    // If the deleted profile was primary, assign primary to another existing profile if available
    if (profile.isPrimary) {
      const remainingProfile = await Profile.findOne({ userId: req.user._id });
      if (remainingProfile) {
        remainingProfile.isPrimary = true;
        await remainingProfile.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Profile and associated logs deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfiles,
  getProfileById,
  createProfile,
  updateProfile,
  deleteProfile,
};
