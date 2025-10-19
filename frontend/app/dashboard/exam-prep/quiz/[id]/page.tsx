"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { quizService } from "@/services"
import type { Quiz, QuizQuestion } from "@/services/types/quiz"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function QuizTakingPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params)
  const router = useRouter()
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [selectedAnswer, setSelectedAnswer] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch quiz data on mount
  useEffect(() => {
    fetchQuiz()
  }, [resolvedParams.id])

  // Update selected answer when changing questions
  useEffect(() => {
    if (questions.length > 0) {
      const currentQuestionId = questions[currentQuestion].question_id
      setSelectedAnswer(answers[currentQuestionId] || "")
    }
  }, [currentQuestion, questions, answers])

  const fetchQuiz = async () => {
    try {
      setIsLoading(true)
      setError("")
      const response = await quizService.getQuizById(resolvedParams.id)
      const fetchedQuiz = response.data.quiz

      if (!fetchedQuiz) {
        setError("Quiz not found")
        return
      }

      if (!fetchedQuiz.questions || fetchedQuiz.questions.length === 0) {
        setError("This quiz has no questions")
        return
      }

      setQuiz(fetchedQuiz)
      setQuestions(fetchedQuiz.questions)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load quiz")
      console.error("Failed to fetch quiz:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnswerSelect = (answer: string) => {
    const currentQuestionId = questions[currentQuestion].question_id
    setSelectedAnswer(answer)
    setAnswers((prev) => ({
      ...prev,
      [currentQuestionId]: answer,
    }))
  }

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const handleSubmit = async () => {
    // Check if all questions are answered
    const unansweredQuestions = questions.filter(
      (q) => !answers[q.question_id]
    )

    if (unansweredQuestions.length > 0) {
      const confirmSubmit = window.confirm(
        `You have ${unansweredQuestions.length} unanswered question(s). Do you want to submit anyway?`
      )
      if (!confirmSubmit) return
    }

    setIsSubmitting(true)
    try {
      const response = await quizService.submitQuizAttempt(resolvedParams.id, { answers })

      // Redirect to results page with attempt details
      router.push(`/dashboard/exam-prep/results/${response.data.attempt_id}`)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to submit quiz")
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading quiz...</p>
        </div>
      </div>
    )
  }

  if (error || !quiz || questions.length === 0) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertDescription>{error || "Quiz not available"}</AlertDescription>
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

  const currentQuestionData = questions[currentQuestion]
  const answeredCount = Object.keys(answers).length

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/exam-prep">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{quiz.quiz_title || 'Untitled Quiz'}</h1>
            <p className="text-sm text-muted-foreground">
              Question {currentQuestion + 1} of {questions.length} • {answeredCount} answered
            </p>
          </div>
        </div>
        <Badge variant="outline">{quiz.subject || 'General'}</Badge>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all"
          style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{currentQuestionData.question_text}</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={selectedAnswer} onValueChange={handleAnswerSelect}>
              <div className="space-y-3">
                {currentQuestionData.options.map((option: string, index: number) => (
                  <Label
                    key={index}
                    htmlFor={`option-${index}`}
                    className={`flex items-center space-x-3 border rounded-lg p-4 cursor-pointer transition-colors ${selectedAnswer === option ? 'border-primary bg-primary/5' : 'hover:bg-accent'
                      }`}
                  >
                    <RadioGroupItem value={option} id={`option-${index}`} />
                    <span className="flex-1">{option}</span>
                  </Label>
                ))}
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            disabled={currentQuestion === 0}
            onClick={handlePrevious}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {currentQuestion < questions.length - 1 ? (
            <Button onClick={handleNext}>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Finish Quiz'
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
