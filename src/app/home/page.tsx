import DashboardLayout from '@/components/layout'
import VideoIntegration from '@/components/video-integration'

export default function VideosPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Educational Videos</h1>
          <p className="text-gray-600 mt-2">Discover and watch educational videos to supplement your learning</p>
        </div>
        
        <VideoIntegration />
      </div>
    </DashboardLayout>
  )
}
