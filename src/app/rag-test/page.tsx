'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Loader2, MessageCircle, FileText, Search, Database } from 'lucide-react'

interface ChatResponse {
  success: boolean
  response?: string
  error?: string
  sources?: Array<{
    id: string
    index: number
    similarity: number
    preview: string
    chunkIndex: number
    fileId: string
  }>
  metadata?: {
    query: string
    courseId: string
    sourcesFound: number
    hasRelevantContext: boolean
    courseStats: {
      indexedFiles: number
      totalChunks: number
      avgChunkTokens: number
    }
  }
}

interface CourseStats {
  indexedFiles: number
  totalChunks: number
  avgChunkTokens: number
  firstIndexed: string | null
  lastIndexed: string | null
  isReady: boolean
}

export default function RAGTestPage() {
  const [courseId, setCourseId] = useState('')
  const [question, setQuestion] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState<ChatResponse | null>(null)
  const [courseStats, setCourseStats] = useState<CourseStats | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(false)

  const checkCourseStats = async () => {
    if (!courseId) return
    
    setIsLoadingStats(true)
    try {
      const res = await fetch(`/api/chat/rag?courseId=${courseId}`)
      const data = await res.json()
      
      if (data.success) {
        setCourseStats({ ...data.stats, isReady: data.isReady })
      }
    } catch (error) {
      console.error('Error checking course stats:', error)
    } finally {
      setIsLoadingStats(false)
    }
  }

  const askQuestion = async () => {
    if (!courseId || !question) return
    
    setIsLoading(true)
    try {
      const res = await fetch('/api/chat/rag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: question,
          courseId,
          maxSources: 5
        })
      })
      
      const data = await res.json()
      setResponse(data)
    } catch (error) {
      console.error('Error asking question:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            RAG System Test
          </h1>
          <p className="text-lg text-gray-600">
            Test the Retrieval-Augmented Generation system with your course materials
          </p>
        </div>

        {/* Course Setup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Course Configuration
            </CardTitle>
            <CardDescription>
              Enter a course ID to test RAG functionality
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Input
                placeholder="Course ID (UUID)"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={checkCourseStats}
                disabled={!courseId || isLoadingStats}
                variant="outline"
              >
                {isLoadingStats ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                Check Status
              </Button>
            </div>

            {courseStats && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Course Index Status</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Indexed Files</p>
                    <p className="font-medium">{courseStats.indexedFiles}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Total Chunks</p>
                    <p className="font-medium">{courseStats.totalChunks}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Avg Tokens</p>
                    <p className="font-medium">{courseStats.avgChunkTokens}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Status</p>
                    <p className={`font-medium ${courseStats.isReady ? 'text-green-600' : 'text-red-600'}`}>
                      {courseStats.isReady ? 'Ready' : 'Not Ready'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat Interface */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Ask a Question
            </CardTitle>
            <CardDescription>
              Ask questions about the course materials
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="What would you like to know about the course materials?"
              value={question}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setQuestion(e.target.value)}
              rows={3}
            />
            <Button 
              onClick={askQuestion}
              disabled={!courseId || !question || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <MessageCircle className="h-4 w-4 mr-2" />
              )}
              Ask Question
            </Button>
          </CardContent>
        </Card>

        {/* Response */}
        {response && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                AI Response
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {response.success ? (
                <>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="whitespace-pre-wrap">{response.response}</p>
                  </div>

                  {response.sources && response.sources.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Sources ({response.sources.length})
                      </h4>
                      <div className="space-y-2">
                        {response.sources.map((source) => (
                          <div key={source.id} className="p-3 bg-gray-50 border rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-sm font-medium">Source {source.index}</span>
                              <span className="text-xs text-gray-500">
                                Similarity: {Math.round(source.similarity * 100)}%
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">{source.preview}</p>
                            <div className="text-xs text-gray-500 mt-1">
                              Chunk {source.chunkIndex} • File ID: {source.fileId.slice(0, 8)}...
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {response.metadata && (
                    <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded">
                      <strong>Query Stats:</strong> Found {response.metadata.sourcesFound} sources • 
                      Course has {response.metadata.courseStats.indexedFiles} indexed files with {response.metadata.courseStats.totalChunks} total chunks
                    </div>
                  )}
                </>
              ) : (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700">Error: {response.error || 'Unknown error'}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Test</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Upload some documents (PDF, DOCX, PPTX) to a course</li>
              <li>Wait for processing to complete (check the files table for processing_status)</li>
              <li>Enter the course ID above and check status</li>
              <li>Ask questions about the uploaded content</li>
              <li>Review the AI response and source citations</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
