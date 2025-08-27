'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  BookOpen, 
  FileText, 
  MessageSquare, 
  Brain, 
  Video,
  TrendingUp,
  Clock,
  Award,
  Users,
  BarChart3
} from 'lucide-react'
import Link from 'next/link'

interface DashboardStats {
  totalDocuments: number
  totalQuizzes: number
  totalVideos: number
  studyTime: number
  averageScore: number
  streakDays: number
}

const mockStats: DashboardStats = {
  totalDocuments: 12,
  totalQuizzes: 8,
  totalVideos: 15,
  studyTime: 145, // minutes
  averageScore: 87,
  streakDays: 5
}

const recentActivity = [
  {
    id: 1,
    type: 'document',
    title: 'Uploaded "Introduction to Machine Learning"',
    time: '2 hours ago',
    icon: FileText
  },
  {
    id: 2,
    type: 'quiz',
    title: 'Completed "Data Structures Quiz" - 92%',
    time: '4 hours ago',
    icon: Brain
  },
  {
    id: 3,
    type: 'video',
    title: 'Watched "Neural Networks Explained"',
    time: '1 day ago',
    icon: Video
  },
  {
    id: 4,
    type: 'chat',
    title: 'Asked 5 questions about "Algorithms"',
    time: '2 days ago',
    icon: MessageSquare
  }
]

const quickActions = [
  {
    title: 'Upload Document',
    description: 'Add new study materials',
    href: '/upload',
    icon: FileText,
    color: 'bg-blue-500'
  },
  {
    title: 'Start Chat',
    description: 'Ask AI about your documents',
    href: '/chat',
    icon: MessageSquare,
    color: 'bg-green-500'
  },
  {
    title: 'Generate Quiz',
    description: 'Test your knowledge',
    href: '/quizzes',
    icon: Brain,
    color: 'bg-purple-500'
  },
  {
    title: 'Watch Videos',
    description: 'Educational content',
    href: '/videos',
    icon: Video,
    color: 'bg-red-500'
  }
]

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome to wingman!</h1>
        <p className="text-blue-100">Ready to continue your learning journey?</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{mockStats.totalDocuments}</p>
                <p className="text-xs text-gray-600">Documents</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{mockStats.totalQuizzes}</p>
                <p className="text-xs text-gray-600">Quizzes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Video className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{mockStats.totalVideos}</p>
                <p className="text-xs text-gray-600">Videos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{Math.round(mockStats.studyTime / 60)}h</p>
                <p className="text-xs text-gray-600">Study Time</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Award className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{mockStats.averageScore}%</p>
                <p className="text-xs text-gray-600">Avg Score</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{mockStats.streakDays}</p>
                <p className="text-xs text-gray-600">Day Streak</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with common tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action) => (
                <Link key={action.title} href={action.href}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex flex-col items-center text-center space-y-2">
                        <div className={`p-3 rounded-full ${action.color} text-white`}>
                          <action.icon className="h-6 w-6" />
                        </div>
                        <h3 className="font-semibold text-sm">{action.title}</h3>
                        <p className="text-xs text-gray-600">{action.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest learning activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <activity.icon className="h-4 w-4 text-gray-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button variant="outline" className="w-full">
                View All Activity
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Learning Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Learning Progress</span>
          </CardTitle>
          <CardDescription>Your progress over the last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Documents Read</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
                <span className="text-sm text-gray-600">9/12</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Quizzes Completed</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: '60%' }}></div>
                </div>
                <span className="text-sm text-gray-600">6/10</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Study Goals</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '90%' }}></div>
                </div>
                <span className="text-sm text-gray-600">90%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
