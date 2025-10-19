"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Mic, Square, ArrowLeft, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { noteSummarizerService } from "@/services/noteSummarizerService"

export default function NewNotePage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"record" | "upload">("upload")
  const [isRecording, setIsRecording] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        const audioFile = new File([audioBlob], `recording-${Date.now()}.webm`, { type: "audio/webm" })
        setAudioFile(audioFile)
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (error) {
      console.error("Error accessing microphone:", error)
      setErrorMessage("Failed to access microphone. Please check permissions.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Check file type
      const validTypes = ["audio/mpeg", "audio/wav", "audio/mp3", "audio/m4a", "audio/webm", "audio/ogg"]
      if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a|webm|ogg)$/i)) {
        setErrorMessage("Please select a valid audio file (MP3, WAV, M4A, WEBM, OGG)")
        return
      }
      setAudioFile(file)
      setUploadStatus("idle")
      setErrorMessage("")
    }
  }

  const handleUpload = async () => {
    if (!audioFile) return

    try {
      setIsUploading(true)
      setUploadStatus("uploading")
      setUploadProgress(0)
      setErrorMessage("")

      const response = await noteSummarizerService.uploadAudioNote(audioFile)

      setUploadStatus("success")
      setUploadProgress(100)

      // Redirect to note detail page after a short delay
      setTimeout(() => {
        router.push(`/dashboard/notes/note/${response.note_id}`)
      }, 1500)
    } catch (error: any) {
      console.error("Error uploading audio:", error)
      setUploadStatus("error")
      setErrorMessage(error.response?.data?.message || "Failed to upload audio. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const resetAudio = () => {
    setAudioFile(null)
    setUploadStatus("idle")
    setRecordingTime(0)
    setErrorMessage("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/notes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create New Note Summary</h1>
          <p className="text-muted-foreground mt-1">Record or upload audio to generate an AI-powered summary</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Upload Audio</CardTitle>
            <CardDescription>Record your lecture or upload an audio file</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Tab Selection */}
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "record" | "upload")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="record">
                  <Mic className="w-4 h-4 mr-2" />
                  Record Audio
                </TabsTrigger>
                <TabsTrigger value="upload">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload File
                </TabsTrigger>
              </TabsList>

              {/* Record Tab */}
              <TabsContent value="record" className="mt-6">
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center space-y-6">
                  <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center ${
                    isRecording ? "bg-red-500 animate-pulse" : "bg-primary/20"
                  }`}>
                    <Mic className={`w-12 h-12 ${isRecording ? "text-white" : "text-primary"}`} />
                  </div>

                  <div>
                    <p className="text-lg font-semibold mb-2">
                      {isRecording ? "Recording..." : audioFile && activeTab === "record" ? "Recording Complete" : "Ready to Record"}
                    </p>
                    {isRecording && (
                      <p className="text-2xl font-mono text-red-500">{formatTime(recordingTime)}</p>
                    )}
                    {audioFile && activeTab === "record" && !isRecording && (
                      <p className="text-sm text-muted-foreground">
                        Recording duration: {formatTime(recordingTime)}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3 justify-center">
                    {!isRecording && !audioFile && (
                      <Button onClick={startRecording} size="lg">
                        <Mic className="w-4 h-4 mr-2" />
                        Start Recording
                      </Button>
                    )}
                    {isRecording && (
                      <Button onClick={stopRecording} variant="destructive" size="lg">
                        <Square className="w-4 h-4 mr-2" />
                        Stop Recording
                      </Button>
                    )}
                    {audioFile && !isRecording && activeTab === "record" && (
                      <>
                        <Button onClick={resetAudio} variant="outline">
                          Record Again
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Upload Tab */}
              <TabsContent value="upload" className="mt-6">
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center space-y-4">
                  <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                  
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {audioFile && activeTab === "upload" 
                        ? "File selected" 
                        : "Select an audio file from your device"}
                    </p>
                    {audioFile && activeTab === "upload" && (
                      <p className="text-sm font-medium">{audioFile.name}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Supports MP3, WAV, M4A, WEBM, OGG files
                    </p>
                  </div>

                  <div className="flex gap-2 justify-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="audio-upload"
                    />
                    <Button onClick={() => fileInputRef.current?.click()} variant="outline">
                      <Upload className="w-4 h-4 mr-2" />
                      {audioFile && activeTab === "upload" ? "Choose Different File" : "Choose File"}
                    </Button>
                    {audioFile && activeTab === "upload" && (
                      <Button onClick={resetAudio} variant="ghost">
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Upload Status */}
            {uploadStatus === "uploading" && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900">Uploading audio...</p>
                    <p className="text-xs text-blue-700 mt-1">Your note will be processed automatically</p>
                  </div>
                </div>
              </div>
            )}

            {uploadStatus === "success" && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-900">Upload successful!</p>
                    <p className="text-xs text-green-700 mt-1">Redirecting to your note...</p>
                  </div>
                </div>
              </div>
            )}

            {uploadStatus === "error" && errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-900">Upload failed</p>
                    <p className="text-xs text-red-700 mt-1">{errorMessage}</p>
                  </div>
                </div>
              </div>
            )}

            {errorMessage && uploadStatus === "idle" && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <p className="text-sm text-red-900">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Link href="/dashboard/notes" className="flex-1">
                <Button variant="outline" className="w-full" disabled={isUploading}>
                  Cancel
                </Button>
              </Link>
              <Button
                onClick={handleUpload}
                className="flex-1"
                disabled={!audioFile || isUploading || uploadStatus === "success"}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload & Process
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
