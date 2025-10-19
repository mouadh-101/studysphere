"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Calculator, Languages, GraduationCap, FolderOpen, BookOpen, Loader2, AlertCircle } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import Link from "next/link"
//import { statsService, UserStats } from "@/services/statsService"

export default function DashboardPage() {
  const { user } = useAuth()
  //const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await statsService.getUserStats()
      setStats(data)
    } catch (err: any) {
      console.error("Error loading stats:", err)
      setError(err.response?.data?.message || "Failed to load statistics")
    } finally {
      setLoading(false)
    }
  }
*/
  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {user?.full_name || "Student"}!</h1>
        <p className="text-muted-foreground mt-1">Here's what's happening with your studies today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Loading...</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        ) : error ? (
          <Card className="col-span-full">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-destructive">
                <AlertCircle className="w-5 h-5" />
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        ) : stats ? (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Notes Summarized</CardTitle>
                <FileText className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.notes.completed}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.notes.thisWeek} this week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Research Papers</CardTitle>
                <BookOpen className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.research.completed}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.research.thisWeek} this week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Quizzes Completed</CardTitle>
                <GraduationCap className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.quizzes.total}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Average score: {stats.quizzes.averageScore}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Homework Solved</CardTitle>
                <Calculator className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.homework.solved}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.homework.thisWeek} this week
                </p>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>

      {/* Quick Access 
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Access</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/dashboard/notes">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Note Summarizer</CardTitle>
                <CardDescription>Upload and summarize your lecture notes</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/dashboard/homework">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Calculator className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Homework Solver</CardTitle>
                <CardDescription>Get step-by-step solutions</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/dashboard/language">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Languages className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Language Learning</CardTitle>
                <CardDescription>Practice with AI tutor</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/dashboard/exam-prep">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <GraduationCap className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Exam Prep</CardTitle>
                <CardDescription>Generate practice quizzes</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/dashboard/studyhub">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <FolderOpen className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>StudyHub</CardTitle>
                <CardDescription>Share and access resources</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : stats && (stats.notes.total > 0 || stats.research.total > 0 || stats.homework.total > 0) ? (
              <div className="space-y-4">
                {stats.notes.thisWeek > 0 && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Summarized {stats.notes.thisWeek} note{stats.notes.thisWeek > 1 ? 's' : ''}</p>
                      <p className="text-sm text-muted-foreground">This week</p>
                    </div>
                  </div>
                )}

                {stats.quizzes.thisWeek > 0 && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Completed {stats.quizzes.thisWeek} quiz{stats.quizzes.thisWeek > 1 ? 'zes' : ''}</p>
                      <p className="text-sm text-muted-foreground">Average score: {stats.quizzes.averageScore}%</p>
                    </div>
                  </div>
                )}

                {stats.homework.thisWeek > 0 && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Calculator className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Solved {stats.homework.thisWeek} homework problem{stats.homework.thisWeek > 1 ? 's' : ''}</p>
                      <p className="text-sm text-muted-foreground">This week</p>
                    </div>
                  </div>
                )}

                {stats.research.thisWeek > 0 && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Analyzed {stats.research.thisWeek} research paper{stats.research.thisWeek > 1 ? 's' : ''}</p>
                      <p className="text-sm text-muted-foreground">This week</p>
                    </div>
                  </div>
                )}

                {stats.notes.thisWeek === 0 && stats.quizzes.thisWeek === 0 && 
                 stats.homework.thisWeek === 0 && stats.research.thisWeek === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No activity this week. Start studying to see your progress!
                  </p>
                )}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No activity yet. Start using the tools to track your progress!
              </p>
            )}
          </CardContent>
        </Card>
      </div>*/}
    </div>
    
  )
}