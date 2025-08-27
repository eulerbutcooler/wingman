import DashboardLayout from '@/components/layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Upload, Eye, Download, Trash2, Calendar } from 'lucide-react'

const mockDocuments = [
  {
    id: '1',
    name: 'Introduction to Machine Learning.pdf',
    type: 'pdf' as const,
    size: 2.5,
    uploadedAt: new Date('2024-03-15'),
    status: 'ready' as const,
    pageCount: 45
  },
  {
    id: '2',
    name: 'Data Structures and Algorithms.docx',
    type: 'docx' as const,
    size: 1.8,
    uploadedAt: new Date('2024-03-14'),
    status: 'ready' as const,
    pageCount: 32
  },
  {
    id: '3',
    name: 'Neural Networks Research.pdf',
    type: 'pdf' as const,
    size: 3.2,
    uploadedAt: new Date('2024-03-13'),
    status: 'processing' as const,
    pageCount: 56
  }
]

export default function DocumentsPage() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'text-green-600 bg-green-100'
      case 'processing':
        return 'text-yellow-600 bg-yellow-100'
      case 'error':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getFileIcon = (type: string) => {
    return <FileText className="h-8 w-8 text-blue-500" />
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
            <p className="text-gray-600 mt-2">Manage your uploaded documents and study materials</p>
          </div>
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {mockDocuments.map((document) => (
            <Card key={document.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {getFileIcon(document.type)}
                    <div>
                      <h3 className="font-semibold text-lg">{document.name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                        <span>{document.size} MB</span>
                        <span>{document.pageCount} pages</span>
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {document.uploadedAt.toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(document.status)}`}>
                      {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
                    </span>
                    
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {mockDocuments.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No documents yet</h3>
              <p className="text-gray-600 mb-4">Get started by uploading your first document</p>
              <Button>Upload Document</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
