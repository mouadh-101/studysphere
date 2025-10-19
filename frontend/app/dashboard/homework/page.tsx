"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, CheckCircle2, Clock, XCircle, Calendar, Trash2, Eye } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { homeworkService } from "@/services"
import type { HomeworkProblem } from "@/services/types/homework"
import { useToast } from "@/hooks/use-toast"
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


export default function HomeworkHistoryPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [problems, setProblems] = useState<HomeworkProblem[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [problemToDelete, setProblemToDelete] = useState<string | null>(null)
  const { toast } = useToast()

  // Fetch problems on mount
  useEffect(() => {
    fetchProblems()
  }, [])

  const fetchProblems = async () => {
    try {
      setLoading(true)
      const data = await homeworkService.getUserHomework()
      setProblems(data)
    } catch (error: any) {
      console.error('Failed to fetch homework:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to load homework problems",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!problemToDelete) return

    try {
      await homeworkService.deleteHomework(problemToDelete)
      toast({
        title: "Success",
        description: "Problem deleted successfully",
      })
      // Remove from local state
      setProblems(problems.filter(p => p.problemId !== problemToDelete))
      setDeleteDialogOpen(false)
      setProblemToDelete(null)
    } catch (error: any) {
      console.error('Failed to delete problem:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete problem",
        variant: "destructive",
      })
    }
  }

  const openDeleteDialog = (problemId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setProblemToDelete(problemId)
    setDeleteDialogOpen(true)
  }

  // Filter problems based on search
  const filteredProblems = problems.filter(problem => {
    const query = searchQuery.toLowerCase()
    return (
      problem.type.toLowerCase().includes(query) ||
      problem.extractedText?.toLowerCase().includes(query) ||
      new Date(problem.uploadedAt).toLocaleDateString().includes(query)
    )
  })

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
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
      default:
        return null
    }
  }

  // Get type label
  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      mathematic: 'Mathematics',
      linguistic: 'Language',
      programming: 'Programming',
      scientific: 'Science',
    }
    return labels[type] || type
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Homework Solver & Explainer</h1>
          <p className="text-muted-foreground mt-1">
            {problems.length} {problems.length === 1 ? 'problem' : 'problems'} in your history
          </p>
        </div>
        <Link href="/dashboard/homework/new">
          <Button size="lg" className="gap-2">
            <Plus className="w-5 h-5" />
            New Solution
          </Button>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by type, content, or date..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Solutions List */}
      {!loading && filteredProblems.length > 0 && (
        <div className="space-y-4">
          {filteredProblems.map((problem) => (
            <Link key={problem.problemId} href={`/dashboard/homework/solver/${problem.problemId}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">
                          {getTypeLabel(problem.type)} Problem
                        </h3>
                        {getStatusBadge(problem.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {problem.extractedText || 'Processing...'}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <Badge variant="outline">{getTypeLabel(problem.type)}</Badge>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(problem.uploadedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Eye className="w-4 h-4" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => openDeleteDialog(problem.problemId, e)}
                        className="gap-2 hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <Clock className="w-12 h-12 mx-auto mb-4 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading your homework...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && problems.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">No homework yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Upload your first homework problem to get started
            </p>
            <Link href="/dashboard/homework/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Upload Homework
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* No Search Results */}
      {!loading && problems.length > 0 && filteredProblems.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No results found</h3>
            <p className="text-muted-foreground">Try adjusting your search query</p>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Problem</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this problem? This action cannot be undone and will also delete the solution.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
