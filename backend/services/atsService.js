const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

// Parse resume file and extract text
async function parseResume(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  let text = '';

  try {
    if (ext === '.pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      text = data.text;
    } else if (ext === '.docx') {
      const result = await mammoth.extractRawText({ path: filePath });
      text = result.value;
    } else if (ext === '.doc') {
      // For .doc files, try mammoth (limited support)
      const result = await mammoth.extractRawText({ path: filePath });
      text = result.value;
    } else if (ext === '.txt') {
      text = fs.readFileSync(filePath, 'utf-8');
    } else {
      throw new Error('Unsupported file format');
    }
  } catch (error) {
    console.error('Error parsing resume:', error);
    throw new Error('Error parsing resume file');
  }

  return text;
}

// Extract keywords from text
function extractKeywords(text) {
  // Common stop words to filter out
  const stopWords = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
    'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
    'to', 'was', 'were', 'will', 'with', 'the', 'this', 'but', 'they',
    'have', 'had', 'what', 'when', 'where', 'who', 'which', 'why', 'how',
    'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some',
    'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too',
    'very', 'can', 'just', 'should', 'now', 'or', 'if', 'our', 'we', 'you',
    'your', 'their', 'them', 'i', 'me', 'my', 'myself', 'we', 'us', 'am'
  ]);

  // Extract words, filter stop words, and normalize
  const words = text.toLowerCase()
    .replace(/[^a-z0-9\s\+\#\.]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));

  // Count word frequency
  const wordCount = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });

  // Return unique keywords sorted by frequency
  return Object.keys(wordCount).sort((a, b) => wordCount[b] - wordCount[a]);
}

// Extract technical skills and important keywords from job description
function extractJobKeywords(jobDescription) {
  const text = jobDescription.toLowerCase();
  
  // Common technical skills and keywords to look for
  const technicalPatterns = [
    // Programming languages
    /\b(javascript|python|java|c\+\+|c#|ruby|php|swift|kotlin|go|rust|typescript|scala|r)\b/g,
    // Frameworks and libraries
    /\b(react|angular|vue|node\.?js|express|django|flask|spring|rails|laravel|\.net|tensorflow|pytorch)\b/g,
    // Databases
    /\b(sql|mysql|postgresql|mongodb|redis|elasticsearch|oracle|dynamodb|cassandra)\b/g,
    // Cloud and DevOps
    /\b(aws|azure|gcp|docker|kubernetes|jenkins|ci\/cd|terraform|ansible|linux)\b/g,
    // Tools and concepts
    /\b(git|agile|scrum|jira|rest|api|microservices|machine learning|data science|ai)\b/g,
    // Soft skills (for matching)
    /\b(leadership|communication|teamwork|problem.solving|analytical|management)\b/g
  ];

  const keywords = new Set();
  
  // Extract pattern-based keywords
  technicalPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(m => keywords.add(m.toLowerCase()));
    }
  });

  // Also extract general keywords
  const generalKeywords = extractKeywords(jobDescription);
  generalKeywords.slice(0, 30).forEach(kw => keywords.add(kw));

  return Array.from(keywords);
}

// Check resume formatting
function analyzeFormatting(resumeText) {
  const text = resumeText.toLowerCase();
  const issues = [];
  let score = 100;

  // Check for contact information
  const hasEmail = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(resumeText);
  const hasPhone = /(\+?1?[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(resumeText);
  const hasLinkedIn = /linkedin/i.test(resumeText);

  // Check for common sections
  const hasEducation = /(education|academic|degree|university|college|bachelor|master|phd)/i.test(text);
  const hasExperience = /(experience|employment|work history|professional background)/i.test(text);
  const hasSkills = /(skills|technologies|technical skills|competencies|proficiencies)/i.test(text);
  const hasSummary = /(summary|objective|profile|about)/i.test(text);

  if (!hasEmail) {
    issues.push('Missing email address');
    score -= 15;
  }
  if (!hasPhone) {
    issues.push('Missing phone number');
    score -= 10;
  }
  if (!hasEducation) {
    issues.push('Missing Education section');
    score -= 15;
  }
  if (!hasExperience) {
    issues.push('Missing Experience section');
    score -= 20;
  }
  if (!hasSkills) {
    issues.push('Missing Skills section');
    score -= 15;
  }
  if (!hasSummary) {
    issues.push('Consider adding a Professional Summary section');
    score -= 5;
  }

  // Check resume length (rough word count)
  const wordCount = resumeText.split(/\s+/).length;
  if (wordCount < 150) {
    issues.push('Resume appears too short. Consider adding more detail.');
    score -= 10;
  } else if (wordCount > 1500) {
    issues.push('Resume may be too long. Consider condensing to 1-2 pages.');
    score -= 5;
  }

  // Check for action verbs
  const actionVerbs = ['managed', 'developed', 'created', 'implemented', 'designed', 'led', 'improved', 'achieved', 'delivered', 'coordinated'];
  const hasActionVerbs = actionVerbs.some(verb => text.includes(verb));
  if (!hasActionVerbs) {
    issues.push('Use more action verbs to describe your accomplishments');
    score -= 5;
  }

  // Check for quantifiable achievements
  const hasNumbers = /\d+%|\$\d+|\d+\s*(years?|months?|projects?|team|people|clients?)/i.test(resumeText);
  if (!hasNumbers) {
    issues.push('Add quantifiable achievements (numbers, percentages, metrics)');
    score -= 10;
  }

  return {
    hasProperSections: hasEducation && hasExperience && hasSkills,
    hasContactInfo: hasEmail || hasPhone,
    hasEducation,
    hasExperience,
    hasSkills,
    issues,
    score: Math.max(0, score)
  };
}

// Main ATS analysis function
function analyzeATS(resumeText, jobDescription) {
  const resumeKeywords = extractKeywords(resumeText);
  const jobKeywords = extractJobKeywords(jobDescription);

  // Find matching and missing keywords
  const matchedKeywords = [];
  const missingKeywords = [];

  jobKeywords.forEach(keyword => {
    if (resumeText.toLowerCase().includes(keyword.toLowerCase())) {
      matchedKeywords.push(keyword);
    } else {
      missingKeywords.push(keyword);
    }
  });

  // Calculate keyword match score
  const keywordScore = jobKeywords.length > 0 
    ? (matchedKeywords.length / jobKeywords.length) * 100 
    : 0;

  // Analyze formatting
  const formattingAnalysis = analyzeFormatting(resumeText);

  // Calculate overall ATS score (weighted average)
  const atsScore = Math.round(
    (keywordScore * 0.6) + (formattingAnalysis.score * 0.4)
  );

  // Generate improvement tips
  const improvementTips = generateImprovementTips(
    matchedKeywords, 
    missingKeywords, 
    formattingAnalysis, 
    atsScore
  );

  return {
    atsScore,
    keywordAnalysis: {
      matchedKeywords: matchedKeywords.slice(0, 20),
      missingKeywords: missingKeywords.slice(0, 20),
      keywordDensity: Math.round(keywordScore)
    },
    formattingAnalysis,
    improvementTips
  };
}

// Generate improvement tips based on analysis
function generateImprovementTips(matchedKeywords, missingKeywords, formattingAnalysis, atsScore) {
  const tips = [];

  // Keyword-related tips
  if (missingKeywords.length > 5) {
    tips.push(`Add these important keywords from the job description: ${missingKeywords.slice(0, 5).join(', ')}`);
  }

  if (matchedKeywords.length < 5) {
    tips.push('Your resume lacks key skills mentioned in the job description. Review and align your skills section.');
  }

  // Formatting-related tips
  formattingAnalysis.issues.forEach(issue => {
    tips.push(issue);
  });

  // General tips based on score
  if (atsScore < 50) {
    tips.push('Consider tailoring your resume more specifically to this job description');
    tips.push('Use exact phrases from the job posting where applicable');
  }

  if (atsScore >= 50 && atsScore < 70) {
    tips.push('Good start! Focus on incorporating more technical keywords');
    tips.push('Ensure your most relevant experience is prominently displayed');
  }

  if (atsScore >= 70) {
    tips.push('Strong match! Fine-tune by adding any missing critical keywords');
  }

  // Always include these best practices
  if (tips.length < 5) {
    tips.push('Use standard section headings (Experience, Education, Skills)');
    tips.push('Avoid graphics, tables, and complex formatting that ATS may not parse');
    tips.push('Save your resume as a .docx or .pdf file for best compatibility');
  }

  return tips.slice(0, 8);
}

module.exports = {
  parseResume,
  analyzeATS,
  extractKeywords,
  extractJobKeywords,
  analyzeFormatting
};
