const Submission = require('../models/Submission');
const Test = require('../models/Test');
const Question = require('../models/Question');

// @desc    Start or resume a test submission
// @route   POST /api/submissions/start
// @access  Private (Candidate)
const startSubmission = async (req, res) => {
  try {
    const { testId } = req.body;
    
    let submission = await Submission.findOne({ testId, candidateId: req.user._id });
    if (!submission) {
      // Fetch test to see if random questions are enabled
      const test = await Test.findById(testId);
      if (!test) return res.status(404).json({ message: 'Test not found' });

      // If randomQuestionsCount > 0, pick random questions
      let assignedQuestions = [];
      if (test.randomQuestionsCount > 0) {
        const questions = await Question.find({ testId });
        // Shuffle questions
        const shuffled = questions.sort(() => 0.5 - Math.random());
        assignedQuestions = shuffled.slice(0, test.randomQuestionsCount).map(q => q._id);
      } // Else, we leave it empty and assume all questions belong to the test

      submission = await Submission.create({
        testId,
        candidateId: req.user._id,
        startTime: new Date(),
        assignedQuestions
      });
    }
    
    if (submission.status === 'completed' || submission.status === 'auto_submitted') {
      return res.status(400).json({ message: 'Test already completed' });
    }
    
    res.json(submission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Save an answer
// @route   PUT /api/submissions/:id/answer
// @access  Private (Candidate)
const saveAnswer = async (req, res) => {
  try {
    const { questionId, answers } = req.body;
    const submission = await Submission.findById(req.params.id);
    
    if (!submission || submission.candidateId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    if (submission.status !== 'in_progress') {
      return res.status(400).json({ message: 'Test already completed' });
    }

    const answerIndex = submission.answers.findIndex(a => a.questionId.toString() === questionId);
    if (answerIndex > -1) {
      submission.answers[answerIndex].answers = answers;
    } else {
      submission.answers.push({ questionId, answers });
    }

    await submission.save();
    res.json({ message: 'Answer saved' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit Test and calculate score
// @route   POST /api/submissions/:id/submit
// @access  Private (Candidate)
const submitTest = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id).populate('testId');
    if (!submission || submission.candidateId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    if (submission.status !== 'in_progress') {
      return res.status(400).json({ message: 'Test already completed' });
    }

    let questions;
    if (submission.assignedQuestions && submission.assignedQuestions.length > 0) {
      questions = await Question.find({ _id: { $in: submission.assignedQuestions } });
    } else {
      questions = await Question.find({ testId: submission.testId._id });
    }
    
    let totalScore = 0;
    let maxScore = 0;

    submission.answers.forEach(ans => {
      const question = questions.find(q => q._id.toString() === ans.questionId.toString());
      if (question) {
        maxScore += question.points || 1;
        // Check if correct
        const isCorrect = JSON.stringify(ans.answers.sort()) === JSON.stringify(question.correctAnswers.sort());
        ans.isCorrect = isCorrect;
        ans.pointsAwarded = isCorrect ? (question.points || 1) : 0;
        totalScore += ans.pointsAwarded;
      }
    });

    // Check answers for unanswered questions to add to max score
    questions.forEach(q => {
      if (!submission.answers.find(a => a.questionId.toString() === q._id.toString())) {
        maxScore += q.points || 1;
      }
    });

    submission.score = totalScore;
    submission.maxScore = maxScore;
    submission.endTime = new Date();
    submission.status = req.body.isAutoSubmit ? 'auto_submitted' : 'completed';
    
    await submission.save();
    res.json(submission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Report anti-cheat violation
// @route   PUT /api/submissions/:id/violation
// @access  Private (Candidate)
const reportViolation = async (req, res) => {
  try {
    const { type } = req.body;
    const submission = await Submission.findById(req.params.id);
    
    if (!submission || submission.candidateId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    if (type === 'tab_switch') {
      submission.tabSwitches += 1;
    } else if (type === 'copy_paste') {
      submission.copyPasteAttempts += 1;
    }

    await submission.save();
    res.json({ message: 'Violation recorded' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get candidate's submissions
// @route   GET /api/submissions/my
// @access  Private
const getMySubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ candidateId: req.user._id }).populate('testId', 'title description duration');
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all submissions for a test (Admin)
// @route   GET /api/submissions/test/:testId
// @access  Private/Admin
const getTestSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ testId: req.params.testId })
      .populate('candidateId', 'name email degree college')
      .populate('testId', 'title');
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { startSubmission, saveAnswer, submitTest, getMySubmissions, getTestSubmissions, reportViolation };
