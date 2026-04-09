const express = require('express');
const { startSubmission, saveAnswer, submitTest, getMySubmissions, getTestSubmissions, reportViolation, recalculateTestSubmissions, exportTestSubmissions } = require('../controllers/submissionController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.post('/start', protect, startSubmission);
router.get('/my', protect, getMySubmissions);
router.put('/:id/answer', protect, saveAnswer);
router.post('/:id/submit', protect, submitTest);
router.put('/:id/violation', protect, reportViolation);

router.get('/test/:testId', protect, admin, getTestSubmissions);
router.post('/test/:testId/recalculate', protect, admin, recalculateTestSubmissions);
router.get('/test/:testId/export', protect, admin, exportTestSubmissions);
router.get('/all', protect, admin, require('../controllers/submissionController').getAllSubmissions);

module.exports = router;
