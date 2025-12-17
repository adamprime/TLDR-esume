/**
 * PDF styling for browser-based export
 */

export type PdfStyle = 'modern' | 'serif' | 'mono';

export const PDF_STYLES: { id: PdfStyle; name: string; desc: string }[] = [
  { id: 'modern', name: 'Modern', desc: 'Clean, minimal (Inter)' },
  { id: 'serif', name: 'Classic', desc: 'Traditional (Crimson Pro)' },
  { id: 'mono', name: 'Monospace', desc: 'Technical (JetBrains Mono)' },
];

const MODERN_CSS = `
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap");

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 11pt;
  line-height: 1.6;
  color: #111;
  max-width: 720px;
  margin: 0 auto;
  padding: 2rem;
  background: #fff;
}

h1, h2, h3 {
  font-weight: 600;
  letter-spacing: -0.01em;
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.3rem;
}

h1 {
  font-size: 22pt;
  text-align: center;
  border: none;
  margin-top: 0;
  margin-bottom: 0.5rem;
  letter-spacing: -0.02em;
}

h2 {
  font-size: 12pt;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #374151;
}

h3 {
  font-size: 11pt;
  font-weight: 500;
  color: #4b5563;
  border: none;
  margin-top: 1rem;
}

/* Contact info - first paragraph after h1 */
h1 + p {
  text-align: center;
  font-size: 9pt;
  color: #6b7280;
  margin-bottom: 1.5rem;
}

.sep {
  color: #d1d5db;
  margin: 0 0.25rem;
}

p {
  margin: 0.5rem 0;
}

ul {
  list-style: none;
  padding-left: 0;
  margin: 0.5rem 0;
}

li {
  position: relative;
  margin-bottom: 0.4rem;
  padding-left: 1.25rem;
  font-size: 10.5pt;
}

li:before {
  content: "•";
  position: absolute;
  left: 0.25rem;
  color: #9ca3af;
}

a {
  color: #2563eb;
  text-decoration: none;
}

hr {
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 1.5rem 0;
}

strong {
  font-weight: 600;
  color: #111;
}

@media print {
  @page {
    size: Letter;
    margin: 0.5in 0.6in;
  }
  body {
    color: #000;
    background: none;
    padding: 0;
    margin: 0;
    max-width: none;
  }
  h1, h2, h3 { color: #000; }
  a { color: #000; text-decoration: none; }
}
`;

const SERIF_CSS = `
@import url("https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;500;600&display=swap");

body {
  font-family: 'Crimson Pro', Georgia, 'Times New Roman', serif;
  font-size: 11.5pt;
  line-height: 1.65;
  color: #1a1a1a;
  max-width: 720px;
  margin: 0 auto;
  padding: 2rem;
  background: #fff;
}

h1, h2, h3 {
  font-weight: 600;
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
  border-bottom: 1px solid #d1d5db;
  padding-bottom: 0.3rem;
}

h1 {
  font-size: 24pt;
  text-align: center;
  border: none;
  margin-top: 0;
  margin-bottom: 0.5rem;
  letter-spacing: 0.02em;
}

h2 {
  font-size: 12pt;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #374151;
}

h3 {
  font-size: 11pt;
  font-weight: 500;
  color: #4b5563;
  border: none;
  margin-top: 1rem;
}

h1 + p {
  text-align: center;
  font-size: 9pt;
  color: #6b7280;
  margin-bottom: 1.5rem;
}

.sep {
  color: #d1d5db;
  margin: 0 0.25rem;
}

p {
  margin: 0.5rem 0;
}

ul {
  list-style: none;
  padding-left: 0;
  margin: 0.5rem 0;
}

li {
  position: relative;
  margin-bottom: 0.4rem;
  padding-left: 1.25rem;
  font-size: 11pt;
}

li:before {
  content: "•";
  position: absolute;
  left: 0.25rem;
  color: #9ca3af;
}

a {
  color: #1e40af;
  text-decoration: none;
}

hr {
  border: none;
  border-top: 1px solid #d1d5db;
  margin: 1.5rem 0;
}

strong {
  font-weight: 600;
  color: #1a1a1a;
}

@media print {
  @page {
    size: Letter;
    margin: 0.5in 0.6in;
  }
  body {
    color: #000;
    background: none;
    padding: 0;
    margin: 0;
    max-width: none;
  }
  h1, h2, h3 { color: #000; }
  a { color: #000; text-decoration: none; }
}
`;

const MONO_CSS = `
@import url("https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap");

body {
  font-family: 'JetBrains Mono', 'Courier Prime', 'Courier New', monospace;
  font-size: 10.5pt;
  line-height: 1.6;
  color: #111;
  max-width: 720px;
  margin: 0 auto;
  padding: 2rem;
  background: #fff;
}

h1, h2, h3 {
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
  border-bottom: 1px solid #ccc;
  padding-bottom: 0.2rem;
}

h1 {
  font-size: 18pt;
  text-align: center;
  border: none;
  margin-top: 0;
  margin-bottom: 0.5rem;
}

h2 {
  font-size: 12pt;
}

h3 {
  font-size: 11pt;
  font-style: italic;
  color: #555;
  border: none;
  margin-top: 1rem;
}

h1 + p {
  text-align: center;
  font-size: 9pt;
  color: #333;
  margin-bottom: 1.5rem;
}

.sep {
  color: #999;
  margin: 0 0.25rem;
}

p {
  margin: 0.5rem 0;
}

ul {
  list-style: none;
  padding-left: 0;
  margin: 0.5rem 0;
}

li {
  position: relative;
  margin-bottom: 0.4rem;
  padding-left: 1.5rem;
  font-size: 10pt;
}

li:before {
  content: "–";
  position: absolute;
  left: 0.25rem;
  color: #333;
}

a {
  color: #222;
  text-decoration: underline dotted;
}

hr {
  border: none;
  border-top: 1px dashed #bbb;
  margin: 1.5rem 0;
}

strong {
  font-weight: 600;
  color: #000;
}

@media print {
  @page {
    size: Letter;
    margin: 0.5in 0.6in;
  }
  body {
    color: #000;
    background: none;
    padding: 0;
    margin: 0;
    max-width: none;
  }
  h1, h2, h3 { color: #000; }
  a { color: #000; text-decoration: none; }
}
`;

export function getStyleCSS(style: PdfStyle): string {
  switch (style) {
    case 'serif':
      return SERIF_CSS;
    case 'mono':
      return MONO_CSS;
    case 'modern':
    default:
      return MODERN_CSS;
  }
}

/**
 * Convert markdown to HTML for PDF export
 */
export function markdownToHtml(markdown: string): string {
  // Strip YAML frontmatter
  let content = markdown.replace(/^---[\s\S]*?---\n?/, '');
  
  // Process line by line for better control
  const lines = content.split('\n');
  const result: string[] = [];
  let inList = false;
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const trimmed = line.trim();
    
    // Skip empty lines but close list if we're in one
    if (!trimmed) {
      if (inList) {
        result.push('</ul>');
        inList = false;
      }
      result.push('');
      continue;
    }
    
    // Headers - apply inline formatting for bold/italic
    if (trimmed.startsWith('### ')) {
      if (inList) { result.push('</ul>'); inList = false; }
      result.push(`<h3>${applyInlineFormatting(trimmed.slice(4))}</h3>`);
      continue;
    }
    if (trimmed.startsWith('## ')) {
      if (inList) { result.push('</ul>'); inList = false; }
      result.push(`<h2>${applyInlineFormatting(trimmed.slice(3))}</h2>`);
      continue;
    }
    if (trimmed.startsWith('# ')) {
      if (inList) { result.push('</ul>'); inList = false; }
      result.push(`<h1>${applyInlineFormatting(trimmed.slice(2))}</h1>`);
      continue;
    }
    
    // Horizontal rule
    if (trimmed === '---') {
      if (inList) { result.push('</ul>'); inList = false; }
      result.push('<hr>');
      continue;
    }
    
    // List items
    if (trimmed.startsWith('- ')) {
      if (!inList) {
        result.push('<ul>');
        inList = true;
      }
      const listContent = applyInlineFormatting(trimmed.slice(2));
      result.push(`<li>${listContent}</li>`);
      continue;
    }
    
    // Close list if we hit non-list content
    if (inList) {
      result.push('</ul>');
      inList = false;
    }
    
    // Regular paragraph - apply inline formatting
    const formatted = applyInlineFormatting(trimmed);
    result.push(`<p>${formatted}</p>`);
  }
  
  // Close any open list
  if (inList) {
    result.push('</ul>');
  }
  
  return result.join('\n');
}

/**
 * Apply inline markdown formatting (bold, italic, links)
 */
function applyInlineFormatting(text: string): string {
  return text
    // Links first (before bold/italic processing)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Italic (single asterisks, but not inside words)
    .replace(/(?<!\w)\*([^*]+)\*(?!\w)/g, '<em>$1</em>')
    // Pipe separators -> line breaks (for contact info)
    .replace(/\s*\|\s*/g, ' <span class="sep">|</span> ');
}

/**
 * Generate and trigger PDF download in browser
 */
export function exportToPDF(
  markdown: string,
  style: PdfStyle,
  title: string
): void {
  const css = getStyleCSS(style);
  const html = markdownToHtml(markdown);
  
  const fullHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>${css}</style>
</head>
<body>
  ${html}
</body>
</html>
`;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(fullHtml);
    printWindow.document.close();
    
    // Wait for fonts to load before printing
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }
}
