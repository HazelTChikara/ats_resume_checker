const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  resumeText: {
    type: String,
    required: true
  },
  jobDescription: {
    type: String,
    required: true
  },
  atsScore: {
    type: Number,
    required: true
  },
  keywordAnalysis: {
    matchedKeywords: [String],
    missingKeywords: [String],
    keywordDensity: Number
  },
  formattingAnalysis: {
    hasProperSections: Boolean,
    hasContactInfo: Boolean,
    hasEducation: Boolean,
    hasExperience: Boolean,
    hasSkills: Boolean,
    issues: [String],
    score: Number
  },
  improvementTips: [String],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Resume', resumeSchema);
