"use client"

import { use, useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, FileText, Share2, Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { noteSummarizerService } from "@/services/noteSummarizerService"
import { NoteDetailResponse, MindmapNode } from "@/services/types/noteSummarizer"

export default function NoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [note, setNote] = useState<NoteDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPolling, setIsPolling] = useState(false)

  useEffect(() => {
    loadNote()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // Polling effect
  useEffect(() => {
    if (!note) return

    // Check if note is still processing
    if (note.status === "processing" || note.status === "pending") {
      setIsPolling(true)
      const pollInterval = setInterval(async () => {
        try {
          const updatedNote = await noteSummarizerService.getNoteById(id)
          setNote(updatedNote)
          
          // Stop polling if completed or failed
          if (updatedNote.status === "completed" || updatedNote.status === "failed") {
            setIsPolling(false)
            clearInterval(pollInterval)
          }
        } catch (err) {
          console.error("Error polling note status:", err)
          // Continue polling even on error
        }
      }, 3000) // Poll every 3 seconds

      return () => {
        clearInterval(pollInterval)
        setIsPolling(false)
      }
    } else {
      setIsPolling(false)
    }
  }, [note, id])

  const loadNote = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await noteSummarizerService.getNoteById(id)
      setNote(data)
    } catch (err: any) {
      console.error("Error loading note:", err)
      setError(err.response?.data?.message || "Failed to load note")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { label: "Completed", className: "bg-green-500" },
      processing: { label: "Processing", className: "bg-yellow-500" },
      pending: { label: "Pending", className: "bg-blue-500" },
      failed: { label: "Failed", className: "bg-red-500" },
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return <Badge className={config.className}>{config.label}</Badge>
  }

  const renderMindmapNode = (node: any, level: number = 0, index: number = 0) => {
    const colors = [
      "bg-primary/20 text-primary border-primary",
      "bg-blue-500/20 text-blue-700 border-blue-500",
      "bg-green-500/20 text-green-700 border-green-500",
      "bg-purple-500/20 text-purple-700 border-purple-500",
      "bg-orange-500/20 text-orange-700 border-orange-500",
      "bg-pink-500/20 text-pink-700 border-pink-500",
    ]
    const colorClass = colors[level % colors.length]
    const hasChildren = node.children && node.children.length > 0

    return (
      <div key={`${level}-${index}`} className="relative flex flex-col items-center">
        {/* Connecting Line to Parent */}
        {level > 1 && (
          <div className="absolute -top-4 w-0.5 h-4 bg-border"></div>
        )}
        
        {/* Node */}
        <div className={`
          relative rounded-full border-2 ${colorClass} 
          ${level === 1 ? "px-6 py-3 text-sm font-semibold min-w-[180px]" : "px-4 py-2 text-xs min-w-[140px]"}
          text-center shadow-md hover:shadow-lg transition-shadow
        `}>
          {node.name}
        </div>

        {/* Children Container */}
        {hasChildren && (
          <>
            {/* Vertical Line Down */}
            <div className="w-0.5 h-6 bg-border"></div>
            
            {/* Horizontal Line Connecting Children */}
            {node.children.length > 1 && (
              <div className="relative w-full flex justify-center">
                <div className="absolute top-0 h-0.5 bg-border" style={{ 
                  width: `${Math.min(node.children.length * 200, 800)}px` 
                }}></div>
              </div>
            )}
            
            {/* Children Nodes */}
            <div className={`
              flex gap-6 mt-6 flex-wrap justify-center
              ${node.children.length === 1 ? "items-center" : "items-start"}
            `}>
              {node.children.map((child: any, idx: number) => (
                <div key={idx} className="relative">
                  {/* Vertical line from horizontal line to child */}
                  {node.children.length > 1 && (
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-border"></div>
                  )}
                  {renderMindmapNode(child, level + 1, idx)}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading note...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <div>
            <h2 className="text-xl font-semibold">Error Loading Note</h2>
            <p className="text-muted-foreground mt-2">{error}</p>
          </div>
          <div className="flex gap-2 justify-center">
            <Button onClick={loadNote} variant="outline">
              Try Again
            </Button>
            <Link href="/dashboard/notes">
              <Button variant="ghost">Back to Notes</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!note) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Note not found</p>
          <Link href="/dashboard/notes">
            <Button variant="outline">Back to Notes</Button>
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
          <Link href="/dashboard/notes">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">Note Summary</h1>
              {getStatusBadge(note.status)}
            </div>
            <p className="text-muted-foreground mt-1">Created on {formatDate(note.created_at)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled={note.status !== "completed"}>
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button disabled={note.status !== "completed"}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Processing/Error States */}
      {(note.status === "processing" || note.status === "pending") && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="flex items-center gap-3 pt-6">
            <Loader2 className="w-5 h-5 animate-spin text-yellow-600" />
            <div className="flex-1">
              <p className="text-yellow-800 font-medium">
                {note.status === "pending" ? "Your note is queued for processing..." : "Your note is being processed..."}
              </p>
              <p className="text-yellow-700 text-sm mt-1">
                {isPolling ? "Checking status every 3 seconds. This page will update automatically." : "Please wait..."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {note.status === "failed" && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-red-800 font-medium">Processing failed</p>
              {note.error_message && <p className="text-red-700 text-sm mt-1">{note.error_message}</p>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Three-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Transcription */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Transcription
            </CardTitle>
            <CardDescription>Audio transcription from your note</CardDescription>
          </CardHeader>
          <CardContent>
            {note.transcription ? (
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">{note.transcription}</pre>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                {(note.status === "processing" || note.status === "pending") && (
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                )}
                <p className="text-sm text-muted-foreground text-center">
                  {note.status === "completed" ? "No transcription available" : "Transcription in progress..."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Middle Column: Summary & Key Concepts */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>AI-Generated Summary</CardTitle>
            <CardDescription>Concise overview of your notes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {note.summary ? (
              <>
                <div>
                  <p className="text-sm leading-relaxed">{note.summary}</p>
                </div>

                {note.key_concepts && note.key_concepts.length > 0 && (
                  <div className="pt-4 border-t">
                    <h3 className="font-semibold mb-3">Key Concepts</h3>
                    <div className="flex flex-wrap gap-2">
                      {note.key_concepts.map((concept: string, index: number) => (
                        <Badge key={index} variant="secondary">
                          {concept}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                {(note.status === "processing" || note.status === "pending") && (
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                )}
                <p className="text-sm text-muted-foreground text-center">
                  {note.status === "completed" ? "No summary available" : "Summary being generated..."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Mind Map */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Mind Map</CardTitle>
            <CardDescription>Visual representation of concepts</CardDescription>
          </CardHeader>
          <CardContent>
            {note.mindmap_data ? (
              <div className="overflow-auto max-h-[700px] p-6">
                <div className="flex flex-col items-center">
                  {/* Root Node - Central Topic */}
                  <div className="relative">
                    <div className="px-8 py-4 text-lg font-bold rounded-full border-4 bg-gradient-to-br from-primary/30 to-primary/10 text-primary border-primary text-center min-w-[200px] shadow-xl">
                      {note.mindmap_data.root}
                    </div>
                    
                    {/* Connecting lines from root to children */}
                    {note.mindmap_data.children && note.mindmap_data.children.length > 0 && (
                      <>
                        <div className="w-0.5 h-8 bg-border mx-auto"></div>
                        {note.mindmap_data.children.length > 1 && (
                          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 h-0.5 bg-border" 
                               style={{ width: `${Math.min(note.mindmap_data.children.length * 220, 900)}px` }}>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  
                  {/* First Level Children */}
                  {note.mindmap_data.children && note.mindmap_data.children.length > 0 && (
                    <div className="flex gap-8 mt-8 flex-wrap justify-center items-start">
                      {note.mindmap_data.children.map((child, idx) => (
                        <div key={idx} className="relative">
                          {note.mindmap_data && note.mindmap_data.children && note.mindmap_data.children.length > 1 && (
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-0.5 h-8 bg-border"></div>
                          )}
                          {renderMindmapNode(child, 1, idx)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="aspect-square bg-muted rounded-lg flex items-center justify-center p-6">
                <div className="flex flex-col items-center space-y-3">
                  {(note.status === "processing" || note.status === "pending") && (
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  )}
                  <p className="text-sm text-muted-foreground text-center">
                    {note.status === "completed" ? "No mind map available" : "Mind map being generated..."}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
