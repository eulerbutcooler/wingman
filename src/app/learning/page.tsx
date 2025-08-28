'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/layout'
import QuizGenerator from '@/components/quiz-generator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Brain, FileText, Trophy, Clock } from 'lucide-react'

const mockDocuments = [
  { id: '1', name: 'Introduction to Machine Learning.pdf' },
  { id: '2', name: 'Data Structures and Algorithms.docx' },
  { id: '3', name: 'Neural Networks Research.pdf' }
]

const mockQuizzes = [
  {
    id: '1',
    title: 'Machine Learning Basics Quiz',
    documentName: 'Introduction to Machine Learning.pdf',
    difficulty: 'medium' as const,
    totalQuestions: 10,
    bestScore: 85,
    createdAt: new Date('2024-03-15')
  },
  {
    id: '2',
    title: 'Data Structures Quiz',
    documentName: 'Data Structures and Algorithms.docx',
    difficulty: 'hard' as const,
    totalQuestions: 15,
    bestScore: 92,
    createdAt: new Date('2024-03-14')
  }
]

export default function QuizzesPage() {
  const [selectedDocument, setSelectedDocument] = useState<{ id: string; name: string } | null>(null)
  const [showGenerator, setShowGenerator] = useState(false)

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'text-green-600 bg-green-100'
      case 'medium':
        return 'text-yellow-600 bg-yellow-100'
      case 'hard':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quizzes</h1>
            <p className="text-gray-600 mt-2">Generate and take AI-powered quizzes based on your documents</p>
          </div>
          <Button 
            onClick={() => setShowGenerator(!showGenerator)}
            className="flex items-center space-x-2"
          >
            <Brain className="h-4 w-4" />
            <span>Generate Quiz</span>
          </Button>
        </div>

        {showGenerator && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Document Selection */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Select Document</CardTitle>
                  <CardDescription>Choose a document to generate quiz from</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {mockDocuments.map((doc) => (
                    <Button
                      key={doc.id}
                      variant={selectedDocument?.id === doc.id ? "default" : "outline"}
                      className="w-full justify-start text-left h-auto p-3"
                      onClick={() => setSelectedDocument(doc)}
                    >
                      <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{doc.name}</span>
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Quiz Generator */}
            <div className="lg:col-span-3">
              <QuizGenerator 
                documentId={selectedDocument?.id}
                documentName={selectedDocument?.name}
              />
            </div>
          </div>
        )}

        {/* Existing Quizzes */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Your Quizzes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockQuizzes.map((quiz) => (
              <Card key={quiz.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate">{quiz.title}</span>
                    <Brain className="h-5 w-5 text-purple-600 flex-shrink-0" />
                  </CardTitle>
                  <CardDescription className="truncate">
                    {quiz.documentName}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Difficulty:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(quiz.difficulty)}`}>
                        {quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Questions:</span>
                      <span className="font-medium">{quiz.totalQuestions}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Best Score:</span>
                      <div className="flex items-center space-x-1">
                        <Trophy className="h-3 w-3 text-yellow-500" />
                        <span className="font-medium">{quiz.bestScore}%</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Created:</span>
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {quiz.createdAt.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 mt-4">
                    <Button size="sm" className="flex-1">
                      Take Quiz
                    </Button>
                    <Button size="sm" variant="outline">
                      View Results
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {mockQuizzes.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No quizzes yet</h3>
                <p className="text-gray-600 mb-4">Generate your first quiz from an uploaded document</p>
                <Button onClick={() => setShowGenerator(true)}>
                  Generate Quiz
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
