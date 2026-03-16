const express = require('express');
const { getAnalytics } = require('../controllers/analyticsController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, admin, getAnalytics);

module.exports = router;
