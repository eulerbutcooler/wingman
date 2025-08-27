import DashboardLayout from '@/components/layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { User, Mail, Calendar, Award, BookOpen, Brain, Video } from 'lucide-react'

const mockUserData = {
  name: 'Alex Johnson',
  email: 'alex.johnson@example.com',
  joinDate: 'March 15, 2024',
  avatar: null,
  stats: {
    documentsUploaded: 12,
    quizzesCompleted: 8,
    videosWatched: 15,
    totalStudyTime: 145,
    averageScore: 87,
    currentStreak: 5
  }
}

export default function ProfilePage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600 mt-2">Manage your profile information and view your learning statistics</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Profile Information</span>
                </CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {mockUserData.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <Button variant="outline" size="sm">Change Avatar</Button>
                    <p className="text-sm text-gray-500 mt-1">JPG, PNG up to 2MB</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <Input defaultValue={mockUserData.name} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <Input type="email" defaultValue={mockUserData.email} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea 
                    className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="Tell us about yourself and your learning goals..."
                  />
                </div>

                <div className="flex space-x-4">
                  <Button>Save Changes</Button>
                  <Button variant="outline">Cancel</Button>
                </div>
              </CardContent>
            </Card>

            {/* Learning Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="h-5 w-5" />
                  <span>Achievements</span>
                </CardTitle>
                <CardDescription>Your learning milestones and badges</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <Award className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                    <p className="font-semibold text-yellow-900">First Quiz</p>
                    <p className="text-xs text-yellow-700">Completed your first quiz</p>
                  </div>

                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <BookOpen className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="font-semibold text-blue-900">Document Master</p>
                    <p className="text-xs text-blue-700">Uploaded 10+ documents</p>
                  </div>

                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <Brain className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <p className="font-semibold text-purple-900">Quiz Ace</p>
                    <p className="text-xs text-purple-700">90%+ average score</p>
                  </div>

                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Video className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="font-semibold text-green-900">Video Learner</p>
                    <p className="text-xs text-green-700">Watched 10+ videos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
                <CardDescription>Your learning at a glance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Documents</span>
                  <span className="font-semibold">{mockUserData.stats.documentsUploaded}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Quizzes</span>
                  <span className="font-semibold">{mockUserData.stats.quizzesCompleted}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Videos</span>
                  <span className="font-semibold">{mockUserData.stats.videosWatched}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Study Time</span>
                  <span className="font-semibold">{Math.round(mockUserData.stats.totalStudyTime / 60)}h</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Avg Score</span>
                  <span className="font-semibold">{mockUserData.stats.averageScore}%</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Current Streak</span>
                  <span className="font-semibold">{mockUserData.stats.currentStreak} days</span>
                </div>
              </CardContent>
            </Card>

            {/* Account Info */}
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Your account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-gray-600">{mockUserData.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Member Since</p>
                    <p className="text-sm text-gray-600">{mockUserData.joinDate}</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button variant="outline" size="sm" className="w-full">
                    Download My Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
