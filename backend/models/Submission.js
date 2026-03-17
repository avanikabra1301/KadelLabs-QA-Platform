const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  answers: [{ type: String }], // Array for multiple select, single item for mcq/short_answer
  isCorrect: { type: Boolean },
  pointsAwarded: { type: Number, default: 0 }
});

const submissionSchema = new mongoose.Schema({
  testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedQuestions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }], // Randomly chosen questions for this candidate
  answers: [answerSchema],
  score: { type: Number, default: 0 },
  maxScore: { type: Number, default: 0 },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  status: { type: String, enum: ['in_progress', 'completed', 'auto_submitted'], default: 'in_progress' },
  tabSwitches: { type: Number, default: 0 },
  copyPasteAttempts: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Submission', submissionSchema);
