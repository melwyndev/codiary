"use client";

import { useEffect, useRef } from "react";
import {
	useCreateBlockNote,
	SuggestionMenuController,
	getDefaultReactSlashMenuItems,
} from "@blocknote/react";
import { filterSuggestionItems } from "@blocknote/core/extensions";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useTheme } from "next-themes";

import { insforge } from "@/lib/insforge";
import { showToast } from "@/components/toast";

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB limit for free tier
const ENABLE_VIDEO_AUDIO = false; // Set to true when scaling up infrastructure

interface BlockEditorProps {
	initialContent?: string;
	remoteContent?: string;
	onChange?: (content: string) => void;
	className?: string;
	editable?: boolean;
}

export default function BlockEditor({
	initialContent,
	remoteContent,
	onChange,
	className,
	editable = true,
}: BlockEditorProps) {
	const { resolvedTheme } = useTheme();
	const isInitializedRef = useRef(false);

	const editor = useCreateBlockNote({
		uploadFile: async (file: File) => {
			// Validate file type
			if (
				!ENABLE_VIDEO_AUDIO &&
				(file.type.startsWith("video/") || file.type.startsWith("audio/"))
			) {
				showToast(
					"Video and audio files are disabled on the free tier.",
					"error",
				);
				throw new Error("Video/audio files are disabled on free tier.");
			}

			// Validate file size
			if (file.size > MAX_FILE_SIZE_BYTES) {
				showToast("File size exceeds the 2MB free tier limit.", "error");
				throw new Error("File size exceeds 2MB limit.");
			}

			try {
				const fileExt = file.name.split(".").pop() || "png";
				const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
				const filePath = `inline-embeds/${fileName}`;

				const { data, error } = await insforge.storage
					.from("note-images")
					.upload(filePath, file);

				if (!error && data?.url) {
					return data.url;
				}
			} catch (e) {
				console.warn("InsForge storage upload fallback to data URL:", e);
			}

			return new Promise<string>((resolve, reject) => {
				const reader = new FileReader();
				reader.onload = (e) => {
					if (e.target?.result) resolve(e.target.result as string);
					else reject(new Error("Failed to read file"));
				};
				reader.onerror = () => reject(reader.error);
				reader.readAsDataURL(file);
			});
		},
	});

	const isInitializedWithContentRef = useRef(false);
	const hasTypedRef = useRef(false);
	const lastLocalEditTimeRef = useRef<number>(0);
	const lastLocalMarkdownRef = useRef<string>(initialContent || "");

	useEffect(() => {
		if (!editor) return;

		// If user has already started typing, NEVER let initialContent overwrite the canvas
		if (hasTypedRef.current) return;

		// Load content whenever initialContent is available and we haven't loaded non-empty content yet
		if (initialContent && initialContent.trim() !== "" && !isInitializedWithContentRef.current) {
			isInitializedWithContentRef.current = true;
			isInitializedRef.current = true;
			lastLocalMarkdownRef.current = initialContent;

			async function loadContent() {
				if (hasTypedRef.current) return;
				try {
					const blocks = await editor.tryParseMarkdownToBlocks(initialContent!);
					if (blocks && blocks.length > 0 && !hasTypedRef.current) {
						editor.replaceBlocks(editor.document, blocks);
						return;
					}
				} catch {}

				try {
					const blocks = await editor.tryParseHTMLToBlocks(initialContent!);
					if (blocks && blocks.length > 0 && !hasTypedRef.current) {
						editor.replaceBlocks(editor.document, blocks);
					}
				} catch {}
			}

			loadContent();
		} else if (!isInitializedRef.current && initialContent !== undefined) {
			isInitializedRef.current = true;
		}
	}, [editor, initialContent]);

	// Listen for remote real-time content changes from other collaborators
	useEffect(() => {
		if (
			!editor ||
			remoteContent === undefined ||
			remoteContent === null ||
			remoteContent === lastLocalMarkdownRef.current
		) {
			return;
		}

		let cancelled = false;
		let deferTimer: NodeJS.Timeout | null = null;

		async function applyRemoteContent() {
			// Don't interrupt user mid-keystroke if they typed locally in the last 800ms
			const timeSinceLastLocalEdit = Date.now() - lastLocalEditTimeRef.current;
			if (timeSinceLastLocalEdit < 800) {
				deferTimer = setTimeout(() => {
					if (!cancelled) {
						applyRemoteContent();
					}
				}, 800 - timeSinceLastLocalEdit + 50);
				return;
			}

			try {
				const currentMarkdown = await editor.blocksToMarkdownLossy(editor.document);
				if (cancelled || (remoteContent && currentMarkdown && remoteContent.trim() === currentMarkdown.trim())) {
					lastLocalMarkdownRef.current = remoteContent || "";
					return;
				}
			} catch {}

			// Capture current cursor block to restore after remote sync
			let cursorBlockIndex = -1;
			try {
				const cursor = editor.getTextCursorPosition();
				if (cursor?.block) {
					cursorBlockIndex = editor.document.findIndex((b) => b.id === cursor.block.id);
				}
			} catch {}

			try {
				const blocks = await editor.tryParseMarkdownToBlocks(remoteContent!);
				if (blocks && blocks.length > 0 && !cancelled) {
					lastLocalMarkdownRef.current = remoteContent!;
					editor.replaceBlocks(editor.document, blocks);
					if (cursorBlockIndex >= 0 && cursorBlockIndex < editor.document.length) {
						try {
							editor.setTextCursorPosition(editor.document[cursorBlockIndex], "end");
						} catch {}
					}
					return;
				}
			} catch {}

			try {
				const blocks = await editor.tryParseHTMLToBlocks(remoteContent!);
				if (blocks && blocks.length > 0 && !cancelled) {
					lastLocalMarkdownRef.current = remoteContent!;
					editor.replaceBlocks(editor.document, blocks);
					if (cursorBlockIndex >= 0 && cursorBlockIndex < editor.document.length) {
						try {
							editor.setTextCursorPosition(editor.document[cursorBlockIndex], "end");
						} catch {}
					}
				}
			} catch {}
		}

		applyRemoteContent();

		return () => {
			cancelled = true;
			if (deferTimer) clearTimeout(deferTimer);
		};
	}, [editor, remoteContent]);

	const changeDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

	const flushPendingChange = async () => {
		if (!onChange || !editor || !isInitializedRef.current) return;
		if (changeDebounceTimerRef.current) {
			clearTimeout(changeDebounceTimerRef.current);
			changeDebounceTimerRef.current = null;
		}
		try {
			const markdown = await editor.blocksToMarkdownLossy(editor.document);
			// Prevent premature emission of empty string if document previously had non-empty content
			if (
				lastLocalMarkdownRef.current &&
				lastLocalMarkdownRef.current.trim() !== "" &&
				(!markdown || markdown.trim() === "")
			) {
				return;
			}
			lastLocalMarkdownRef.current = markdown;
			onChange(markdown);
		} catch {
			try {
				const html = await editor.blocksToHTMLLossy(editor.document);
				if (
					lastLocalMarkdownRef.current &&
					lastLocalMarkdownRef.current.trim() !== "" &&
					(!html || html.trim() === "")
				) {
					return;
				}
				lastLocalMarkdownRef.current = html;
				onChange(html);
			} catch {
				// Ignore conversion errors
			}
		}
	};

	const handleChange = () => {
		if (!onChange || !editor || !isInitializedRef.current) return;
		hasTypedRef.current = true;
		lastLocalEditTimeRef.current = Date.now();
		isInitializedWithContentRef.current = true;

		if (changeDebounceTimerRef.current) {
			clearTimeout(changeDebounceTimerRef.current);
		}

		changeDebounceTimerRef.current = setTimeout(() => {
			flushPendingChange();
		}, 150);
	};

	useEffect(() => {
		return () => {
			if (changeDebounceTimerRef.current) {
				clearTimeout(changeDebounceTimerRef.current);
				flushPendingChange();
			}
		};
	}, []);

	const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
		const items = e.clipboardData?.items;
		if (!items || !editor) return;

		let imageFile: File | null = null;
		for (let i = 0; i < items.length; i++) {
			if (items[i].type.startsWith("image/")) {
				const file = items[i].getAsFile();
				if (file) {
					imageFile = file;
					break;
				}
			}
		}

		if (!imageFile && e.clipboardData?.files?.length > 0) {
			const files = Array.from(e.clipboardData.files);
			const found = files.find((f) => f.type.startsWith("image/"));
			if (found) imageFile = found;
		}

		if (imageFile) {
			if (
				!ENABLE_VIDEO_AUDIO &&
				(imageFile.type.startsWith("video/") ||
					imageFile.type.startsWith("audio/"))
			) {
				showToast(
					"Video and audio files are disabled on the free tier.",
					"error",
				);
				return;
			}
			if (imageFile.size > MAX_FILE_SIZE_BYTES) {
				showToast("Pasted file exceeds the 2MB free tier limit.", "error");
				return;
			}

			e.preventDefault();
			e.stopPropagation();

			const reader = new FileReader();
			reader.onload = (event) => {
				const base64Url = event.target?.result as string;
				if (base64Url && editor) {
					try {
						const currentBlock =
							editor.getTextCursorPosition()?.block ||
							editor.document[editor.document.length - 1];
						editor.insertBlocks(
							[
								{
									type: "image",
									props: {
										url: base64Url,
									},
								},
							],
							currentBlock,
							"after",
						);
					} catch {
						editor.insertBlocks(
							[
								{
									type: "image",
									props: {
										url: base64Url,
									},
								},
							],
							editor.document[editor.document.length - 1],
							"after",
						);
					}
				}
			};
			reader.readAsDataURL(imageFile);
		}
	};

	return (
		<div
			className={`blocknote-wrapper w-full ${className || ""}`}
			onPasteCapture={handlePaste}
			onBlurCapture={flushPendingChange}
		>
			<style>{`
        .blocknote-wrapper .bn-container,
        .blocknote-wrapper .bn-editor {
          padding-inline: 0 !important;
          padding-block: 0 !important;
          background: transparent !important;
        }

        .bn-suggestion-menu,
        [data-menu-type="slash-menu"] {
          z-index: 9999 !important;
          max-height: 280px !important;
          overflow-y: auto !important;
        }

        ${!ENABLE_VIDEO_AUDIO
					? `
        /* Hide Video, Audio, and File embed items from slash menu and popups */
        .bn-slash-menu-item[data-item-type="video"],
        .bn-slash-menu-item[data-item-type="audio"],
        .bn-slash-menu-item[data-item-type="file"],
        .bn-menu-item[data-item-type="video"],
        .bn-menu-item[data-item-type="audio"],
        .bn-menu-item[data-item-type="file"],
        button[data-test="video"],
        button[data-test="audio"],
        button[data-test="file"] {
          display: none !important;
        }
        `
					: ""
				}
      `}</style>
			<BlockNoteView
				editor={editor}
				editable={editable}
				slashMenu={false}
				onChange={handleChange}
				theme={resolvedTheme === "dark" ? "dark" : "light"}
			>
				<SuggestionMenuController
					triggerCharacter="/"
					getItems={async (query) =>
						filterSuggestionItems(
							getDefaultReactSlashMenuItems(editor).filter(
								(item) =>
									ENABLE_VIDEO_AUDIO ||
									((item as any).key !== "video" &&
										(item as any).key !== "audio" &&
										(item as any).key !== "file"),
							),
							query,
						)
					}
				/>
			</BlockNoteView>
		</div>
	);
}
