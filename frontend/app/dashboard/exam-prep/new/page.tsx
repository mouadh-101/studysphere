"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, Sparkles, ArrowLeft, X, FileText, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { quizService } from "@/services/quizService"

export default function NewQuizPage() {
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [numQuestions, setNumQuestions] = useState("10")
  const [difficulty, setDifficulty] = useState("medium")
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    const validation = quizService.validateQuizFile(file)
    if (!validation.valid) {
      toast({
        title: "Invalid File",
        description: validation.error,
        variant: "destructive",
      })
      return
    }

    setSelectedFile(file)
    toast({
      title: "File Selected",
      description: `${file.name} (${quizService.formatFileSize(file.size)})`,
    })
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleGenerate = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a study material file to generate a quiz",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)

    try {
      const response = await quizService.generateQuiz({
        file: selectedFile,
        numQuestions: parseInt(numQuestions),
        difficulty: difficulty as "easy" | "medium" | "hard",
      })

      toast({
        title: "Quiz Generated",
        description: `Successfully generated a quiz with ${numQuestions} questions`,
      })

      // Navigate to the generated quiz
      router.push(`/dashboard/exam-prep/${response.data.quiz_id}`)
    } catch (error: any) {
      console.error("Error generating quiz:", error)
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate quiz. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const getFileIcon = (file: File) => {
    if (file.type === "application/pdf") return "📄"
    if (file.type.includes("word")) return "📝"
    return "📃"
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/exam-prep">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create New Quiz</h1>
          <p className="text-muted-foreground mt-1">Upload study materials to generate a custom quiz</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Quiz Creation</CardTitle>
            <CardDescription>Upload your study materials and set quiz parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* File Upload */}
            <div className="space-y-2">
              <Label>Study Materials</Label>
              {!selectedFile ? (
                <div 
                  className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Drag and drop your study materials here, or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">Supports PDF, DOCX, TXT files (max 50MB)</p>
                  <Button variant="outline" type="button">
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </Button>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleFileSelect}
                  />
                </div>
              ) : (
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{getFileIcon(selectedFile)}</div>
                      <div>
                        <p className="text-sm font-medium">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {quizService.formatFileSize(selectedFile.size)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleRemoveFile}
                      type="button"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Quiz Parameters */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="questions">Number of Questions</Label>
                <Select value={numQuestions} onValueChange={setNumQuestions}>
                  <SelectTrigger id="questions">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 Questions</SelectItem>
                    <SelectItem value="10">10 Questions</SelectItem>
                    <SelectItem value="15">15 Questions</SelectItem>
                    <SelectItem value="20">20 Questions</SelectItem>
                    <SelectItem value="25">25 Questions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty Level</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger id="difficulty">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <Link href="/dashboard/exam-prep" className="flex-1">
                <Button variant="outline" className="w-full bg-transparent" type="button">
                  Cancel
                </Button>
              </Link>
              <Button 
                onClick={handleGenerate} 
                className="flex-1" 
                disabled={isGenerating || !selectedFile}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Quiz...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Create Quiz
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
