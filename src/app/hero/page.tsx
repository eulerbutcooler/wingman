"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { TypeAnimation } from "react-type-animation";
import { motion, AnimatePresence } from "framer-motion";
import { SiGmail } from "react-icons/si";
import { 
  Database, 
  Cpu, 
  MessageSquare, 
  FileText, 
  ArrowRight, 
  Layers, 
  Binary,
  Search,
  Code,
  Server
} from 'lucide-react';
import { MultiStepLoader } from "@/components/ui/multi-step-loader";
type FAQ = { id: number; q: string; a: string };

type Stage = 'idle' | 'query' | 'embedding' | 'retrieval' | 'augmentation' | 'generation' | 'complete';

interface StepProps {
  isActive: boolean;
  isCompleted: boolean;
  icon: React.ElementType;
  title: string;
}

// Demo Chat Component
function DemoChat() {
  return (
    <div className="relative w-full max-w-md mx-auto bg-white border border-slate-200/60 rounded-2xl shadow-2xl shadow-slate-200/50 overflow-hidden backdrop-blur-sm flex flex-col h-[500px]">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50/50 border-b border-slate-100">
        <div className="flex gap-2 items-center">
          <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">AI Active</span>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">AeroMentor</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-white to-slate-50/30">
        <div className="flex gap-3 items-start">
          <div className="w-8 h-8 rounded-lg bg-blue-600 shadow-blue-500/30 flex items-center justify-center flex-shrink-0 shadow-sm">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div className="max-w-[80%] rounded-2xl rounded-tl-none p-3 text-sm font-medium shadow-sm bg-white border border-slate-100 text-slate-700">
            Hello! I&apos;m AeroMentor. Ask me anything about your studies, and I&apos;ll provide detailed explanations with sources.
          </div>
        </div>
        
        <div className="flex gap-3 items-start flex-row-reverse">
          <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-xs font-bold text-slate-600">U</span>
          </div>
          <div className="max-w-[80%] rounded-2xl rounded-tr-none p-3 text-sm font-medium shadow-sm bg-blue-600 text-white">
            What are Newton&apos;s laws of motion?
          </div>
        </div>

        <div className="flex gap-3 items-start">
          <div className="w-8 h-8 rounded-lg bg-blue-600 shadow-blue-500/30 flex items-center justify-center flex-shrink-0 shadow-sm">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div className="max-w-[80%] rounded-2xl rounded-tl-none p-3 text-sm font-medium shadow-sm bg-white border border-slate-100 text-slate-700">
            <strong>Newton&apos;s Three Laws:</strong><br/>
            1. <strong>Inertia:</strong> An object at rest stays at rest<br/>
            2. <strong>F=ma:</strong> Force equals mass times acceleration<br/>
            3. <strong>Action-Reaction:</strong> For every action, there&apos;s an equal and opposite reaction<br/>
            <span className="text-xs text-slate-500 mt-2 block">Source: Physics Fundamentals, Chapter 4</span>
          </div>
        </div>
      </div>

      <div className="p-4 bg-white border-t border-slate-100">
        <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-2 py-2 border border-slate-200">
          <input 
            className="flex-1 bg-transparent border-none outline-none text-slate-700 text-sm px-2"
            placeholder="Ask about any topic..."
            disabled
          />
          <button className="p-2 bg-blue-600 text-white rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

const StepIndicator: React.FC<StepProps> = ({ isActive, isCompleted, icon: Icon, title }) => (
  <div className={`flex flex-col items-center text-center transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-40'}`}>
    <div className={`
      w-12 h-12 rounded-lg flex items-center justify-center mb-2 border
      ${isActive ? 'bg-blue-600 text-white border-blue-600' : isCompleted ? 'bg-slate-600 text-white border-slate-600' : 'bg-white text-gray-300 border-gray-200'}
    `}>
      <Icon size={20} strokeWidth={2} />
    </div>
    <h3 className={`font-bold text-xs ${isActive ? 'text-blue-900' : 'text-gray-400'}`}>{title}</h3>
  </div>
);

const ConnectionLine: React.FC<{ active: boolean }> = ({ active }) => (
  <div className="hidden md:flex flex-1 h-[1px] bg-gray-200 mx-2 relative overflow-hidden">
    {active && (
      <div className="absolute inset-0 bg-blue-600 animate-progress-slide" />
    )}
  </div>
);

function RAGVisualizer() {
  const [stage, setStage] = React.useState<Stage>('idle');
  const query = "How do planes work?";

  React.useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];

    const runLoop = () => {
      setStage('query');
      
      timeouts.push(setTimeout(() => setStage('embedding'), 2000));
      timeouts.push(setTimeout(() => setStage('retrieval'), 4000));
      timeouts.push(setTimeout(() => setStage('augmentation'), 6500));
      timeouts.push(setTimeout(() => setStage('generation'), 8500));
      timeouts.push(setTimeout(() => setStage('complete'), 10500));
      
      // Restart loop
      timeouts.push(setTimeout(() => {
        setStage('idle');
        timeouts.push(setTimeout(runLoop, 1000));
      }, 13000));
    };

    // Start immediately
    runLoop();

    return () => timeouts.forEach(clearTimeout);
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto font-sans p-4 bg-transparent">
      
      {/* Progress Bar / Steps */}
      {/* <div className="flex justify-between items-center mb-12 px-4">
        <StepIndicator 
          isActive={stage === 'query'} 
          isCompleted={['embedding', 'retrieval', 'augmentation', 'generation', 'complete'].includes(stage)}
          icon={MessageSquare} 
          title="Query" 
        />
        <ConnectionLine active={stage === 'query'} />
        
        <StepIndicator 
          isActive={stage === 'embedding'} 
          isCompleted={['retrieval', 'augmentation', 'generation', 'complete'].includes(stage)}
          icon={Binary} 
          title="Embed" 
        />
        <ConnectionLine active={stage === 'embedding'} />
        
        <StepIndicator 
          isActive={stage === 'retrieval'} 
          isCompleted={['augmentation', 'generation', 'complete'].includes(stage)}
          icon={Database} 
          title="Retrieve" 
        />
        <ConnectionLine active={stage === 'retrieval'} />
        
        <StepIndicator 
          isActive={stage === 'augmentation'} 
          isCompleted={['generation', 'complete'].includes(stage)}
          icon={Layers} 
          title="Augment" 
        />
        <ConnectionLine active={stage === 'augmentation'} />
        
        <StepIndicator 
          isActive={stage === 'generation' || stage === 'complete'} 
          isCompleted={stage === 'complete'}
          icon={Cpu} 
          title="Generate" 
        />
      </div> */}

      {/* Visual Stage Area */}
      
    </div>
  );
}

const faqs: FAQ[] = [
  {
    id: 1,
    q: "How does chat with PDFs work?",
    a: "Upload a PDF and start a natural conversation; answers include citations and page links.",
  },
  {
    id: 2,
    q: "Can quizzes use my data?",
    a: "Yes. Quizzes are generated from uploaded files, notes, and bookmarks with adaptive difficulty.",
  },
  {
    id: 3,
    q: "What’s the Library feature?",
    a: "Create courses and study plans from saved content, with milestones and tracking.",
  },
  {
    id: 4,
    q: "How does privacy work with uploaded documents?",
    a: "Files are processed to extract text and generate answers/quizzes, then cleared from temporary processing; data isn’t used to train public models and access controls restrict who can view content.",
  },
];

function FAQItem({ q, a, isOpen, onToggle }: { q: string; a: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <motion.div
      layout
      className="w-full bg-white border border-slate-200 rounded-2xl transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md"
      initial={false}
    >
      <button
        className="flex w-full items-center cursor-pointer justify-between text-left p-6"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={`panel-${q}`}
      >
        <span className="font-semibold cursor-pointer text-slate-900 text-base md:text-lg">
          {q}
        </span>
        <motion.svg
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.2 }}
          className="w-6 h-6 text-slate-900 flex-shrink-0 ml-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </motion.svg>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={`panel-${q}`}
            key="content"
            initial="collapsed"
            animate="open"
            exit="collapsed"
            variants={{
              open: { opacity: 1, height: "auto" },
              collapsed: { opacity: 0, height: 0 },
            }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 text-sm leading-relaxed text-slate-600">
              {a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Hero() {
  const [openFaqId, setOpenFaqId] = React.useState<number | null>(null);

  // Override body background for hero page
  React.useEffect(() => {
    // Clear body background so sketch image doesn't show through
    const originalBackgroundImage = document.body.style.backgroundImage;
    const originalBackgroundColor = document.body.style.backgroundColor;
    const originalBackgroundSize = document.body.style.backgroundSize;
    const originalBackgroundPosition = document.body.style.backgroundPosition;
    const originalBackgroundAttachment =
      document.body.style.backgroundAttachment;
    const originalBackgroundRepeat = document.body.style.backgroundRepeat;

    document.body.style.backgroundImage = "none";
    document.body.style.backgroundColor = "transparent";

    // Cleanup: restore original background when component unmounts
    return () => {
      document.body.style.backgroundImage = originalBackgroundImage || "";
      document.body.style.backgroundColor =
        originalBackgroundColor || "#f5f5f5";
      document.body.style.backgroundSize = originalBackgroundSize || "cover";
      document.body.style.backgroundPosition =
        originalBackgroundPosition || "center";
      document.body.style.backgroundAttachment =
        originalBackgroundAttachment || "fixed";
      document.body.style.backgroundRepeat =
        originalBackgroundRepeat || "no-repeat";
    };
  }, []);

  return (
    <div className="min-h-screen w-full relative overflow-hidden scrollbar-hide bg-slate-50">
      {/* Background Elements - Light Mode */}
      <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-200/40 rounded-full blur-[120px] mix-blend-multiply pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-orange-200/40 rounded-full blur-[100px] mix-blend-multiply pointer-events-none" />
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-40 mix-blend-soft-light"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      {/* Gradient fade overlay - fades grid on both left and right sides */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-50 via-transparent via-50% to-slate-50"></div>

      {/* Content container with higher z-index and isolation */}
      <div
        className="relative z-10 flex flex-col pt-32 md:pt-40 gap-8 items-center px-4 md:px-6"
        style={{ isolation: "isolate" }}
      >
        {/* Hero Section */}
        <div className="w-full max-w-7xl mx-auto pb-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-blue-100 shadow-sm text-blue-700 text-sm font-bold tracking-wide">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                AI-POWERED LEARNING PLATFORM
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-bold text-slate-900 leading-[1.1] tracking-tight min-h-[8rem] lg:min-h-[10rem]">
                Your personal AI{" "}
                <span className="inline-block min-w-[280px] lg:min-w-[420px]">
                  <TypeAnimation
                    sequence={[
                      "tutor",
                      1000,
                      "study buddy",
                      1000,
                      "coach",
                      1000,
                      "guide",
                      1000,
                    ]}
                    wrapper="span"
                    cursor={true}
                    repeat={Infinity}
                    className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-blue-600 to-slate-200"
                  />
                </span>
              </h1>
              
              <p className="text-lg text-slate-600 max-w-xl leading-relaxed">
                AeroMentor is an AI-powered learning assistant that helps you
                learn and study more effectively with intelligent tutoring, personalized quizzes, and comprehensive study materials.
              </p>
              
              <div className="pt-8 flex items-center gap-8 text-slate-700 text-base font-bold flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div> 
                  Secure & Private
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div> 
                  Comprehensive Resources
                </div>
              </div>
            </div>

            {/* Interactive Demo Mockup */}
            <div className="relative perspective-1000 hidden lg:block">
              <div className="absolute inset-0 bg-blue-600/5 rounded-[2rem] transform rotate-3 scale-105 -z-10"></div>
              <DemoChat />
            </div>
          </div>
        </div>

      </div>

      {/* Trusted By Logo Strip - Outside main container for full width */}
      <div className="w-full bg-slate-50 border-y border-slate-200 py-10 relative overflow-hidden">
        <Image
          src="/img.jpg"
          alt="Background"
          fill
          className="object-cover opacity-40"
          priority
        />
        <div className="max-w-7xl mx-auto px-6 mb-8 relative z-10">
          <p className="text-center text-slate-800 text-sm font-bold mb-8 uppercase tracking-widest">Trusted by students at</p>
          <div className="flex flex-wrap justify-center items-center gap-16 transition-all duration-500">
            <Image
              src="/crest.png"
              alt="NIAT Crest"
              width={80}
              height={80}
              className="object-contain"
            />
            <span className="text-xl font-bold text-slate-800">Naval Institute of Aeronautical Technology</span>
            <Image
              src="/niat.png"
              alt="NIAT Logo"
              width={90}
              height={90}
              className="object-contain"
            />
          </div>
        </div>
      </div>

      {/* Feature Cards Section - Reopen content container */}
      <div className="relative z-10 flex flex-col items-center px-4 md:px-6" style={{ isolation: "isolate" }}>
        {/* Gradient fade overlay - fades grid only on left side */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-50 via-transparent via-30% to-transparent pointer-events-none"></div>
        <div className="w-full max-w-7xl mx-auto py-24 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Built for Modern Learning</h2>
            <p className="text-slate-500 text-lg">Everything you need to accelerate your learning journey with AI-powered tools and personalized study experiences.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Link href="/chat" className="flex-1">
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(37,99,235,0.1)] transition-all group hover:-translate-y-1 duration-300 h-full cursor-pointer">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-6  transition-colors duration-300 border border-slate-100">
                  <span className="text-3xl group-hover:scale-110 transition-transform">💬</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">Chat Bot</h3>
                <p className="text-slate-500 leading-relaxed">
                  Ask questions in natural language and get instant, cited answers from your study materials. Get summaries, explanations, and intelligent follow-ups tailored to your learning pace.
                </p>
              </div>
            </Link>

            <Link href="/library" className="flex-1">
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(37,99,235,0.1)] transition-all group hover:-translate-y-1 duration-300 h-full cursor-pointer">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-6  transition-colors duration-300 border border-slate-100">
                  <span className="text-3xl group-hover:scale-110 transition-transform">📚</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">Library</h3>
                <p className="text-slate-500 leading-relaxed">
                  Access a comprehensive collection of shared study materials, resources, and learning content. Browse, explore, and dive deep into topics curated by your community.
                </p>
              </div>
            </Link>

            <Link href="/quiz" className="flex-1">
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(37,99,235,0.1)] transition-all group hover:-translate-y-1 duration-300 h-full cursor-pointer">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-6  transition-colors duration-300 border border-slate-100">
                  <span className="text-3xl group-hover:scale-110 transition-transform">🧠</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">Quiz</h3>
                <p className="text-slate-500 leading-relaxed">
                  Challenge yourself with AI-generated quizzes tailored to your learning materials. Track your progress, identify weak areas, and reinforce your understanding through adaptive testing.
                </p>
              </div>
            </Link>
          </div>
        </div>

      </div>

      {/* RAG Explanation Section - Outside main container for full width */}
      <div className="w-full py-24 bg-slate-50 border-y border-slate-200 relative overflow-hidden">
        <Image
          src="/gemini.png"
          alt="Background"
          fill
          className="object-cover opacity-40"
          priority
        />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-12">
            
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">RAG Powered Deep Learning</h2>
            {/* <p className="text-slate-600 text-lg max-w-3xl mx-auto">
              Standard AI guesses when it doesn&apos;t know. AeroMentor retrieves factual content from your materials first, then summarizes them with sources.
            </p> */}
          </div>
          <div className="relative w-full h-[600px] md:h-[400px] overflow-hidden">
            <div className="relative w-full h-full">
              <MultiStepLoader
                loadingStates={[
                  { text: "User asks: How do planes work?" },
                  { text: "Converting query to vector embeddings..." },
                  { text: "Searching knowledge base for relevant content..." },
                  { text: "Found 5 relevant documents about aerodynamics" },
                  { text: "Augmenting prompt with retrieved context..." },
                  { text: "Generating comprehensive answer with sources..." },
                  { text: "✓ Answer ready with citations!" },
                  { text: "User asks: How do planes work?" },
                  { text: "Converting query to vector embeddings..." },
                  { text: "Searching knowledge base for relevant content..." },
                  { text: "Found 5 relevant documents about aerodynamics" },
                  { text: "Augmenting prompt with retrieved context..." },
                  { text: "Generating comprehensive answer with sources..." },
                  { text: "✓ Answer ready with citations!" },
                  { text: "User asks: How do planes work?" },
                  { text: "Converting query to vector embeddings..." },
                  { text: "Searching knowledge base for relevant content..." },
                  { text: "Found 5 relevant documents about aerodynamics" },
                  { text: "Augmenting prompt with retrieved context..." },
                  { text: "Generating comprehensive answer with sources..." },
                  { text: "✓ Answer ready with citations!" },
                  { text: "User asks: How do planes work?" },
                  { text: "Converting query to vector embeddings..." },
                  { text: "Searching knowledge base for relevant content..." },
                  { text: "Found 5 relevant documents about aerodynamics" },
                  { text: "Augmenting prompt with retrieved context..." },
                  { text: "Generating comprehensive answer with sources..." },
                  { text: "✓ Answer ready with citations!" },
                  { text: "User asks: How do planes work?" },
                  { text: "Converting query to vector embeddings..." },
                  { text: "Searching knowledge base for relevant content..." },
                  { text: "Found 5 relevant documents about aerodynamics" },
                  { text: "Augmenting prompt with retrieved context..." },
                  { text: "Generating comprehensive answer with sources..." },
                  { text: "✓ Answer ready with citations!" },
                  { text: "User asks: How do planes work?" },
                  { text: "Converting query to vector embeddings..." },
                  { text: "Searching knowledge base for relevant content..." },
                  { text: "Found 5 relevant documents about aerodynamics" },
                  { text: "Augmenting prompt with retrieved context..." },
                  { text: "Generating comprehensive answer with sources..." },
                  { text: "✓ Answer ready with citations!" },
                  { text: "User asks: How do planes work?" },
                  { text: "Converting query to vector embeddings..." },
                  { text: "Searching knowledge base for relevant content..." },
                  { text: "Found 5 relevant documents about aerodynamics" },
                  { text: "Augmenting prompt with retrieved context..." },
                  { text: "Generating comprehensive answer with sources..." },
                  { text: "✓ Answer ready with citations!" },
                  { text: "User asks: How do planes work?" },
                  { text: "Converting query to vector embeddings..." },
                  { text: "Searching knowledge base for relevant content..." },
                  { text: "Found 5 relevant documents about aerodynamics" },
                  { text: "Augmenting prompt with retrieved context..." },
                  { text: "Generating comprehensive answer with sources..." },
                  { text: "✓ Answer ready with citations!" },
                  { text: "User asks: How do planes work?" },
                  { text: "Converting query to vector embeddings..." },
                  { text: "Searching knowledge base for relevant content..." },
                  { text: "Found 5 relevant documents about aerodynamics" },
                  { text: "Augmenting prompt with retrieved context..." },
                  { text: "Generating comprehensive answer with sources..." },
                  { text: "✓ Answer ready with citations!" },
                  { text: "User asks: How do planes work?" },
                  { text: "Converting query to vector embeddings..." },
                  { text: "Searching knowledge base for relevant content..." },
                  { text: "Found 5 relevant documents about aerodynamics" },
                  { text: "Augmenting prompt with retrieved context..." },
                  { text: "Generating comprehensive answer with sources..." },
                  { text: "✓ Answer ready with citations!" },
                  { text: "User asks: How do planes work?" },
                  { text: "Converting query to vector embeddings..." },
                  { text: "Searching knowledge base for relevant content..." },
                  { text: "Found 5 relevant documents about aerodynamics" },
                  { text: "Augmenting prompt with retrieved context..." },
                  { text: "Generating comprehensive answer with sources..." },
                  { text: "✓ Answer ready with citations!" },
                  { text: "User asks: How do planes work?" },
                  { text: "Converting query to vector embeddings..." },
                  { text: "Searching knowledge base for relevant content..." },
                  { text: "Found 5 relevant documents about aerodynamics" },
                  { text: "Augmenting prompt with retrieved context..." },
                  { text: "Generating comprehensive answer with sources..." },
                  { text: "✓ Answer ready with citations!" },
                  { text: "User asks: How do planes work?" },
                  { text: "Converting query to vector embeddings..." },
                  { text: "Searching knowledge base for relevant content..." },
                  { text: "Found 5 relevant documents about aerodynamics" },
                  { text: "Augmenting prompt with retrieved context..." },
                  { text: "Generating comprehensive answer with sources..." },
                  { text: "✓ Answer ready with citations!" },
                  { text: "User asks: How do planes work?" },
                  { text: "Converting query to vector embeddings..." },
                  { text: "Searching knowledge base for relevant content..." },
                  { text: "Found 5 relevant documents about aerodynamics" },
                  { text: "Augmenting prompt with retrieved context..." },
                  { text: "Generating comprehensive answer with sources..." },
                  { text: "✓ Answer ready with citations!" },
                  { text: "User asks: How do planes work?" },
                  { text: "Converting query to vector embeddings..." },
                  { text: "Searching knowledge base for relevant content..." },
                  { text: "Found 5 relevant documents about aerodynamics" },
                  { text: "Augmenting prompt with retrieved context..." },
                  { text: "Generating comprehensive answer with sources..." },
                  { text: "✓ Answer ready with citations!" },
                  { text: "User asks: How do planes work?" },
                  { text: "Converting query to vector embeddings..." },
                  { text: "Searching knowledge base for relevant content..." },
                  { text: "Found 5 relevant documents about aerodynamics" },
                  { text: "Augmenting prompt with retrieved context..." },
                  { text: "Generating comprehensive answer with sources..." },
                  { text: "✓ Answer ready with citations!" },
                  { text: "User asks: How do planes work?" },
                  { text: "Converting query to vector embeddings..." },
                  { text: "Searching knowledge base for relevant content..." },
                  { text: "Found 5 relevant documents about aerodynamics" },
                  { text: "Augmenting prompt with retrieved context..." },
                  { text: "Generating comprehensive answer with sources..." },
                  { text: "✓ Answer ready with citations!" },
                  { text: "User asks: How do planes work?" },
                  { text: "Converting query to vector embeddings..." },
                  { text: "Searching knowledge base for relevant content..." },
                  { text: "Found 5 relevant documents about aerodynamics" },
                  { text: "Augmenting prompt with retrieved context..." },
                  { text: "Generating comprehensive answer with sources..." },
                  { text: "✓ Answer ready with citations!" },
                  { text: "User asks: How do planes work?" },
                  { text: "Converting query to vector embeddings..." },
                  { text: "Searching knowledge base for relevant content..." },
                  { text: "Found 5 relevant documents about aerodynamics" },
                  { text: "Augmenting prompt with retrieved context..." },
                  { text: "Generating comprehensive answer with sources..." },
                  { text: "✓ Answer ready with citations!" },
                  { text: "User asks: How do planes work?" },
                  { text: "Converting query to vector embeddings..." },
                  { text: "Searching knowledge base for relevant content..." },
                  { text: "Found 5 relevant documents about aerodynamics" },
                  { text: "Augmenting prompt with retrieved context..." },
                  { text: "Generating comprehensive answer with sources..." },
                  { text: "✓ Answer ready with citations!" },
                  { text: "User asks: How do planes work?" },
                  { text: "Converting query to vector embeddings..." },
                  { text: "Searching knowledge base for relevant content..." },
                  { text: "Found 5 relevant documents about aerodynamics" },
                  { text: "Augmenting prompt with retrieved context..." },
                  { text: "Generating comprehensive answer with sources..." },
                  { text: "✓ Answer ready with citations!" },
                  { text: "User asks: How do planes work?" },
                  { text: "Converting query to vector embeddings..." },
                  { text: "Searching knowledge base for relevant content..." },
                  { text: "Found 5 relevant documents about aerodynamics" },
                  { text: "Augmenting prompt with retrieved context..." },
                  { text: "Generating comprehensive answer with sources..." },
                  { text: "✓ Answer ready with citations!" },
                  { text: "User asks: How do planes work?" },
                  { text: "Converting query to vector embeddings..." },
                  { text: "Searching knowledge base for relevant content..." },
                  { text: "Found 5 relevant documents about aerodynamics" },
                  { text: "Augmenting prompt with retrieved context..." },
                  { text: "Generating comprehensive answer with sources..." },
                  { text: "✓ Answer ready with citations!" },
                  { text: "User asks: How do planes work?" },
                  { text: "Converting query to vector embeddings..." },
                  { text: "Searching knowledge base for relevant content..." },
                  { text: "Found 5 relevant documents about aerodynamics" },
                  { text: "Augmenting prompt with retrieved context..." },
                  { text: "Generating comprehensive answer with sources..." },
                  { text: "✓ Answer ready with citations!" },
                  { text: "User asks: How do planes work?" },
                  { text: "Converting query to vector embeddings..." },
                  { text: "Searching knowledge base for relevant content..." },
                  { text: "Found 5 relevant documents about aerodynamics" },
                  { text: "Augmenting prompt with retrieved context..." },
                  { text: "Generating comprehensive answer with sources..." },
                  { text: "✓ Answer ready with citations!" },
                  { text: "User asks: How do planes work?" },
                  { text: "Converting query to vector embeddings..." },
                  { text: "Searching knowledge base for relevant content..." },
                  { text: "Found 5 relevant documents about aerodynamics" },
                  { text: "Augmenting prompt with retrieved context..." },
                  { text: "Generating comprehensive answer with sources..." },
                  { text: "✓ Answer ready with citations!" },
                  { text: "User asks: How do planes work?" },
                  { text: "Converting query to vector embeddings..." },
                  { text: "Searching knowledge base for relevant content..." },
                  { text: "Found 5 relevant documents about aerodynamics" },
                  { text: "Augmenting prompt with retrieved context..." },
                  { text: "Generating comprehensive answer with sources..." },
                  { text: "✓ Answer ready with citations!" },
                  { text: "User asks: How do planes work?" },
                  { text: "Converting query to vector embeddings..." },
                  { text: "Searching knowledge base for relevant content..." },
                  { text: "Found 5 relevant documents about aerodynamics" },
                  { text: "Augmenting prompt with retrieved context..." },
                  { text: "Generating comprehensive answer with sources..." },
                  { text: "✓ Answer ready with citations!" },
                  { text: "User asks: How do planes work?" },
                  { text: "Converting query to vector embeddings..." },
                  { text: "Searching knowledge base for relevant content..." },
                  { text: "Found 5 relevant documents about aerodynamics" },
                  { text: "Augmenting prompt with retrieved context..." },
                  { text: "Generating comprehensive answer with sources..." },
                  { text: "✓ Answer ready with citations!" },
                  
                ]}
                loading={true}
                duration={2000}
                loop={true}
              />
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section - Reopen content container */}
      <div className="relative z-10 flex flex-col items-center px-4 md:px-6" style={{ isolation: "isolate" }}>
        {/* Gradient fade overlay - fades grid only on left side */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-50 via-transparent via-30% to-transparent pointer-events-none"></div>
        <div className="w-full max-w-4xl mx-auto py-24 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-slate-500 text-lg">Everything you need to know about AeroMentor</p>
          </div>
          <div className="flex flex-col gap-4">
            {faqs.map((f) => (
              <FAQItem 
                key={f.id} 
                q={f.q} 
                a={f.a} 
                isOpen={openFaqId === f.id}
                onToggle={() => setOpenFaqId(openFaqId === f.id ? null : f.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section - Outside main container for full width */}
      <div className="w-full py-24 bg-slate-50 border-t border-slate-200 relative overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute top-0 left-0 w-full h-full object-cover opacity-40"
        >
          <source src="/video.mp4" type="video/mp4" />
        </video>
        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6">
              Ready to Transform Your Learning?
            </h2>
            <p className="text-slate-700 text-xl mb-4 max-w-2xl mx-auto">
              Join thousands of students using AeroMentor to learn smarter, faster, and more effectively.
            </p>
        </div>
      </div>

      {/* Footer - Outside main container to be full width */}
      <footer className="w-full bg-slate-900 pt-20 pb-10 relative z-10">
        <div className="w-full px-6">
            <div className="grid md:grid-cols-12 gap-8 mb-16">
              <div className="md:col-span-5">
                <div className="flex items-center gap-2 text-2xl font-bold text-white mb-6">
                  <span>AeroMentor</span>
                </div>
                <div className="flex gap-6 mb-6">
                  <Image
                    src="/crest.png"
                    alt="NIAT Crest"
                    width={60}
                    height={60}
                    className="object-contain"
                  />
                  <Image
                    src="/niat.png"
                    alt="NIAT Logo"
                    width={60}
                    height={60}
                    className="object-contain"
                  />
                </div>
                <p className="text-slate-400 max-w-sm mb-2">
                  Built by the Naval Institute of Aeronautical Technology, Kochi.
                </p>
                <p className="text-slate-400 max-w-sm text-sm">
                  Established in 1956 under Southern Naval Command, advancing aeronautical education and applied research.
                </p>
              </div>
              <div className="md:col-span-3"></div>
              <div className="md:col-span-2 text-right">
                <h4 className="text-white font-bold mb-6">Platform</h4>
                <ul className="space-y-4 text-slate-400 text-sm">
                  <li><Link href="/chat" className="hover:text-white transition-colors">Chat</Link></li>
                  <li><Link href="/library" className="hover:text-white transition-colors">Library</Link></li>
                  <li><Link href="/quiz" className="hover:text-white transition-colors">Quiz</Link></li>
                </ul>
              </div>
              <div className="md:col-span-2 text-right">
                <h4 className="text-white font-bold mb-6">Contact</h4>
                <ul className="space-y-4 text-slate-400 text-sm">
                  <li>aeromentor.contact@gmail.com</li>
                  <li>+91 9876543210</li>
                  <li className="leading-relaxed">INS Garuda, Naval Base<br/>Kochi - 682004, Kerala</li>
                </ul>
                <div className="mt-6">
                  <h4 className="text-white font-bold mb-4">Social</h4>
                  <div className="flex gap-4 text-slate-400 justify-end">
                    <SiGmail className="cursor-pointer hover:text-white transition-colors text-xl" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        <div className="w-full pt-8 border-t border-slate-800 text-center text-slate-500 text-sm px-6">
          © 2025 NIAT. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
