'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Quiz, Question } from '@/types'
import { Brain, Clock, Award, CheckCircle, X, ChevronRight } from 'lucide-react'

interface QuizGeneratorProps {
  documentId?: string
  documentName?: string
}

export default function QuizGenerator({ documentId, documentName }: QuizGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedQuiz, setGeneratedQuiz] = useState<Quiz | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({})
  const [showResults, setShowResults] = useState(false)
  const [quizConfig, setQuizConfig] = useState({
    questionCount: 5,
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    questionTypes: ['multiple-choice', 'true-false']
  })

  const generateQuiz = async () => {
    if (!documentId) return
    
    setIsGenerating(true)
    
    // Simulate quiz generation
    setTimeout(() => {
      const mockQuiz: Quiz = {
        id: Date.now().toString(),
        title: `Quiz: ${documentName}`,
        description: `Auto-generated quiz based on the content of ${documentName}`,
        documentId,
        difficulty: quizConfig.difficulty,
        totalQuestions: quizConfig.questionCount,
        timeLimit: quizConfig.questionCount * 60, // 1 minute per question
        createdAt: new Date(),
        questions: generateMockQuestions(quizConfig.questionCount)
      }
      
      setGeneratedQuiz(mockQuiz)
      setIsGenerating(false)
      setCurrentQuestionIndex(0)
      setUserAnswers({})
      setShowResults(false)
    }, 2000)
  }

  const generateMockQuestions = (count: number): Question[] => {
    const questions: Question[] = []
    
    for (let i = 0; i < count; i++) {
      const isMultipleChoice = Math.random() > 0.5
      
      if (isMultipleChoice) {
        questions.push({
          id: `q${i + 1}`,
          type: 'multiple-choice',
          question: `What is the main concept discussed in section ${i + 1} of the document?`,
          options: [
            'Option A: First possible answer',
            'Option B: Second possible answer',
            'Option C: Third possible answer',
            'Option D: Fourth possible answer'
          ],
          correctAnswer: 'Option A: First possible answer',
          explanation: 'This is the correct answer based on the document content.',
          points: 10
        })
      } else {
        questions.push({
          id: `q${i + 1}`,
          type: 'true-false',
          question: `The document states that concept ${i + 1} is fundamental to understanding the topic.`,
          options: ['True', 'False'],
          correctAnswer: 'True',
          explanation: 'This statement is supported by evidence in the document.',
          points: 5
        })
      }
    }
    
    return questions
  }

  const handleAnswerSelect = (answer: string) => {
    if (!generatedQuiz) return
    
    const currentQuestion = generatedQuiz.questions[currentQuestionIndex]
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answer
    }))
  }

  const nextQuestion = () => {
    if (!generatedQuiz) return
    
    if (currentQuestionIndex < generatedQuiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else {
      // Quiz completed, show results
      setShowResults(true)
    }
  }

  const calculateScore = () => {
    if (!generatedQuiz) return { score: 0, totalPoints: 0, percentage: 0 }
    
    let score = 0
    let totalPoints = 0
    
    generatedQuiz.questions.forEach(question => {
      totalPoints += question.points
      if (userAnswers[question.id] === question.correctAnswer) {
        score += question.points
      }
    })
    
    return {
      score,
      totalPoints,
      percentage: Math.round((score / totalPoints) * 100)
    }
  }

  const restartQuiz = () => {
    setCurrentQuestionIndex(0)
    setUserAnswers({})
    setShowResults(false)
  }

  if (!documentId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <span>Quiz Generator</span>
          </CardTitle>
          <CardDescription>
            Upload a document first to generate quizzes based on its content.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (showResults) {
    const results = calculateScore()
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="h-5 w-5 text-gold-600" />
            <span>Quiz Results</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {results.percentage}%
            </div>
            <p className="text-gray-600">
              You scored {results.score} out of {results.totalPoints} points
            </p>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-semibold">Question Review:</h3>
            {generatedQuiz?.questions.map((question, index) => {
              const userAnswer = userAnswers[question.id]
              const isCorrect = userAnswer === question.correctAnswer
              
              return (
                <div key={question.id} className="border rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                      isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {isCorrect ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium mb-2">
                        Question {index + 1}: {question.question}
                      </p>
                      <div className="space-y-1 text-sm">
                        <p>
                          <span className="font-medium">Your answer:</span>{' '}
                          <span className={isCorrect ? 'text-green-600' : 'text-red-600'}>
                            {userAnswer || 'Not answered'}
                          </span>
                        </p>
                        {!isCorrect && (
                          <p>
                            <span className="font-medium">Correct answer:</span>{' '}
                            <span className="text-green-600">{question.correctAnswer}</span>
                          </p>
                        )}
                        {question.explanation && (
                          <p className="text-gray-600 mt-2">{question.explanation}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          
          <div className="flex justify-center space-x-4">
            <Button onClick={restartQuiz} variant="outline">
              Retake Quiz
            </Button>
            <Button onClick={() => setGeneratedQuiz(null)}>
              Generate New Quiz
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (generatedQuiz && !showResults) {
    const currentQuestion = generatedQuiz.questions[currentQuestionIndex]
    const progress = ((currentQuestionIndex + 1) / generatedQuiz.questions.length) * 100
    
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-purple-600" />
              <span>{generatedQuiz.title}</span>
            </CardTitle>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>Question {currentQuestionIndex + 1} of {generatedQuiz.questions.length}</span>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">{currentQuestion.question}</h3>
            <div className="space-y-3">
              {currentQuestion.options?.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(option)}
                  className={`w-full text-left p-4 rounded-lg border transition-colors ${
                    userAnswers[currentQuestion.id] === option
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      userAnswers[currentQuestion.id] === option
                        ? 'border-purple-500 bg-purple-500'
                        : 'border-gray-300'
                    }`}>
                      {userAnswers[currentQuestion.id] === option && (
                        <div className="w-full h-full rounded-full bg-white scale-50" />
                      )}
                    </div>
                    <span>{option}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </Button>
            <Button
              onClick={nextQuestion}
              disabled={!userAnswers[currentQuestion.id]}
              className="flex items-center space-x-2"
            >
              <span>
                {currentQuestionIndex === generatedQuiz.questions.length - 1 ? 'Finish Quiz' : 'Next'}
              </span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Brain className="h-5 w-5 text-purple-600" />
          <span>Quiz Generator</span>
        </CardTitle>
        <CardDescription>
          Generate AI-powered quizzes based on your uploaded document: {documentName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Questions
            </label>
            <Input
              type="number"
              min="3"
              max="20"
              value={quizConfig.questionCount}
              onChange={(e) => setQuizConfig(prev => ({
                ...prev,
                questionCount: parseInt(e.target.value) || 5
              }))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Difficulty Level
            </label>
            <select
              value={quizConfig.difficulty}
              onChange={(e) => setQuizConfig(prev => ({
                ...prev,
                difficulty: e.target.value as 'easy' | 'medium' | 'hard'
              }))}
              className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question Types
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={quizConfig.questionTypes.includes('multiple-choice')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setQuizConfig(prev => ({
                        ...prev,
                        questionTypes: [...prev.questionTypes, 'multiple-choice']
                      }))
                    } else {
                      setQuizConfig(prev => ({
                        ...prev,
                        questionTypes: prev.questionTypes.filter(t => t !== 'multiple-choice')
                      }))
                    }
                  }}
                  className="mr-2"
                />
                <span className="text-sm">Multiple Choice</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={quizConfig.questionTypes.includes('true-false')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setQuizConfig(prev => ({
                        ...prev,
                        questionTypes: [...prev.questionTypes, 'true-false']
                      }))
                    } else {
                      setQuizConfig(prev => ({
                        ...prev,
                        questionTypes: prev.questionTypes.filter(t => t !== 'true-false')
                      }))
                    }
                  }}
                  className="mr-2"
                />
                <span className="text-sm">True/False</span>
              </label>
            </div>
          </div>
        </div>
        
        <Button
          onClick={generateQuiz}
          disabled={isGenerating || quizConfig.questionTypes.length === 0}
          className="w-full"
        >
          {isGenerating ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Generating Quiz...</span>
            </div>
          ) : (
            'Generate Quiz'
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
