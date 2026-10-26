const express = require('express');
const router = express.Router();
const {
  getFoods,
  getExercises,
  getYoga,
  generatePersonalizedPlan,
} = require('../controllers/recommendationController');
const { protect } = require('../middleware/authMiddleware');

router.get('/foods', getFoods);
router.get('/exercises', getExercises);
router.get('/yoga', getYoga);
router.post('/plan', protect, generatePersonalizedPlan);

module.exports = router;
