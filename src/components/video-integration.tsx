'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { YouTubeVideo } from '@/types'
import { Play, Search, BookOpen, Clock, Eye, ThumbsUp } from 'lucide-react'

interface VideoPlayerProps {
  videoId: string
  onClose: () => void
}

function VideoPlayer({ videoId, onClose }: VideoPlayerProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">Video Player</h3>
          <Button variant="ghost" onClick={onClose}>
            ×
          </Button>
        </div>
        <div className="aspect-video">
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${videoId}`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </div>
    </div>
  )
}

export default function VideoIntegration() {
  const [searchQuery, setSearchQuery] = useState('')
  const [videos, setVideos] = useState<YouTubeVideo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null)
  const [recommendedVideos, setRecommendedVideos] = useState<YouTubeVideo[]>([])

  // Mock data for demonstration
  const mockVideos: YouTubeVideo[] = [
    {
      id: 'dQw4w9WgXcQ',
      title: 'Introduction to Machine Learning Fundamentals',
      description: 'Learn the basics of machine learning, including supervised and unsupervised learning, algorithms, and practical applications.',
      thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      duration: '15:42',
      channelTitle: 'ML Academy',
      publishedAt: new Date('2024-01-15'),
      relatedTopics: ['machine learning', 'AI', 'algorithms'],
      transcript: 'Sample transcript content...'
    },
    {
      id: 'jNQXAC9IVRw',
      title: 'Data Structures and Algorithms Explained',
      description: 'Complete guide to understanding data structures like arrays, linked lists, trees, and common algorithms.',
      thumbnailUrl: 'https://img.youtube.com/vi/jNQXAC9IVRw/maxresdefault.jpg',
      duration: '22:15',
      channelTitle: 'Code Academy',
      publishedAt: new Date('2024-02-10'),
      relatedTopics: ['data structures', 'algorithms', 'programming'],
      transcript: 'Sample transcript content...'
    },
    {
      id: 'y8Yv4pnO7qc',
      title: 'Neural Networks Deep Dive',
      description: 'Advanced concepts in neural networks, backpropagation, and deep learning architectures.',
      thumbnailUrl: 'https://img.youtube.com/vi/y8Yv4pnO7qc/maxresdefault.jpg',
      duration: '28:33',
      channelTitle: 'Deep Learning Hub',
      publishedAt: new Date('2024-03-05'),
      relatedTopics: ['neural networks', 'deep learning', 'AI'],
      transcript: 'Sample transcript content...'
    }
  ]

  useEffect(() => {
    // Load recommended videos on component mount
    setRecommendedVideos(mockVideos)
  }, [])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    setIsLoading(true)
    
    // Simulate API call
    setTimeout(() => {
      // Filter mock videos based on search query
      const filteredVideos = mockVideos.filter(video =>
        video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.relatedTopics.some(topic => 
          topic.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
      
      setVideos(filteredVideos)
      setIsLoading(false)
    }, 1000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const formatDuration = (duration: string) => {
    return duration // Already formatted in mock data
  }

  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M views`
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K views`
    }
    return `${views} views`
  }

  const VideoCard = ({ video }: { video: YouTubeVideo }) => (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative">
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="w-full h-48 object-cover"
        />
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
          {formatDuration(video.duration)}
        </div>
        <button
          onClick={() => setSelectedVideoId(video.id)}
          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-30 transition-all group"
        >
          <Play className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-semibold text-sm mb-2 line-clamp-2">{video.title}</h3>
        <p className="text-xs text-gray-600 mb-2">{video.channelTitle}</p>
        <p className="text-xs text-gray-500 line-clamp-2 mb-3">{video.description}</p>
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{formatViews(Math.floor(Math.random() * 1000000))}</span>
          <span>{video.publishedAt.toLocaleDateString()}</span>
        </div>
        
        <div className="flex flex-wrap gap-1 mt-2">
          {video.relatedTopics.slice(0, 3).map((topic, index) => (
            <span
              key={index}
              className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
            >
              {topic}
            </span>
          ))}
        </div>
        
        <div className="flex space-x-2 mt-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSelectedVideoId(video.id)}
            className="flex-1"
          >
            <Play className="h-3 w-3 mr-1" />
            Watch
          </Button>
          <Button size="sm" variant="outline">
            <BookOpen className="h-3 w-3 mr-1" />
            Notes
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5 text-blue-600" />
            <span>Educational Videos</span>
          </CardTitle>
          <CardDescription>
            Search for educational videos related to your study topics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input
              placeholder="Search for educational videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={isLoading}>
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {videos.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Search Results</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </div>
      )}

      {/* Recommended Videos */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          {videos.length > 0 ? 'More Recommendations' : 'Recommended for You'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendedVideos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      </div>

      {/* Study Playlists */}
      <Card>
        <CardHeader>
          <CardTitle>Study Playlists</CardTitle>
          <CardDescription>
            Curated video playlists for different topics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'Machine Learning Basics', count: 12, duration: '3h 45m' },
              { name: 'Data Structures', count: 8, duration: '2h 30m' },
              { name: 'Algorithms', count: 15, duration: '4h 20m' },
              { name: 'Deep Learning', count: 10, duration: '5h 15m' },
              { name: 'Programming Fundamentals', count: 20, duration: '6h 30m' },
              { name: 'Mathematics for CS', count: 18, duration: '7h 10m' }
            ].map((playlist, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">{playlist.name}</h3>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{playlist.count} videos</span>
                    <span className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {playlist.duration}
                    </span>
                  </div>
                  <Button size="sm" variant="outline" className="w-full mt-3">
                    View Playlist
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Video Player Modal */}
      {selectedVideoId && (
        <VideoPlayer
          videoId={selectedVideoId}
          onClose={() => setSelectedVideoId(null)}
        />
      )}
    </div>
  )
}
