"use client"

import { useEffect, useState } from "react"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { researchPaperService, ResearchPaper } from "@/services/researchPaperService"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, BookOpen, Calendar, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default function ResearchPapersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [papers, setPapers] = useState<ResearchPaper[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedPaperId, setSelectedPaperId] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    researchPaperService.getUserPapers()
      .then((data) => {
        setPapers(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || "Failed to load papers")
        setLoading(false)
      })
  }, [])

  // Filter papers by search query
  const filteredPapers = papers.filter((paper) => {
    const q = searchQuery.toLowerCase()
    return (
      paper.title.toLowerCase().includes(q) ||
      (paper.summary?.abstract?.toLowerCase().includes(q) ?? false)
    )
  })

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Research Paper Assistant</h1>
          <p className="text-muted-foreground mt-1">Manage and analyze your research papers</p>
        </div>
        <Link href="/dashboard/research-papers/new">
          <Button size="lg" className="gap-2">
            <Plus className="w-5 h-5" />
            Add New Paper
          </Button>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search papers by title or abstract..."
          className="pl-10"
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Loading/Error State */}
      {loading && (
        <div className="text-center py-12 text-muted-foreground">Loading papers...</div>
      )}
      {error && (
        <div className="text-center py-12 text-red-500">{error}</div>
      )}

      {/* Papers Grid */}
      {!loading && !error && filteredPapers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPapers.map((paper) => (
            <Card key={paper.paper_id} className="hover:shadow-lg transition-shadow h-full flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {new Date(paper.created_at).toLocaleDateString()}
                  </div>
                </div>
                <CardTitle className="text-lg line-clamp-2">{paper.title}</CardTitle>
                <CardDescription className="line-clamp-1">
                  {paper.summary?.abstract ? paper.summary.abstract.slice(0, 80) + "..." : "No abstract yet"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {paper.summary?.abstract || "No abstract available yet."}
                  </p>
                  <Badge variant="secondary" className="w-fit">
                    {paper.status.charAt(0).toUpperCase() + paper.status.slice(1)}
                  </Badge>
                </div>
                <div className="flex gap-2 mt-4">
                  <Link href={`/dashboard/research-papers/research/${paper.paper_id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full bg-transparent">
                      <FileText className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </Link>
                  <AlertDialog open={deleteDialogOpen && selectedPaperId === paper.paper_id} onOpenChange={(open) => {
                    setDeleteDialogOpen(open)
                    if (!open) setSelectedPaperId(null)
                  }}>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-fit"
                        onClick={() => {
                          setSelectedPaperId(paper.paper_id)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Paper</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this paper? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={async () => {
                            try {
                              await researchPaperService.deletePaper(paper.paper_id)
                              setPapers((prev) => prev.filter((p) => p.paper_id !== paper.paper_id))
                              setDeleteDialogOpen(false)
                              setSelectedPaperId(null)
                            } catch (err: any) {
                              setError(err.message || 'Failed to delete paper')
                            }
                          }}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredPapers.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No papers yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Start by uploading your first research paper</p>
            <Link href="/dashboard/research-papers/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Upload First Paper
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
