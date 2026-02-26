"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { Hero } from "@/components/ui/hero-new"

export default function Home() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && query.trim()) {
      setLoading(true)
      try {
        const res = await fetch("/api/decisions/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        })

        if (res.ok) {
          const data = await res.json()
          router.push(`/decision/${data.id}/options/`)
        } else {
          console.error("Failed to create decision")
          alert("Server error: Could not save the decision. Please ensure the backend is running.")
        }
      } catch (error) {
        console.error("Error:", error)
        alert("Network error: Could not reach the server.")
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <>

      <Hero
        title="Decision Companion System"
        subtitle="Make smarter decisions with AI-powered assistance."
      >
        <div className="flex flex-col items-center gap-6 mt-4">

          {/* Heading */}
          <h2 className="bg-gradient-to-br from-gray-900 to-gray-500 bg-clip-text text-transparent dark:from-gray-100 dark:to-gray-400 text-2xl md:text-3xl font-semibold tracking-tight text-center animate-fade-up">
            What do you want to Search ?
          </h2>

          {/* Search Bar */}
          <div className="relative w-full max-w-2xl animate-fade-up">
            <div className="relative flex items-center w-full h-14 rounded-full border border-gray-200 bg-white/80 backdrop-blur-sm px-4 shadow-lg hover:shadow-xl transition-shadow dark:border-gray-800 dark:bg-black/80">
              <Search className="mr-3 h-5 w-5 shrink-0 opacity-50 text-gray-500" />
              <input
                className="flex h-full w-full rounded-full bg-transparent py-3 text-lg outline-none placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50 dark:placeholder:text-gray-500 text-black dark:text-white"
                placeholder="e.g. Choose a laptop under budget..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                autoFocus
              />
            </div>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 animate-fade-up font-medium">
            Enter to continue
          </p>
        </div>
      </Hero>
    </>
  )
}
