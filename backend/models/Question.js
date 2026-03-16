const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
  text: { type: String, required: true },
  type: { type: String, enum: ['mcq', 'multiple_select', 'short_answer'], required: true },
  options: [{ type: String }], // Optional, only for mcq and multiple_select
  correctAnswers: [{ type: String, required: true }],
  points: { type: Number, default: 1 }
}, { timestamps: true });

module.exports = mongoose.model('Question', questionSchema);
