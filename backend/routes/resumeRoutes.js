const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const Resume = require('../models/Resume');
const { parseResume, analyzeATS } = require('../services/atsService');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Upload resume and analyze
router.post('/analyze', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No resume file uploaded' });
    }

    const { jobDescription } = req.body;
    if (!jobDescription || jobDescription.trim() === '') {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Job description is required' });
    }

    // Parse resume text
    const resumeText = await parseResume(req.file.path);
    
    // Analyze ATS score
    const analysis = analyzeATS(resumeText, jobDescription);

    // Save to database
    const resume = new Resume({
      filename: req.file.filename,
      originalName: req.file.originalname,
      resumeText,
      jobDescription,
      atsScore: analysis.atsScore,
      keywordAnalysis: analysis.keywordAnalysis,
      formattingAnalysis: analysis.formattingAnalysis,
      improvementTips: analysis.improvementTips
    });

    await resume.save();

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      id: resume._id,
      atsScore: analysis.atsScore,
      keywordAnalysis: analysis.keywordAnalysis,
      formattingAnalysis: analysis.formattingAnalysis,
      improvementTips: analysis.improvementTips
    });
  } catch (error) {
    console.error('Error analyzing resume:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: error.message || 'Error analyzing resume' });
  }
});

// Get analysis history
router.get('/history', async (req, res) => {
  try {
    const resumes = await Resume.find()
      .select('originalName atsScore createdAt')
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(resumes);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Error fetching history' });
  }
});

// Get specific analysis by ID
router.get('/:id', async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume) {
      return res.status(404).json({ error: 'Analysis not found' });
    }
    res.json(resume);
  } catch (error) {
    console.error('Error fetching analysis:', error);
    res.status(500).json({ error: 'Error fetching analysis' });
  }
});

module.exports = router;
