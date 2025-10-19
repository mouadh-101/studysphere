import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Lightbulb, FileSearch, MessageSquare, ClipboardCheck, Users } from "lucide-react"

const services = [
  {
    icon: FileText,
    title: "Smart Note Summarizer",
    description: "Turn lengthy lectures into concise notes",
    color: "text-accent",
  },
  {
    icon: Lightbulb,
    title: "Homework Solver & Explainer",
    description: "Get step-by-step solutions and explanations",
    color: "text-secondary",
  },
  {
    icon: FileSearch,
    title: "Research Paper Assistant",
    description: "Understand complex research quickly",
    color: "text-primary",
  },
  {
    icon: MessageSquare,
    title: "Language Learning Companion",
    description: "Practice languages with AI conversation partner",
    color: "text-accent",
  },
  {
    icon: ClipboardCheck,
    title: "Exam Prep & Smart Quiz Generator",
    description: "Create personalized practice tests",
    color: "text-secondary",
  },
  {
    icon: Users,
    title: "StudyHub",
    description: "Share and discover study resources",
    color: "text-primary",
  },
]

export function ServicesSection() {
  return (
    <section id="services" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground text-balance">
            Six Powerful Tools, One Platform
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Everything you need to excel in your academic journey, powered by advanced AI
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => {
            const Icon = service.icon
            return (
              <Card
                key={index}
                className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border"
              >
                <CardHeader>
                  <div
                    className={`w-12 h-12 rounded-lg bg-muted flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${service.color}`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-foreground">{service.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base text-muted-foreground">{service.description}</CardDescription>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
