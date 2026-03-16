const Test = require('../models/Test');
const Question = require('../models/Question');

// @desc    Create a new test
// @route   POST /api/tests
// @access  Private/Admin
const createTest = async (req, res) => {
  try {
    const { title, description, duration } = req.body;
    const test = await Test.create({
      title,
      description,
      duration,
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
    const { title, description, duration, status } = req.body;
    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ message: 'Test not found' });
    
    test.title = title || test.title;
    test.description = description || test.description;
    test.duration = duration || test.duration;
    test.status = status || test.status;
    
    const updatedTest = await test.save();
    res.json(updatedTest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createTest, getTests, getTestById, updateTest };
