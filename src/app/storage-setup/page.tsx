'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, AlertCircle, Settings, Database, Upload, RefreshCw } from 'lucide-react'

interface SetupStatus {
  setup: boolean
  message: string
  bucket?: {
    id: string
    name: string
    public: boolean
    createdAt: string
    updatedAt: string
  }
  accessible?: boolean
  accessError?: string | null
  endpoints?: {
    upload: string
    bucketUrl: string
  }
}

export default function StorageSetupPage() {
  const [setupStatus, setSetupStatus] = useState<SetupStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isChecking, setIsChecking] = useState(false)

  const checkSetupStatus = async () => {
    setIsChecking(true)
    try {
      const response = await fetch('/api/setup-storage', {
        method: 'GET'
      })
      const result = await response.json()
      setSetupStatus(result)
    } catch (error) {
      console.error('Error checking setup status:', error)
      setSetupStatus({
        setup: false,
        message: 'Failed to check setup status'
      })
    } finally {
      setIsChecking(false)
    }
  }

  const runSetup = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/setup-storage', {
        method: 'POST'
      })
      const result = await response.json()
      setSetupStatus(result)
    } catch (error) {
      console.error('Error running setup:', error)
      setSetupStatus({
        setup: false,
        message: 'Failed to run setup'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = () => {
    if (!setupStatus) return <Settings className="h-8 w-8 text-gray-400" />
    if (setupStatus.setup && setupStatus.accessible !== false) {
      return <CheckCircle className="h-8 w-8 text-green-500" />
    }
    return <AlertCircle className="h-8 w-8 text-red-500" />
  }

  const getStatusColor = () => {
    if (!setupStatus) return 'border-gray-200'
    if (setupStatus.setup && setupStatus.accessible !== false) {
      return 'border-green-200 bg-green-50'
    }
    return 'border-red-200 bg-red-50'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Supabase Storage Setup
          </h1>
          <p className="text-lg text-gray-600">
            Set up your file storage system for the Wingman platform
          </p>
        </div>

        <Card className={`${getStatusColor()} transition-colors`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              {getStatusIcon()}
              Storage Status
            </CardTitle>
            <CardDescription>
              Check and configure your Supabase Storage bucket
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {setupStatus && (
              <div className="p-4 rounded-lg bg-white border">
                <p className="font-medium text-gray-900 mb-2">
                  {setupStatus.message}
                </p>
                
                {setupStatus.bucket && (
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Bucket ID:</strong> {setupStatus.bucket.id}</p>
                    <p><strong>Public:</strong> {setupStatus.bucket.public ? 'Yes' : 'No'}</p>
                    <p><strong>Created:</strong> {new Date(setupStatus.bucket.createdAt).toLocaleDateString()}</p>
                  </div>
                )}

                {setupStatus.endpoints && (
                  <div className="mt-3 text-sm text-gray-600">
                    <p><strong>Upload Endpoint:</strong> {setupStatus.endpoints.upload}</p>
                    <p><strong>Bucket URL:</strong> {setupStatus.endpoints.bucketUrl}</p>
                  </div>
                )}

                {setupStatus.accessError && (
                  <div className="mt-3 p-2 bg-yellow-100 border border-yellow-300 rounded text-sm text-yellow-800">
                    <strong>Access Warning:</strong> {setupStatus.accessError}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-4">
              <Button 
                onClick={checkSetupStatus}
                disabled={isChecking}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
                Check Status
              </Button>
              
              <Button 
                onClick={runSetup}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Database className={`h-4 w-4 ${isLoading ? 'animate-pulse' : ''}`} />
                {isLoading ? 'Setting up...' : 'Run Setup'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Supported File Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-900">Videos</h4>
                  <p className="text-sm text-gray-600">MP4, WebM, MOV, AVI</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Documents</h4>
                  <p className="text-sm text-gray-600">PDF, DOCX, DOC</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Presentations</h4>
                  <p className="text-sm text-gray-600">PPTX, PPT, PPSX</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Images</h4>
                  <p className="text-sm text-gray-600">JPEG, PNG, WebP</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Setup Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div>
                  <h4 className="font-medium text-gray-900">What this setup does:</h4>
                  <ul className="list-disc list-inside text-gray-600 mt-1 space-y-1">
                    <li>Creates the 'wingman-files' storage bucket</li>
                    <li>Configures public access for course content</li>
                    <li>Sets up proper file type restrictions</li>
                    <li>Enables 100MB file size limit</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Requirements:</h4>
                  <ul className="list-disc list-inside text-gray-600 mt-1 space-y-1">
                    <li>Valid Supabase service role key</li>
                    <li>Storage admin permissions</li>
                    <li>Active Supabase project</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {setupStatus?.setup && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800">
                ✅ Setup Complete!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-green-700 mb-4">
                Your Supabase Storage is now configured and ready to use. You can now:
              </p>
              <ul className="list-disc list-inside text-green-700 space-y-1">
                <li>Upload files through the course creator</li>
                <li>Use the document uploader component</li>
                <li>Store course materials in organized folders</li>
                <li>Access files through public URLs</li>
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
