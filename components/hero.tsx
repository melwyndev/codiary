"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"

export function Hero() {
  return (
    <section className="w-full bg-[#faf9f6] dark:bg-[#0c0c0c] text-neutral-900 dark:text-neutral-100 font-sans border-b-[0.5px] border-neutral-900 dark:border-white/20 min-h-[calc(100dvh-73px)] flex flex-col justify-between transition-colors duration-200">
      
      {/* 1. Intro Grid Layout modeled precisely after Primer.com "School for What's Ahead" */}
      <div className="grid grid-cols-1 md:grid-cols-12 w-full border-b-[0.5px] border-neutral-900 dark:border-white/20 items-stretch flex-1">
        
        {/* Left Side Grid Block with pastel shapes and grid lines */}
        <div className="md:col-span-3 border-r-[0.5px] border-neutral-900 dark:border-white/20 p-8 flex flex-col justify-between items-center min-h-[220px] relative overflow-hidden">
          {/* Faint grid cells with exact 0.5px stroke */}
          <svg className="absolute inset-0 w-full h-full stroke-neutral-900 dark:stroke-white/20" xmlns="http://www.w3.org/2000/svg">
            <line x1="33.33%" y1="0" x2="33.33%" y2="100%" strokeWidth="0.5" />
            <line x1="66.66%" y1="0" x2="66.66%" y2="100%" strokeWidth="0.5" />
            <line x1="0" y1="33.33%" x2="100%" y2="33.33%" strokeWidth="0.5" />
            <line x1="0" y1="66.66%" x2="100%" y2="66.66%" strokeWidth="0.5" />
          </svg>
          <div 
            className="absolute top-[50%] left-[16.66%] w-6 h-6 bg-[#aac2ec] -translate-x-1/2 -translate-y-1/2 hover:scale-150 hover:rotate-12 hover:shadow-lg transition-all duration-300 cursor-pointer"
            title="Pastel Periwinkle Grid Cell (#aac2ec)" 
          />
          <div 
            className="absolute top-[83.33%] left-[83.33%] w-6 h-6 bg-[#f5c6a5] -translate-x-1/2 -translate-y-1/2 hover:scale-150 hover:-rotate-12 hover:shadow-lg transition-all duration-300 cursor-pointer" 
            title="Pastel Peach Grid Cell (#f5c6a5)"
          />
        </div>

        {/* Center Grid Block: Massive Editorial Typography with Tight Spacing */}
        <div className="md:col-span-6 px-6 sm:px-8 py-16 text-center flex flex-col items-center justify-center space-y-3.5">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-sans font-black tracking-tight leading-[0.98] text-neutral-950 dark:text-white">
            A Note Vault for What’s Ahead.
          </h1>
          <p className="text-base md:text-lg font-normal text-neutral-700 dark:text-neutral-300 max-w-lg leading-relaxed pt-1">
            Codiary is a private, AI-powered notes archive built for software developers to capture ideas, document architectures, track debug flows, and retrieve them via semantic vector search.
          </p>
          <div className="pt-2">
            <Button
              asChild
              className="btn-standard"
            >
              <a href="#features">Explore Features</a>
            </Button>
          </div>
        </div>

        {/* Right Side Grid Block with clean radar/tech schema pattern */}
        <div className="md:col-span-3 border-l-[0.5px] border-neutral-900 dark:border-white/20 p-8 hidden md:flex items-center justify-center relative overflow-hidden">
          {/* Tech schematics with 0.5px stroke */}
          <svg className="absolute inset-0 w-full h-full stroke-neutral-900 dark:stroke-white/20" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50%" cy="50%" r="90" fill="none" strokeWidth="0.5" />
            <circle cx="50%" cy="50%" r="60" fill="none" strokeWidth="0.5" />
            <circle cx="50%" cy="50%" r="30" fill="none" strokeWidth="0.5" strokeDasharray="3 3" />
            <line x1="0" y1="50%" x2="100%" y2="50%" strokeWidth="0.5" />
            <line x1="50%" y1="0" x2="50%" y2="100%" strokeWidth="0.5" />
            <line x1="0" y1="0" x2="100%" y2="100%" strokeWidth="0.5" strokeDasharray="2 2" />
          </svg>
          <div className="absolute right-4 top-4">
            <span className="w-4 h-24 hover:h-32 bg-[#b8d8be] block transition-all duration-300 cursor-pointer" title="Mint Vector Meter" />
          </div>
        </div>

      </div>

      {/* 3. Solid Horizontal Color Bar directly below the intro grid */}
      <div className="w-full h-3 bg-[#aac2ec]" />

    </section>
  )
}
