"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Camera, FileText, Sparkles, ArrowLeft, X, Image as ImageIcon } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { homeworkService } from "@/services"
import { useToast } from "@/hooks/use-toast"

export default function NewHomeworkPage() {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/png', 'image/jpg']
    const validDocTypes = ['application/pdf']
    const allValidTypes = [...validImageTypes, ...validDocTypes]

    if (!allValidTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPG, PNG, or PDF file",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB",
        variant: "destructive",
      })
      return
    }

    setSelectedFile(file)

    // Create preview for images
    if (validImageTypes.includes(file.type)) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setPreviewUrl(null)
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleSolve = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive",
      })
      return
    }

    try {
      setIsProcessing(true)

      // Upload the file
      const response = await homeworkService.uploadHomework(selectedFile)

      toast({
        title: "Success!",
        description: "Your homework has been uploaded and is being processed",
      })

      // Navigate to the problem detail page
      router.push(`/dashboard/homework/solver/${response.data.problemId}`)
    } catch (error: any) {
      console.error('Upload error:', error)
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload homework. Please try again.",
        variant: "destructive",
      })
      setIsProcessing(false)
    }
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/homework">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Submit New Problem</h1>
          <p className="text-muted-foreground mt-1">Upload your homework problem to get step-by-step solutions</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Problem Submission</CardTitle>
            <CardDescription>Choose how you want to input your problem</CardDescription>
          </CardHeader>
          <CardContent>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg,application/pdf"
              onChange={handleFileSelect}
              className="hidden"
            />

            <Tabs defaultValue="image">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="image">
                  <Camera className="w-4 h-4 mr-2" />
                  Image
                </TabsTrigger>
                <TabsTrigger value="file">
                  <Upload className="w-4 h-4 mr-2" />
                  PDF File
                </TabsTrigger>
              </TabsList>

              <TabsContent value="image" className="mt-6">
                {selectedFile && previewUrl ? (
                  <div className="relative border-2 border-border rounded-lg p-4">
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 z-10"
                      onClick={handleRemoveFile}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="mt-4 text-center">
                      <p className="text-sm font-medium">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="border-2 border-dashed border-border rounded-lg p-16 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={handleUploadClick}
                  >
                    <Camera className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">Upload Problem Image</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Drag and drop an image of your problem, or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground mb-6">Supports JPG, PNG files (max 10MB)</p>
                    <Button variant="outline" size="lg" type="button">
                      <Upload className="w-4 h-4 mr-2" />
                      Choose Image
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="file" className="mt-6">
                {selectedFile && !previewUrl ? (
                  <div className="relative border-2 border-border rounded-lg p-8">
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={handleRemoveFile}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    <div className="text-center">
                      <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                      <p className="font-medium mb-1">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="border-2 border-dashed border-border rounded-lg p-16 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={handleUploadClick}
                  >
                    <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">Upload PDF Document</h3>
                    <p className="text-sm text-muted-foreground mb-4">Upload a PDF containing your problem</p>
                    <p className="text-xs text-muted-foreground mb-6">Supports PDF files (max 10MB)</p>
                    <Button variant="outline" size="lg" type="button">
                      <Upload className="w-4 h-4 mr-2" />
                      Choose PDF
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <div className="flex gap-3 pt-6 mt-6 border-t">
              <Link href="/dashboard/homework" className="flex-1">
                <Button variant="outline" className="w-full bg-transparent">
                  Cancel
                </Button>
              </Link>
              <Button 
                onClick={handleSolve} 
                className="flex-1" 
                disabled={isProcessing || !selectedFile}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {isProcessing ? "Uploading..." : "Solve This Problem"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
