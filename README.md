# 🤖 NextHire AI Recruiter Agent

> **An AI-powered recruitment platform that streamlines hiring through intelligent resume analysis, job matching, interview assistance, and recruiter-focused workflows.**

<p align="center">
  <img src="public/logo.png" alt="NextHire Logo" width="180"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-Frontend-black?style=for-the-badge" />
  <img src="https://img.shields.io/badge/FastAPI-Backend-green?style=for-the-badge" />
  <img src="https://img.shields.io/badge/MongoDB-Database-brightgreen?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Vercel-Deployed-black?style=for-the-badge" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" />
</p>

---

# 🚀 Live Demo

### 🌐 Frontend (Vercel)

https://next-hire-steel.vercel.app/

### ⚡ Backend (Render)

https://nexthire-1-lrdw.onrender.com

### 📚 API Docs

https://nexthire-1-lrdw.onrender.com/docs

---

# 🚀 Overview

NextHire is a modern AI-powered recruitment platform designed to simplify the hiring process for recruiters and job seekers. It offers secure authentication, intelligent resume analysis, ATS scoring, candidate management, and recruiter dashboards within a responsive and user-friendly interface.

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
- 🔒 Secure Authentication
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

## Database

- MongoDB Atlas

## Deployment

- Vercel (Frontend)
- Render (Backend)

---

# 🏗 System Architecture

```
                  Next.js Frontend (Vercel)
                           │
                           ▼
                FastAPI Backend (Render)
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
      MongoDB Atlas             AI Resume Analysis
```

---

# 🔄 Workflow

```
User Login
      │
      ▼
Upload Resume
      │
      ▼
Resume Analysis
      │
      ▼
ATS Score
      │
      ▼
Job Matching
      │
      ▼
Candidate Ranking
      │
      ▼
Interview Questions
      │
      ▼
Recruiter Dashboard
```

---

# 📂 Project Structure

```
NextHire/
│
├── frontend/
├── backend/
├── public/
├── README.md
├── LICENSE
└── docker-compose.yml
```

---

# ⚙️ Installation

## Clone Repository

```bash
git clone https://github.com/Yukta062006/NextHire.git

cd NextHire
```

---

## Frontend

```bash
cd frontend

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

### Backend (`.env`)

```env
DATABASE_URL=your_database_url

JWT_SECRET=your_secret_key

SECRET_KEY=your_secret_key
```

### Frontend (`.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8001

NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key

NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com

NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id

NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com

NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id

NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

---

# 📡 API Documentation

After starting the backend:

```
http://localhost:8001/docs
```

Production:

```
https://nexthire-1-lrdw.onrender.com/docs
```

---

# 🚀 Deployment

### Frontend

- **Vercel**

### Backend

- **Render**

### Database

- **MongoDB Atlas**

---

# 📈 Future Improvements

- AI-powered Resume Recommendations
- Voice-based Interviews
- Calendar Integration
- Gmail Notifications
- Company Dashboard
- Candidate Analytics
- Mobile Application
- Multilingual Support

---

# 👩‍💻 Author

**Yukta Thakur**

- GitHub: https://github.com/Yukta062006
- LinkedIn: https://www.linkedin.com/in/yukta-thakur-38251a328

---

# 📄 License

This project is licensed under the **MIT License**.
