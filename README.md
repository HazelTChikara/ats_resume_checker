# ATS Resume Score Checker

A dockerized full-stack application to analyze resumes against job descriptions and provide ATS (Applicant Tracking System) compatibility scores.

## Features

- 📤 **Resume Upload**: Support for PDF, DOC, DOCX, and TXT files
- 🔍 **ATS Score Analysis**: Get a comprehensive score based on keyword matching and formatting
- 🔑 **Keyword Analysis**: See matched and missing keywords from the job description
- 📋 **Format Check**: Validate resume structure and sections
- 💡 **Improvement Tips**: Actionable suggestions to improve your resume
- 📊 **Score History**: Track your previous analyses

## Tech Stack

- **Frontend**: React 18 with modern CSS
- **Backend**: Node.js with Express
- **Database**: MongoDB
- **Reverse Proxy**: Nginx
- **Containerization**: Docker & Docker Compose

## Project Structure

```
ats-resume-checker/
├── backend/
│   ├── models/
│   │   └── Resume.js
│   ├── routes/
│   │   └── resumeRoutes.js
│   ├── services/
│   │   └── atsService.js
│   ├── uploads/
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/
│   │   ├── index.html
│   │   └── manifest.json
│   ├── src/
│   │   ├── App.js
│   │   ├── index.css
│   │   └── index.js
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── nginx/
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
└── README.md
```

## Quick Start

### Prerequisites

- Docker Desktop installed and running
- Docker Compose (included with Docker Desktop)

### One Command Deployment

1. Clone or navigate to the project directory:
   ```bash
   cd ats-resume-checker
   ```

2. Build and start all services:
   ```bash
   docker-compose up --build
   ```

3. Access the application:
   - **Application**: http://localhost
   - **API Health Check**: http://localhost/api/health

### Stopping the Application

```bash
docker-compose down
```

To also remove the database volume:
```bash
docker-compose down -v
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/resume/analyze` | Upload resume and analyze against job description |
| GET | `/api/resume/history` | Get analysis history (last 10) |
| GET | `/api/resume/:id` | Get specific analysis by ID |
| GET | `/api/health` | Health check endpoint |

## How to Use

1. **Upload Resume**: Drag and drop or click to upload your resume file (PDF, DOC, DOCX, or TXT)
2. **Add Job Description**: Paste the complete job description in the text area
3. **Analyze**: Click the "Analyze Resume" button
4. **Review Results**: 
   - View your ATS Score (0-100)
   - Check matched and missing keywords
   - Review formatting issues
   - Follow improvement tips

## Scoring Criteria

The ATS score is calculated based on:

- **Keyword Match (60%)**: How well your resume matches the job description keywords
- **Formatting (40%)**: Proper sections, contact info, quantifiable achievements

### Score Ranges

| Score | Rating | Description |
|-------|--------|-------------|
| 80-100 | Excellent | Well-optimized for the job |
| 60-79 | Good | Good alignment with requirements |
| 40-59 | Average | Needs improvement |
| 0-39 | Poor | Significant improvements needed |

## Development

### Running Locally (Without Docker)

**Backend:**
```bash
cd backend
npm install
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm start
```

**MongoDB:**
```bash
# Run MongoDB locally or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:7.0
```

## Environment Variables

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://mongodb:27017/ats_resume_checker
NODE_ENV=production
```

## Troubleshooting

### Common Issues

1. **Port 80 already in use**
   - Stop other services using port 80
   - Or modify the nginx port in `docker-compose.yml`

2. **Docker build fails**
   - Ensure Docker Desktop is running
   - Try `docker-compose build --no-cache`

3. **MongoDB connection issues**
   - Wait for MongoDB to be healthy before backend connects
   - Check logs: `docker-compose logs mongodb`

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

## License

MIT License - feel free to use this project for your own purposes.
