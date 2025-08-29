'use client';

import React, { useState, useMemo } from 'react';
import type { FC, ReactNode } from 'react';
import DashboardLayout from '@/components/layout';

// --- UTILITY FUNCTION (to replace cn) ---
const cn = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

// --- ICONS (Using inline SVGs for simplicity) ---
const CheckCircle: FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
);
const XCircle: FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
);
const Award: FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 17 17 23 15.79 13.88"></polyline></svg>
);
const RefreshCw: FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
);
const ArrowLeft: FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
);
const Eye: FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
);

// --- TYPESCRIPT INTERFACES ---
interface Question {
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
}

interface Quiz {
    id: string;
    topic: string;
    difficulty: string;
    questions: Question[];
}

interface QuizProgress {
    status: 'not_started' | 'completed';
    score: number;
    userAnswers: number[];
}

interface ProgressState {
    [quizId: string]: QuizProgress;
}

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children: ReactNode;
  showRadialGradient?: boolean;
}

// --- MOCK QUIZ DATA ---
const quizzes: Quiz[] = [
    {
        id: "html-easy", topic: "HTML", difficulty: "Easy", questions: [
            { questionText: "What does HTML stand for?", options: ["Hyper Text Markup Language", "Home Tool Markup Language", "Hyperlinks and Text Markup Language"], correctAnswerIndex: 0 },
            { questionText: "Which tag is used to define an unordered list?", options: ["<ul>", "<ol>", "<li>", "<list>"], correctAnswerIndex: 0 },
            { questionText: "What is the correct HTML for creating a line break?", options: ["<br>", "<break>", "<lb>", "<newline>"], correctAnswerIndex: 0 },
            { questionText: "Which HTML element is used to specify a footer for a document or section?", options: ["<footer>", "<bottom>", "<section>", "<end>"], correctAnswerIndex: 0 },
        ]
    },
    {
        id: "html-medium", topic: "HTML", difficulty: "Medium", questions: [
            { questionText: "What is the correct HTML for creating a hyperlink?", options: ["<a href='url'>text</a>", "<a>url</a>", "<link>url</link>", "<hyperlink>url</hyperlink>"], correctAnswerIndex: 0 },
            { questionText: "Which attribute specifies an alternate text for an image, if the image cannot be displayed?", options: ["alt", "src", "title", "description"], correctAnswerIndex: 0 },
            { questionText: "Which HTML element is used to display a scalar measurement within a range?", options: ["<meter>", "<gauge>", "<measure>", "<range>"], correctAnswerIndex: 0 },
            { questionText: "What is the correct HTML for making a text area?", options: ["<textarea>", "<input type='textbox'>", "<input type='area'>", "<textinput>"], correctAnswerIndex: 0 },
        ]
    },
    {
        id: "react-easy", topic: "React", difficulty: "Easy", questions: [
            { questionText: "Which company developed React?", options: ["Facebook", "Google", "Twitter", "Microsoft"], correctAnswerIndex: 0 },
            { questionText: "What is JSX?", options: ["JavaScript XML", "JavaScript Extension", "Java Syntax Extension", "JSON Extension"], correctAnswerIndex: 0 },
            { questionText: "What is the correct way to create a React component?", options: ["function Component() {}", "class Component {}", "const Component = () => {}", "All of the above"], correctAnswerIndex: 3 },
            { questionText: "Which hook is used to manage state in functional components?", options: ["useState", "useEffect", "useContext", "useReducer"], correctAnswerIndex: 0 },
        ]
    },
    {
        id: "react-hard", topic: "React", difficulty: "Hard", questions: [
            { questionText: "What is the purpose of `useCallback` hook?", options: ["To memoize functions", "To memoize values", "To create side effects", "To manage state"], correctAnswerIndex: 0 },
            { questionText: "In React, what is used to pass data to a component from outside?", options: ["props", "state", "setState", "getInitialState"], correctAnswerIndex: 0 },
            { questionText: "What is the correct way to handle errors in React components?", options: ["Error Boundaries", "try-catch blocks", "useError hook", "componentDidCatch only"], correctAnswerIndex: 0 },
            { questionText: "What is the difference between useMemo and useCallback?", options: ["useMemo memoizes values, useCallback memoizes functions", "They are the same", "useMemo is for classes, useCallback for functions", "useCallback is deprecated"], correctAnswerIndex: 0 },
        ]
    },
    {
        id: "javascript-easy", topic: "JavaScript", difficulty: "Easy", questions: [
            { questionText: "What is the correct way to declare a variable in JavaScript?", options: ["var x = 5", "variable x = 5", "v x = 5", "declare x = 5"], correctAnswerIndex: 0 },
            { questionText: "Which method is used to add an element to the end of an array?", options: ["push()", "add()", "append()", "insert()"], correctAnswerIndex: 0 },
            { questionText: "What does '===' operator do in JavaScript?", options: ["Strict equality comparison", "Assignment", "Loose equality", "Not equal"], correctAnswerIndex: 0 },
            { questionText: "How do you write a comment in JavaScript?", options: ["// comment", "<!-- comment -->", "# comment", "/* comment"], correctAnswerIndex: 0 },
        ]
    },
    {
        id: "css-medium", topic: "CSS", difficulty: "Medium", questions: [
            { questionText: "Which CSS property is used to create space between elements?", options: ["margin", "padding", "spacing", "gap"], correctAnswerIndex: 0 },
            { questionText: "What is the correct CSS syntax for making all <p> elements bold?", options: ["p {font-weight: bold;}", "p {text-size: bold;}", "<p style='bold'>", "p {bold: true;}"], correctAnswerIndex: 0 },
            { questionText: "Which CSS property controls the text size?", options: ["font-size", "text-size", "font-style", "text-style"], correctAnswerIndex: 0 },
            { questionText: "What is the difference between 'rem' and 'em' units?", options: ["rem is relative to root element, em to parent", "They are the same", "rem for margins, em for fonts", "em is deprecated"], correctAnswerIndex: 0 },
        ]
    }
];

// --- REUSABLE COMPONENTS ---

const AuroraBackground = ({ className, children, showRadialGradient = true, ...props }: AuroraBackgroundProps) => (
    <div className={cn("relative flex flex-col min-h-screen bg-zinc-50", className)} {...props}>
        <div className="absolute inset-0 overflow-hidden z-0">
            <div className={cn(`pointer-events-none absolute -inset-[10px] opacity-75 blur-[10px] invert filter will-change-transform after:absolute after:inset-0 after:[background-attachment:fixed] after:mix-blend-difference after:content-[""] [background-image:var(--white-gradient),var(--aurora)] [background-size:300%,_200%] [background-position:50%_50%,50%_50%] after:[background-image:var(--white-gradient),var(--aurora)] after:[background-size:200%,_100%] after:animate-aurora`, showRadialGradient && `[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,transparent_70%)]`)}></div>
        </div>
        <div className="relative z-10 flex-1">{children}</div>
    </div>
);

// --- QUIZ PAGE COMPONENTS ---

const QuizList = ({ progress, onStartQuiz, onResetQuiz, onReviewQuiz }: { progress: ProgressState, onStartQuiz: (quizId: string) => void, onResetQuiz: (quizId: string) => void, onReviewQuiz: (quizId: string) => void }) => (
    <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-sm border border-gray-200/80 p-8 w-full max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Available Quizzes</h1>
        <div className="space-y-6">
            {quizzes.map(quiz => {
                const quizProgress = progress[quiz.id];
                const isCompleted = quizProgress.status === 'completed';
                const scorePercentage = isCompleted ? (quizProgress.score / quiz.questions.length) * 100 : 0;

                return (
                    <div key={quiz.id} className="flex flex-col md:flex-row items-center gap-6 bg-gray-100/70 p-4 rounded-xl">
                        {/* Left Side: Quiz Card */}
                        <div className="w-full md:w-1/3 bg-black text-white p-6 rounded-lg flex flex-col justify-center text-center h-full">
                            <h2 className="text-2xl font-bold">{quiz.topic}</h2>
                            <p className="text-lg text-gray-300">{quiz.difficulty}</p>
                            <p className="text-sm text-gray-400 mt-2">{quiz.questions.length} questions</p>
                        </div>

                        {/* Right Side: Details & Actions */}
                        <div className="w-full md:w-2/3 flex flex-col justify-center">
                            <div className="flex items-center justify-between mb-3">
                                <p className="font-semibold">Progress</p>
                                {isCompleted && <p className="font-bold text-lg">{quizProgress.score}/{quiz.questions.length}</p>}
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                                <div className="bg-black h-4 rounded-full transition-all duration-500" style={{ width: `${scorePercentage}%` }}></div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <button onClick={() => onStartQuiz(quiz.id)} className="flex-grow bg-black text-white font-semibold py-2 px-5 rounded-lg hover:bg-gray-800 transition-colors">
                                    {isCompleted ? 'Retake Quiz' : 'Start Quiz'}
                                </button>
                                {isCompleted && (
                                    <>
                                        <button onClick={() => onReviewQuiz(quiz.id)} className="flex-grow bg-gray-200 font-semibold py-2 px-5 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-2">
                                            <Eye className="w-4 h-4" /> View Answers
                                        </button>
                                        <button onClick={() => onResetQuiz(quiz.id)} className="p-2 text-gray-500 hover:text-black transition-colors" title="Reset Progress">
                                            <RefreshCw className="w-5 h-5" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    </div>
);

const QuizInProgress = ({ quiz, onQuizComplete }: { quiz: Quiz, onQuizComplete: (score: number, userAnswers: number[]) => void }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<number[]>([]);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

    const handleNext = () => {
        const newAnswers = [...userAnswers, selectedAnswer!];
        setUserAnswers(newAnswers);
        setSelectedAnswer(null);

        if (currentQuestionIndex < quiz.questions.length - 1) {
            setCurrentQuestionIndex(i => i + 1);
        } else {
            let finalScore = 0;
            newAnswers.forEach((answer, index) => {
                if (answer === quiz.questions[index].correctAnswerIndex) {
                    finalScore++;
                }
            });
            onQuizComplete(finalScore, newAnswers);
        }
    };
    
    const question = quiz.questions[currentQuestionIndex];

    return (
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-sm border border-gray-200/80 p-8 max-w-2xl mx-auto w-full">
            <div className="mb-4">
                <p className="text-sm text-gray-600">Question {currentQuestionIndex + 1} of {quiz.questions.length}</p>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                    <div className="bg-black h-2.5 rounded-full transition-all duration-300" style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}></div>
                </div>
            </div>
            <h2 className="text-2xl font-bold mb-6">{question.questionText}</h2>
            <div className="space-y-3">
                {question.options.map((option, index) => (
                    <button key={index} onClick={() => setSelectedAnswer(index)} className={cn("w-full text-left p-4 rounded-lg border transition-all duration-200 hover:scale-[1.02]", selectedAnswer === index ? 'bg-gray-200 border-black shadow-md' : 'bg-gray-100 border-gray-200 hover:border-gray-400 hover:bg-gray-150')}>
                        {option}
                    </button>
                ))}
            </div>
            <button onClick={handleNext} disabled={selectedAnswer === null} className="w-full mt-8 bg-black text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 hover:scale-[1.02]">
                {currentQuestionIndex < quiz.questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
            </button>
        </div>
    );
};

const QuizResults = ({ quiz, progress, onRestart, onReview, onBackToList }: { quiz: Quiz, progress: QuizProgress, onRestart: () => void, onReview: () => void, onBackToList: () => void }) => {
    const scorePercentage = (progress.score / quiz.questions.length) * 100;
    const getScoreColor = () => {
        if (scorePercentage >= 80) return 'text-green-600';
        if (scorePercentage >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    return (
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-sm border border-gray-200/80 p-8 text-center max-w-2xl mx-auto w-full">
            <Award className={cn("w-16 h-16 mx-auto mb-4", getScoreColor())} />
            <h1 className="text-3xl font-bold mb-2">Quiz Complete!</h1>
            <p className="text-gray-600 mb-6">You've successfully completed the {quiz.topic} - {quiz.difficulty} quiz.</p>
            <div className="bg-gray-100 rounded-xl p-6 mb-6">
                <p className="text-lg font-semibold">Your Score</p>
                <p className={cn("text-5xl font-bold my-2", getScoreColor())}>{progress.score} <span className="text-2xl text-gray-500">/ {quiz.questions.length}</span></p>
                <p className={cn("text-lg font-semibold", getScoreColor())}>{scorePercentage.toFixed(0)}%</p>
            </div>
            <div className="space-y-3">
                <button onClick={onReview} className="w-full bg-black text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors">View Answers</button>
                <button onClick={onRestart} className="w-full bg-gray-200 text-black font-bold py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors">Retake Quiz</button>
                <button onClick={onBackToList} className="w-full bg-gray-200 text-black font-bold py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors">Back to All Quizzes</button>
            </div>
        </div>
    );
};

const ReviewAnswers = ({ quiz, progress, onBackToResults }: { quiz: Quiz, progress: QuizProgress, onBackToResults: () => void }) => (
    <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-sm border border-gray-200/80 p-8 max-w-3xl mx-auto w-full">
        <button onClick={onBackToResults} className="flex items-center text-sm font-semibold text-gray-600 hover:text-black mb-6 transition-colors duration-300">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Results
        </button>
        <h1 className="text-3xl font-bold mb-6">Review Answers</h1>
        <div className="space-y-6">
            {quiz.questions.map((q, index) => {
                const userAnswerIndex = progress.userAnswers[index];
                const isCorrect = userAnswerIndex === q.correctAnswerIndex;
                return (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <h2 className="font-bold text-lg mb-3">{index + 1}. {q.questionText}</h2>
                        <div className="space-y-2">
                            {q.options.map((option, optIndex) => {
                                const isUserAnswer = userAnswerIndex === optIndex;
                                const isCorrectAnswer = q.correctAnswerIndex === optIndex;
                                return (
                                    <div key={optIndex} className={cn(
                                        "p-3 rounded-lg flex items-center gap-3 transition-all duration-200",
                                        isCorrectAnswer && "bg-green-100 border border-green-300",
                                        isUserAnswer && !isCorrectAnswer && "bg-red-100 border border-red-300",
                                        !isUserAnswer && !isCorrectAnswer && "bg-gray-50"
                                    )}>
                                        {isUserAnswer && !isCorrectAnswer && <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
                                        {isCorrectAnswer && <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />}
                                        <span className={cn(
                                            isCorrectAnswer && "font-semibold text-green-700",
                                            isUserAnswer && !isCorrectAnswer && "font-semibold text-red-700"
                                        )}>{option}</span>
                                        {isUserAnswer && !isCorrectAnswer && <span className="text-xs text-red-600 ml-auto">Your answer</span>}
                                        {isCorrectAnswer && <span className="text-xs text-green-600 ml-auto">Correct answer</span>}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )
            })}
        </div>
    </div>
);

// --- QUIZ CONTENT COMPONENT ---
function QuizContent() {
    const [view, setView] = useState<'list' | 'in_progress' | 'results' | 'review'>('list');
    const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
    
    const initialProgress = quizzes.reduce((acc, quiz) => {
        acc[quiz.id] = { status: 'not_started', score: 0, userAnswers: [] };
        return acc;
    }, {} as ProgressState);
    
    const [progress, setProgress] = useState<ProgressState>(initialProgress);

    const activeQuiz = useMemo(() => quizzes.find(q => q.id === activeQuizId), [activeQuizId]);

    const handleStartQuiz = (quizId: string) => {
        setActiveQuizId(quizId);
        setView('in_progress');
    };
    
    const handleReviewQuiz = (quizId: string) => {
        setActiveQuizId(quizId);
        setView('review');
    };

    const handleResetQuiz = (quizId: string) => {
        setProgress(prev => ({
            ...prev,
            [quizId]: { status: 'not_started', score: 0, userAnswers: [] }
        }));
    };

    const handleQuizComplete = (score: number, userAnswers: number[]) => {
        if (!activeQuizId) return;
        setProgress(prev => ({
            ...prev,
            [activeQuizId]: { status: 'completed', score, userAnswers }
        }));
        setView('results');
    };
    
    const handleBackToList = () => {
        setActiveQuizId(null);
        setView('list');
    };

    const renderContent = () => {
        switch (view) {
            case 'in_progress':
                return activeQuiz && <QuizInProgress quiz={activeQuiz} onQuizComplete={handleQuizComplete} />;
            case 'results':
                return activeQuiz && <QuizResults quiz={activeQuiz} progress={progress[activeQuiz.id]} onRestart={() => handleStartQuiz(activeQuiz.id)} onReview={() => setView('review')} onBackToList={handleBackToList} />;
            case 'review':
                return activeQuiz && <ReviewAnswers quiz={activeQuiz} progress={progress[activeQuiz.id]} onBackToResults={() => setView('results')} />;
            case 'list':
            default:
                return <QuizList progress={progress} onStartQuiz={handleStartQuiz} onResetQuiz={handleResetQuiz} onReviewQuiz={handleReviewQuiz} />;
        }
    };

    return (
        <AuroraBackground>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 flex items-center justify-center min-h-screen">
                {renderContent()}
            </div>
        </AuroraBackground>
    );
}

// --- MAIN PAGE COMPONENT ---
export default function QuizPage() {
    return (
        <>
            <style>{`
                :root {
                  --aurora: repeating-linear-gradient(100deg,#3b82f6 10%,#a5b4fc 15%,#93c5fd 20%,#ddd6fe 25%,#60a5fa 30%);
                  --dark-gradient: repeating-linear-gradient(100deg,#000 0%,#000 7%,transparent 10%,transparent 12%,#000 16%);
                  --white-gradient: repeating-linear-gradient(100deg,#fff 0%,#fff 7%,transparent 10%,transparent 12%,#fff 16%);
                }
                @keyframes aurora {
                  from { background-position: 50% 50%, 50% 50%; }
                  to { background-position: 350% 50%, 350% 50%; }
                }
                .after\\:animate-aurora::after {
                    animation: aurora 60s linear infinite;
                }
            `}</style>
            <DashboardLayout>
                <QuizContent />
            </DashboardLayout>
        </>
    );
}