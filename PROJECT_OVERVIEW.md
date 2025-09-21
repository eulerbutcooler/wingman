# NIAT AI Tutor - Project Overview

AI-powered tutoring platform for Naval Institute of Aeronautical Technology students and faculty.

## 📦 Deliverables

- **Course Management**: Create courses, upload study materials (PDF, DOCX)
- **Auto Quiz Generation**: 30+ quizzes per course using AI
- **AI Chatbot**: Context-aware assistant with RAG-processed materials
- **Student Dashboard**: Personalized learning experience
- **PWA App**: Browser-installable with Tauri

## 🛠️ Tech Stack

- **Frontend**: Next.js, TypeScript, Tailwind CSS, Tauri
- **Backend**: Supabase (PostgreSQL), Drizzle ORM, NextAuth
- **AI/ML**: Google Gemini Pro, Vercel AI SDK
- **Vector DB**: pgvector extension, RAG embeddings (768-dim)
- **Voice**: ElevenLabs realistic voice synthesis
- **Email**: Nodemailer with Gmail SMTP
- **Video**: YouTube Data API v3 integration
- **Deployment**: Vercel with edge functions

## 💰 Recurring Costs

| Service | Cost | Notes |
|---------|------|-------|
| Supabase | ₹2,000/month | Free tier insufficient for production |
| Gemini Pro | FREE (1 year) | Then ₹20,000/year (free tier available) |
| ElevenLabs | ₹1,000/month | Free tier too limited for realistic voice |
| YouTube API | FREE | 10K requests/day quota |
| Gmail SMTP | FREE | For email notifications |
| Vercel | FREE | Hobby tier sufficient |

**Total**: ₹3,000/month (current) → ₹4,667/month (after year 1)

---
*Tauri-based PWA installable from browser*