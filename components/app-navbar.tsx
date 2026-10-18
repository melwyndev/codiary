"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ModeToggle } from "@/components/mode-toggle";
import { UserMenu } from "@/components/user-menu";
import { useAuth } from "@/components/auth-provider";
import { useSidebar } from "@/components/sidebar-context";
import { PanelLeft } from "lucide-react";

interface AppNavbarProps {
	/** Optional title/left-content shown when authenticated (can be a string or React node) */
	title?: React.ReactNode;
	/** Optional right-side action buttons shown when authenticated */
	actions?: React.ReactNode;
}

function AppNavbarContent({ title, actions }: AppNavbarProps) {
	const pathname = usePathname();
	const { user } = useAuth();
	const { toggleSidebar } = useSidebar();

	const isHomeActive = pathname === "/";
	const isSignInActive = pathname === "/login";
	const isSignUpActive = pathname === "/signup";
	const isNotesRoute = pathname === "/notes" || pathname.startsWith("/notes/");

	return (
		<header className="h-20 px-4 sm:px-5 border-b border-border flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur-md z-40 transition-colors duration-200 shrink-0">
			{/* LEFT: Logo & Sidebar Toggle */}
			<div className="flex items-center gap-3 shrink-0">
				{user && (
					<button
						type="button"
						onClick={toggleSidebar}
						className="h-10 w-10 flex items-center justify-center rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
						title="Toggle Sidebar"
					>
						<PanelLeft className="w-4 h-4" />
					</button>
				)}
				{!isNotesRoute && (
					<Link
						href={user ? "/notes" : "/"}
						className="group flex items-center gap-2.5 cursor-pointer shrink-0"
					>
						<span className="font-sans font-black text-xl tracking-tight text-foreground">
							Codiary.
						</span>
						<div className="grid grid-cols-2 grid-rows-2 gap-[1.5px] border border-border p-[1.5px] w-5 h-5 bg-background shrink-0 group-hover:rotate-90 transition-transform duration-500">
							<span className="bg-[#aac2ec] block" />
							<span className="bg-[#fae8b4] block" />
							<span className="bg-[#f5c6a5] block" />
							<span className="bg-[#b8d8be] block" />
						</div>
					</Link>
				)}

				{/* Authenticated: show title slot next to logo */}
				{user && title && (
					<div className={`hidden sm:flex items-center gap-2 ${isNotesRoute ? "" : "border-l border-border/60 pl-3 ml-1"}`}>
						{typeof title === "string" ? (
							<span className="text-sm font-sans font-semibold text-foreground truncate max-w-xs">
								{title}
							</span>
						) : (
							title
						)}
					</div>
				)}
			</div>

			{/* RIGHT: Auth-conditional controls */}
			<div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
				{!user ? (
					/* ── PUBLIC NAV: HOME / SIGN IN / SIGN UP + ModeToggle ── */
					<>
						<Link
							href="/"
							className={`h-10 px-3 flex items-center text-xs font-sans font-bold uppercase tracking-wider transition-colors relative ${
								isHomeActive
									? "text-foreground"
									: "text-muted-foreground hover:text-foreground"
							}`}
						>
							<span>HOME</span>
							{isHomeActive && (
								<span className="absolute bottom-0 left-2 right-2 h-[2.5px] bg-foreground rounded-full animate-in fade-in zoom-in-95 duration-300" />
							)}
						</Link>

						<Link
							href="/login"
							className={`h-10 px-3 flex items-center text-xs font-sans font-bold uppercase tracking-wider transition-colors relative ${
								isSignInActive
									? "text-foreground"
									: "text-muted-foreground hover:text-foreground"
							}`}
						>
							<span>SIGN IN</span>
							{isSignInActive && (
								<span className="absolute bottom-0 left-2 right-2 h-[2.5px] bg-foreground rounded-full animate-in fade-in zoom-in-95 duration-300" />
							)}
						</Link>

						<Link
							href="/signup"
							className={`h-10 px-3 flex items-center text-xs font-sans font-bold uppercase tracking-wider transition-colors relative ${
								isSignUpActive
									? "text-foreground"
									: "text-muted-foreground hover:text-foreground"
							}`}
						>
							<span>SIGN UP</span>
							{isSignUpActive && (
								<span className="absolute bottom-0 left-2 right-2 h-[2.5px] bg-foreground rounded-full animate-in fade-in zoom-in-95 duration-300" />
							)}
						</Link>

						<ModeToggle />
					</>
				) : (
					/* ── APP NAV: actions slot + UserMenu ── */
					<>
						{actions && (
							<div className="flex items-center gap-1.5 sm:gap-2">
								{actions}
							</div>
						)}
						<UserMenu />
					</>
				)}
			</div>
		</header>
	);
}

export function AppNavbar({ title, actions }: AppNavbarProps) {
	return (
		<Suspense
			fallback={
				<header className="h-14 px-4 sm:px-5 border-b border-border flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur-md z-40">
					<Link
						href="/"
						className="font-sans font-black text-xl tracking-tight text-foreground"
					>
						Codiary.
					</Link>
				</header>
			}
		>
			<AppNavbarContent title={title} actions={actions} />
		</Suspense>
	);
}
