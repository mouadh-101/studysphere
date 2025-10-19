"use client"

import type React from "react"
import { useState } from "react"
import { researchPaperService } from "@/services/researchPaperService"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, FileText, X, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function NewResearchPaperPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile || !title) return
    setIsUploading(true)
    try {
      const response = await researchPaperService.uploadPaper(selectedFile, title)
      toast({
        title: "Paper Uploaded",
        description: response.message,
      })
      // Navigate to detail page for the new paper
      router.push(`/dashboard/research-papers/research/${response.paper.paper_id}`)
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload research paper",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/research-papers">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Upload Research Paper</h1>
          <p className="text-muted-foreground mt-1">Add a new research paper to analyze and organize</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Paper Information</CardTitle>
            <CardDescription>Upload your research paper and provide basic details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="file">Research Paper (PDF) *</Label>
              {!selectedFile ? (
                <div
                  className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <input type="file" id="file" className="hidden" onChange={handleFileChange} accept=".pdf" required />
                  <label htmlFor="file" className="cursor-pointer block">
                    <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-sm font-medium mb-1">Drag and drop your PDF here, or click to browse</p>
                    <p className="text-xs text-muted-foreground">Supports PDF files up to 50MB</p>
                  </label>
                </div>
              ) : (
                <div className="border border-border rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={handleRemoveFile}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Title Input */}
            <div className="space-y-2">
              <Label htmlFor="title">Paper Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Post-Meningitic Syndrome: Pathophysiology and Consequences..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">The title will be extracted from the PDF if available</p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <Link href="/dashboard/research-papers" className="flex-1">
                <Button variant="outline" className="w-full bg-transparent">
                  Cancel
                </Button>
              </Link>
              <Button onClick={handleSubmit} className="flex-1" disabled={!title || !selectedFile || isUploading}>
                {isUploading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Processing Paper...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload & Analyze
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
