import { NoteItem } from './notes-store';
import { showToast } from '@/components/toast';

/**
 * Export a note as a cleanly formatted Markdown (.md) file with YAML frontmatter.
 */
export function exportNoteToMarkdown(note: NoteItem): void {
  try {
    const rawTitle = note.title?.trim() || 'Untitled Note';
    const sanitizedFileName = rawTitle.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'note';
    const tagsList = note.tags && note.tags.length > 0 ? note.tags.map((t) => `"${t}"`).join(', ') : '';

    const frontmatter = [
      '---',
      `title: "${rawTitle.replace(/"/g, '\\"')}"`,
      `tags: [${tagsList}]`,
      `createdAt: "${note.createdAt || new Date().toISOString()}"`,
      note.ownerEmail ? `author: "${note.ownerEmail}"` : '',
      note.summary ? `summary: "${note.summary.replace(/"/g, '\\"')}"` : '',
      '---',
      '',
    ].filter(Boolean).join('\n');

    const markdownBody = `${frontmatter}\n# ${note.icon ? `${note.icon} ` : ''}${rawTitle}\n\n${note.content || ''}\n`;

    const blob = new Blob([markdownBody], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${sanitizedFileName}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Exported "${rawTitle}" as Markdown (.md)`);
  } catch (err) {
    console.error('Export markdown error:', err);
    showToast('Failed to export as Markdown', 'error');
  }
}

/**
 * Open a high-fidelity, print-ready document window and trigger browser Print-to-PDF.
 */
export function exportNoteToPDF(note: NoteItem): void {
  try {
    const rawTitle = note.title?.trim() || 'Untitled Note';
    const printWindow = window.open('', '_blank');

    if (!printWindow) {
      showToast('Pop-up blocked. Please allow pop-ups to export as PDF.', 'error');
      return;
    }

    const tagsHtml = (note.tags || [])
      .map((t) => `<span class="tag">#${t}</span>`)
      .join(' ');

    // Convert lines into HTML blocks for clean PDF printing
    const lines = (note.content || '').split('\n');
    const formattedBody = lines
      .map((line) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('# ')) return `<h1>${trimmed.replace(/^#\s+/, '')}</h1>`;
        if (trimmed.startsWith('## ')) return `<h2>${trimmed.replace(/^##\s+/, '')}</h2>`;
        if (trimmed.startsWith('### ')) return `<h3>${trimmed.replace(/^###\s+/, '')}</h3>`;
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return `<li>${trimmed.replace(/^[-*]\s+/, '')}</li>`;
        }
        if (trimmed.startsWith('```')) {
          return '<hr class="code-boundary" />';
        }
        if (trimmed === '') return '<div class="spacer"></div>';
        return `<p>${trimmed}</p>`;
      })
      .join('\n');

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${rawTitle} - PDF Export</title>
  <style>
    @page {
      margin: 18mm 20mm 20mm 20mm;
      size: A4 portrait;
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #111827;
      background: #ffffff;
      line-height: 1.65;
      padding: 32px 40px;
      max-width: 820px;
      margin: 0 auto;
      font-size: 14px;
    }
    .header {
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 18px;
      margin-bottom: 24px;
    }
    .icon {
      font-size: 36px;
      line-height: 1;
      margin-bottom: 10px;
    }
    h1.doc-title {
      font-size: 30px;
      font-weight: 800;
      letter-spacing: -0.025em;
      margin: 0 0 10px 0;
      color: #0f172a;
    }
    .meta-bar {
      font-size: 12px;
      color: #64748b;
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      align-items: center;
      margin-bottom: 10px;
      font-weight: 500;
    }
    .tags {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      margin-top: 8px;
    }
    .tag {
      font-size: 11px;
      background: #f1f5f9;
      color: #334155;
      padding: 2px 9px;
      border-radius: 9999px;
      font-weight: 600;
      border: 1px solid #e2e8f0;
    }
    .summary-box {
      background: #fffbeb;
      border-left: 4px solid #f59e0b;
      padding: 12px 16px;
      border-radius: 6px;
      font-size: 13px;
      color: #92400e;
      margin: 20px 0;
      line-height: 1.5;
    }
    .summary-box strong {
      color: #78350f;
    }
    .content {
      color: #334155;
    }
    h1 {
      font-size: 22px;
      font-weight: 700;
      margin: 28px 0 12px;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 6px;
      color: #0f172a;
    }
    h2 {
      font-size: 18px;
      font-weight: 700;
      margin: 22px 0 10px;
      color: #1e293b;
    }
    h3 {
      font-size: 15px;
      font-weight: 600;
      margin: 18px 0 8px;
      color: #334155;
    }
    p {
      margin: 0 0 12px 0;
    }
    li {
      margin-left: 20px;
      margin-bottom: 4px;
    }
    .spacer {
      height: 12px;
    }
    .footer {
      margin-top: 48px;
      border-top: 1px solid #e2e8f0;
      padding-top: 12px;
      font-size: 11px;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
    }
    @media print {
      body {
        padding: 0;
        max-width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    ${note.icon ? `<div class="icon">${note.icon}</div>` : ''}
    <h1 class="doc-title">${rawTitle}</h1>
    <div class="meta-bar">
      <span>Date: ${note.createdAt || 'N/A'}</span>
      ${note.ownerEmail ? `<span>Author: ${note.ownerEmail}</span>` : ''}
    </div>
    ${note.tags && note.tags.length > 0 ? `<div class="tags">${tagsHtml}</div>` : ''}
  </div>

  ${note.summary ? `<div class="summary-box"><strong>Summary:</strong> ${note.summary}</div>` : ''}

  <div class="content">
    ${formattedBody}
  </div>

  <div class="footer">
    <span>Exported from Codiary</span>
    <span>Document ID: ${note.id}</span>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 300);
    };
  </script>
</body>
</html>`);
    printWindow.document.close();
    showToast(`Opened PDF print view for "${rawTitle}"`);
  } catch (err) {
    console.error('Export PDF error:', err);
    showToast('Failed to open PDF view', 'error');
  }
}
