"use client"

import Link from "next/link"
import { useAuth } from '@/hooks/use-auth';
import { usePathname } from "next/navigation"
import { BookOpen, Calculator, Languages, GraduationCap, FolderOpen, Settings, LogOut, FileText, BookMarked } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: BookOpen },
  { name: "Note Summarizer", href: "/dashboard/notes", icon: FileText },
  { name: "Homework Solver", href: "/dashboard/homework", icon: Calculator },
  { name: "Research Papers", href: "/dashboard/research-papers", icon: BookMarked},
  { name: "Language Learning", href: "/dashboard/language", icon: Languages },
  { name: "Exam Prep", href: "/dashboard/exam-prep", icon: GraduationCap },
  { name: "StudyHub", href: "/dashboard/studyhub", icon: FolderOpen },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-lg">StudySphere</span>
        </Link>
      </div>

      {/* User Profile */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback><h1 className="text-lg font-bold">{user?.full_name.charAt(0)}</h1></AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.full_name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.university}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-border space-y-1">
        <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground">
          <Settings className="w-5 h-5" />
          Settings
        </Button>
        <Button onClick={logout} variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground">
          <LogOut className="w-5 h-5" />
          Logout
        </Button>
      </div>
    </aside>
  )
}
