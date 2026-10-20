"use client"

import * as React from "react"
import { useState } from "react"
import { IconChevronRight, IconCode, IconShieldLock, IconRefresh } from "@tabler/icons-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function Features() {
  const [activeCard, setActiveCard] = useState<number | null>(null)

  const featureSnippets = [
    {
      id: 1,
      title: "Private Sandbox",
      numberColor: "text-[#5c7ba8] dark:text-[#aac2ec]",
      icon: <IconShieldLock className="size-4 text-[#5c7ba8] dark:text-[#aac2ec]" />,
      summary: "Local-first vault architecture with zero analytics tracking, ensuring your thoughts, documents, and notes remain your private asset.",
      code: `// codiary.vault.config.json
{
  "storage": "local_sqlite_db",
  "encryption": "AES-256-GCM",
  "telemetry": false,
  "sync": "offline_sandboxed"
}`
    },
    {
      id: 2,
      title: "Debounced Autosave",
      numberColor: "text-[#bca462] dark:text-[#fae8b4]",
      icon: <IconRefresh className="size-4 text-[#bca462] dark:text-[#fae8b4]" />,
      summary: "Focus entirely on writing. All your drafts, ideas, and markdown notes auto-save instantly to prevent working data loss.",
      code: `// Autosave engine
useDebouncedSave({
  delayMs: 300,
  target: "~/vault/notes/",
  onSave: (file) => console.log("Saved: " + file.id)
})`
    },
    {
      id: 3,
      title: "AI Auto-Organize",
      numberColor: "text-[#b06060] dark:text-[#eba7a7]",
      icon: <IconCode className="size-4 text-[#b06060] dark:text-[#eba7a7]" />,
      summary: "Clean messy drafts automatically. The AI structures your writing, generates summaries, and categorizes note metadata.",
      code: `// Embedded vector indexing
const embed = await localAI.vectorize({
  content: currentNote,
  tags: ["ideas", "journal", "projects"]
})`
    }
  ]

  return (
    <section id="features" className="w-full bg-[#faf9f6] dark:bg-[#0c0c0c] text-neutral-900 dark:text-neutral-100 font-sans min-h-dvh flex flex-col justify-center border-b-[0.5px] border-neutral-900 dark:border-white/20 transition-colors duration-200 py-16">
      <div className="max-w-7xl mx-auto px-6 space-y-8">
        
        {/* Section Header */}
        <div className="pb-6">
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-sans font-black tracking-tight leading-[1.02] text-neutral-950 dark:text-white max-w-3xl">
            The Building Blocks Of A Timeless Notes Vault.
          </h2>
        </div>

        {/* Feature Cards Grid - 3 Columns with shadcn Card UI */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {featureSnippets.map((feature, idx) => {
            const isSelected = activeCard === feature.id
            const topAccents = ["border-t-2 border-t-[#5c7ba8] dark:border-t-[#aac2ec]", "border-t-2 border-t-[#bca462] dark:border-t-[#fae8b4]", "border-t-2 border-t-[#b06060] dark:border-t-[#eba7a7]"]

            return (
              <Card 
                key={feature.id}
                onClick={() => setActiveCard(isSelected ? null : feature.id)}
                className={`group rounded-none border-[0.5px] ${topAccents[idx]} transition-all duration-300 p-8 gap-0 cursor-pointer select-none ${
                  isSelected 
                    ? "border-neutral-950 dark:border-white/60 bg-[#f4f2ec] dark:bg-[#161616] shadow-md" 
                    : "border-neutral-900 dark:border-white/20 bg-white dark:bg-[#121212] hover:bg-[#faf8f4] dark:hover:bg-[#161616] hover:border-neutral-950 dark:hover:border-white/40"
                }`}
              >
                <CardHeader className="p-0 mb-2 space-y-0">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-4xl font-sans font-black ${feature.numberColor} transition-transform duration-300 group-hover:scale-110 block`}>
                      {feature.id}
                    </span>
                  </div>

                  <CardTitle className="text-lg font-bold uppercase tracking-wider text-neutral-950 dark:text-white">
                    {feature.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-0">
                  <p className="text-sm md:text-base text-neutral-800 dark:text-neutral-200 leading-relaxed font-normal">
                    {feature.summary}
                  </p>

                  {/* Animated Snippet Reveal */}
                  {isSelected && (
                    <div className="mt-4 pt-4 border-t-[0.5px] border-neutral-900/20 dark:border-white/10 animate-in fade-in zoom-in-95 duration-200 space-y-2">
                      <div className="text-[10px] font-sans font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                        {"// Implementation Spec"}
                      </div>
                      <pre className="bg-[#1e1e1e] text-neutral-200 p-3.5 rounded-none text-[11px] font-mono overflow-x-auto border-[0.5px] border-neutral-800">
                        <code>{feature.code}</code>
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

      </div>
    </section>
  )
}
