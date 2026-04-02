const Question = require('../models/Question');
const Test = require('../models/Test');
const xlsx = require('xlsx');

// @desc    Create a new question
// @route   POST /api/questions
// @access  Private/Admin
const createQuestion = async (req, res) => {
  try {
    const { testId, text, type, options, correctAnswers, points } = req.body;
    const test = await Test.findById(testId);
    if (!test) return res.status(404).json({ message: 'Test not found' });

    if (!correctAnswers || correctAnswers.length === 0) {
      return res.status(400).json({ message: 'Correct answers are mandatory and cannot be empty.' });
    }

    const question = await Question.create({
      testId, text, type, options, correctAnswers, points
    });
    res.status(201).json(question);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get questions for a specific test
// @route   GET /api/questions/test/:testId
// @access  Private
const getQuestionsByTest = async (req, res) => {
  try {
    let query = { testId: req.params.testId };
    
    // If Candidate, try to find their submission to respect assigned random questions
    if (req.user.role !== 'admin') {
      const Submission = require('../models/Submission');
      const submission = await Submission.findOne({ testId: req.params.testId, candidateId: req.user._id });
      if (submission && submission.assignedQuestions && submission.assignedQuestions.length > 0) {
        query = { _id: { $in: submission.assignedQuestions } };
      }
    }

    let questions = await Question.find(query);
    
    // If Candidate, restore exact assigned randomization sequence
    if (req.user.role !== 'admin') {
      const Submission = require('../models/Submission');
      const submission = await Submission.findOne({ testId: req.params.testId, candidateId: req.user._id });
      if (submission && submission.assignedQuestions && submission.assignedQuestions.length > 0) {
        const orderMap = new Map();
        submission.assignedQuestions.forEach((id, index) => orderMap.set(id.toString(), index));
        questions.sort((a, b) => orderMap.get(a._id.toString()) - orderMap.get(b._id.toString()));
      }
      
      const sanitizedQuestions = questions.map(q => {
        const { correctAnswers, ...rest } = q.toObject();
        return rest;
      });
      return res.json(sanitizedQuestions);
    }
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Import questions from Excel
// @route   POST /api/questions/test/:testId/import
// @access  Private/Admin
const importQuestions = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const testId = req.params.testId;
    const test = await Test.findById(testId);
    if (!test) return res.status(404).json({ message: 'Test not found' });

    // Read the Excel file buffer
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // Expected columns: Question Text, Type, Option 1, Option 2, Option 3, Option 4, Correct Answers, Points
    const formattedQuestions = sheetData.map(row => {
      const type = (row['Type'] || 'mcq').toLowerCase();
      let options = [];
      if (type !== 'short_answer') {
        if (row['Option 1']) options.push(String(row['Option 1']));
        if (row['Option 2']) options.push(String(row['Option 2']));
        if (row['Option 3']) options.push(String(row['Option 3']));
        if (row['Option 4']) options.push(String(row['Option 4']));
      }

      // Handle multiple correct answers separated by commas
      const rawCorrect = String(row['Correct Answers'] || '').trim();
      const correctAnswers = type === 'short_answer' 
        ? (rawCorrect ? [rawCorrect] : []) 
        : rawCorrect.split(',').map(s => s.trim()).filter(s => s);

      if (!correctAnswers || correctAnswers.length === 0) {
        throw new Error(`Question "${row['Question Text'] || 'Untitled'}" is missing 'Correct Answers' column or value. Import failed.`);
      }

      return {
        testId,
        text: row['Question Text'] || 'Untitled Question',
        type,
        options,
        correctAnswers,
        points: Number(row['Points']) || 1
      };
    });

    const inserted = await Question.insertMany(formattedQuestions);
    res.status(201).json({ message: `${inserted.length} questions imported successfully`, count: inserted.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createQuestion, getQuestionsByTest, importQuestions };
