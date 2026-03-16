const Submission = require('../models/Submission');
const Test = require('../models/Test');
const User = require('../models/User');

// @desc    Get dashboard analytics
// @route   GET /api/analytics
// @access  Private/Admin
const getAnalytics = async (req, res) => {
  try {
    const totalTests = await Test.countDocuments();
    const totalCandidates = await User.countDocuments({ role: 'candidate' });
    const totalSubmissions = await Submission.countDocuments({ status: { $in: ['completed', 'auto_submitted'] } });
    
    // Calculate average score across all tests safely
    const completedSubmissions = await Submission.find({ status: { $in: ['completed', 'auto_submitted'] } });
    
    let totalScorePercentage = 0;
    completedSubmissions.forEach(sub => {
      if (sub.maxScore > 0) {
        totalScorePercentage += (sub.score / sub.maxScore) * 100;
      }
    });
    
    const averageScore = totalSubmissions > 0 ? (totalScorePercentage / totalSubmissions).toFixed(1) : 0;

    res.json({
      totalTests,
      totalCandidates,
      totalSubmissions,
      averageScore
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAnalytics };
