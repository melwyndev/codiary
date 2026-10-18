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
	onChange?: (content: string) => void;
	className?: string;
	editable?: boolean;
}

export default function BlockEditor({
	initialContent,
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

	useEffect(() => {
		if (!editor || isInitializedRef.current) return;

		if (initialContent && initialContent.trim() !== "") {
			isInitializedRef.current = true;
			async function loadContent() {
				try {
					// Try parsing Markdown first
					const blocks = await editor.tryParseMarkdownToBlocks(initialContent!);
					if (blocks && blocks.length > 0) {
						editor.replaceBlocks(editor.document, blocks);
						return;
					}
				} catch {
					// Fallback to HTML
				}

				try {
					const blocks = await editor.tryParseHTMLToBlocks(initialContent!);
					if (blocks && blocks.length > 0) {
						editor.replaceBlocks(editor.document, blocks);
					}
				} catch {
					// Ignore parse errors
				}
			}

			loadContent();
		} else {
			isInitializedRef.current = true;
		}
	}, [editor, initialContent]);

	const handleChange = async () => {
		if (!onChange || !editor) return;
		try {
			const markdown = await editor.blocksToMarkdownLossy(editor.document);
			onChange(markdown);
		} catch {
			try {
				const html = await editor.blocksToHTMLLossy(editor.document);
				onChange(html);
			} catch {
				// Ignore conversion errors
			}
		}
	};

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

        ${
					!ENABLE_VIDEO_AUDIO
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
