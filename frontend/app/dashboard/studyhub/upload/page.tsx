"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, FileText, X, ArrowLeft, AlertCircle, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { resourceService } from "@/services"
import type { Category } from "@/services/types/resource"
import { Alert, AlertDescription } from "@/components/ui/alert"


export default function UploadResourcePage() {
  const router = useRouter()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [customCategory, setCustomCategory] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [fileError, setFileError] = useState("")

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setIsLoadingCategories(true)
      const response = await resourceService.getCategories()
      setCategories(response.data.categories)
    } catch (err) {
      console.error("Failed to fetch categories:", err)
      // Set default categories if fetch fails
      setCategories([
        { category_id: "1", name: "Lecture Notes" },
        { category_id: "2", name: "Study Guides" },
        { category_id: "3", name: "Past Exams" },
        { category_id: "4", name: "Textbooks" },
        { category_id: "5", name: "Assignments" },
        { category_id: "6", name: "Research Papers" },
        { category_id: "7", name: "Presentations" },
        { category_id: "8", name: "Other" },
      ])
    } finally {
      setIsLoadingCategories(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError("")
    setError("")
    
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      
      // Validate file
      const validation = resourceService.validateFile(file)
      if (!validation.valid) {
        setFileError(validation.error || "Invalid file")
        setSelectedFile(null)
        return
      }
      
      setSelectedFile(file)
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setFileError("")
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    if (!selectedFile) {
      setError("Please select a file to upload")
      return
    }

    if (!title.trim()) {
      setError("Please enter a title")
      return
    }

    if (!description.trim()) {
      setError("Please enter a description")
      return
    }

    if (!category) {
      setError("Please select a category")
      return
    }

    if (category === "Other" && !customCategory.trim()) {
      setError("Please enter a custom category name")
      return
    }

    setIsUploading(true)
    setError("")
    setSuccess("")

    try {
      // Upload resource
      const response = await resourceService.uploadResource({
        file: selectedFile,
        title: title.trim(),
        description: description.trim(),
        category: category === "Other" ? customCategory.trim() : category,
      })

      setSuccess("Resource uploaded successfully!")

      // Wait a moment to show success message
      setTimeout(() => {
        router.push("/dashboard/studyhub")
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload resource")
      setIsUploading(false)
    }
  }



  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href="/dashboard/studyhub">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to StudyHub
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Upload Resource</CardTitle>
            <CardDescription>Share your study materials with the StudySphere community</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Success Alert */}
              {success && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">{success}</AlertDescription>
                </Alert>
              )}

              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="file">File *</Label>
                {!selectedFile ? (
                  <div className={`border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors ${
                    fileError ? "border-red-300 bg-red-50" : "border-border"
                  }`}>
                    <input
                      type="file"
                      id="file"
                      className="hidden"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png"
                      required
                      disabled={isUploading}
                    />
                    <label htmlFor="file" className={`cursor-pointer ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}>
                      <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm font-medium mb-1">Click to upload or drag and drop</p>
                      <p className="text-xs text-muted-foreground">
                        PDF, Word, PowerPoint, Excel, Text, or Images (Max 50MB)
                      </p>
                    </label>
                  </div>
                ) : (
                  <div className="border border-border rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {resourceService.formatFileSize(selectedFile.size)}
                        </p>
                      </div>
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleRemoveFile}
                      disabled={isUploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                {fileError && (
                  <p className="text-sm text-red-600 mt-1">{fileError}</p>
                )}
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Calculus II Final Exam Study Guide"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  disabled={isUploading}
                  maxLength={255}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Provide a brief description of the resource... (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  disabled={isUploading}
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select 
                  value={category} 
                  onValueChange={(val) => {
                    setCategory(val)
                    if (val !== "Other") setCustomCategory("")
                  }}
                  required 
                  disabled={isUploading || isLoadingCategories}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder={isLoadingCategories ? "Loading categories..." : "Select category"} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories
                      .filter((cat) => cat.name !== "Other")
                      .map((cat) => (
                        <SelectItem key={cat.category_id} value={cat.name}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    <SelectItem key="other" value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {category === "Other" && (
                  <div className="pt-2">
                    <Label htmlFor="custom-category">Custom Category Name *</Label>
                    <Input
                      id="custom-category"
                      placeholder="Enter custom category name"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      required
                      disabled={isUploading}
                      maxLength={100}
                      className="mt-1"
                    />
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  If your category doesn't exist, it will be created automatically
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1" disabled={isUploading || !selectedFile}>
                  {isUploading ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Resource
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={isUploading}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
