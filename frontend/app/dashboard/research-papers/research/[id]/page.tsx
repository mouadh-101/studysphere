"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Download, Share2, ExternalLink, FileText, Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { researchPaperService, ResearchPaper } from "@/services/researchPaperService"

export default function ResearchPaperDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [paper, setPaper] = useState<ResearchPaper | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPolling, setIsPolling] = useState(false)

  useEffect(() => {
    loadPaper()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // Polling effect
  useEffect(() => {
    if (!paper) return

    // Check if paper is still processing
    if (paper.status === "processing" || paper.status === "pending") {
      setIsPolling(true)
      const pollInterval = setInterval(async () => {
        try {
          const updatedPaper = await researchPaperService.getPaperById(id)
          setPaper(updatedPaper)
          
          // Stop polling if completed or failed
          if (updatedPaper.status === "completed" || updatedPaper.status === "failed") {
            setIsPolling(false)
            clearInterval(pollInterval)
          }
        } catch (err) {
          console.error("Error polling paper status:", err)
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
  }, [paper, id])

  const loadPaper = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await researchPaperService.getPaperById(id)
      setPaper(data)
    } catch (err: any) {
      console.error("Error loading paper:", err)
      setError(err.message || "Failed to load paper")
    } finally {
      setLoading(false)
    }
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


  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading research paper...</p>
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
            <h2 className="text-xl font-semibold">Error Loading Research Paper</h2>
            <p className="text-muted-foreground mt-2">{error}</p>
          </div>
          <div className="flex gap-2 justify-center">
            <Button onClick={loadPaper} variant="outline">
              Try Again
            </Button>
            <Link href="/dashboard/research-papers">
              <Button variant="ghost">Back to Papers</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!paper) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Research paper not found</p>
          <Link href="/dashboard/research-papers">
            <Button variant="outline">Back to Papers</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <Link href="/dashboard/research-papers">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold line-clamp-2">{paper.title}</h1>
              {getStatusBadge(paper.status)}
            </div>
            <p className="text-muted-foreground mt-1">
              {new Date(paper.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => navigator.clipboard.writeText(window.location.href)}
            disabled={paper.status !== "completed"}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button asChild disabled={paper.status !== "completed"}>
            <a href={`/${paper.file_path}`} download>
              <Download className="w-4 h-4 mr-2" />
              Download
            </a>
          </Button>
        </div>
      </div>

      {/* Processing/Error States */}
      {(paper.status === "processing" || paper.status === "pending") && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="flex items-center gap-3 pt-6">
            <Loader2 className="w-5 h-5 animate-spin text-yellow-600" />
            <div className="flex-1">
              <p className="text-yellow-800 font-medium">
                {paper.status === "pending" ? "Your research paper is queued for processing..." : "Your research paper is being analyzed..."}
              </p>
              <p className="text-yellow-700 text-sm mt-1">
                {isPolling ? "Checking status every 3 seconds. This page will update automatically." : "Please wait..."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {paper.status === "failed" && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-red-800 font-medium">Processing failed</p>
              <p className="text-red-700 text-sm mt-1">Failed to analyze the research paper. Please try uploading again.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Three-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Original Content */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Document
            </CardTitle>
            <CardDescription>Original research paper</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted rounded-lg p-4 text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium mb-3">{paper.title}.pdf</p>
              <Button asChild className="w-full mb-2">
                <a href={`/${paper.file_path}`} download>
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </a>
              </Button>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold text-sm mb-3">Text Preview</h3>
              <div className="bg-muted rounded p-3 max-h-64 overflow-y-auto">
                <pre className="text-xs whitespace-pre-wrap font-sans leading-relaxed text-muted-foreground">
                  {paper.text_content ? paper.text_content.substring(0, 500) + "..." : "No text extracted yet."}
                </pre>
              </div>
              <p className="text-xs text-muted-foreground mt-3">To see full detail, download the document</p>
            </div>
          </CardContent>
        </Card>

        {/* Middle Column: Summary & Citations */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Summary & Citations</CardTitle>
            <CardDescription>AI-generated analysis and citation formats</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="citations">Citations</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="space-y-4 mt-4">
                {paper.summary?.abstract || paper.summary?.key_findings?.length ? (
                  <>
                    <div>
                      <h3 className="font-semibold text-sm mb-2">Abstract</h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {paper.summary?.abstract || "No abstract available yet."}
                      </p>
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="font-semibold text-sm mb-3">Key Findings</h3>
                      <ul className="space-y-2">
                        {paper.summary?.key_findings?.length ? (
                          paper.summary.key_findings.map((finding, index) => (
                            <li key={index} className="text-sm text-muted-foreground flex gap-2">
                              <span className="text-primary font-bold">•</span>
                              <span>{finding}</span>
                            </li>
                          ))
                        ) : (
                          <li className="text-xs text-muted-foreground">No key findings available yet.</li>
                        )}
                      </ul>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 space-y-3">
                    {(paper.status === "processing" || paper.status === "pending") && (
                      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    )}
                    <p className="text-sm text-muted-foreground text-center">
                      {paper.status === "completed" ? "No summary available" : "Summary being generated..."}
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="citations" className="space-y-4 mt-4">
                {paper.citations?.formatted_citations ? (
                  <>
                    <div>
                      <h3 className="font-semibold text-sm mb-2">APA</h3>
                      <p className="text-xs bg-muted p-2 rounded leading-relaxed">
                        {paper.citations?.formatted_citations?.apa?.[0] || "No APA citation yet."}
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-sm mb-2">MLA</h3>
                      <p className="text-xs bg-muted p-2 rounded leading-relaxed">
                        {paper.citations?.formatted_citations?.mla?.[0] || "No MLA citation yet."}
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-sm mb-2">Chicago</h3>
                      <p className="text-xs bg-muted p-2 rounded leading-relaxed">
                        {paper.citations?.formatted_citations?.chicago?.[0] || "No Chicago citation yet."}
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-sm mb-2">IEEE</h3>
                      <p className="text-xs bg-muted p-2 rounded leading-relaxed">
                        {paper.citations?.formatted_citations?.ieee?.[0] || "No IEEE citation yet."}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 space-y-3">
                    {(paper.status === "processing" || paper.status === "pending") && (
                      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    )}
                    <p className="text-sm text-muted-foreground text-center">
                      {paper.status === "completed" ? "No citations available" : "Citations being generated..."}
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Right Column: Research Questions & Related Papers */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Research Context</CardTitle>
            <CardDescription>Questions and related papers</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="questions" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="questions">Questions</TabsTrigger>
                <TabsTrigger value="related">Related</TabsTrigger>
              </TabsList>

              <TabsContent value="questions" className="space-y-4 mt-4">
                {paper.research_questions?.questions?.length || paper.research_questions?.research_gaps?.length ? (
                  <>
                    <div>
                      <h3 className="font-semibold text-sm mb-3">Research Questions</h3>
                      <ul className="space-y-2">
                        {paper.research_questions?.questions?.length ? (
                          paper.research_questions.questions.map((question, index) => (
                            <li key={index} className="text-xs text-muted-foreground leading-relaxed">
                              <span className="font-semibold text-foreground">Q{index + 1}:</span> {question}
                            </li>
                          ))
                        ) : (
                          <li className="text-xs text-muted-foreground">No research questions available yet.</li>
                        )}
                      </ul>
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="font-semibold text-sm mb-3">Research Gaps</h3>
                      <ul className="space-y-2">
                        {paper.research_questions?.research_gaps?.length ? (
                          paper.research_questions.research_gaps.map((gap, index) => (
                            <li key={index} className="text-xs text-muted-foreground flex gap-2">
                              <span className="text-primary">•</span>
                              <span>{gap}</span>
                            </li>
                          ))
                        ) : (
                          <li className="text-xs text-muted-foreground">No research gaps available yet.</li>
                        )}
                      </ul>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 space-y-3">
                    {(paper.status === "processing" || paper.status === "pending") && (
                      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    )}
                    <p className="text-sm text-muted-foreground text-center">
                      {paper.status === "completed" ? "No research questions available" : "Research questions being generated..."}
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="related" className="space-y-3 mt-4">
                <h3 className="font-semibold text-sm mb-3">Related Papers</h3>
                <RelatedPapers paperId={paper.paper_id} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Related papers tab content
function RelatedPapers({ paperId }: { paperId: string }) {
  const [related, setRelated] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    researchPaperService
      .getRelatedPapers(paperId)
      .then((data) => {
        setRelated(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || "Failed to load related papers")
        setLoading(false)
      })
  }, [paperId])

  if (loading) return <div className="text-xs text-muted-foreground">Loading related papers...</div>
  if (error) return <div className="text-xs text-destructive">{error}</div>
  if (!related.length) return <div className="text-xs text-muted-foreground">No related papers found.</div>

  return (
    <div className="space-y-2">
      {related.map((rp, idx) => (
        <div key={idx} className="border rounded-lg p-3 hover:bg-accent/50 transition-colors">
          <a
            href={rp.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-primary hover:underline flex items-center gap-1 mb-1"
          >
            {rp.title}
            <ExternalLink className="w-3 h-3" />
          </a>
          <p className="text-xs text-muted-foreground">
            {rp.authors?.map?.((a: any) => a.name).join(", ") || rp.authors || ""}
          </p>
        </div>
      ))}
    </div>
  )
}
