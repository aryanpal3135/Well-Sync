const User = require('../models/User');

// @desc    Upload avatar or profile photo
// @route   POST /api/upload
// @access  Private
const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image file',
      });
    }

    // Relative web-accessible path
    const fileUrl = `/uploads/${req.file.filename}`;

    // Optionally update user's avatar if user is authenticated
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { avatar: fileUrl });
    }

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      url: fileUrl,
      file: {
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadFile,
};
