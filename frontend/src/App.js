import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

const API_URL = '/api';

function App() {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError('');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024 // 5MB
  });

  const removeFile = () => {
    setFile(null);
  };

  const analyzeResume = async () => {
    if (!file) {
      setError('Please upload a resume file');
      return;
    }
    if (!jobDescription.trim()) {
      setError('Please enter a job description');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);

    const formData = new FormData();
    formData.append('resume', file);
    formData.append('jobDescription', jobDescription);

    try {
      const response = await axios.post(`${API_URL}/resume/analyze`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setResults(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error analyzing resume. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getScoreClass = (score) => {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'average';
    return 'poor';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent Match!';
    if (score >= 60) return 'Good Match';
    if (score >= 40) return 'Needs Improvement';
    return 'Poor Match';
  };

  const getScoreDescription = (score) => {
    if (score >= 80) return 'Your resume is well-optimized for this job!';
    if (score >= 60) return 'Your resume has good alignment with the job requirements.';
    if (score >= 40) return 'Consider adding more relevant keywords and experiences.';
    return 'Significant improvements needed to match this job.';
  };

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1>📄 ATS Resume Score Checker</h1>
          <p>Optimize your resume for Applicant Tracking Systems</p>
        </header>

        <div className="main-content">
          {/* Upload Section */}
          <div className="card">
            <h2><span className="icon">📤</span> Upload Resume</h2>
            
            <div
              {...getRootProps()}
              className={`dropzone ${isDragActive ? 'active' : ''}`}
            >
              <input {...getInputProps()} />
              <div className="upload-icon">📁</div>
              {isDragActive ? (
                <p>Drop your resume here...</p>
              ) : (
                <>
                  <p>Drag & drop your resume here, or click to select</p>
                  <span className="file-types">Supported: PDF, DOC, DOCX, TXT (Max 5MB)</span>
                </>
              )}
            </div>

            {file && (
              <div className="selected-file">
                <span className="file-icon">📄</span>
                <span>{file.name}</span>
                <button onClick={removeFile} title="Remove file">✕</button>
              </div>
            )}
          </div>

          {/* Job Description Section */}
          <div className="card">
            <h2><span className="icon">💼</span> Job Description</h2>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here. Include the job title, required skills, qualifications, and responsibilities for the best analysis..."
            />
          </div>
        </div>

        {/* Analyze Button */}
        <button
          className={`analyze-btn ${loading ? 'loading' : ''}`}
          onClick={analyzeResume}
          disabled={loading || !file || !jobDescription.trim()}
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Analyzing...
            </>
          ) : (
            '🔍 Analyze Resume'
          )}
        </button>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Results Section */}
        {results && (
          <div className="results-section">
            <div className="results-grid">
              {/* Score Card */}
              <div className="card score-card">
                <div className={`score-circle ${getScoreClass(results.atsScore)}`}>
                  <span className="score">{results.atsScore}</span>
                  <span className="label">ATS Score</span>
                </div>
                <h3 className="score-label">{getScoreLabel(results.atsScore)}</h3>
                <p className="score-description">{getScoreDescription(results.atsScore)}</p>
              </div>

              {/* Keyword Analysis */}
              <div className="card">
                <h2><span className="icon">🔑</span> Keyword Analysis</h2>
                
                <div className="keywords-section">
                  <h3>✅ Matched Keywords ({results.keywordAnalysis.matchedKeywords.length})</h3>
                  <div className="keyword-tags">
                    {results.keywordAnalysis.matchedKeywords.length > 0 ? (
                      results.keywordAnalysis.matchedKeywords.map((keyword, index) => (
                        <span key={index} className="keyword-tag matched">{keyword}</span>
                      ))
                    ) : (
                      <span className="keyword-tag missing">No matching keywords found</span>
                    )}
                  </div>
                </div>

                <div className="keywords-section">
                  <h3>❌ Missing Keywords ({results.keywordAnalysis.missingKeywords.length})</h3>
                  <div className="keyword-tags">
                    {results.keywordAnalysis.missingKeywords.length > 0 ? (
                      results.keywordAnalysis.missingKeywords.map((keyword, index) => (
                        <span key={index} className="keyword-tag missing">{keyword}</span>
                      ))
                    ) : (
                      <span className="keyword-tag matched">All keywords matched!</span>
                    )}
                  </div>
                </div>

                <div className="keyword-density">
                  <strong>Keyword Match: {results.keywordAnalysis.keywordDensity}%</strong>
                  <div className="density-bar">
                    <div 
                      className="density-fill" 
                      style={{ width: `${results.keywordAnalysis.keywordDensity}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Formatting Analysis */}
              <div className="card">
                <h2><span className="icon">📋</span> Format Check</h2>
                <div className="format-checks">
                  <div className={`format-item ${results.formattingAnalysis.hasContactInfo ? 'pass' : 'fail'}`}>
                    <span className="status-icon">
                      {results.formattingAnalysis.hasContactInfo ? '✅' : '❌'}
                    </span>
                    <span>Contact Information</span>
                  </div>
                  <div className={`format-item ${results.formattingAnalysis.hasExperience ? 'pass' : 'fail'}`}>
                    <span className="status-icon">
                      {results.formattingAnalysis.hasExperience ? '✅' : '❌'}
                    </span>
                    <span>Work Experience Section</span>
                  </div>
                  <div className={`format-item ${results.formattingAnalysis.hasEducation ? 'pass' : 'fail'}`}>
                    <span className="status-icon">
                      {results.formattingAnalysis.hasEducation ? '✅' : '❌'}
                    </span>
                    <span>Education Section</span>
                  </div>
                  <div className={`format-item ${results.formattingAnalysis.hasSkills ? 'pass' : 'fail'}`}>
                    <span className="status-icon">
                      {results.formattingAnalysis.hasSkills ? '✅' : '❌'}
                    </span>
                    <span>Skills Section</span>
                  </div>
                  <div className="format-item">
                    <span className="status-icon">📊</span>
                    <span>Format Score: {results.formattingAnalysis.score}%</span>
                  </div>
                </div>
              </div>

              {/* Improvement Tips */}
              <div className="card">
                <h2><span className="icon">💡</span> Improvement Tips</h2>
                <div className="tips-list">
                  {results.improvementTips.map((tip, index) => (
                    <div key={index} className="tip-item">
                      <span className="tip-icon">💡</span>
                      <p>{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <footer className="footer">
          <p>ATS Resume Score Checker © 2024 | Optimize your job application success</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
