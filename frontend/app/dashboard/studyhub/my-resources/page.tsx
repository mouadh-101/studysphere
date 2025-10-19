"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, FileText, Edit, Trash2, ArrowLeft, Upload } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useEffect, useState } from "react"
import { resourceService } from "@/services"
import { Resource } from "@/services/types/resource"
import { useRouter } from "next/navigation"
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


export default function MyResourcesPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
    const [resources, setResources] = useState<Resource[]>([])
    const [filteredResources, setFilteredResources] = useState<Resource[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState("")
    const [totalResources, setTotalResources] = useState(0)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
  
    // Fetch resources from database
    useEffect(() => {
      fetchResources()
    }, [])
    const fetchResources = async () => {
    try {
      setIsLoading(true)
      setError("")
      const response = await resourceService.getMyResource()
      setResources(response.data.resources)
      setTotalResources(response.data.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load resources")
      console.error("Failed to fetch resources:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteClick = (resource: Resource, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setResourceToDelete(resource)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!resourceToDelete) return
    
    setIsDeleting(true)
    try {
      await resourceService.deleteResource(resourceToDelete.resource_id)
      // Refresh the resource list
      await fetchResources()
      setDeleteDialogOpen(false)
      setResourceToDelete(null)
    } catch (err) {
      console.error("Failed to delete resource:", err)
      alert(err instanceof Error ? err.message : "Failed to delete resource")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEditClick = (resourceId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    router.push(`/dashboard/studyhub/edit/${resourceId}`)
  }


  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/studyhub">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">My Resources</h1>
          <p className="text-muted-foreground mt-1">Manage your uploaded study materials</p>
        </div>
        <Link href="/dashboard/studyhub/upload">
          <Button>
            <Upload className="w-4 h-4 mr-2" />
            Upload New
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search your resources..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {resources.map((resource) => (
          <Link key={resource.resource_id} href={`/dashboard/studyhub/resource/${resource.resource_id}`}>
          <Card key={resource.resource_id}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="font-semibold text-lg line-clamp-1">{resource.title}</h3>
                    <div className="flex gap-2">
                      <Badge variant="outline">{resource.category}</Badge>
                      <Badge variant="secondary">{resourceService.getFileExtension(resource.file_url).toUpperCase()}</Badge>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground mb-3">
                    <p>Uploaded on {new Date(resource.created_at).toLocaleDateString()}</p>
                    <p>{resource.download_count} downloads</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="bg-transparent"
                      onClick={(e) => handleEditClick(resource.resource_id, e)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="bg-transparent text-red-600 hover:text-red-700"
                      onClick={(e) => handleDeleteClick(resource, e)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          </Link>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resource</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{resourceToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
