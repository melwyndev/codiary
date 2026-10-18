"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { IconSun, IconMoon, IconDeviceDesktop } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ModeToggle() {
  const { setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" className="h-9 w-9 shrink-0 border-[0.5px] border-neutral-900 dark:border-white/20 rounded-full bg-white dark:bg-[#121212]" disabled />
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className="h-9 w-9 shrink-0 border-[0.5px] border-neutral-900 dark:border-white/20 rounded-full bg-white dark:bg-[#121212] hover:bg-[#faf9f6] dark:hover:bg-[#1c1c1c] text-neutral-900 dark:text-white transition-all duration-200 cursor-pointer group"
          aria-label="Toggle Theme"
        >
          <IconSun className="h-4 w-4 rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0 text-amber-600 group-hover:rotate-45" />
          <IconMoon className="absolute h-4 w-4 rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100 text-sky-400 dark:group-hover:-rotate-45 group-hover:-rotate-45" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="border border-border bg-card rounded-2xl shadow-xl p-1.5 space-y-0.5 min-w-[140px]">
        <DropdownMenuItem onClick={() => setTheme("light")} className="cursor-pointer font-sans font-bold text-xs uppercase tracking-wider gap-2.5 rounded-xl py-2 px-3 focus:bg-muted">
          <IconSun className="size-4 text-amber-600" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} className="cursor-pointer font-sans font-bold text-xs uppercase tracking-wider gap-2.5 rounded-xl py-2 px-3 focus:bg-muted">
          <IconMoon className="size-4 text-sky-400" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")} className="cursor-pointer font-sans font-bold text-xs uppercase tracking-wider gap-2.5 rounded-xl py-2 px-3 focus:bg-muted">
          <IconDeviceDesktop className="size-4 text-emerald-500" />
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
