"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Hero } from "@/components/hero";
import { Features } from "@/components/features";
import { ContactForm } from "@/components/contact-form";
import { Footer } from "@/components/footer";
import { AppNavbar } from "@/components/app-navbar";
import { useAuth } from "@/components/auth-provider";

export default function Home() {
	const { user, loading } = useAuth();
	const router = useRouter();

	// Redirect authenticated users to their notes vault
	useEffect(() => {
		if (!loading && user) {
			router.replace("/notes");
		}
	}, [user, loading, router]);

	// While loading auth state, show nothing to avoid flash of landing page for authed users
	if (loading) {
		return null;
	}

	// If user is set (redirect in flight), render nothing
	if (user) {
		return null;
	}

	return (
		<div className="min-h-full flex flex-col bg-[#faf9f6] dark:bg-[#0c0c0c] text-neutral-900 dark:text-neutral-100 font-sans selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-neutral-950 transition-colors duration-200">
			{/* Universal Navbar */}
			<AppNavbar />

			{/* Landing page sections */}
			<main className="flex-1 flex flex-col items-center justify-start w-full">
				<Hero />
				<Features />
				<ContactForm />
			</main>

			{/* Global Footer */}
			<Footer />
		</div>
	);
}
