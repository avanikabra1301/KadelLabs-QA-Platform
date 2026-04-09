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
      if (test.isActive === false) return res.status(403).json({ message: 'This test is currently inactive' });

      // Ensure assigned questions are shuffled and restricted by randomQuestionsCount
      let assignedQuestions = [];
      let questions = await Question.find({ testId });
      
      if (test.randomizeQuestions) {
        questions = questions.sort(() => 0.5 - Math.random());
      }
      
      if (test.randomQuestionsCount > 0) {
        questions = questions.slice(0, test.randomQuestionsCount);
      }
      
      assignedQuestions = questions.map(q => q._id);

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

// @desc    Recalculate all submissions for a test
// @route   POST /api/submissions/test/:testId/recalculate
// @access  Private/Admin
const recalculateTestSubmissions = async (req, res) => {
  try {
    const { testId } = req.params;
    const test = await Test.findById(testId);
    if (!test) return res.status(404).json({ message: 'Test not found' });

    const questions = await Question.find({ testId });
    if (!questions || questions.length === 0) {
      return res.status(400).json({ message: 'No questions found for this test' });
    }

    const submissions = await Submission.find({ testId });
    for (let submission of submissions) {
      if (submission.status === 'in_progress') continue;
      
      let totalScore = 0;
      let maxScore = 0;
      
      let applicableQuestions = questions;
      if (submission.assignedQuestions && submission.assignedQuestions.length > 0) {
        applicableQuestions = questions.filter(q => submission.assignedQuestions.includes(q._id));
      }

      submission.answers.forEach(ans => {
        const question = applicableQuestions.find(q => q._id.toString() === ans.questionId.toString());
        if (question) {
          const isCorrect = JSON.stringify(ans.answers.sort()) === JSON.stringify(question.correctAnswers.sort());
          ans.isCorrect = isCorrect;
          ans.pointsAwarded = isCorrect ? (question.points || 1) : 0;
          totalScore += ans.pointsAwarded;
        }
      });

      applicableQuestions.forEach(q => {
        maxScore += q.points || 1;
      });

      submission.score = totalScore;
      submission.maxScore = maxScore;
      await submission.save();
    }

    res.json({ message: `Successfully recalculated ${submissions.length} submissions.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Export detailed report for a test
// @route   GET /api/submissions/test/:testId/export
// @access  Private/Admin
const exportTestSubmissions = async (req, res) => {
  try {
    const { testId } = req.params;
    const test = await Test.findById(testId);
    if (!test) return res.status(404).json({ message: 'Test not found' });
    
    const questions = await Question.find({ testId });
    const submissions = await Submission.find({ testId }).populate('candidateId', 'name email degree college');

    const exportData = [];

    // Detailed report array building
    submissions.forEach(sub => {
      if (sub.status === 'in_progress') return;

      let applicableQuestions = questions;
      if (sub.assignedQuestions && sub.assignedQuestions.length > 0) {
        applicableQuestions = questions.filter(q => sub.assignedQuestions.includes(q._id));
      }

      applicableQuestions.forEach(q => {
        const ans = sub.answers.find(a => a.questionId.toString() === q._id.toString());
        const selectedOption = ans && ans.answers && ans.answers.length > 0 ? ans.answers.join(', ') : 'Not Answered';
        const correctOpt = q.correctAnswers ? q.correctAnswers.join(', ') : 'N/A';
        const isCorrect = ans ? ans.isCorrect : false;

        exportData.push({
          'Candidate Name': sub.candidateId?.name || 'Unknown',
          'Candidate Email': sub.candidateId?.email || 'N/A',
          'Question ID': q._id.toString(),
          'Question Text': q.text,
          'Selected Answer': selectedOption,
          'Correct Answer': correctOpt,
          'Result': isCorrect ? 'Correct' : 'Wrong',
          'Candidate Total Score': `${sub.score} / ${sub.maxScore}`,
          'Test Date': new Date(sub.startTime).toLocaleDateString()
        });
      });
    });

    if (exportData.length === 0) {
      return res.status(400).json({ message: 'No completed submissions to export' });
    }

    const xlsx = require('xlsx');
    const ws = xlsx.utils.json_to_sheet(exportData);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Data");
    const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Test_${test._id}_report.xlsx`);
    res.send(buf);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all submissions across all tests (Admin)
// @route   GET /api/submissions/all
// @access  Private/Admin
const getAllSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({})
      .populate('candidateId', 'name email degree college course domain')
      .populate('testId', 'title');
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { startSubmission, saveAnswer, submitTest, getMySubmissions, getTestSubmissions, reportViolation, recalculateTestSubmissions, exportTestSubmissions, getAllSubmissions };
