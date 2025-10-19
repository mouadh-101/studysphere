"use client"


import React, { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ArrowLeft, Download, Share2, FileText, Calendar, TrendingUp } from "lucide-react"
import Link from "next/link"
import { resourceService } from "@/services"


export default function ResourceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params)
  const [resource, setResource] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchResource = async () => {
      setLoading(true)
      setError("")
      try {
        const res = await resourceService.getResourceById(resolvedParams.id)
        setResource(res.data.resource)
      } catch (err: any) {
        setError(err.message || "Failed to load resource")
      } finally {
        setLoading(false)
      }
    }
    fetchResource()
  }, [resolvedParams.id])

  if (loading) {
    return <div className="p-8">Loading resource...</div>
  }
  if (error) {
    return <div className="p-8 text-red-600">{error}</div>
  }
  if (!resource) {
    return <div className="p-8">Resource not found.</div>
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/studyhub">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{resource.title}</h1>
            <div className="flex items-center gap-3 mt-1">
              <Badge variant="outline">{resource.category}</Badge>
              <Badge variant="secondary">{resourceService.getFileExtension(resource.file_url).toUpperCase()}</Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button onClick={() => resourceService.downloadResource(resource.resource_id, resource.title)}>
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - File Preview */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>File Preview</CardTitle>
              <CardDescription>Preview of the resource content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-[4/3] bg-muted rounded-lg flex items-center justify-center">
                <div className="w-full h-full flex items-center justify-center">
                  {(() => {
                    const ext = resourceService.getFileExtension(resource.file_url).toLowerCase();
                    const fileUrl = resourceService.getFullFileUrl ? resourceService.getFullFileUrl(resource.file_url) : resource.file_url;
                    if (["jpg", "jpeg", "png"].includes(ext)) {
                      return (
                        <img src={fileUrl} alt={resource.title} className="max-h-72 max-w-full rounded shadow" />
                      );
                    }
                    if (ext === "pdf") {
                      return (
                        <iframe
                          src={fileUrl}
                          title={resource.title}
                          className="w-full h-72 rounded shadow border"
                        />
                      );
                    }
                    // Fallback for other types
                    return (
                      <div className="text-center w-full">
                        <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                        <p className="text-sm text-muted-foreground">No preview available for this file type.</p>
                        <Button className="mt-4" onClick={() => resourceService.downloadResource(resource.resource_id, resource.title)}>
                          <Download className="w-4 h-4 mr-2" />
                          Download to View Full Document
                        </Button>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Metadata */}
        <div className="space-y-6">
          {/* Resource Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resource Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>
                    {resource.user?.full_name
                      ? resource.user.full_name.split(" ").map((n: string) => n[0]).join("")
                      : "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{resource.user?.full_name || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">Uploader</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Uploaded:</span>
                  <span>{new Date(resource.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Downloads:</span>
                  <span>{resource.download_count}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">File Size:</span>
                  <span>{resourceService.formatFileSize(resource.file_size || 0)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{resource.description}</p>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}
