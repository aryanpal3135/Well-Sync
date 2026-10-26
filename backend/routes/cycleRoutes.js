const express = require('express');
const router = express.Router();
const {
  getCycleLogs,
  createCycleLog,
  updateCycleLog,
  deleteCycleLog,
} = require('../controllers/cycleController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getCycleLogs)
  .post(createCycleLog);

router.route('/:id')
  .put(updateCycleLog)
  .delete(deleteCycleLog);

module.exports = router;
