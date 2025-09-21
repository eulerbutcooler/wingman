# NIAT AI Tutor - Wingman

An intelligent tutoring platform designed specifically for students and teachers at the Naval Institute of Aeronautical Technology (NIAT). This AI-powered application helps teachers create comprehensive courses and provides students with personalized learning experiences through advanced RAG (Retrieval-Augmented Generation) technology.

## 🚀 Key Features & Deliverables

### For Teachers
- **Course Creation**: Easy-to-use interface for creating and managing courses
- **Study Material Upload**: Support for various document formats (PDF, DOCX, etc.)
- **Automatic Quiz Generation**: AI generates 30+ quizzes automatically for every course
- **Material Processing**: Advanced RAG processing for intelligent content indexing

### For Students
- **AI Chatbot**: Context-aware chatbot with access to course materials
- **Personalized Dashboard**: Tailored learning experience and progress tracking
- **Interactive Quizzes**: Auto-generated assessments based on study materials
- **Voice Integration**: Realistic voice synthesis for enhanced learning

### Platform Features
- **Progressive Web App (PWA)**: Installable directly from browser using Tauri
- **Responsive Design**: Optimized for both desktop and mobile devices
- **Real-time Processing**: Instant material processing and quiz generation
- **Secure Authentication**: User management and secure access control

## 🛠️ Technology Stack

### Frontend
- **Next.js** - React framework for production
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Tauri** - Cross-platform app framework for PWA capabilities

### Backend & Database
- **Supabase** - Backend-as-a-Service (Database, Authentication, Storage)
- **Drizzle ORM** - Type-safe database operations
- **PostgreSQL** - Primary database

### AI & Processing
- **Google Gemini Pro** - Large Language Model for content generation
- **RAG (Retrieval-Augmented Generation)** - Advanced document processing
- **ElevenLabs** - Realistic voice synthesis

### Development Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Vercel** - Deployment platform

## 💰 Recurring Costs

### Database & Storage
- **Supabase** (Database + Storage): ₹2,000/month
  - Includes PostgreSQL database hosting
  - File storage for study materials
  - Authentication services

### AI Services
- **Google Gemini Pro**: FREE for next 1 year
  - After 1 year: ₹20,000/annually
  - *Note: Can fallback to free tier if needed*

### Voice Services
- **ElevenLabs Realistic Voice**: ₹1,000/month (credit-based)
  - High-quality voice synthesis
  - When credits exhausted, automatically switches to less realistic voice
  - Credit consumption varies based on usage

### Total Monthly Cost
- **Current**: ₹3,000/month
- **After Year 1**: ₹4,667/month (including Gemini Pro annual cost)

## 🚀 Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run development server: `npm run dev`
5. Build for production: `npm run build`

## 📱 Installation

The app can be installed directly from the browser as a Progressive Web App (PWA) thanks to Tauri integration, providing a native app experience across all platforms.

## 🎯 Target Audience

- **Primary**: Students and faculty at Naval Institute of Aeronautical Technology (NIAT)
- **Secondary**: Educational institutions requiring AI-powered learning solutions

---

*Built with ❤️ for the NIAT community*
│   │   ├── ai/               # AI model configurations
│   │   ├── auth/             # Authentication utilities
│   │   ├── db/               # Database schema and actions
│   │   ├── rag/              # RAG implementation
│   │   └── services/         # Business logic services
│   └── types/                # TypeScript type definitions
├── drizzle/                  # Database migrations
├── public/                   # Static assets
└── uploads/                  # File uploads directory
```

### Key Configuration Files

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

// drizzle.config.ts
export default {
  schema: "./src/lib/db/schema",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

## 🛠️ Tech Stack

### Core Dependencies

```json
{
  "dependencies": {
    "@ai-sdk/google": "^2.0.11",
    "@ai-sdk/react": "^2.0.28", 
    "@ai-sdk/rsc": "^1.0.28",
    "@supabase/supabase-js": "^2.56.0",
    "ai": "^5.0.28",
    "next": "15.5.2",
    "next-auth": "^4.24.11",
    "drizzle-orm": "^0.44.5",
    "pgvector": "^0.2.1",
    "react": "19.1.0",
    "react-dom": "19.1.0"
  }
}
```

### AI & Machine Learning
- **Vercel AI SDK** (`ai`): Core AI functionality and streaming
- **Google AI SDK** (`@ai-sdk/google`): Gemini model integration
- **pgvector**: PostgreSQL vector extension for embeddings
- **@xenova/transformers**: Client-side ML models

### Database & Backend
- **Drizzle ORM**: Type-safe database operations
- **PostgreSQL**: Primary database with vector support
- **Supabase**: Database hosting and authentication
- **NextAuth.js**: Authentication framework

### UI & Frontend
- **Next.js 15**: React framework with App Router
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Icon library
- **React Markdown**: Markdown rendering

## 🔐 Authentication Implementation

### NextAuth Configuration

```typescript
// src/app/api/auth/[...nextauth]/route.ts
const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email))
          .limit(1);

        if (!user.length || !user[0].emailVerified) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password, 
          user[0].password
        );
        
        return isPasswordValid ? {
          id: user[0].id,
          email: user[0].email,
          name: user[0].name,
        } : null;
      }
    })
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/sign-in",
    signOut: "/sign-out"
  }
});
```

### Route Protection

```typescript
// src/lib/auth/config.ts
export const AUTH_CONFIG = {
  PROTECTED_ROUTES: [
    '/dashboard', '/chat', '/quiz', '/library', '/upload'
  ],
  AUTH_ROUTES: [
    '/sign-in', '/sign-up', '/verify-otp'
  ],
  PUBLIC_ROUTES: [
    '/', '/hero', '/sign-out'
  ]
};

// middleware.ts
export default withAuth(
  function middleware(req) {
    const isAuth = !!req.nextauth.token;
    const pathname = req.nextUrl.pathname;
    
    if (isProtectedPage && !isAuth) {
      return NextResponse.redirect(
        new URL(`/sign-in?from=${encodeURIComponent(pathname)}`, req.url)
      );
    }
  }
);
```

### Session Management

```typescript
// Components use useSession hook for authentication state
import { useSession } from "next-auth/react";

function ProtectedComponent() {
  const { data: session, status } = useSession();
  
  if (status === "loading") return <Loading />;
  if (status === "unauthenticated") return <SignIn />;
  
  return <Dashboard user={session.user} />;
}
```

## 🗄️ Database Schema

### User Management

```typescript
// src/lib/db/schema/users.ts
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  emailVerified: boolean('email_verified').default(false),
  verificationToken: text('verification_token'),
  verificationTokenExpiry: timestamp('verification_token_expiry'),
  createdAt: timestamp('created_at').defaultNow(),
});
```

### Course Structure

```typescript
// src/lib/db/schema/courses.ts
export const courses = pgTable('courses', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  imageUrl: text('image_url'),
  userId: uuid('user_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const topics = pgTable('topics', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'cascade' }),
  order: integer('order').notNull(),
});

export const lessons = pgTable('lessons', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  type: text('type', { enum: ['pdf', 'pptx', 'docx'] }).notNull(),
  fileUrl: text('file_url'),
  topicId: uuid('topic_id').references(() => topics.id, { onDelete: 'cascade' }),
  order: integer('order').notNull(),
});
```

### Vector Storage for RAG

```typescript
// Document chunks with pgvector embeddings
export const documentChunks = pgTable('document_chunks', {
  id: uuid('id').primaryKey().defaultRandom(),
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'cascade' }),
  fileId: uuid('file_id').references(() => files.id, { onDelete: 'cascade' }),
  chunkText: text('chunk_text').notNull(),
  chunkIndex: integer('chunk_index').notNull(),
  tokenCount: integer('token_count'),
  embedding: vector('embedding', { dimensions: 768 }), // Gemini embeddings
  createdAt: timestamp('created_at').defaultNow(),
});
```

### Quiz System

```typescript
// src/lib/db/schema/quizzes.ts
export const quizzes = pgTable('quizzes', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id).notNull(),
  difficulty: text('difficulty', { enum: ['easy', 'medium', 'hard'] }),
  totalQuestions: integer('total_questions').notNull(),
  questions: jsonb('questions').notNull(), // Array of question objects
});

export const quizResults = pgTable('quiz_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  quizId: uuid('quiz_id').references(() => quizzes.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id).notNull(),
  score: integer('score').notNull(),
  answers: jsonb('answers').notNull(),
  completedAt: timestamp('completed_at').defaultNow(),
});
```

## 🤖 AI Integration with Vercel AI SDK

### Core AI Configuration

```typescript
// Using Google's Gemini models through Vercel AI SDK
import { google } from '@ai-sdk/google';
import { generateText, streamText, generateObject } from 'ai';

// Text generation for chat responses
const { textStream } = streamText({
  model: google("gemini-2.5-flash-lite"),
  system: systemPrompt,
  messages: conversationHistory,
});

// Structured output for quiz generation
const result = await generateObject({
  model: google('gemini-2.5-flash-lite'),
  prompt: quizGenerationPrompt,
  schema: QuizGenerationSchema,
  temperature: 0.7,
});
```

### Embedding Generation

```typescript
// src/lib/rag/embeddings.ts
export async function generateEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: google.textEmbedding('text-embedding-004'),
    value: text,
  });
  return embedding;
}

// Batch processing for multiple texts
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];
  const batchSize = 10;
  
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchPromises = batch.map(text => generateEmbedding(text));
    const batchEmbeddings = await Promise.all(batchPromises);
    embeddings.push(...batchEmbeddings);
  }
  
  return embeddings;
}
```

### RAG Pipeline Implementation

#### Text Chunking Strategy

```typescript
// src/lib/rag/text-chunking.ts
export function chunkText(
  text: string,
  maxTokens: number = 700,
  overlapTokens: number = 100
): TextChunk[] {
  const chunks: TextChunk[] = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  let currentChunk = '';
  let chunkIndex = 0;
  
  for (const sentence of sentences) {
    const potentialChunk = currentChunk + (currentChunk ? ' ' : '') + sentence;
    const tokenCount = estimateTokenCount(potentialChunk);
    
    if (tokenCount > maxTokens && currentChunk) {
      chunks.push({
        text: currentChunk.trim(),
        index: chunkIndex++,
        tokenCount: estimateTokenCount(currentChunk)
      });
      
      // Create overlap for context continuity
      const words = currentChunk.split(' ');
      const overlapWords = Math.floor(words.length * (overlapTokens / estimateTokenCount(currentChunk)));
      const overlap = words.slice(-overlapWords).join(' ');
      
      currentChunk = overlap + (overlap ? ' ' : '') + sentence;
    } else {
      currentChunk = potentialChunk;
    }
  }
  
  return chunks;
}
```

#### Vector Similarity Search

```typescript
// src/lib/rag/search.ts
export async function searchSimilarChunks(
  query: string,
  courseId: string,
  maxResults: number = 5,
  similarityThreshold: number = 0.7
) {
  // Generate embedding for the query
  const queryEmbedding = await generateEmbedding(query);
  
  // Search using pgvector cosine similarity
  const results = await db
    .select({
      chunkId: documentChunks.id,
      chunkText: documentChunks.chunkText,
      chunkIndex: documentChunks.chunkIndex,
      fileId: documentChunks.fileId,
      similarity: sql<number>`1 - (${documentChunks.embedding} <=> ${queryEmbedding})`
    })
    .from(documentChunks)
    .where(
      and(
        eq(documentChunks.courseId, courseId),
        sql`1 - (${documentChunks.embedding} <=> ${queryEmbedding}) > ${similarityThreshold}`
      )
    )
    .orderBy(sql`${documentChunks.embedding} <=> ${queryEmbedding}`)
    .limit(maxResults);

  return results;
}
```

### Chat Modes Implementation

#### Normal Mode - General AI Assistant

```typescript
// Basic chat without RAG
const systemPrompt = `You are "Wingman", a virtual teaching assistant for students at INAT. 
Provide clear explanations and guide students through complex concepts.`;

const { textStream } = streamText({
  model: google("gemini-2.5-flash-lite"),
  system: systemPrompt,
  messages: conversationHistory,
});
```

#### Deep Mode - RAG-Enhanced Responses

```typescript
// src/app/actions/chat/actions.ts
if (mode === 'deep' && userQuery) {
  const relevantChunks = await searchAllCourses(userQuery, 5, 0.7);
  
  if (relevantChunks.length > 0) {
    const context = formatContextForWingman(relevantChunks);
    systemPrompt += `
ADDITIONAL CONTEXT FROM COURSE MATERIALS:
${context}

Reference course materials using [Source X] citations when relevant.`;
  }
}
```

### Quiz Generation with Structured Output

```typescript
// src/app/api/quiz/generate/route.ts
const QuestionSchema = z.object({
  id: z.string(),
  type: z.enum(['multiple-choice', 'true-false']),
  question: z.string(),
  options: z.array(z.string()),
  correctAnswer: z.string(),
  explanation: z.string().optional(),
  points: z.number().default(1),
});

const QuizGenerationSchema = z.object({
  questions: z.array(QuestionSchema),
});

const result = await generateObject({
  model: google('gemini-2.5-flash-lite'),
  prompt: `Generate a ${difficulty} difficulty quiz with exactly 10 questions...`,
  schema: QuizGenerationSchema,
  temperature: 0.7,
});
```

## 🚀 Core Features

### Course Creation API

```typescript
// src/app/api/courses/route.ts
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const courseData = {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    userId: formData.get('userId') as string,
  };

  // Create course in database
  const [course] = await db.insert(courses).values(courseData).returning();
  
  // Process topics and lessons
  const topicsData = JSON.parse(formData.get('topics') as string);
  for (const [topicIndex, topic] of topicsData.entries()) {
    const [createdTopic] = await db.insert(topics).values({
      title: topic.title,
      courseId: course.id,
      order: topicIndex,
    }).returning();

    // Process lessons and file uploads
    for (const [lessonIndex, lesson] of topic.lessons.entries()) {
      const file = formData.get(`file-${topic.id}-${lesson.id}`) as File;
      if (file) {
        const fileUrl = await uploadFile(file);
        await db.insert(lessons).values({
          title: lesson.title,
          type: lesson.type,
          fileUrl,
          topicId: createdTopic.id,
          order: lessonIndex,
        });
      }
    }
  }

  return NextResponse.json({ success: true, course });
}
```

### Document Processing Pipeline

```typescript
// src/lib/rag/document-processor.ts
export async function processDocument(
  fileBuffer: Buffer,
  filename: string,
  courseId: string,
  fileId: string
) {
  // Extract text based on file type
  let extractedText: string;
  
  if (filename.endsWith('.pdf')) {
    extractedText = await extractTextFromPDF(fileBuffer);
  } else if (filename.endsWith('.docx')) {
    extractedText = await extractTextFromDOCX(fileBuffer);
  } else {
    throw new Error('Unsupported file type');
  }

  // Chunk the text
  const chunks = chunkText(extractedText, 700, 100);
  
  // Generate embeddings
  const embeddings = await generateEmbeddings(chunks.map(c => c.text));
  
  // Store in database
  const chunkInserts = chunks.map((chunk, index) => ({
    courseId,
    fileId,
    chunkText: chunk.text,
    chunkIndex: index,
    tokenCount: chunk.tokenCount,
    embedding: embeddings[index],
  }));

  await db.insert(documentChunks).values(chunkInserts);
  
  console.log(`✅ Processed ${chunks.length} chunks for file ${filename}`);
}
```

### Vector Database Operations

```typescript
// Insert embeddings
export async function insertDocumentChunks(chunks: DocumentChunk[]) {
  return db.insert(documentChunks).values(chunks).returning();
}

// Similarity search
export async function searchSimilarChunks(query: string, courseId: string) {
  const queryEmbedding = await generateEmbedding(query);
  
  return db
    .select()
    .from(documentChunks)
    .where(eq(documentChunks.courseId, courseId))
    .orderBy(sql`${documentChunks.embedding} <=> ${queryEmbedding}`)
    .limit(5);
}

// Update embeddings
export async function updateChunkEmbedding(chunkId: string, embedding: number[]) {
  return db
    .update(documentChunks)
    .set({ embedding })
    .where(eq(documentChunks.id, chunkId));
}
```

## 📡 API Routes

### Chat API with Streaming

```typescript
// src/app/api/chat/rag/route.ts
export async function POST(request: NextRequest) {
  const { message, courseId, maxSources = 5 } = await request.json();

  // Search for relevant content
  const relevantChunks = await searchSimilarChunks(message, courseId, maxSources);
  
  // Prepare context
  const context = relevantChunks
    .map((chunk, index) => `[Source ${index + 1}]\n${chunk.chunkText}`)
    .join('\n---\n');

  // Generate AI response
  const { text: aiResponse } = await generateText({
    model: google('gemini-2.5-flash-lite'),
    system: `Answer questions based on course materials. Context: ${context}`,
    prompt: message,
  });

  return NextResponse.json({
    success: true,
    response: aiResponse,
    sources: relevantChunks.map((chunk, index) => ({
      id: chunk.chunkId,
      index: index + 1,
      similarity: chunk.similarity,
      preview: chunk.chunkText.substring(0, 200) + '...'
    }))
  });
}
```

### File Upload API

```typescript
// src/app/api/upload/route.ts
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const courseId = formData.get('courseId') as string;

  // Validate file
  const validation = validateFile(file);
  if (!validation.isValid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  // Save file
  const filename = `${Date.now()}_${file.name}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join('./uploads', filename), buffer);

  // Process document for RAG
  await processDocument(buffer, filename, courseId, fileId);

  return NextResponse.json({ 
    success: true, 
    filename,
    message: 'File uploaded and processed successfully' 
  });
}
```

### Quiz Generation API

```typescript
// src/app/api/quiz/generate/route.ts
export async function POST(request: NextRequest) {
  const { courseId, userId, difficulty } = await request.json();

  const course = await db.select().from(courses).where(eq(courses.id, courseId));
  
  const prompt = `Generate a ${difficulty} quiz for: ${course[0].title}`;
  
  const result = await generateObject({
    model: google('gemini-2.5-flash-lite'),
    prompt,
    schema: QuizGenerationSchema,
  });

  const [newQuiz] = await db.insert(quizzes).values({
    title: `${course[0].title} - ${difficulty} Quiz`,
    courseId,
    userId,
    difficulty,
    totalQuestions: 10,
    questions: result.object.questions,
  }).returning();

  return NextResponse.json({ success: true, quiz: newQuiz });
}
```

## 🎨 UI Components

### Main Layout with Navbar

```tsx
// src/components/layout.tsx
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
```

### Chat Interface with Streaming

```tsx
// src/app/chat/page.tsx
function ChatContent() {
  const [conversation, setConversation] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    setConversation(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { messages, newMessage } = await continueConversation(
        [...conversation, userMessage]
      );

      // Stream the response
      let textContent = "";
      for await (const delta of readStreamableValue(newMessage)) {
        textContent += delta;
        setConversation([
          ...messages,
          { role: "assistant", content: textContent },
        ]);
      }
    } catch (error) {
      console.error("Error in conversation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {conversation.map((message, index) => (
          <ChatMessage key={index} message={message} />
        ))}
        {isLoading && <LoadingIndicator />}
      </div>
      
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1 px-4 py-2 border rounded-lg"
          />
          <button 
            type="submit" 
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
```

### Course Management Interface

```tsx
// src/components/CourseCreator.tsx
export default function CourseCreator({ userId, onSuccess }: CourseCreatorProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
  });
  const [topics, setTopics] = useState<Topic[]>([]);

  const handleSubmit = async () => {
    const courseFormData = new FormData();
    courseFormData.append('title', formData.title);
    courseFormData.append('description', formData.description);
    courseFormData.append('userId', userId);
    courseFormData.append('topics', JSON.stringify(topics));

    // Add files to FormData
    topics.forEach(topic => {
      topic.lessons.forEach(lesson => {
        if (lesson.file) {
          courseFormData.append(`file-${topic.id}-${lesson.id}`, lesson.file);
        }
      });
    });

    const response = await fetch('/api/courses', {
      method: 'POST',
      body: courseFormData,
    });

    if (response.ok) {
      const result = await response.json();
      onSuccess(result.course);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Course Title</label>
          <input
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="w-full px-3 py-2 border rounded-md"
            rows={3}
          />
        </div>

        <TopicManager topics={topics} setTopics={setTopics} />
        
        <button 
          onClick={handleSubmit}
          className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Create Course
        </button>
      </div>
    </div>
  );
}
```

### Quiz Display Component

```tsx
// src/components/QuizTaker.tsx
export default function QuizTaker({ quiz }: { quiz: Quiz }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const calculateScore = () => {
    let correct = 0;
    quiz.questions.forEach(question => {
      if (answers[question.id] === question.correctAnswer) {
        correct++;
      }
    });
    return (correct / quiz.questions.length) * 100;
  };

  if (showResults) {
    return <QuizResults score={calculateScore()} answers={answers} />;
  }

  const question = quiz.questions[currentQuestion];

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-gray-500">
            Question {currentQuestion + 1} of {quiz.questions.length}
          </span>
          <div className="w-full bg-gray-200 rounded-full h-2 mx-4">
            <div 
              className="bg-blue-600 h-2 rounded-full" 
              style={{ width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` }}
            />
          </div>
        </div>
        
        <h3 className="text-xl font-semibold mb-4">{question.question}</h3>
        
        <div className="space-y-3">
          {question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(question.id, option)}
              className={`w-full text-left p-4 border rounded-lg hover:bg-gray-50 ${
                answers[question.id] === option ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
          disabled={currentQuestion === 0}
          className="px-4 py-2 border rounded-md disabled:opacity-50"
        >
          Previous
        </button>
        
        {currentQuestion === quiz.questions.length - 1 ? (
          <button
            onClick={() => setShowResults(true)}
            className="px-6 py-2 bg-green-600 text-white rounded-md"
          >
            Finish Quiz
          </button>
        ) : (
          <button
            onClick={() => setCurrentQuestion(prev => prev + 1)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}
```

## 🌊 Streaming & Real-time Features

### Server Actions with Streaming

```typescript
// src/app/actions/chat/actions.ts
export async function continueConversation(history: Message[]) {
  "use server";
  
  const stream = createStreamableValue();

  (async () => {
    const { textStream } = streamText({
      model: google("gemini-2.5-flash-lite"),
      messages: history,
    });

    let fullContent = "";
    for await (const text of textStream) {
      fullContent += text;
      stream.update(text);
    }

    stream.done();
  })();

  return {
    messages: history,
    newMessage: stream.value,
  };
}
```

### Client-side Streaming with readStreamableValue

```typescript
// Reading streamed responses in components
import { readStreamableValue } from "@ai-sdk/rsc";

const { newMessage } = await continueConversation(conversation);

let textContent = "";
for await (const delta of readStreamableValue(newMessage)) {
  textContent += delta;
  setConversation(prev => [
    ...prev.slice(0, -1),
    { role: "assistant", content: textContent }
  ]);
}
```

### Real-time UI Updates

```tsx
// Loading states during streaming
{isLoading && (
  <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg">
    <div className="flex space-x-1">
      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
    </div>
    <span className="text-sm text-gray-600">AI is thinking...</span>
  </div>
)}

// Auto-scroll during streaming
useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
}, [conversation]);
```

## 🔒 Performance & Security

### Environment Variables

```bash
# .env.local
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/wingman"

# Authentication
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"

# AI Services
GOOGLE_GENERATIVE_AI_API_KEY="your-gemini-api-key"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

### Security Headers

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
    ];
  },
};
```

### Data Validation

```typescript
// Using Zod for API validation
import { z } from 'zod';

const CreateCourseSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  userId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const validatedData = CreateCourseSchema.parse(body);
  // Process validated data...
}
```

### Error Boundaries

```tsx
// src/components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center">
          <h2 className="text-xl font-semibold text-red-600">Something went wrong</h2>
          <p className="mt-2 text-gray-600">Please refresh the page and try again.</p>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## 🚀 Deployment Configuration

### Vercel Deployment

```json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  "env": {
    "DATABASE_URL": "@database_url",
    "NEXTAUTH_SECRET": "@nextauth_secret",
    "GOOGLE_GENERATIVE_AI_API_KEY": "@google_ai_key"
  },
  "build": {
    "env": {
      "NODE_ENV": "production"
    }
  }
}
```

### Build Configuration

```json
// package.json scripts
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "db:push": "drizzle-kit push:pg",
    "db:studio": "drizzle-kit studio"
  }
}
```

### Database Migrations

```bash
# Generate migration
npx drizzle-kit generate:pg

# Push to database
npx drizzle-kit push:pg

# Open database studio
npx drizzle-kit studio
```

## 🌍 Environment Setup

### Prerequisites

- Node.js 18+ 
- PostgreSQL with pgvector extension
- Google AI API key
- Supabase account (optional)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/wingman.git
cd wingman

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Set up database
npm run db:push

# Start development server
npm run dev
```

### Database Setup

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Run Drizzle migrations
-- This will create all tables automatically
```

## 🚀 Getting Started

### Development Workflow

1. **Start the development server**
   ```bash
   npm run dev
   ```

2. **Access the application**
   - Open [http://localhost:3000](http://localhost:3000)
   - Sign up for a new account
   - Create your first course
   - Upload documents for RAG processing
   - Test the chat interface

3. **Database management**
   ```bash
   # View database in browser
   npm run db:studio
   
   # Push schema changes
   npm run db:push
   ```

### Key Features to Test

1. **Authentication Flow**
   - Sign up with email verification
   - Sign in and session management
   - Protected route access

2. **Course Creation**
   - Create course with topics and lessons
   - Upload PDF/DOCX files
   - Document processing and chunking

3. **AI Chat Interface**
   - Normal mode: General AI assistance
   - Deep mode: RAG-enhanced responses with course context
   - Streaming responses in real-time

4. **Quiz Generation**
   - Auto-generate quizzes from course content
   - Multiple difficulty levels
   - Structured question formats

5. **Document Search**
   - Semantic search across course materials
   - Vector similarity matching
   - Source attribution in responses

### Performance Monitoring

```typescript
// Monitor streaming performance
console.time('AI Response');
for await (const delta of readStreamableValue(newMessage)) {
  // Process delta
}
console.timeEnd('AI Response');

// Monitor RAG search performance  
console.time('Vector Search');
const results = await searchSimilarChunks(query, courseId);
console.timeEnd('Vector Search');
```

---

## 📞 Support

For technical support or questions about the codebase, please:

1. Check the [Issues](https://github.com/your-username/wingman/issues) page
2. Review the code documentation
3. Contact the development team

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ for the Indian Naval Institute of Aeronautical Technology (INAT)**

> AI-powered learning assistant for the Indian Naval Institute of Aeronautical Technology (INAT)

[![Next.js](https://img.shields.io/badge/Next.js-15.5.2-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000)](https://vercel.com/)

## Overview

Wingman AI is a sophisticated educational platform designed specifically for INAT students studying aeronautical engineering and naval technology. It combines the power of Google's Gemini AI with advanced RAG (Retrieval-Augmented Generation) capabilities to provide intelligent, context-aware assistance for learning and course management.

### Key Features

- 🤖 **AI-Powered Chat Assistant** - Context-aware responses using course materials
- 📚 **Intelligent Course Management** - Hierarchical course organization with AI summaries
- 📄 **Multi-Format Document Support** - PDF, DOCX, and PPTX processing
- 🧠 **RAG-Enhanced Learning** - Vector search through course materials
- 📝 **AI-Generated Quizzes** - Adaptive difficulty based on course content
- 🔐 **Secure Authentication** - Email verification with OTP
- 📱 **Responsive Design** - Works seamlessly across all devices

## Tech Stack

### Frontend
- **Framework:** Next.js 15.5.2 with App Router
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4 with custom design system
- **UI Components:** Custom component library
- **State Management:** React hooks and server state

### Backend
- **API:** Next.js API Routes
- **Database:** PostgreSQL with Drizzle ORM
- **Vector Database:** pgvector extension
- **Authentication:** NextAuth.js with credentials provider
- **File Storage:** Supabase Storage

### AI & Machine Learning
- **AI Model:** Google Gemini 2.5 Flash Lite
- **Embeddings:** Google text-embedding-004 (768 dimensions)
- **Framework:** Vercel AI SDK
- **RAG Pipeline:** Custom implementation with vector similarity search

### Infrastructure
- **Deployment:** Vercel
- **Database Hosting:** Supabase
- **Email Service:** Nodemailer with Gmail SMTP
- **File Processing:** Custom pipeline for PDF/DOCX/PPTX

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database with pgvector extension
- Supabase account for storage
- Google AI API key
- Gmail account for email service

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/eulerbutcooler/wingman.git
   cd wingman
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Configure the following variables in `.env`:
   ```env
   # Database
   DATABASE_URL=postgresql://username:password@localhost:5432/wingman
   
   # Supabase
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   SUPABASE_ANON_KEY=your_anon_key
   
   # Authentication
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_nextauth_secret
   
   # Email
   EMAIL_FROM=your_email@gmail.com
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   
   # AI Services
   GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key
   YOUTUBE_API_KEY=your_youtube_api_key
   ```

4. **Set up the database**
   ```bash
   # Run database migrations
   npm run db:migrate
   
   # Optional: Seed with sample data
   npm run db:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
wingman/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Authentication pages
│   │   ├── api/               # API routes
│   │   ├── chat/              # Chat interface
│   │   ├── dashboard/         # User dashboard
│   │   ├── library/           # Course library
│   │   ├── quiz/              # Quiz system
│   │   └── actions/           # Server actions
│   ├── components/            # React components
│   │   ├── auth/              # Auth components
│   │   ├── chat/              # Chat components
│   │   ├── ui/                # UI primitives
│   │   └── *.tsx              # Feature components
│   ├── lib/                   # Utility libraries
│   │   ├── ai/                # AI configurations
│   │   ├── auth/              # Auth utilities
│   │   ├── db/                # Database schema
│   │   ├── rag/               # RAG pipeline
│   │   └── services/          # Business logic
│   └── types/                 # TypeScript types
├── drizzle/                   # Database migrations
├── public/                    # Static assets
└── config files              # Configuration files
```

## Key Features

### 🤖 AI-Powered Chat

The chat system uses Google's Gemini AI with RAG capabilities to provide intelligent responses based on your course materials.

**Features:**
- Context-aware responses using uploaded course materials
- Multiple chat modes (Normal, Deep, Video)
- Real-time streaming responses
- Chat history and management
- Citation of sources in responses

### 📚 Course Management

Create and organize courses with a hierarchical structure:

**Course → Topics → Lessons → Files**

- Upload PDF, DOCX, and PPTX files
- Automatic text extraction and processing
- AI-generated course summaries
- Vector search through course content

### 📝 Intelligent Quizzes

Generate quizzes automatically from your course materials:

- Three difficulty levels (Easy, Medium, Hard)
- Multiple choice and true/false questions
- INAT-specific context for aeronautical engineering
- Progress tracking and result analysis

### 🔍 RAG Pipeline

Advanced document processing and search:

1. **Document Upload** - Support for multiple file formats
2. **Text Extraction** - Smart content extraction
3. **Chunking** - Intelligent text segmentation
4. **Embedding Generation** - Vector representations using Gemini
5. **Vector Search** - Similarity-based content retrieval

## API Reference

### Authentication Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/verify-otp` - Email verification
- `POST /api/auth/[...nextauth]` - NextAuth endpoints

### Course Management

- `GET /api/courses` - List user courses
- `POST /api/courses` - Create new course
- `GET /api/courses/[id]` - Get course details
- `DELETE /api/courses/[id]` - Delete course

### File Operations

- `POST /api/upload-supabase` - Upload files to Supabase
- `POST /api/process-document` - Process uploaded documents
- `GET /api/process-documents` - Check processing status

### AI Features

- `POST /api/chat/rag` - RAG-powered chat
- `POST /api/quiz/generate` - Generate quizzes
- `GET /api/quiz/[courseId]` - Get course quizzes

## Database Schema

### Core Tables

```sql
-- Users with email verification
users (id, name, email, password, email_verified, verification_token)

-- Course hierarchy
courses (id, title, description, user_id, image_url)
topics (id, title, course_id, order)
lessons (id, title, type, file_url, topic_id, order)
files (id, original_name, filename, url, lesson_id, processing_status)

-- RAG with vector search
document_chunks (id, course_id, file_id, chunk_text, embedding, chunk_index)

-- Quiz system
quizzes (id, title, course_id, difficulty, questions)
quiz_results (id, quiz_id, user_id, score, answers, completed_at)
```

## Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npm run db:generate  # Generate database migrations
npm run db:migrate   # Run database migrations
npm run db:studio    # Open Drizzle Studio
npm run db:seed      # Seed database with sample data

# Deployment
npm run deploy       # Deploy to Vercel
```

### Database Migrations

```bash
# Generate migration after schema changes
npm run db:generate

# Apply migrations
npm run db:migrate
```

### Environment Setup

1. **Development**: Local Next.js with remote database
2. **Staging**: Branch deployments on Vercel
3. **Production**: Main branch auto-deployment to Vercel

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Write meaningful commit messages
- Test your changes thoroughly
- Update documentation as needed

## Deployment

### Vercel Deployment

1. **Connect your repository** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Deploy** - Automatic deployments on push to main

### Database Setup

1. **Create Supabase project**
2. **Enable pgvector extension**
3. **Run migrations** using Drizzle
4. **Configure connection string**

### Required Environment Variables

See the [Installation](#installation) section for the complete list of required environment variables.

## Security

- 🔐 **Authentication**: Email verification with OTP
- 🛡️ **Data Protection**: bcrypt password hashing
- 🚫 **Input Validation**: Comprehensive validation on all endpoints
- 📁 **File Security**: MIME type validation and size limits
- 🔒 **API Security**: Route protection and error handling

## Performance

- ⚡ **Fast Loading**: Optimized Next.js build
- 🎯 **Smart Caching**: Efficient data fetching
- 📊 **Vector Search**: Optimized similarity search with pgvector
- 🖼️ **Asset Optimization**: Compressed images and efficient loading

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:

- 📧 Email: support@wingman-ai.com
- 💬 Discussions: GitHub Discussions
- 🐛 Issues: GitHub Issues
- 📖 Documentation: [docs.wingman-ai.com](https://docs.wingman-ai.com)

## Acknowledgments

- **INAT (Indian Naval Institute of Aeronautical Technology)** for the educational context
- **Google AI** for the Gemini API and embedding models
- **Vercel** for the deployment platform
- **Supabase** for database and storage services
- **Open Source Community** for the amazing libraries and tools

---

Built with ❤️ for INAT students by the Wingman AI team
