import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/auth-provider";
import { SmoothScroll } from "@/components/smooth-scroll";

const figtree = Figtree({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: "Codiary - Private Notes Drawer",
  description: "A simple, distraction-free notes drawer to write, organize, and keep your thoughts safe.",
  keywords: ["notes", "notebook", "notes drawer", "ideas", "journal", "writing"],
  authors: [{ name: "Codiary Team" }],
  openGraph: {
    title: "Codiary - Private Notes Drawer",
    description: "A simple, distraction-free notes drawer to write, organize, and keep your thoughts safe.",
    type: "website",
    siteName: "Codiary",
  },
};

import { SidebarProvider } from "@/components/sidebar-context";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={cn("h-full", "antialiased", figtree.variable, "font-sans")}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col bg-zinc-950 text-zinc-100 font-sans"
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <SidebarProvider>
              <SmoothScroll>
                {children}
              </SmoothScroll>
            </SidebarProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
