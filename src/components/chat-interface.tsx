'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Send, Bot, User, FileText, ExternalLink } from 'lucide-react'
import { ChatMessage, Citation } from '@/types'

interface ChatInterfaceProps {
  documentId?: string
  documentName?: string
}

export default function ChatInterface({ documentId, documentName }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: documentId 
        ? `Hello! I'm ready to answer questions about "${documentName}". What would you like to know?`
        : "Hello! Upload a document first, then I can help you analyze and answer questions about it.",
      role: 'assistant',
      timestamp: new Date(),
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputMessage,
      role: 'user',
      timestamp: new Date(),
      documentId
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: generateMockResponse(inputMessage),
        role: 'assistant',
        timestamp: new Date(),
        documentId,
        citations: documentId ? generateMockCitations() : undefined
      }
      
      setMessages(prev => [...prev, aiResponse])
      setIsLoading(false)
    }, 1500)
  }

  const generateMockResponse = (question: string): string => {
    const responses = [
      "Based on the document, I can provide you with the following information...",
      "According to the content I've analyzed, the answer to your question is...",
      "The document mentions several key points related to your query...",
      "From my analysis of the uploaded material, I found that...",
    ]
    return responses[Math.floor(Math.random() * responses.length)]
  }

  const generateMockCitations = (): Citation[] => {
    return [
      {
        id: '1',
        text: "This is a relevant excerpt from the document that supports the answer provided above.",
        page: Math.floor(Math.random() * 10) + 1,
        documentId: documentId!,
        documentName: documentName || "Document",
        confidence: 0.95
      },
      {
        id: '2',
        text: "Another supporting passage that provides additional context and evidence.",
        page: Math.floor(Math.random() * 10) + 1,
        documentId: documentId!,
        documentName: documentName || "Document",
        confidence: 0.87
      }
    ]
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center space-x-2">
          <Bot className="h-5 w-5 text-blue-600" />
          <span>AI Assistant</span>
          {documentName && (
            <span className="text-sm font-normal text-gray-500">
              - {documentName}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex space-x-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.role === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {message.role === 'user' ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className={`rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                  </div>
                  
                  {/* Citations */}
                  {message.citations && message.citations.length > 0 && (
                    <div className="mt-2 space-y-2">
                      <p className="text-xs font-medium text-gray-600">Sources:</p>
                      {message.citations.map((citation) => (
                        <div
                          key={citation.id}
                          className="bg-white border border-gray-200 rounded-md p-3 text-xs"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <FileText className="h-3 w-3 text-gray-400" />
                              <span className="font-medium text-gray-700">
                                {citation.documentName}
                              </span>
                              <span className="text-gray-500">Page {citation.page}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className="text-gray-500">
                                {Math.round(citation.confidence * 100)}%
                              </span>
                              <ExternalLink className="h-3 w-3 text-gray-400" />
                            </div>
                          </div>
                          <p className="text-gray-600 italic">"{citation.text}"</p>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex space-x-3 max-w-[80%]">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input */}
        <div className="border-t p-4">
          <div className="flex space-x-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={documentId ? "Ask a question about this document..." : "Upload a document first to start chatting"}
              disabled={!documentId || isLoading}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || !documentId || isLoading}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
