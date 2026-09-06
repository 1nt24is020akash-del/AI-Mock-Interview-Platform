# AI Mock Interview Platform 🚀

An AI-powered full-stack mock interview and resume evaluation platform. Practice technical interviews across 8 specialized engineering domains with real-time AI feedback, scoring, and automated resume analysis.

## Features ✨

- **Multi-Domain Technical Interviews**: Practice across JavaScript/Node.js, React, Python, Data Science, DevOps, System Design, Database Design, and General software engineering.
- **AI-Powered Evaluation**: Real-time constructive feedback on technical accuracy, clarity, and depth.
- **Resume Analysis**: Upload your PDF/DOC resume to receive skill detection, experience level evaluation, and personalized domain recommendations.
- **Session History & Analytics**: Track progress, review past sessions with full conversation transcripts, and retake interviews.

## Project Structure 📁

```text
├── client/         # Next.js 16 (App Router), React 19, Tailwind CSS frontend
├── server/         # Express.js, MongoDB (Mongoose), JWT, Groq AI backend
└── README.md
```

## Quick Start 🛠️

### 1. Backend Setup
```bash
cd server
npm install
cp .env.example .env
# Fill in MONGO_URI, JWT_SECRET, and optional GROQ_API_KEY in .env
npm run dev
```

### 2. Frontend Setup
```bash
cd client
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start practicing!
