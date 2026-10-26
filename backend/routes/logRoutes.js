const express = require('express');
const router = express.Router();
const {
  getLogs,
  createLog,
  getLogStats,
  deleteLog,
} = require('../controllers/logController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getLogs)
  .post(createLog);

router.get('/stats', getLogStats);
router.delete('/:id', deleteLog);

module.exports = router;
