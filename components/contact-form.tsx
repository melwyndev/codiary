"use client";

import * as React from "react";
import { useState } from "react";
import { IconCheck, IconLoader2 } from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function ContactForm() {
	const [formData, setFormData] = useState({
		name: "",
		email: "",
	});
	const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.name || !formData.email) return;

		setStatus("loading");
		setTimeout(() => {
			setStatus("success");
		}, 1200);
	};

	return (
		<section
			id="contact"
			className="w-full bg-[#faf9f6] dark:bg-[#0c0c0c] text-neutral-900 dark:text-neutral-100 font-sans border-b-[0.5px] border-neutral-900 dark:border-white/20 min-h-dvh flex flex-col justify-between transition-colors duration-200"
		>
			{/* Solid Orange Color Bar Accent modeled after the screenshot */}
			<div className="w-full h-4 bg-[#f5c6a5] border-b-[0.5px] border-neutral-900 dark:border-white/20" />

			{/* Grid Layout Container */}
			<div className="grid grid-cols-1 md:grid-cols-12 w-full items-stretch flex-1">
				{/* Left Side: Empty styled Grid Cell with targeting concentric squares pattern */}
				<div className="md:col-span-3 border-r-[0.5px] border-neutral-900 dark:border-white/20 hidden md:flex items-center justify-center relative overflow-hidden min-h-[260px]">
					<svg
						className="absolute inset-0 w-full h-full stroke-neutral-900 dark:stroke-white/20"
						xmlns="http://www.w3.org/2000/svg"
					>
						<rect
							x="15%"
							y="15%"
							width="70%"
							height="70%"
							fill="none"
							strokeWidth="0.5"
						/>
						<rect
							x="25%"
							y="25%"
							width="50%"
							height="50%"
							fill="none"
							strokeWidth="0.5"
							strokeDasharray="3 3"
						/>
						<circle cx="50%" cy="50%" r="6" fill="none" strokeWidth="0.5" />
						<line
							x1="0"
							y1="50%"
							x2="100%"
							y2="50%"
							strokeWidth="0.5"
							strokeDasharray="1 4"
						/>
						<line
							x1="50%"
							y1="0"
							x2="50%"
							y2="100%"
							strokeWidth="0.5"
							strokeDasharray="1 4"
						/>
					</svg>
					<div className="absolute left-6 bottom-6 flex gap-2">
						<span
							className="w-6 h-6 bg-[#fae8b4] block hover:scale-125 hover:rotate-12 transition-transform duration-300 cursor-pointer"
							title="Pastel Yellow Block"
						/>
						<span
							className="w-6 h-6 bg-[#aac2ec] block hover:scale-125 hover:-rotate-12 transition-transform duration-300 cursor-pointer"
							title="Pastel Blue Block"
						/>
					</div>
				</div>

				{/* Center: Enrollment Call to Action & Form */}
				<div className="md:col-span-6 px-6 sm:px-8 py-16 flex flex-col items-center justify-center text-center space-y-8 md:space-y-10">
					<h2 className="text-4xl md:text-6xl lg:text-7xl font-sans font-black tracking-tight leading-[1.02] text-neutral-950 dark:text-white">
						Ready to Begin?
						<br />
						Your Engineering Note Vault Starts Here.
					</h2>

					<div className="w-full max-w-sm pt-4 md:pt-6">
						{status === "success" ? (
							<div className="border-[0.5px] border-neutral-900 dark:border-white/20 bg-white dark:bg-[#121212] p-8 space-y-4 animate-in fade-in zoom-in-95 duration-300">
								<IconCheck className="size-8 mx-auto text-emerald-600 bg-neutral-100 dark:bg-neutral-800 border-[0.5px] border-neutral-900 dark:border-white/20 p-1 rounded-full animate-bounce" />
								<h3 className="text-sm font-bold uppercase tracking-wider">
									Vault Space Allocated
								</h3>
								<p className="text-sm text-neutral-800 dark:text-neutral-200 font-normal leading-relaxed">
									Thank you,{" "}
									<span className="font-semibold text-neutral-950 dark:text-white">
										{formData.name}
									</span>
									. We have queued your early access request for{" "}
									<code className="bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 text-neutral-950 dark:text-white">
										{formData.email}
									</code>
									. An invitation link will be sent shortly.
								</p>
								<Button
									variant="link"
									onClick={() => setStatus("idle")}
									className="p-0 h-auto link-caps"
								>
									Register another email
								</Button>
							</div>
						) : (
							<form onSubmit={handleSubmit} className="space-y-8 text-left">
								<div className="flex flex-col space-y-1.5">
									<Label
										htmlFor="dev-name"
										className="pl-2 text-xs font-bold uppercase tracking-wider text-foreground"
									>
										Developer Name
									</Label>
									<Input
										id="dev-name"
										type="text"
										required
										value={formData.name}
										onChange={(e) =>
											setFormData({ ...formData, name: e.target.value })
										}
										placeholder="Alice Smith"
										className="bg-background border-border text-foreground input-standard"
									/>
								</div>
								<div className="flex flex-col space-y-1.5">
									<Label
										htmlFor="dev-email"
										className="pl-2 text-xs font-bold uppercase tracking-wider text-foreground"
									>
										Secure Email
									</Label>
									<Input
										id="dev-email"
										type="email"
										required
										value={formData.email}
										onChange={(e) =>
											setFormData({ ...formData, email: e.target.value })
										}
										placeholder="alice@domain.com"
										className="bg-background border-border text-foreground input-standard"
									/>
								</div>
								<Button
									type="submit"
									disabled={status === "loading"}
									className="w-full btn-standard"
								>
									{status === "loading" ? (
										<span className="flex items-center justify-center gap-1.5">
											<IconLoader2 className="size-4 animate-spin" />
											<span>Requesting Vault...</span>
										</span>
									) : (
										<span>Request Vault Invitation</span>
									)}
								</Button>
							</form>
						)}
					</div>
				</div>

				{/* Right Side: Empty styled Grid Cell with vertical bar */}
				<div className="md:col-span-3 border-l-[0.5px] border-neutral-900 dark:border-white/20 p-8 flex flex-col justify-between min-h-[260px] relative">
					<div className="absolute right-6 top-6">
						<span
							className="w-12 h-12 bg-[#eba7a7] block hover:scale-125 hover:rotate-45 transition-transform duration-300 cursor-pointer"
							title="Pastel Rose Accent"
						/>
					</div>
					<div className="absolute inset-x-0 bottom-0 h-[0.5px] bg-neutral-900 dark:bg-white/20" />
				</div>
			</div>
		</section>
	);
}
