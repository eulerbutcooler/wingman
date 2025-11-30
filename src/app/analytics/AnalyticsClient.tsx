"use client";

import { useState } from "react";
import {
  getStudentDetailedAnalytics,
  StudentAnalytics,
  StudentDetailedAnalytics,
} from "@/lib/actions/analytics/analytics-actions";
import { Users, Award, Clock, TrendingUp, X } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { MultiStepLoader } from "@/components/ui/multi-step-loader";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface AnalyticsClientProps {
  initialStudents: StudentAnalytics[];
}

export default function AnalyticsClient({ initialStudents }: AnalyticsClientProps) {
  const [students] = useState<StudentAnalytics[]>(initialStudents);
  const [selectedStudent, setSelectedStudent] =
    useState<StudentDetailedAnalytics | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingStudentId, setLoadingStudentId] = useState<number | null>(null);

  const handleStudentClick = async (studentId: number) => {
    setLoadingStudentId(studentId);
    try {
      const details = await getStudentDetailedAnalytics(studentId);
      if (details) {
        setSelectedStudent(details);
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error("Error fetching student details:", error);
    } finally {
      setLoadingStudentId(null);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedStudent(null);
  };

  return (
    <div className="flex flex-col items-center min-h-screen w-full scrollbar-hide relative overflow-hidden">
      <div className="fixed inset-0 bg-[url('/scketch.jpeg')] bg-cover bg-center"></div>
      <div className="fixed inset-0 bg-white/40 backdrop-blur-sm"></div>
      <div className="relative z-10 w-full md:w-11/12 mb-10 md:mb-14 px-4 md:px-6 pt-24 md:pt-34">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Student Analytics
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            Overview of all enrolled students and their performance
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-4xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-black rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-600">
                  Total Students
                </p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">
                  {students.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-4xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-green-600 rounded-xl flex items-center justify-center">
                <Award className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-600">
                  Average Score
                </p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">
                  {students.length > 0
                    ? Math.round(
                        students.reduce(
                          (sum, student) => sum + student.averageScore,
                          0
                        ) / students.length
                      )
                    : 0}
                  %
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-4xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-600">
                  Total Quizzes
                </p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">
                  {students.reduce(
                    (sum, student) => sum + student.totalQuizzes,
                    0
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Student Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
          {students.map((student) => {
            const isLoading = loadingStudentId === student.id;
            return (
              <div
                key={student.id}
                className="bg-white p-4 md:p-6 rounded-2xl md:rounded-4xl border border-gray-200 shadow-sm cursor-pointer relative"
                onClick={() => !isLoading && handleStudentClick(student.id)}
              >
                {isLoading && (
                  <div className="absolute inset-0 bg-white/50 backdrop-blur-sm rounded-2xl md:rounded-4xl z-20 flex items-center justify-center overflow-hidden">
                    <div className="scale-75 origin-center -mt-20">
                      <MultiStepLoader
                        loading={isLoading}
                        loadingStates={[
                          { text: "Loading student..." },
                          { text: "Fetching history..." },
                          { text: "Almost ready..." },
                          { text: "Loading student..." },
                          { text: "Fetching history..." },
                          { text: "Almost ready..." },
                          { text: "Loading student..." },
                          { text: "Fetching history..." },
                          { text: "Almost ready..." },
                          { text: "Loading student..." },
                          { text: "Fetching history..." },
                          { text: "Almost ready..." },
                        ]}
                        duration={800}
                        loop={true}
                      />
                    </div>
                  </div>
                )}
              {/* Student Avatar */}
              <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r from-navy to-blue-600 rounded-xl flex items-center justify-center mb-3 md:mb-4">
                <span className="text-lg md:text-2xl font-bold text-white">
                  {student.name.charAt(0).toUpperCase()}
                </span>
              </div>

              {/* Student Info */}
              <h3 className="text-base md:text-lg font-bold text-gray-900 mb-1">
                {student.name}
              </h3>
              <p className="text-xs md:text-sm text-gray-600 mb-3 truncate">
                {student.serviceId || student.email}
              </p>

              {/* Stats */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs md:text-sm">
                  <span className="text-gray-600">Course:</span>
                  <span className="font-semibold text-gray-900 truncate ml-2">
                    {student.course || "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs md:text-sm">
                  <span className="text-gray-600">Quizzes:</span>
                  <span className="font-semibold text-gray-900">
                    {student.totalQuizzes}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs md:text-sm">
                  <span className="text-gray-600">Avg Score:</span>
                  <span className="font-semibold text-green-600">
                    {Math.round(student.averageScore)}%
                  </span>
                </div>
              </div>

              {/* Last Activity */}
              {student.lastActivityAt && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Clock className="w-3 h-3" />
                    <span>
                      Last activity:{" "}
                      {new Date(student.lastActivityAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
          })}
        </div>

        {/* Empty State */}
        {students.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No Students Yet
            </h3>
            <p className="text-gray-600">
              Student analytics will appear here once users start enrolling.
            </p>
          </div>
        )}
      </div>

      {/* Student Detail Modal */}
      {isModalOpen && selectedStudent && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl md:rounded-4xl max-w-4xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide border border-gray-200 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm p-6 border-b border-gray-200 flex items-center justify-between rounded-t-2xl md:rounded-t-4xl">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-r from-navy to-blue-600 rounded-xl flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {selectedStudent.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedStudent.name}
                  </h2>
                  <p className="text-gray-600">{selectedStudent.serviceId || selectedStudent.email}</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Overview Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">
                    Total Quizzes
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {selectedStudent.totalQuizzes}
                  </p>
                </div>
                <div className="bg-green-50 border border-green-200 p-4 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">
                    Average Score
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {Math.round(selectedStudent.averageScore)}%
                  </p>
                </div>
                <div className="bg-purple-50 border border-purple-200 p-4 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">
                    Courses Enrolled
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {selectedStudent.coursesEnrolled.length}
                  </p>
                </div>
              </div>

              {/* Quiz Attempts */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Quiz History
                </h3>
                <div className="space-y-3">
                  {selectedStudent.quizAttempts.length > 0 ? (
                    selectedStudent.quizAttempts.map((attempt) => (
                      <div
                        key={attempt.id}
                        className="p-4 bg-gray-50 border border-gray-200 rounded-xl hover:border-gray-400 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">
                            {attempt.quizTitle}
                          </h4>
                          <span
                            className={`text-lg font-bold ${
                              attempt.percentage >= 70
                                ? "text-green-600"
                                : attempt.percentage >= 50
                                ? "text-yellow-600"
                                : "text-red-600"
                            }`}
                          >
                            {Math.round(attempt.percentage)}%
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>
                            Score: {attempt.score}/{attempt.totalQuestions}
                          </span>
                          {attempt.completedAt && (
                            <span>
                              {new Date(attempt.completedAt).toLocaleDateString()}
                            </span>
                          )}
                          {attempt.timeSpent && (
                            <span>{Math.round(attempt.timeSpent / 60)} min</span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-600 text-center py-4">
                      No quiz attempts yet
                    </p>
                  )}
                </div>
              </div>

              {/* Performance Chart */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Performance Over Time
                </h3>
                {selectedStudent.quizAttempts.length > 0 ? (
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <Line
                      data={{
                        labels: selectedStudent.quizAttempts
                          .slice()
                          .reverse()
                          .map((attempt) =>
                            attempt.completedAt
                              ? new Date(attempt.completedAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : 'N/A'
                          ),
                        datasets: [
                          {
                            label: 'Score (%)',
                            data: selectedStudent.quizAttempts
                              .slice()
                              .reverse()
                              .map((attempt) => Math.round(attempt.percentage)),
                            borderColor: 'rgb(59, 130, 246)',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            fill: true,
                            tension: 0.4,
                            pointRadius: 6,
                            pointHoverRadius: 8,
                            pointBackgroundColor: 'rgb(59, 130, 246)',
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: true,
                        aspectRatio: 2,
                        plugins: {
                          legend: {
                            display: false,
                          },
                          title: {
                            display: false,
                          },
                          tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            padding: 12,
                            titleFont: {
                              size: 14,
                              weight: 'bold',
                            },
                            bodyFont: {
                              size: 13,
                            },
                            callbacks: {
                              label: function (context) {
                                return `Score: ${context.parsed.y}%`;
                              },
                            },
                          },
                        },
                        scales: {
                          x: {
                            title: {
                              display: true,
                              text: 'Quiz Date',
                              font: {
                                size: 12,
                                weight: 'bold',
                              },
                            },
                            grid: {
                              display: false,
                            },
                          },
                          y: {
                            beginAtZero: true,
                            max: 100,
                            title: {
                              display: true,
                              text: 'Score (%)',
                              font: {
                                size: 12,
                                weight: 'bold',
                              },
                            },
                            ticks: {
                              callback: function (value) {
                                return value + '%';
                              },
                            },
                            grid: {
                              color: 'rgba(0, 0, 0, 0.05)',
                            },
                          },
                        },
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 border border-gray-200 rounded-xl">
                    <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">
                      No quiz data available to display performance chart
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
