import DashboardLayout from '@/components/layout'
import DocumentUploader from '@/components/document-uploader'

export default function UploadPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Upload Documents</h1>
          <p className="text-gray-600 mt-2">Upload your study materials to start analyzing them with AI</p>
        </div>
        
        <DocumentUploader />
      </div>
    </DashboardLayout>
  )
}
