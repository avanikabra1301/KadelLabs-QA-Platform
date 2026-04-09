const mongoose = require('mongoose');

const testSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  duration: { type: Number, required: true }, // in minutes
  course: { type: String, required: true },
  domain: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
  randomizeQuestions: { type: Boolean, default: false },
  randomQuestionsCount: { type: Number, default: 0 }, // 0 means all questions
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Test', testSchema);
