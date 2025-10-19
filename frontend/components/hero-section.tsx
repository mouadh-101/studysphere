"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Play } from "lucide-react"
import Link from "next/link"

export function HeroSection() {
  return (
    <section id="home" className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground leading-tight text-balance">
                Transform Your Study Experience with AI
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed text-pretty">
                The all-in-one platform that makes studying smarter, not harder
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-base">
                <Link href="/signup">
                  Start Your Free Journey
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-base bg-transparent">
                <Play className="mr-2 w-5 h-5" />
                Watch Demo Video
              </Button>
            </div>
          </div>

          {/* Right Visual */}
          <div className="relative">
            <div className="relative aspect-square rounded-2xl bg-gradient-to-br from-accent/20 via-secondary/20 to-primary/20 p-8 backdrop-blur-sm border border-border">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-accent/10 to-primary/10 animate-pulse" />
              <div className="relative h-full flex items-center justify-center">
                <img
                  src="/ai-studying-with-books-and-technology-illustration.jpg"
                  alt="AI-powered studying illustration"
                  className="w-full h-full object-cover "
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
