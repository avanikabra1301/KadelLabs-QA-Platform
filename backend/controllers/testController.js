const Test = require('../models/Test');
const Question = require('../models/Question');

// @desc    Create a new test
// @route   POST /api/tests
// @access  Private/Admin
const createTest = async (req, res) => {
  try {
    const { title, description, duration, course, domain, randomQuestionsCount, randomizeQuestions, isActive } = req.body;
    if (!course || !domain) {
      return res.status(400).json({ message: 'Course and Domain configurations are strictly required for tests.' });
    }
    const test = await Test.create({
      title,
      description,
      duration,
      course,
      domain,
      randomQuestionsCount: randomQuestionsCount || 0,
      randomizeQuestions: randomizeQuestions || false,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user._id
    });
    res.status(201).json(test);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all tests (Admin sees all, Candidate sees published)
// @route   GET /api/tests
// @access  Private
const getTests = async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== 'admin') {
      query.status = 'published';
      query.isActive = true;
      if (req.user.course) query.course = req.user.course;
      if (req.user.domain) query.domain = req.user.domain;
    }
    const tests = await Test.find(query).populate('createdBy', 'name');
    res.json(tests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single test details
// @route   GET /api/tests/:id
// @access  Private
const getTestById = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ message: 'Test not found' });
    res.json(test);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a test
// @route   PUT /api/tests/:id
// @access  Private/Admin
const updateTest = async (req, res) => {
  try {
    const { title, description, duration, status, course, domain, randomQuestionsCount, randomizeQuestions, isActive } = req.body;
    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ message: 'Test not found' });
    
    if (status === 'published' && test.status !== 'published') {
      const questions = await Question.find({ testId: test._id });
      if (questions.length === 0) {
        return res.status(400).json({ message: 'Cannot publish test without any questions.' });
      }
      const invalidQuestions = questions.filter(q => !q.correctAnswers || q.correctAnswers.length === 0);
      if (invalidQuestions.length > 0) {
        return res.status(400).json({ message: 'Correct answers missing for one or more questions. Cannot publish test.' });
      }
    }

    test.title = title || test.title;
    test.description = description || test.description;
    test.duration = duration || test.duration;
    test.status = status || test.status;
    if (course) test.course = course;
    if (domain) test.domain = domain;
    if (randomQuestionsCount !== undefined) {
      test.randomQuestionsCount = randomQuestionsCount;
    }
    if (randomizeQuestions !== undefined) {
      test.randomizeQuestions = randomizeQuestions;
    }
    if (isActive !== undefined) {
      test.isActive = isActive;
    }
    
    const updatedTest = await test.save();
    res.json(updatedTest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createTest, getTests, getTestById, updateTest };
