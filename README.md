# 🤖 NextHire AI Recruiter Agent

> **An AI-powered autonomous hiring platform built with Qwen Cloud that streamlines recruitment through intelligent resume analysis, job matching, interview automation, and recruiter-assisted hiring workflows.**

<p align="center">
  <img src="public/logo.png" alt="NextHire Logo" width="180"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Qwen%20Cloud-AI-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Alibaba%20Cloud-Backend-orange?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Next.js-Frontend-black?style=for-the-badge" />
  <img src="https://img.shields.io/badge/FastAPI-Backend-green?style=for-the-badge" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" />
</p>

---

# 🚀 Overview

NextHire AI Recruiter Agent is a production-ready autonomous hiring assistant designed for the **Global AI Hackathon Series with Qwen Cloud**.

Instead of acting as a simple chatbot, NextHire behaves like an AI recruiter capable of analyzing resumes, matching candidates with jobs, generating interviews, assisting recruiters, and automating recruitment workflows using **Qwen Cloud AI**.

---

# ✨ Features

- 🤖 AI Resume Analysis
- 📄 ATS Resume Scoring
- 🎯 Job Description Matching
- 🧠 Skill Gap Analysis
- 🎤 AI Interview Question Generation
- 📊 Candidate Ranking
- 📧 Automated Email Generation
- 📅 Interview Scheduling
- 👨‍💼 Recruiter Dashboard
- 👩‍🎓 Candidate Dashboard
- 🔒 Role-Based Authentication
- 🧠 Persistent AI Memory
- 👨‍⚖️ Human-in-the-Loop Approval
- 📈 Hiring Analytics

---

# 🛠 Tech Stack

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Framer Motion

## Backend

- FastAPI
- Python
- REST API
- JWT Authentication

## AI

- Qwen Cloud
- DashScope API
- OpenAI SDK

## Database

- MongoDB Atlas

## Deployment

- Alibaba Cloud ECS
- Vercel

---

# 🏗 System Architecture

```
                   Next.js Frontend
                           │
                           ▼
                 FastAPI Backend
                           │
      ┌──────────────┬───────────────┐
      │              │               │
      ▼              ▼               ▼
  Qwen Cloud     MongoDB Atlas   Email Service
      │
      ▼
 Autonomous Hiring Workflow
```

---

# 🔄 Workflow

```
Resume Upload
      │
      ▼
Resume Parsing
      │
      ▼
Qwen AI Analysis
      │
      ▼
Skill Extraction
      │
      ▼
Job Matching
      │
      ▼
Candidate Ranking
      │
      ▼
Interview Generation
      │
      ▼
Recruiter Approval
      │
      ▼
Interview Scheduling
      │
      ▼
Email Notification
```

---

# 📂 Project Structure

```
NextHire-Qwen/
│
├── frontend/
├── backend/
├── public/
├── docs/
├── README.md
├── LICENSE
└── docker-compose.yml
```

---

# ⚙ Installation

## Clone Repository

```bash
git clone https://github.com/yourusername/NextHire-Qwen.git

cd NextHire-Qwen
```

---

## Frontend

```bash
npm install

npm run dev
```

---

## Backend

```bash
cd backend

pip install -r requirements.txt

uvicorn app.main:app --reload
```

---

# 🔐 Environment Variables

Backend `.env`

```env
DASHSCOPE_API_KEY=your_qwen_api_key

DATABASE_URL=your_database_url

JWT_SECRET=your_secret_key
```

Frontend `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:8001
```

---

# 📡 API Documentation

When the backend is running:

```
http://localhost:8001/docs
```

Swagger UI provides complete API documentation.

---

# 🎯 AI Capabilities

Using **Qwen Cloud**, NextHire can:

- Analyze resumes
- Extract candidate skills
- Match candidates to job descriptions
- Generate interview questions
- Evaluate candidate responses
- Recommend hiring decisions
- Generate recruiter emails
- Store recruiter preferences
- Maintain candidate memory

---

# 🚀 Deployment

Deploy using:

- Alibaba Cloud ECS

## Database

- MongoDB Atlas

---

# 📈 Future Improvements

- Voice-based AI Interviews
- Multi-Agent Collaboration
- Calendar Integration
- Gmail Integration
- Predictive Hiring Analytics
- ATS Integrations
- Mobile Application
- Multilingual Support

---

# 🏆 Hackathon

**Global AI Hackathon Series with Qwen Cloud**

**Organizer:** Alibaba Cloud × Devpost

**Track:** Autopilot Agent

---

# 👩‍💻 Author

**Yukta Thakur**

- GitHub: https://github.com/Yukta062006
- LinkedIn: https://www.linkedin.com/in/yukta-thakur-38251a328

---

# 📄 License

This project is licensed under the **MIT License**.
