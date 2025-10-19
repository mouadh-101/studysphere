"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Download, Search, Filter, FileText, User, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Link from "next/link"
import { resourceService } from '@/services'
import type { Resource } from '@/services/types/resource'

export default function StudyHubPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [resources, setResources] = useState<Resource[]>([])
  const [filteredResources, setFilteredResources] = useState<Resource[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [totalResources, setTotalResources] = useState(0)

  // Fetch resources from database
  useEffect(() => {
    fetchResources()
  }, [])

  // Filter resources when search query or category changes
  useEffect(() => {
    filterResources()
  }, [searchQuery, selectedCategory, resources])

  const fetchResources = async () => {
    try {
      setIsLoading(true)
      setError("")
      const response = await resourceService.getResources({ limit: 100 })
      setResources(response.data.resources)
      setTotalResources(response.data.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load resources")
      console.error("Failed to fetch resources:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const filterResources = () => {
    let filtered = resources

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (resource) =>
          resource.resourceCategory?.name.toLowerCase() === selectedCategory.toLowerCase()
      )
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter((resource) =>
        resource.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredResources(filtered)
  }

  const handleDownload = async (resource: Resource) => {
    try {
      const fileExt = resourceService.getFileExtension(resource.file_url)
      await resourceService.downloadResource(resource.resource_id, `${resource.title}.${fileExt}`)
    } catch (err) {
      console.error("Download failed:", err)
      alert("Failed to download resource")
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">StudyHub</h1>
          <p className="text-muted-foreground mt-1">Share and access study resources with your peers</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/studyhub/my-resources">
            <Button variant="outline">
              <User className="w-4 h-4 mr-2" />
              My Resources
            </Button>
          </Link>
          <Link href="/dashboard/studyhub/upload">
            <Button>
              <Upload className="w-4 h-4 mr-2" />
              Upload Resource
            </Button>
          </Link>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search resources..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Categories */}
      <Tabs defaultValue="all" onValueChange={setSelectedCategory}>
        <TabsList>
          <TabsTrigger value="all">All Resources</TabsTrigger>
          <TabsTrigger value="lecture notes">Lecture Notes</TabsTrigger>
          <TabsTrigger value="past exams">Past Exams</TabsTrigger>
          <TabsTrigger value="study guides">Study Guides</TabsTrigger>
          <TabsTrigger value="textbooks">Textbooks</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedCategory} className="space-y-4 mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading resources...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchResources} variant="outline">
                Try Again
              </Button>
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? "No resources match your search" : "No resources found in this category"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredResources.map((resource) => (
                <Link key={resource.resource_id} href={`/dashboard/studyhub/resource/${resource.resource_id}`}>
                <Card key={resource.resource_id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <h3 className="font-semibold text-lg line-clamp-2">{resource.title}</h3>
                          <div className="flex gap-2 flex-shrink-0">
                            <Badge variant="outline">{resource.resourceCategory?.name || "Uncategorized"}</Badge>
                            <Badge variant="secondary">
                              {resourceService.getFileExtension(resource.file_url).toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                        {resource.description && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {resource.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <Avatar className="w-5 h-5">
                              <AvatarFallback className="text-xs">
                                {resource.user?.full_name
                                  ?.split(" ")
                                  .map((n: string) => n[0])
                                  .join("") || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate">{resource.user?.full_name || "Anonymous"}</span>
                          </div>
                          <span>•</span>
                          <span>{formatDate(resource.created_at)}</span>
                          <span>•</span>
                          <span>{resource.download_count} downloads</span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-transparent"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDownload(resource)
                          }}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : totalResources.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading
                ? "..."
                : resources
                    .reduce((sum, r) => sum + r.download_count, 0)
                    .toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Across all resources</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading
                ? "..."
                : new Set(resources.map((r) => r.resourceCategory?.name).filter(Boolean)).size}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Available categories</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
