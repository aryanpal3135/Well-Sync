const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { uploadFile } = require('../controllers/uploadController');
const { protect } = require('../middleware/authMiddleware');

// Upload profile avatar or document
router.post('/', protect, upload.single('image'), uploadFile);

module.exports = router;
