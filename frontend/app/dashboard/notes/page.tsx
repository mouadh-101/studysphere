"use client"

import { useEffect, useState } from "react"
import { noteSummarizerService, type NoteSummary } from "@/services/noteSummarizerService"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, FileText, Calendar, Trash2, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function NotesHistoryPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [notes, setNotes] = useState<NoteSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)

  useEffect(() => {
    loadNotes()
  }, [])

  const loadNotes = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await noteSummarizerService.getUserNotes()
      setNotes(data)
    } catch (err: any) {
      setError(err.message || "Failed to load notes")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (noteId: string) => {
    try {
      await noteSummarizerService.deleteNote(noteId)
      setNotes((prev) => prev.filter((note) => note.note_id !== noteId))
      setDeleteDialogOpen(false)
      setSelectedNoteId(null)
    } catch (err: any) {
      setError(err.message || "Failed to delete note")
    }
  }

  // Filter notes by search query
  const filteredNotes = notes.filter((note) => {
    const q = searchQuery.toLowerCase()
    return (
      note.transcription?.toLowerCase().includes(q) ||
      note.summary?.toLowerCase().includes(q) ||
      note.key_concepts?.some((concept) => concept.toLowerCase().includes(q))
    )
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default" className="bg-green-500">Completed</Badge>
      case "processing":
        return <Badge variant="secondary" className="bg-yellow-500">Processing</Badge>
      case "failed":
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Smart Note Summarizer</h1>
          <p className="text-muted-foreground mt-1">Your summarized notes history</p>
        </div>
        <Link href="/dashboard/notes/new">
          <Button size="lg" className="gap-2">
            <Plus className="w-5 h-5" />
            Add New Note
          </Button>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search notes by content or concepts..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading notes...</span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-red-500">{error}</p>
            <Button onClick={loadNotes} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Notes Grid */}
      {!loading && !error && filteredNotes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map((note) => (
            <Card key={note.note_id} className="hover:shadow-lg transition-shadow h-full flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {new Date(note.created_at).toLocaleDateString()}
                  </div>
                </div>
                <CardTitle className="text-lg line-clamp-2">
                  {note.summary?.substring(0, 60) || "Note Summary"}...
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {note.transcription?.substring(0, 100) || "No transcription available"}...
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(note.status)}
                  </div>
                  {note.key_concepts && note.key_concepts.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {note.key_concepts.slice(0, 3).map((concept, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {concept}
                        </Badge>
                      ))}
                      {note.key_concepts.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{note.key_concepts.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  <Link href={`/dashboard/notes/note/${note.note_id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full bg-transparent">
                      <FileText className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </Link>
                  <AlertDialog
                    open={deleteDialogOpen && selectedNoteId === note.note_id}
                    onOpenChange={(open) => {
                      setDeleteDialogOpen(open)
                      if (!open) setSelectedNoteId(null)
                    }}
                  >
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-fit"
                        onClick={() => {
                          setSelectedNoteId(note.note_id)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Note</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this note? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(note.note_id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
      {!loading && !error && filteredNotes.length === 0 && notes.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No notes yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Start by creating your first note summary</p>
            <Link href="/dashboard/notes/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create First Note
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* No Search Results */}
      {!loading && !error && filteredNotes.length === 0 && notes.length > 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No notes found</h3>
            <p className="text-sm text-muted-foreground">Try adjusting your search query</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
