"use client"

import * as React from "react"
import Image from "next/image"
import { IconBrandGithub, IconBrandTwitter } from "@tabler/icons-react"

export function Footer() {
  return (
    <footer className="w-full bg-[#faf9f6] dark:bg-[#0c0c0c] text-neutral-900 dark:text-neutral-100 font-sans border-t-[0.5px] border-neutral-900 dark:border-white/20 overflow-hidden transition-colors duration-200">
      
      {/* 2-column footer layout matching Primer.com */}
      <div className="grid grid-cols-1 md:grid-cols-12 w-full items-stretch">
        
        {/* Left Side: Wordmark, links & copyright */}
        <div className="md:col-span-6 p-8 md:p-12 flex flex-col justify-between space-y-12">
          
          <div className="space-y-8">
            {/* Wordmark logo */}
            <div className="text-4xl font-sans font-black tracking-tight text-neutral-950 dark:text-white">
              Codiary.
            </div>

            {/* Sitemap links formatted identical to Navbar links */}
            <div className="grid grid-cols-2 gap-8 max-w-sm">
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">Notes Drawer Resources</h4>
                <ul className="space-y-2.5 text-xs font-bold uppercase tracking-widest text-neutral-600 dark:text-neutral-300">
                  <li><a href="#features" className="hover:text-neutral-950 dark:hover:text-white transition-colors">Workspace Features</a></li>
                  <li><a href="#" className="hover:text-neutral-950 dark:hover:text-white transition-colors">Documentation</a></li>
                  <li><a href="#" className="hover:text-neutral-950 dark:hover:text-white transition-colors">Quick Guides</a></li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">Organization</h4>
                <ul className="space-y-2.5 text-xs font-bold uppercase tracking-widest text-neutral-600 dark:text-neutral-300">
                  <li><a href="#" className="hover:text-neutral-950 dark:hover:text-white transition-colors">Security Rules</a></li>
                  <li><a href="#" className="hover:text-neutral-950 dark:hover:text-white transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-neutral-950 dark:hover:text-white transition-colors">Support Channels</a></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Socials & Copyright */}
          <div className="space-y-4">
            <div className="flex gap-4 text-neutral-600 dark:text-neutral-400">
              <a href="#" className="hover:text-neutral-950 dark:hover:text-white transition-colors"><IconBrandGithub className="size-5" /></a>
              <a href="#" className="hover:text-neutral-950 dark:hover:text-white transition-colors"><IconBrandTwitter className="size-5" /></a>
            </div>
            <div className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
              © {new Date().getFullYear()} Codiary. Your thoughts, kept private and safe.
            </div>
          </div>

        </div>

        {/* Right Side: Workspace photo block separated by vertical 0.5px grid border */}
        <div className="md:col-span-6 border-t-[0.5px] md:border-t-0 md:border-l-[0.5px] border-neutral-900 dark:border-white/20 relative min-h-[350px] overflow-hidden">
          <Image
            src="/footer_workspace.png"
            alt="Minimalist Desk & Workspace Setup"
            fill
            className="object-cover object-center dark:brightness-90 grayscale-[60%] hover:grayscale-0 transition-all duration-500"
          />
        </div>

      </div>

    </footer>
  )
}
