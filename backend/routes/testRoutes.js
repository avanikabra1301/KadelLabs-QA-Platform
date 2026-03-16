const express = require('express');
const { createTest, getTests, getTestById, updateTest } = require('../controllers/testController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .post(protect, admin, createTest)
  .get(protect, getTests);

router.route('/:id')
  .get(protect, getTestById)
  .put(protect, admin, updateTest);

module.exports = router;
