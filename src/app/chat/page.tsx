'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/layout'
import ChatInterface from '@/components/chat-interface'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, MessageSquare } from 'lucide-react'

const mockDocuments = [
  { id: '1', name: 'Introduction to Machine Learning.pdf' },
  { id: '2', name: 'Data Structures and Algorithms.docx' },
  { id: '3', name: 'Neural Networks Research.pdf' }
]

export default function ChatPage() {
  const [selectedDocument, setSelectedDocument] = useState<{ id: string; name: string } | null>(null)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Chat Assistant</h1>
          <p className="text-gray-600 mt-2">Ask questions about your uploaded documents and get AI-powered answers</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Document Selection */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Select Document</CardTitle>
                <CardDescription>Choose a document to chat about</CardDescription>
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
                
                {mockDocuments.length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">No documents uploaded yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-3">
            <ChatInterface 
              documentId={selectedDocument?.id}
              documentName={selectedDocument?.name}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
