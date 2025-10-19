"use client"

import { use, useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, Share2, ImageIcon, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { homeworkService } from "@/services"
import type { ProblemWithSolution, SolutionStep } from "@/services/types/homework"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export default function HomeworkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [problemData, setProblemData] = useState<ProblemWithSolution | null>(null)
  const [loading, setLoading] = useState(true)
  const [pollingActive, setPollingActive] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchProblemDetails()
  }, [id])

  const fetchProblemDetails = async () => {
    try {
      setLoading(true)
      const data = await homeworkService.getProblemSolution(id)
      setProblemData(data)

      // If pending, start polling
      if (data.problem.status === 'pending' && !pollingActive) {
        setPollingActive(true)
        homeworkService.pollProblemStatus(id, (updatedData) => {
          setProblemData(updatedData)
          if (updatedData.problem.status !== 'pending') {
            setPollingActive(false)
          }
        })
      }
    } catch (error: any) {
      console.error('Failed to fetch problem:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to load problem details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    if (!problemData?.solution) {
      toast({
        title: "No solution available",
        description: "Wait for the problem to be solved first",
        variant: "destructive",
      })
      return
    }

    // Create text content
    const content = `
PROBLEM:
${problemData.problem.extractedText || 'N/A'}

TYPE: ${problemData.problem.type}

STEP-BY-STEP SOLUTION:
${problemData.solution.stepByStepSolution.map((step: SolutionStep) => 
  `Step ${step.step}: ${step.description}\n${step.calculation ? `Calculation: ${step.calculation}` : ''}`
).join('\n\n')}

FINAL ANSWER:
${problemData.solution.finalAnswer}

EXPLANATION:
${problemData.solution.explanation}
    `.trim()

    // Create and download file
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `homework-solution-${id}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Exported",
      description: "Solution downloaded successfully",
    })
  }

  const handleShare = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    toast({
      title: "Link copied",
      description: "Share link copied to clipboard",
    })
  }

  const getStatusBadge = () => {
    if (!problemData) return null

    switch (problemData.problem.status) {
      case 'solved':
        return (
          <Badge variant="default" className="gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Solved
          </Badge>
        )
      case 'pending':
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="w-3 h-3" />
            Processing
          </Badge>
        )
      case 'failed':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="w-3 h-3" />
            Failed
          </Badge>
        )
    }
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      mathematic: 'Mathematics',
      linguistic: 'Language',
      programming: 'Programming',
      scientific: 'Science',
    }
    return labels[type] || type
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading problem details...</p>
        </div>
      </div>
    )
  }

  if (!problemData) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <XCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
          <h3 className="font-semibold text-lg mb-2">Problem not found</h3>
          <p className="text-muted-foreground mb-4">This problem doesn't exist or you don't have access to it</p>
          <Link href="/dashboard/homework">
            <Button>Back to Homework</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/homework">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{getTypeLabel(problemData.problem.type)} Problem</h1>
            <div className="flex items-center gap-3 mt-1">
              {getStatusBadge()}
              <Badge variant="outline">{getTypeLabel(problemData.problem.type)}</Badge>
              <span className="text-sm text-muted-foreground">
                {new Date(problemData.problem.uploadedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button onClick={handleExport} disabled={!problemData.solution}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Original Problem */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Original Problem
              </CardTitle>
              <CardDescription>Your uploaded problem</CardDescription>
            </CardHeader>
            <CardContent>
              {problemData.problem.problemImageUrl && (
                <div className="aspect-video bg-muted rounded-lg overflow-hidden mb-4">
                  <img
                    src={`http://localhost:5000/uploads/${problemData.problem.problemImageUrl}`}
                    alt="Problem"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <div className="p-4 bg-accent/50 rounded-lg">
                <p className="text-sm font-medium whitespace-pre-wrap">
                  {problemData.problem.extractedText || 'Processing text extraction...'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Solution */}
        <div className="space-y-6">
          {/* Processing Status */}
          {problemData.problem.status === 'pending' && (
            <Card className="border-secondary">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-secondary" />
                  <div>
                    <h4 className="font-semibold">Processing your problem...</h4>
                    <p className="text-sm text-muted-foreground">
                      This may take a minute. The page will update automatically.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Failed Status */}
          {problemData.problem.status === 'failed' && (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <XCircle className="w-8 h-8 text-destructive" />
                  <div>
                    <h4 className="font-semibold">Processing failed</h4>
                    <p className="text-sm text-muted-foreground">
                      {problemData.solution?.explanation || 'Unable to solve this problem. Please try again or upload a clearer image.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step-by-Step Solution */}
          {problemData.solution && problemData.problem.status === 'solved' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Step-by-Step Solution</CardTitle>
                  <CardDescription>Follow along to understand the process</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {problemData.solution.stepByStepSolution.map((step: SolutionStep, index: number) => (
                      <div key={index} className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                          {step.step}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium mb-1">{step.description}</h4>
                          {step.calculation && (
                            <pre className="text-sm text-muted-foreground bg-muted p-2 rounded mt-2 overflow-x-auto">
                              <code>{step.calculation}</code>
                            </pre>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Final Answer */}
              <Card>
                <CardHeader>
                  <CardTitle>Final Answer</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-primary/10 rounded-lg p-6">
                    <pre className="text-lg font-semibold text-primary whitespace-pre-wrap">
                      {problemData.solution.finalAnswer}
                    </pre>
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Explanation */}
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Explanation</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {problemData.solution.explanation}
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
