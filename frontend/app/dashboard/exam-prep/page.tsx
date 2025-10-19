"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, Play, FileText, Award, Calendar, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { quizService } from "@/services"
import type { Quiz } from "@/services/types/quiz"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function ExamPrepHistoryPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [quizToDelete, setQuizToDelete] = useState<Quiz | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch quizzes on mount
  useEffect(() => {
    fetchQuizzes()
  }, [])

  const fetchQuizzes = async () => {
    try {
      setIsLoading(true)
      setError("")
      const response = await quizService.getUserQuizzes()
      setQuizzes(response.data.quizzes || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load quizzes")
      console.error("Failed to fetch quizzes:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteClick = (quiz: Quiz, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setQuizToDelete(quiz)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!quizToDelete) return
    
    setIsDeleting(true)
    try {
      await quizService.deleteQuiz(quizToDelete.quiz_id)
      await fetchQuizzes()
      setDeleteDialogOpen(false)
      setQuizToDelete(null)
    } catch (err) {
      console.error("Failed to delete quiz:", err)
      alert(err instanceof Error ? err.message : "Failed to delete quiz")
    } finally {
      setIsDeleting(false)
    }
  }

  const filteredQuizzes = quizzes.filter((quiz) =>
    (quiz.quiz_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     quiz.subject?.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Exam Prep & Smart Quiz Generator</h1>
          <p className="text-muted-foreground mt-1">Your quiz library and results</p>
        </div>
        <Link href="/dashboard/exam-prep/new">
          <Button size="lg" className="gap-2">
            <Plus className="w-5 h-5" />
            Create New Quiz
          </Button>
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by subject, date, or score..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Quiz Library */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Your Quizzes</h2>
        {isLoading ? (
          <p>Loading quizzes...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : filteredQuizzes.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">No quizzes found. Create your first quiz!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredQuizzes.map((quiz) => (
              <Card key={quiz.quiz_id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Badge>{quiz.subject || 'General'}</Badge>
                    <Badge variant="outline">{quiz.questionCount || 0} questions</Badge>
                  </div>
                  <CardTitle className="text-lg">{quiz.quiz_title || 'Untitled Quiz'}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {quizService.formatDate(quiz.created_at)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Link href={`/dashboard/exam-prep/quiz/${quiz.quiz_id}`} className="flex-1">
                      <Button className="w-full">
                        <Play className="w-4 h-4 mr-2" />
                        Start Quiz
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={(e) => handleDeleteClick(quiz, e)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quiz</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{quizToDelete?.quiz_title}"? This action cannot be undone and will delete all associated attempts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Recent Results - Commented out for now, will implement with attempts
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Results</h2>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">No recent attempts yet</p>
          </CardContent>
        </Card>
      </div>
      */}
    </div>
  )
}
