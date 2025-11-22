import React, { useState, useEffect, useRef } from 'react';
import { 
  Rocket, 
  Brain, 
  Database, 
  Search, 
  ChevronRight, 
  ShieldCheck, 
  Cpu, 
  BookOpen, 
  Menu, 
  X, 
  Zap, 
  Globe,
  ArrowRight,
  MessageSquare,
  Send,
  Sparkles,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

// --- Gemini API Integration ---

const apiKey = ""; // System will provide the key at runtime

const callGemini = async (prompt, systemInstruction = "") => {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error: Could not connect to AeroMind's neural core. Please try again.";
  }
};

const generateQuiz = async (topic) => {
  const prompt = `Generate a quiz about "${topic}" for an aerospace engineering student. 
  Create 3 multiple choice questions.
  Return ONLY raw JSON (no markdown formatting) with this schema:
  [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correctIndex": number,
      "explanation": "string"
    }
  ]`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        }),
      }
    );
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return JSON.parse(text);
  } catch (error) {
    console.error("Quiz Generation Error:", error);
    return null;
  }
};

// --- Components ---

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full z-50 flex justify-center pt-6 px-4">
        <nav className={`
            w-full max-w-5xl transition-all duration-300 rounded-full px-6 py-3
            flex justify-between items-center border
            ${scrolled || isOpen 
                ? 'bg-white/90 backdrop-blur-xl border-blue-100 shadow-lg shadow-blue-900/5' 
                : 'bg-white/70 backdrop-blur-md border-white/50 shadow-sm'
            }
        `}>
        <div className="flex items-center gap-2 text-xl font-bold text-slate-900 tracking-tighter">
          <div className="bg-blue-600 text-white p-1.5 rounded-lg">
            <Rocket size={20} />
          </div>
          <span>Aero<span className="text-blue-600">Mind</span></span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8 text-slate-600 font-medium text-sm">
          <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
          <a href="#quiz-lab" className="hover:text-blue-600 transition-colors flex items-center gap-1">
             <Sparkles size={14} className="text-orange-400" /> AI Lab
          </a>
          <a href="#pricing" className="hover:text-blue-600 transition-colors">Pricing</a>
          <button className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-full font-semibold transition-all hover:shadow-lg hover:shadow-slate-900/20 text-sm">
            Get Started
          </button>
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden text-slate-700" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile Menu Dropdown (Detached) */}
      {isOpen && (
        <div className="absolute top-24 w-[90%] max-w-md bg-white border border-slate-100 rounded-2xl shadow-2xl p-4 flex flex-col gap-2 animate-fade-in-up z-40">
          <a href="#features" className="text-slate-600 hover:bg-slate-50 px-4 py-3 rounded-xl block font-medium" onClick={() => setIsOpen(false)}>Features</a>
          <a href="#quiz-lab" className="text-slate-600 hover:bg-slate-50 px-4 py-3 rounded-xl block font-medium" onClick={() => setIsOpen(false)}>AI Quiz Lab</a>
          <a href="#pricing" className="text-slate-600 hover:bg-slate-50 px-4 py-3 rounded-xl block font-medium" onClick={() => setIsOpen(false)}>Pricing</a>
          <button className="bg-blue-600 text-white w-full py-3 rounded-xl font-semibold mt-2">Get Started</button>
        </div>
      )}
    </div>
  );
};

// --- GEMINI FEATURE 1: Interactive Chatbot ---

const InteractiveChat = () => {
  const [messages, setMessages] = useState([
    { role: 'ai', text: "Hello, Engineer. I'm AeroMind. Ask me about aerodynamics, propulsion, or orbital mechanics, and I'll cite my sources." }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput("");
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    // System prompt to enforce RAG-like behavior
    const systemPrompt = `You are AeroMind, an expert aerospace engineering AI. 
    Your goal is to provide technical, accurate answers suitable for engineering students.
    ALWAYS cite sources (e.g., "According to Anderson...", "NASA TM-2021 states...", "FAA Part 25 requires...").
    Keep responses concise (under 80 words) for this chat interface.
    Use formatting like **bold** for key terms.
    If the question is not about aerospace/engineering, politely steer it back.`;

    const aiResponse = await callGemini(userMsg, systemPrompt);

    setMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);
    setIsLoading(false);
  };

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div className="relative w-full max-w-md mx-auto bg-white border border-slate-200/60 rounded-2xl shadow-2xl shadow-slate-200/50 overflow-hidden backdrop-blur-sm flex flex-col h-[500px]">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50/50 border-b border-slate-100">
        <div className="flex gap-2 items-center">
          <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Gemini API Active</span>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">AeroMind v2.1</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-white to-slate-50/30" ref={scrollRef}>
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 items-start ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm ${msg.role === 'ai' ? 'bg-blue-600 shadow-blue-500/30' : 'bg-slate-100 border border-slate-200'}`}>
              {msg.role === 'ai' ? <Brain size={16} className="text-white" /> : <span className="text-xs font-bold text-slate-600">U</span>}
            </div>
            <div className={`max-w-[80%] rounded-2xl p-3 text-sm font-medium shadow-sm ${
              msg.role === 'ai' 
                ? 'bg-white border border-slate-100 text-slate-700 rounded-tl-none' 
                : 'bg-blue-600 text-white rounded-tr-none'
            }`}>
              {msg.role === 'ai' ? (
                 // Basic markdown rendering for bold text
                 <span dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
              ) : (
                msg.text
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-3 items-start">
             <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                <Brain size={16} className="text-white" />
             </div>
             <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none p-3 flex gap-2 items-center text-xs text-slate-500">
                <Sparkles size={12} className="text-blue-500 animate-spin" />
                Accessing NASA Technical Reports Server...
             </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100">
        <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-2 py-2 border border-slate-200 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <input 
              className="flex-1 bg-transparent border-none outline-none text-slate-700 text-sm px-2"
              placeholder="Ask about boundary layers..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={isLoading}
            />
            <button 
              onClick={handleSend} 
              disabled={isLoading || !input.trim()}
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
        </div>
      </div>
    </div>
  );
};

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center pt-32 pb-20 overflow-hidden bg-slate-50">
      {/* Background Elements - Light Mode */}
      <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-200/40 rounded-full blur-[120px] mix-blend-multiply pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-orange-200/40 rounded-full blur-[100px] mix-blend-multiply pointer-events-none" />
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-40 mix-blend-soft-light"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      
      <div className="container mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-blue-100 shadow-sm text-blue-700 text-sm font-bold tracking-wide">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            POWERED BY GEMINI API
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-bold text-slate-900 leading-[1.1] tracking-tight">
            Engineering Logic, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-orange-500">
              Not Hallucinations.
            </span>
          </h1>
          
          <p className="text-lg text-slate-600 max-w-xl leading-relaxed">
            The first RAG-powered study assistant for aerospace. 
            Get answers cited directly from verified aerodynamic textbooks, research papers, and propulsion manuals.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all hover:shadow-lg hover:shadow-blue-600/30 flex items-center justify-center gap-2">
              Start Learning Free <ChevronRight size={20} />
            </button>
            <button className="px-8 py-4 rounded-xl font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
              View Documentation
            </button>
          </div>
          
          <div className="pt-8 flex items-center gap-8 text-slate-500 text-sm font-semibold">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-green-100 rounded-full"><ShieldCheck size={14} className="text-green-600" /></div> 
              SOC2 Compliant
            </div>
            <div className="flex items-center gap-2">
              <div className="p-1 bg-blue-100 rounded-full"><BookOpen size={14} className="text-blue-600" /></div> 
              5M+ Papers Indexed
            </div>
          </div>
        </div>

        {/* Interactive Demo Mockup */}
        <div className="relative perspective-1000">
            <div className="absolute inset-0 bg-blue-600/5 rounded-[2rem] transform rotate-3 scale-105 -z-10"></div>
            <InteractiveChat />
        </div>
      </div>
    </section>
  );
};

// --- GEMINI FEATURE 2: AI Quiz Generator ---

const QuizSection = () => {
  const [topic, setTopic] = useState("Space Shuttle");
  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setQuizData(null);
    setShowResults(false);
    setSelectedAnswers({});
    
    const data = await generateQuiz(topic);
    setQuizData(data);
    setLoading(false);
  };

  const handleSelect = (qIndex, optIndex) => {
    setSelectedAnswers(prev => ({ ...prev, [qIndex]: optIndex }));
  };

  const calculateScore = () => {
    if (!quizData) return 0;
    let correct = 0;
    quizData.forEach((q, i) => {
      if (selectedAnswers[i] === q.correctIndex) correct++;
    });
    return correct;
  };

  return (
    <section id="quiz-lab" className="py-24 bg-slate-50 relative overflow-hidden">
       {/* Decor */}
       <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-white to-transparent"></div>
       
       <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-12">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-600 text-xs font-bold mb-4">
                <Sparkles size={12} /> GEMINI POWERED STUDY TOOLS
             </div>
             <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">AI Aero-Quiz Lab</h2>
             <p className="text-slate-500 max-w-2xl mx-auto">Generate instant practice quizzes on any aerospace topic using our fine-tuned LLM.</p>
          </div>

          <div className="max-w-3xl mx-auto">
             {/* Generator Controls */}
             <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg mb-8 flex flex-col md:flex-row gap-4 items-end md:items-center">
                <div className="flex-1 w-full">
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Enter Topic</label>
                   <input 
                      type="text" 
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium focus:ring-2 focus:ring-blue-200 outline-none"
                      placeholder="e.g. Gas Turbines, Kepler's Laws..."
                   />
                </div>
                <button 
                   onClick={handleGenerate}
                   disabled={loading}
                   className="w-full md:w-auto bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                   {loading ? <RefreshCw size={18} className="animate-spin" /> : <Zap size={18} className="text-yellow-400" />}
                   {loading ? "Generating..." : "Generate Quiz"}
                </button>
             </div>

             {/* Quiz Display */}
             {quizData && (
                <div className="space-y-6 animate-fade-in-up">
                   {quizData.map((q, qIdx) => (
                      <div key={qIdx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                         <h3 className="text-lg font-bold text-slate-900 mb-4 flex gap-3">
                            <span className="bg-blue-100 text-blue-700 w-8 h-8 flex items-center justify-center rounded-lg text-sm flex-shrink-0">{qIdx + 1}</span>
                            {q.question}
                         </h3>
                         <div className="grid gap-3">
                            {q.options.map((opt, optIdx) => {
                               const isSelected = selectedAnswers[qIdx] === optIdx;
                               const isCorrect = showResults && q.correctIndex === optIdx;
                               const isWrong = showResults && isSelected && q.correctIndex !== optIdx;
                               
                               let baseClass = "p-4 rounded-xl border text-left text-sm font-medium transition-all cursor-pointer flex justify-between items-center";
                               if (showResults) {
                                  if (isCorrect) baseClass += " bg-green-50 border-green-200 text-green-800";
                                  else if (isWrong) baseClass += " bg-red-50 border-red-200 text-red-800";
                                  else baseClass += " bg-slate-50 border-slate-100 opacity-50";
                               } else {
                                  if (isSelected) baseClass += " bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500";
                                  else baseClass += " bg-white border-slate-200 hover:bg-slate-50";
                               }

                               return (
                                  <button 
                                     key={optIdx} 
                                     onClick={() => !showResults && handleSelect(qIdx, optIdx)}
                                     className={baseClass}
                                     disabled={showResults}
                                  >
                                     {opt}
                                     {isCorrect && <CheckCircle size={16} className="text-green-600" />}
                                     {isWrong && <AlertCircle size={16} className="text-red-600" />}
                                  </button>
                               )
                            })}
                         </div>
                         {showResults && (
                            <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
                               <span className="font-bold text-slate-800">Explanation:</span> {q.explanation}
                            </div>
                         )}
                      </div>
                   ))}
                   
                   {!showResults ? (
                      <button 
                        onClick={() => setShowResults(true)}
                        className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl shadow-lg shadow-green-600/20 transition-all"
                      >
                         Submit Answers
                      </button>
                   ) : (
                      <div className="p-6 bg-slate-900 rounded-2xl text-center text-white">
                         <h4 className="text-2xl font-bold mb-2">Score: {calculateScore()} / 3</h4>
                         <p className="text-slate-400">Good job! Try another topic to keep learning.</p>
                      </div>
                   )}
                </div>
             )}
          </div>
       </div>
    </section>
  );
};

const FeatureCard = ({ icon: Icon, title, desc }) => (
  <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(37,99,235,0.1)] transition-all group hover:-translate-y-1 duration-300">
    <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors duration-300 border border-slate-100">
      <Icon className="text-blue-600 group-hover:text-white transition-colors" size={28} />
    </div>
    <h3 className="text-xl font-bold text-slate-900 mb-4">{title}</h3>
    <p className="text-slate-500 leading-relaxed">{desc}</p>
  </div>
);

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 bg-white relative">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Built for High-Stakes Engineering</h2>
          <p className="text-slate-500 text-lg">General LLMs struggle with the precise physics of aerospace. AeroMind is built different using a specialized RAG architecture.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={Database}
            title="Verified Sourcing"
            desc="Every answer is cross-referenced against a database of 5 million+ peer-reviewed papers, NASA Technical Reports, and FAA regulations."
          />
          <FeatureCard 
            icon={Cpu}
            title="Equation Solver"
            desc="Don't just get text. AeroMind parses LaTeX inputs and outputs step-by-step solutions for fluid dynamics and orbital mechanics problems."
          />
          <FeatureCard 
            icon={Globe}
            title="Multilingual Standards"
            desc="Access engineering standards (ISO, ASTM, MIL-SPEC) in 12 languages, instantly translated and contextually explained."
          />
        </div>
      </div>
    </section>
  );
};

const RagExplanation = () => {
  return (
    <section id="engine" className="py-24 bg-slate-50 border-y border-slate-200">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1 relative">
            {/* Abstract Visualization of RAG */}
            <div className="aspect-square rounded-3xl bg-white border border-slate-200 p-8 relative overflow-hidden shadow-xl shadow-slate-200/50">
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-100 blur-[80px] rounded-full mix-blend-multiply"></div>
               
               <div className="relative z-10 flex flex-col gap-4 h-full justify-center">
                  <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4 w-3/4 self-end animate-pulse">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <div className="h-2 bg-slate-100 rounded w-24"></div>
                  </div>
                  <div className="flex justify-center py-2">
                    <ArrowRight className="rotate-90 text-slate-300" />
                  </div>
                  <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 text-center">
                    <Database className="mx-auto text-blue-600 mb-2" />
                    <div className="text-slate-900 font-bold text-sm">Vector Database</div>
                    <div className="text-xs text-slate-500 mt-1">Searching 12TB of Aero Data</div>
                  </div>
                  <div className="flex justify-center py-2">
                    <ArrowRight className="rotate-90 text-slate-300" />
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm w-3/4">
                    <div className="text-xs text-green-600 font-bold mb-1">Generated Answer</div>
                    <div className="h-2 bg-slate-100 rounded w-full mb-2"></div>
                    <div className="h-2 bg-slate-100 rounded w-2/3"></div>
                  </div>
               </div>
            </div>
          </div>
          
          <div className="order-1 lg:order-2">
            <div className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold mb-6 tracking-wide">
              THE TECHNOLOGY
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Why Retrieval Augmented Generation (RAG) Matters?</h2>
            <div className="space-y-8">
              <div className="flex gap-5">
                <div className="mt-1 bg-white p-3 rounded-xl border border-slate-200 shadow-sm h-fit">
                  <Zap size={20} className="text-yellow-500 fill-yellow-500" />
                </div>
                <div>
                  <h4 className="text-slate-900 font-bold text-lg">Zero Hallucinations</h4>
                  <p className="text-slate-500 leading-relaxed">Standard AI guesses when it doesn't know. AeroMind retrieves factual text chunks first, then summarizes them. If the manual doesn't say it, we don't invent it.</p>
                </div>
              </div>
              <div className="flex gap-5">
                <div className="mt-1 bg-white p-3 rounded-xl border border-slate-200 shadow-sm h-fit">
                  <BookOpen size={20} className="text-purple-500 fill-purple-100" />
                </div>
                <div>
                  <h4 className="text-slate-900 font-bold text-lg">Context-Aware Physics</h4>
                  <p className="text-slate-500 leading-relaxed">Our model understands that "Lift" means something different in orbital mechanics versus aerodynamics. It adapts based on your specific query context.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const PricingCard = ({ title, price, features, recommended = false }) => (
  <div className={`relative p-8 rounded-3xl border ${recommended ? 'bg-white border-blue-200 shadow-2xl shadow-blue-900/10 z-10 scale-105' : 'bg-slate-50 border-slate-200'} flex flex-col h-full transition-transform duration-300`}>
    {recommended && (
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg shadow-blue-600/20">
        Most Popular
      </div>
    )}
    <h3 className={`text-xl font-bold mb-2 ${recommended ? 'text-blue-900' : 'text-slate-700'}`}>{title}</h3>
    <div className="mb-6">
      <span className="text-4xl font-bold text-slate-900">{price}</span>
      {price !== 'Custom' && <span className="text-slate-400 font-medium">/month</span>}
    </div>
    <ul className="space-y-4 mb-8 flex-1">
      {features.map((feat, i) => (
        <li key={i} className="flex items-center gap-3 text-slate-600 text-sm font-medium">
          <ShieldCheck size={16} className="text-green-500 flex-shrink-0" />
          {feat}
        </li>
      ))}
    </ul>
    <button className={`w-full py-3 rounded-xl font-bold transition-all ${recommended ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
      Choose Plan
    </button>
  </div>
);

const Footer = () => (
  <footer className="bg-slate-900 pt-20 pb-10">
    <div className="container mx-auto px-6">
      <div className="grid md:grid-cols-4 gap-12 mb-16">
        <div className="col-span-2">
          <div className="flex items-center gap-2 text-2xl font-bold text-white mb-6">
            <Rocket className="text-white" size={24} />
            <span>AeroMind</span>
          </div>
          <p className="text-slate-400 max-w-sm">
            Accelerating aerospace education and R&D with verified, citation-backed artificial intelligence.
          </p>
        </div>
        <div>
          <h4 className="text-white font-bold mb-6">Platform</h4>
          <ul className="space-y-4 text-slate-400 text-sm">
            <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Data Sources</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
            <li><a href="#" className="hover:text-white transition-colors">API Access</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold mb-6">Company</h4>
          <ul className="space-y-4 text-slate-400 text-sm">
            <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
          </ul>
        </div>
      </div>
      <div className="pt-8 border-t border-slate-800 text-center text-slate-500 text-sm">
        © 2024 AeroMind Technologies. All rights reserved.
      </div>
    </div>
  </footer>
);

// --- Main App Component ---

const App = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100">
      <Navbar />
      
      <main>
        <HeroSection />
        
        {/* Trusted By Logo Strip */}
        <div className="bg-white border-y border-slate-100 py-10">
          <div className="container mx-auto px-6">
            <p className="text-center text-slate-400 text-xs font-bold mb-8 uppercase tracking-widest">Trusted by students at</p>
            <div className="flex flex-wrap justify-center gap-12 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
               <span className="text-xl font-bold text-slate-800">MIT Aero</span>
               <span className="text-xl font-bold text-slate-800">CalTech</span>
               <span className="text-xl font-bold text-slate-800">Stanford</span>
               <span className="text-xl font-bold text-slate-800">Embry-Riddle</span>
               <span className="text-xl font-bold text-slate-800">Georgia Tech</span>
            </div>
          </div>
        </div>

        <QuizSection />
        <FeaturesSection />
        <RagExplanation />
        
        <section id="pricing" className="py-24 bg-white">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Simple Pricing for Every Mission</h2>
              <p className="text-slate-500 text-lg">Whether you're studying for finals or designing the next rocket.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
              <PricingCard 
                title="Student" 
                price="$12" 
                features={[
                  "500 Queries / Month",
                  "Access to Textbook Database",
                  "Basic Equation Solver",
                  "Citation Export"
                ]} 
              />
              <PricingCard 
                title="Researcher" 
                price="$29" 
                recommended={true}
                features={[
                  "Unlimited Queries",
                  "Full NASA & FAA Database",
                  "Advanced Physics Engine",
                  "PDF Document Upload Analysis",
                  "Project Folders"
                ]} 
              />
              <PricingCard 
                title="Enterprise" 
                price="Custom" 
                features={[
                  "Team Collaboration",
                  "Private RAG Integration",
                  "API Access",
                  "SSO Security",
                  "Dedicated Support"
                ]} 
              />
            </div>
          </div>
        </section>

        <section className="py-24 bg-slate-50 border-t border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-100/50 via-transparent to-transparent opacity-60"></div>
          <div className="container mx-auto px-6 text-center relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6">Ready for Liftoff?</h2>
            <p className="text-slate-500 text-lg mb-10 max-w-2xl mx-auto">Join thousands of engineers using AeroMind to solve complex problems faster and more accurately.</p>
            <button className="bg-orange-500 hover:bg-orange-600 text-white px-10 py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40 transform hover:-translate-y-1">
              Start Your Free Trial
            </button>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default App;