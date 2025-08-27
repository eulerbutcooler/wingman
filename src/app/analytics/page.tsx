import DashboardLayout from '@/components/layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, TrendingUp, Clock, Award, BookOpen, Brain, Video, Target } from 'lucide-react'

const mockAnalytics = {
  studyTime: {
    thisWeek: 18.5,
    lastWeek: 15.2,
    change: 21.7
  },
  documentsRead: {
    thisWeek: 8,
    lastWeek: 6,
    change: 33.3
  },
  quizzesTaken: {
    thisWeek: 5,
    lastWeek: 3,
    change: 66.7
  },
  averageScore: {
    thisWeek: 87,
    lastWeek: 82,
    change: 6.1
  }
}

const weeklyProgress = [
  { day: 'Mon', studyTime: 2.5, quizzes: 1, score: 85 },
  { day: 'Tue', studyTime: 3.2, quizzes: 0, score: 0 },
  { day: 'Wed', studyTime: 2.8, quizzes: 2, score: 92 },
  { day: 'Thu', studyTime: 4.1, quizzes: 1, score: 88 },
  { day: 'Fri', studyTime: 3.5, quizzes: 1, score: 90 },
  { day: 'Sat', studyTime: 1.8, quizzes: 0, score: 0 },
  { day: 'Sun', studyTime: 0.6, quizzes: 0, score: 0 }
]

const topSubjects = [
  { subject: 'Machine Learning', time: 8.5, progress: 75 },
  { subject: 'Data Structures', time: 6.2, progress: 60 },
  { subject: 'Algorithms', time: 3.8, progress: 45 },
  { subject: 'Neural Networks', time: 2.1, progress: 30 }
]

export default function AnalyticsPage() {
  const formatChange = (change: number) => {
    const isPositive = change >= 0
    return {
      value: Math.abs(change).toFixed(1),
      isPositive,
      color: isPositive ? 'text-green-600' : 'text-red-600',
      bgColor: isPositive ? 'bg-green-100' : 'bg-red-100'
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Learning Analytics</h1>
          <p className="text-gray-600 mt-2">Track your progress and learning insights</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Study Time</p>
                  <p className="text-2xl font-bold">{mockAnalytics.studyTime.thisWeek}h</p>
                  <div className="flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                    <span className="text-xs text-green-600">
                      +{formatChange(mockAnalytics.studyTime.change).value}% from last week
                    </span>
                  </div>
                </div>
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Documents Read</p>
                  <p className="text-2xl font-bold">{mockAnalytics.documentsRead.thisWeek}</p>
                  <div className="flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                    <span className="text-xs text-green-600">
                      +{formatChange(mockAnalytics.documentsRead.change).value}% from last week
                    </span>
                  </div>
                </div>
                <BookOpen className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Quizzes Taken</p>
                  <p className="text-2xl font-bold">{mockAnalytics.quizzesTaken.thisWeek}</p>
                  <div className="flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                    <span className="text-xs text-green-600">
                      +{formatChange(mockAnalytics.quizzesTaken.change).value}% from last week
                    </span>
                  </div>
                </div>
                <Brain className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Score</p>
                  <p className="text-2xl font-bold">{mockAnalytics.averageScore.thisWeek}%</p>
                  <div className="flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                    <span className="text-xs text-green-600">
                      +{formatChange(mockAnalytics.averageScore.change).value}% from last week
                    </span>
                  </div>
                </div>
                <Award className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Progress Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Weekly Progress</span>
              </CardTitle>
              <CardDescription>Your daily study activities this week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {weeklyProgress.map((day) => (
                  <div key={day.day} className="flex items-center space-x-4">
                    <div className="w-8 text-sm font-medium text-gray-600">{day.day}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span>Study Time: {day.studyTime}h</span>
                        <span>Quizzes: {day.quizzes}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${(day.studyTime / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-12 text-right text-xs">
                      {day.score > 0 ? `${day.score}%` : '-'}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Subjects */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>Subject Progress</span>
              </CardTitle>
              <CardDescription>Time spent on different subjects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topSubjects.map((subject) => (
                  <div key={subject.subject}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{subject.subject}</span>
                      <span className="text-sm text-gray-600">{subject.time}h</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                        style={{ width: `${subject.progress}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{subject.progress}% complete</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Learning Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Learning Insights</CardTitle>
            <CardDescription>Personalized recommendations based on your activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900">Study Streak</span>
                </div>
                <p className="text-sm text-blue-700">
                  You&apos;ve studied for 5 consecutive days! Keep it up to maintain your momentum.
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Award className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-900">Top Performer</span>
                </div>
                <p className="text-sm text-green-700">
                  Your quiz scores have improved by 15% this week. Excellent progress!
                </p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Video className="h-4 w-4 text-purple-600" />
                  <span className="font-medium text-purple-900">Recommendation</span>
                </div>
                <p className="text-sm text-purple-700">
                  Try watching videos on Neural Networks to complement your reading materials.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
