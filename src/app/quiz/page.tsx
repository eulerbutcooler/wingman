'use client';

import React, { useState, useMemo } from 'react';
import type { FC, ReactNode } from 'react';
import DashboardLayout from '@/components/layout';
import { div } from 'framer-motion/client';

const cn = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

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

interface QuizListProps {
    progress: ProgressState;
    onStartQuiz: (quizId: string) => void;
    onResetQuiz: (quizId: string) => void;
    onReviewQuiz: (quizId: string) => void;
}

interface QuizInProgressProps {
    quiz: Quiz;
    onQuizComplete: (score: number, userAnswers: number[]) => void;
}

interface QuizResultsProps {
    quiz: Quiz;
    progress: QuizProgress;
    onRestart: () => void;
    onReview: () => void;
    onBackToList: () => void;
}

interface ReviewAnswersProps {
    quiz: Quiz;
    progress: QuizProgress;
    onBackToResults: () => void;
}

const quizzes: Quiz[] = [
    {
        id: "html-easy",
        topic: "HTML",
        difficulty: "Easy",
        questions: [
            { questionText: "What does HTML stand for?", options: ["Hyper Text Markup Language", "Home Tool Markup Language", "Hyperlinks and Text Markup Language"], correctAnswerIndex: 0 },
            { questionText: "Which tag is used to define an unordered list?", options: ["<ul>", "<ol>", "<li>", "<list>"], correctAnswerIndex: 0 },
            { questionText: "What is the correct HTML for creating a line break?", options: ["<br>", "<break>", "<lb>", "<newline>"], correctAnswerIndex: 0 },
            { questionText: "Which HTML element is used to specify a footer for a document or section?", options: ["<footer>", "<bottom>", "<section>", "<end>"], correctAnswerIndex: 0 },
        ]
    },
    {
        id: "html-medium",
        topic: "HTML",
        difficulty: "Medium",
        questions: [
            { questionText: "What is the correct HTML for creating a hyperlink?", options: ["<a href='url'>text</a>", "<a>url</a>", "<link>url</link>", "<hyperlink>url</hyperlink>"], correctAnswerIndex: 0 },
            { questionText: "Which attribute specifies an alternate text for an image, if the image cannot be displayed?", options: ["alt", "src", "title", "description"], correctAnswerIndex: 0 },
            { questionText: "Which HTML element is used to display a scalar measurement within a range?", options: ["<meter>", "<gauge>", "<measure>", "<range>"], correctAnswerIndex: 0 },
            { questionText: "What is the correct HTML for making a text area?", options: ["<textarea>", "<input type='textbox'>", "<input type='area'>", "<textinput>"], correctAnswerIndex: 0 },
        ]
    },
    {
        id: "react-easy",
        topic: "React",
        difficulty: "Easy",
        questions: [
            { questionText: "Which company developed React?", options: ["Facebook", "Google", "Twitter", "Microsoft"], correctAnswerIndex: 0 },
            { questionText: "What is JSX?", options: ["JavaScript XML", "JavaScript Extension", "Java Syntax Extension", "JSON Extension"], correctAnswerIndex: 0 },
            { questionText: "What is the correct way to create a React component?", options: ["function Component() {}", "class Component {}", "const Component = () => {}", "All of the above"], correctAnswerIndex: 3 },
            { questionText: "Which hook is used to manage state in functional components?", options: ["useState", "useEffect", "useContext", "useReducer"], correctAnswerIndex: 0 },
        ]
    },
    {
        id: "react-hard",
        topic: "React",
        difficulty: "Hard",
        questions: [
            { questionText: "What is the purpose of `useCallback` hook?", options: ["To memoize functions", "To memoize values", "To create side effects", "To manage state"], correctAnswerIndex: 0 },
            { questionText: "In React, what is used to pass data to a component from outside?", options: ["props", "state", "setState", "getInitialState"], correctAnswerIndex: 0 },
            { questionText: "What is the correct way to handle errors in React components?", options: ["Error Boundaries", "try-catch blocks", "useError hook", "componentDidCatch only"], correctAnswerIndex: 0 },
            { questionText: "What is the difference between useMemo and useCallback?", options: ["useMemo memoizes values, useCallback memoizes functions", "They are the same", "useMemo is for classes, useCallback for functions", "useCallback is deprecated"], correctAnswerIndex: 0 },
        ]
    },
    {
        id: "javascript-easy",
        topic: "JavaScript",
        difficulty: "Easy",
        questions: [
            { questionText: "What is the correct way to declare a variable in JavaScript?", options: ["var x = 5", "variable x = 5", "v x = 5", "declare x = 5"], correctAnswerIndex: 0 },
            { questionText: "Which method is used to add an element to the end of an array?", options: ["push()", "add()", "append()", "insert()"], correctAnswerIndex: 0 },
            { questionText: "What does '===' operator do in JavaScript?", options: ["Strict equality comparison", "Assignment", "Loose equality", "Not equal"], correctAnswerIndex: 0 },
            { questionText: "How do you write a comment in JavaScript?", options: ["// comment", "<!-- comment -->", "# comment", "/* comment"], correctAnswerIndex: 0 },
        ]
    },
    {
        id: "css-medium",
        topic: "CSS",
        difficulty: "Medium",
        questions: [
            { questionText: "Which CSS property is used to create space between elements?", options: ["margin", "padding", "spacing", "gap"], correctAnswerIndex: 0 },
            { questionText: "What is the correct CSS syntax for making all <p> elements bold?", options: ["p {font-weight: bold;}", "p {text-size: bold;}", "<p style='bold'>", "p {bold: true;}"], correctAnswerIndex: 0 },
            { questionText: "Which CSS property controls the text size?", options: ["font-size", "text-size", "font-style", "text-style"], correctAnswerIndex: 0 },
            { questionText: "What is the difference between 'rem' and 'em' units?", options: ["rem is relative to root element, em to parent", "They are the same", "rem for margins, em for fonts", "em is deprecated"], correctAnswerIndex: 0 },
        ]
    }
];

const AuroraBackground = ({ className, children, showRadialGradient = true, ...props }: AuroraBackgroundProps) => (
    <div className={cn("relative min-h-screen w-full", className)} {...props}>
        <div className="fixed inset-0 overflow-hidden">
            <div className={cn(`pointer-events-none absolute -inset-[10px] opacity-75 blur-[10px] invert filter will-change-transform after:fixed after:inset-0 after:[background-attachment:fixed] after:mix-blend-difference after:content-[""] [background-image:var(--white-gradient),var(--aurora)] [background-size:300%,_200%] [background-position:50%_50%,50%_50%] after:[background-image:var(--white-gradient),var(--aurora)] after:[background-size:200%,_100%] after:animate-aurora`, showRadialGradient && `[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,transparent_70%)]`)}></div>
        </div>
        <div className="relative z-5">
            {children}
        </div>
    </div>
);

const QuizCard = ({ quiz, progress, onStart, onReset, onReview }: { 
    quiz: Quiz; 
    progress: QuizProgress; 
    onStart: () => void; 
    onReset: () => void; 
    onReview: () => void; 
}) => {
    const isCompleted = progress.status === 'completed';
    const scorePercentage = isCompleted ? (progress.score / quiz.questions.length) * 100 : 0;

    return (
        <div className="flex flex-col md:flex-row items-center gap-6 bg-white p-4 shadow-sm hover:shadow-xl transition-all duration-300 rounded-4xl">
            <div className="w-full md:w-1/3 bg-black text-white p-6 rounded-4xl flex flex-col justify-center text-center h-full">
                <h2 className="text-2xl font-bold">{quiz.topic}</h2>
                <p className="text-lg text-neutral-300">{quiz.difficulty}</p>
                <p className="text-sm text-neutral-300 mt-1">{quiz.questions.length} questions</p>
            </div>

            <div className="w-full md:w-2/3 flex flex-col justify-center">
                <div className="flex items-center justify-between mb-3">
                    <p className="font-semibold">Progress</p>
                    {isCompleted && <p className="font-bold text-lg">{progress.score}/{quiz.questions.length}</p>}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                    <div className="bg-black h-4 rounded-full transition-all duration-500" style={{ width: `${scorePercentage}%` }}></div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button onClick={onStart} className="flex-grow bg-black text-white font-semibold py-2 px-5 rounded-4xl cursor-pointer  transition-colors">
                        {isCompleted ? 'Retake Quiz' : 'Start Quiz'}
                    </button>
                    {isCompleted && (
                        <>
                            <button onClick={onReview} className="flex-grow bg-white font-semibold py-2 px-5 rounded-4xl hover:border-gray-600 transition-colors flex border-gray-300 cursor-pointer border items-center justify-center gap-2">
                                <Eye className="w-4 h-4" /> View Answers
                            </button>
                            <button onClick={onReset} className="p-2 text-gray-500 hover:text-black transition-colors" title="Reset Progress">
                                <RefreshCw className="w-5 h-5" />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

const QuizList = ({ progress, onStartQuiz, onResetQuiz, onReviewQuiz }: QuizListProps) => (
    <div>
        <h1 className="text-2xl font-semibold text-left mb-8">Available quizzes</h1>
    <div className="bg-white  rounded-4xl shadow-sm mb-18  p-8 w-full  mx-auto">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {quizzes.map(quiz => (
                <QuizCard
                    key={quiz.id}
                    quiz={quiz}
                    progress={progress[quiz.id]}
                    onStart={() => onStartQuiz(quiz.id)}
                    onReset={() => onResetQuiz(quiz.id)}
                    onReview={() => onReviewQuiz(quiz.id)}
                />
            ))}
        </div>
    </div>
    </div>
);

const QuizInProgress = ({ quiz, onQuizComplete }: QuizInProgressProps) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<number[]>([]);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

    const question = quiz.questions[currentQuestionIndex];
    const progressPercentage = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

    const handleNext = () => {
        const newAnswers = [...userAnswers, selectedAnswer!];
        setUserAnswers(newAnswers);
        setSelectedAnswer(null);

        if (currentQuestionIndex < quiz.questions.length - 1) {
            setCurrentQuestionIndex(i => i + 1);
        } else {
            const finalScore = newAnswers.reduce((score, answer, index) => 
                answer === quiz.questions[index].correctAnswerIndex ? score + 1 : score, 0);
            onQuizComplete(finalScore, newAnswers);
        }
    };

    return (
        <div>
            <h3 className="text-2xl font-semibold text-left mb-8">Quiz in progress...</h3>
            <div className="bg-white  rounded-4xl shadow-sm mb-18   p-8  mx-auto w-full">
            <div className="mb-4">
                <p className="text-sm text-gray-600">Question {currentQuestionIndex + 1} of {quiz.questions.length}</p>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                    <div className="bg-black h-2.5 rounded-full transition-all duration-300" style={{ width: `${progressPercentage}%` }}></div>
                </div>
            </div>
            <h2 className="text-2xl font-bold mb-6">{question.questionText}</h2>
            <div className="space-y-3">
                {question.options.map((option, index) => (
                    <button 
                        key={index} 
                        onClick={() => setSelectedAnswer(index)} 
                        className={cn(
    "w-full text-left p-4 rounded-4xl transition-all duration-150 cursor-pointer hover:border-gray-600 border", 
    selectedAnswer === index 
        ? 'bg-white border-black' 
        : 'bg-white border-gray-300'
)}

                    >
                        {option}
                    </button>
                ))}
            </div>
            <button 
                onClick={handleNext} 
                disabled={selectedAnswer === null} 
                className="w-full mt-8 bg-black text-white font-bold py-3 px-4 rounded-4xl cursor-pointer"
            >
                {currentQuestionIndex < quiz.questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
            </button>
        </div>
        </div>
    );
};

const QuizResults = ({ quiz, progress, onRestart, onReview, onBackToList }: QuizResultsProps) => {
    const scorePercentage = (progress.score / quiz.questions.length) * 100;
    
    const getScoreColor = () => {
        if (scorePercentage >= 80) return 'text-green-500/90';
        if (scorePercentage >= 60) return 'text-yellow-500/90';
        return 'text-red-500/90';
    };

    return (
        <div className="bg-white rounded-4xl shadow-sm mt-16 mb-18 p-8 text-center  mx-auto w-full">
            <Award className={cn("w-12 h-12 mx-auto mb-4", getScoreColor())} />
            <h1 className="text-2xl font-bold mb-2">Quiz complete!</h1>
            <p className="text-neutral-600 mb-6">You've successfully completed the {quiz.topic} - {quiz.difficulty} quiz.</p>
            <div className="bg-white rounded-4xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 mb-6">
                <p className="text-xl font-semibold">Your Score</p>
                <p className={cn("text-2xl font-bold my-2", getScoreColor())}>
                    {progress.score} <span className="text-2xl text-neutral-600">/ {quiz.questions.length}</span>
                </p>
                <p className={cn("text-2xl pt-2 font-semibold", getScoreColor())}>{scorePercentage.toFixed(0)}%</p>
            </div>
            <div className="space-y-3">
                <button onClick={onReview} className="w-full text-xl bg-black text-white font-semibold py-3 px-4 cursor-pointer rounded-4xl transition-colors">
                    View answers
                </button>
                <button onClick={onRestart} className="w-full text-xl bg-white text-black font-semibold py-3 px-4 cursor-pointer rounded-4xl hover:border-gray-600 border-gray-300 border duration-50  transition-all">
                    Retake quiz
                </button>
                <button onClick={onBackToList} className="w-full text-xl bg-white text-black font-semibold py-3 px-4 cursor-pointer rounded-4xl hover:border-gray-600 border-gray-300 border duration-50  transition-all">
                    Back to all quizzes
                </button>
            </div>
        </div>
    );
};

const AnswerOption = ({ option, index, userAnswerIndex, correctAnswerIndex }: {
    option: string;
    index: number;
    userAnswerIndex: number;
    correctAnswerIndex: number;
}) => {
    const isUserAnswer = userAnswerIndex === index;
    const isCorrectAnswer = correctAnswerIndex === index;

    return (
        <div className={cn(
            "p-3 rounded-4xl flex items-center gap-3 transition-all duration-200",
            isCorrectAnswer && "bg-green-100 border border-green-300",
            isUserAnswer && !isCorrectAnswer && "bg-red-100 border border-red-300",
            !isUserAnswer && !isCorrectAnswer && "bg-white border border-gray-300"
        )}>
            {isUserAnswer && !isCorrectAnswer && <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
            {isCorrectAnswer && <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />}
            <span className={cn(
                isCorrectAnswer && "font-semibold text-green-700",
                isUserAnswer && !isCorrectAnswer && "font-semibold text-red-700"
            )}>
                {option}
            </span>
            {isUserAnswer && !isCorrectAnswer && <span className="text-xs text-red-600 ml-auto">Your answer</span>}
            {isCorrectAnswer && <span className="text-xs text-green-600 ml-auto">Correct answer</span>}
        </div>
    );
};

const ReviewAnswers = ({ quiz, progress, onBackToResults }: ReviewAnswersProps) => (
    <div>
        <button onClick={onBackToResults} className="flex items-center font-semibold text-neutral-600 cursor-pointer hover:text-black mb-6 transition-colors duration-300">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to results
        </button>
        <div className="bg-white  rounded-4xl shadow-sm  p-8 mb-18 mx-auto w-full">
            
            <h1 className="text-2xl font-semibold mb-6">Review Answers</h1>
            <div className="space-y-8">
                {quiz.questions.map((question, index) => (
                    <div key={index} className="shadow-sm rounded-4xl hover:shadow-xl transition-all duration-300 p-4">
                        <h2 className="font-bold text-lg p-2 mb-3">{index + 1}. {question.questionText}</h2>
                        <div className="space-y-4 px-2 pb-2">
                            {question.options.map((option, optIndex) => (
                                <AnswerOption
                                    key={optIndex}
                                    option={option}
                                    index={optIndex}
                                    userAnswerIndex={progress.userAnswers[index]}
                                    correctAnswerIndex={question.correctAnswerIndex}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

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
        if (!activeQuiz && view !== 'list') return null;

        switch (view) {
            case 'in_progress':
                return <QuizInProgress quiz={activeQuiz!} onQuizComplete={handleQuizComplete} />;
            case 'results':
                return (
                    <QuizResults 
                        quiz={activeQuiz!} 
                        progress={progress[activeQuiz!.id]} 
                        onRestart={() => handleStartQuiz(activeQuiz!.id)} 
                        onReview={() => setView('review')} 
                        onBackToList={handleBackToList} 
                    />
                );
            case 'review':
                return <ReviewAnswers quiz={activeQuiz!} progress={progress[activeQuiz!.id]} onBackToResults={() => setView('results')} />;
            default:
                return <QuizList progress={progress} onStartQuiz={handleStartQuiz} onResetQuiz={handleResetQuiz} onReviewQuiz={handleReviewQuiz} />;
        }
    };

    return (
        <div className='flex flex-col items-center min-h-screen w-[100vw]'>
            <div className='w-11/12 pt-34 px-4'>
                {renderContent()}
            </div>
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
        </div>
    );
}

export default function QuizPage() {
    return (
        <AuroraBackground>
            <QuizContent />
        </AuroraBackground>
    );
}
