const express = require('express');
const multer = require('multer');
const { createQuestion, getQuestionsByTest, importQuestions } = require('../controllers/questionController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.route('/')
  .post(protect, admin, createQuestion);

router.route('/test/:testId')
  .get(protect, getQuestionsByTest);

router.post('/test/:testId/import', protect, admin, upload.single('file'), importQuestions);

module.exports = router;
