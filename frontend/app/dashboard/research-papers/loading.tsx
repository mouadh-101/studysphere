import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function ResearchPapersLoading() {
  return (
    <div className="p-8 space-y-6">
      <div className="h-10 bg-muted rounded-lg w-1/3 animate-pulse" />
      <div className="h-10 bg-muted rounded-lg w-full animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-6 bg-muted rounded-lg w-2/3 animate-pulse mb-2" />
              <div className="h-4 bg-muted rounded-lg w-full animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-muted rounded-lg w-full animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
