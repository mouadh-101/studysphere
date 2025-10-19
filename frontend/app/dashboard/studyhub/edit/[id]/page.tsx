"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, AlertCircle, CheckCircle, Save } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { resourceService } from "@/services"
import type { Category, Resource } from "@/services/types/resource"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function EditResourcePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params)
  const router = useRouter()
  const [resource, setResource] = useState<Resource | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [customCategory, setCustomCategory] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)

  // Fetch resource and categories on mount
  useEffect(() => {
    fetchResource()
    fetchCategories()
  }, [resolvedParams.id])

  const fetchResource = async () => {
    try {
      setIsLoading(true)
      const response = await resourceService.getResourceById(resolvedParams.id)
      const res = response.data.resource
      setResource(res)
      setTitle(res.title)
      setDescription(res.description || "")
      setCategory(res.category)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load resource")
    } finally {
      setIsLoading(false)
    }
  }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    if (!title.trim()) {
      setError("Please enter a title")
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

    setIsUpdating(true)
    setError("")
    setSuccess("")

    try {
      // Update resource
      await resourceService.updateResource(resolvedParams.id, {
        title: title.trim(),
        description: description.trim(),
        category: category === "Other" ? customCategory.trim() : category,
      })

      setSuccess("Resource updated successfully!")
      
      // Wait a moment to show success message
      setTimeout(() => {
        router.push("/dashboard/studyhub/my-resources")
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update resource")
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-3xl mx-auto">
          <p>Loading resource...</p>
        </div>
      </div>
    )
  }

  if (!resource) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-red-600">Resource not found</p>
          <Link href="/dashboard/studyhub/my-resources">
            <Button className="mt-4">Back to My Resources</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href="/dashboard/studyhub/my-resources">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to My Resources
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Edit Resource</CardTitle>
            <CardDescription>Update your study material details</CardDescription>
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

              {/* File Info (Read-only) */}
              <div className="space-y-2">
                <Label>Current File</Label>
                <div className="border border-border rounded-lg p-4 bg-muted">
                  <p className="text-sm font-medium">{resource.file_url.split('/').pop()}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Note: File cannot be changed. Delete and re-upload to change the file.
                  </p>
                </div>
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
                  disabled={isUpdating}
                  maxLength={255}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Provide a brief description of the resource..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  disabled={isUpdating}
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
                  disabled={isUpdating || isLoadingCategories}
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
                      disabled={isUpdating}
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
                <Button type="submit" className="flex-1" disabled={isUpdating}>
                  {isUpdating ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update Resource
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={isUpdating}>
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
