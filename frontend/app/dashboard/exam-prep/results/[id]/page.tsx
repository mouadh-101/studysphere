"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Award, CheckCircle2, XCircle, ArrowLeft, RotateCcw, Loader2 } from "lucide-react"
import Link from "next/link"
import { quizService } from "@/services"
import type { QuizAttempt, QuizQuestion } from "@/services/types/quiz"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function QuizResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params)
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchAttempt()
  }, [resolvedParams.id])

  const fetchAttempt = async () => {
    try {
      setIsLoading(true)
      setError("")
      const response = await quizService.getAttemptById(resolvedParams.id)
      const fetchedAttempt = response.data.attempt

      if (!fetchedAttempt) {
        setError("Attempt not found")
        return
      }

      setAttempt(fetchedAttempt)
      if (fetchedAttempt.quiz?.questions) {
        setQuestions(fetchedAttempt.quiz.questions)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load results")
      console.error("Failed to fetch attempt:", err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading results...</p>
        </div>
      </div>
    )
  }

  if (error || !attempt) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertDescription>{error || "Results not available"}</AlertDescription>
        </Alert>
        <Link href="/dashboard/exam-prep">
          <Button className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Exam Prep
          </Button>
        </Link>
      </div>
    )
  }

  // Calculate results
  const totalQuestions = questions.length
  let correctCount = 0
  const reviewData = questions.map((question) => {
    const userAnswer = attempt.answers[question.question_id]
    const isCorrect = userAnswer === question.correct_answer
    if (isCorrect) correctCount++
    
    return {
      question: question.question_text,
      userAnswer: userAnswer || "Not answered",
      correctAnswer: question.correct_answer,
      isCorrect,
    }
  })

  const incorrectCount = totalQuestions - correctCount
  const scorePercentage = attempt.score
  const scoreLabel = quizService.getScoreLabel(scorePercentage)
  const scoreColor = quizService.getScoreColor(scorePercentage)

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/exam-prep">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Quiz Results</h1>
          <p className="text-muted-foreground mt-1">{attempt.quiz?.quiz_title || 'Untitled Quiz'}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Results Summary */}
        <Card>
          <CardHeader className="text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Award className="w-10 h-10 text-primary" />
            </div>
            <CardTitle className="text-3xl">Quiz Complete!</CardTitle>
            <CardDescription>Here's how you did</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-6">
              <div>
                <div className={`text-6xl font-bold mb-2 ${scoreColor}`}>{Math.round(scorePercentage)}%</div>
                <Badge className="text-lg px-4 py-1">{scoreLabel}</Badge>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="p-4 bg-accent/50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">{correctCount}</div>
                  <p className="text-sm text-muted-foreground">Correct</p>
                </div>
                <div className="p-4 bg-accent/50 rounded-lg">
                  <div className="text-3xl font-bold text-red-600">{incorrectCount}</div>
                  <p className="text-sm text-muted-foreground">Incorrect</p>
                </div>
                <div className="p-4 bg-accent/50 rounded-lg">
                  <div className="text-3xl font-bold">{totalQuestions}</div>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Completed on {quizService.formatDate(attempt.end_time)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Question Review */}
        <Card>
          <CardHeader>
            <CardTitle>Question Review</CardTitle>
            <CardDescription>Review your answers and see where you can improve</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {reviewData.map((q, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start gap-3 mb-3">
                  {q.isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium mb-2">
                      {index + 1}. {q.question}
                    </p>
                    <div className="space-y-1 text-sm">
                      <p>
                        <span className="text-muted-foreground">Your answer:</span>{" "}
                        <span className={q.isCorrect ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                          {q.userAnswer}
                        </span>
                      </p>
                      {!q.isCorrect && (
                        <p>
                          <span className="text-muted-foreground">Correct answer:</span>{" "}
                          <span className="text-green-600 font-medium">{q.correctAnswer}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Link href="/dashboard/exam-prep" className="flex-1">
            <Button variant="outline" className="w-full bg-transparent">
              Back to Library
            </Button>
          </Link>
          {attempt.quiz_id && (
            <Link href={`/dashboard/exam-prep/quiz/${attempt.quiz_id}`} className="flex-1">
              <Button className="w-full">
                <RotateCcw className="w-4 h-4 mr-2" />
                Retake Quiz
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
