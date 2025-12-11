import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';
import puppeteer from 'puppeteer';
import { StyleOption } from './types';
import { getApplicationFolder, getApplication, getExportPath, getApplicationFolderName } from './files';

const PROJECT_PATH = process.env.RESUME_PROJECT_PATH || '/Users/adam/coding/2025-resume-project';

const STYLE_FILES: Record<StyleOption, string> = {
  'courier-new': 'marked-resume.css',
  'ibm-plex-mono': 'marked-resume-ibm.css',
  'courier-prime': 'marked-resume-courierprime.css',
  'jetbrains-mono': 'marked-resume-jetbrains.css',
  'modern': 'marked-resume-modern.css',
};

const FONT_IMPORTS: Record<StyleOption, string> = {
  'courier-new': '',
  'ibm-plex-mono': '@import url("https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&display=swap");',
  'courier-prime': '@import url("https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap");',
  'jetbrains-mono': '@import url("https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&display=swap");',
  'modern': '@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap");',
};

export async function getStyleCSS(style: StyleOption): Promise<string> {
  const styleFile = STYLE_FILES[style];
  const stylePath = path.join(PROJECT_PATH, 'style', styleFile);
  
  try {
    let css = await fs.readFile(stylePath, 'utf-8');
    const fontImport = FONT_IMPORTS[style];
    if (fontImport) {
      css = fontImport + '\n\n' + css;
    }
    return css;
  } catch {
    // If style file doesn't exist (e.g., modern), return a default
    if (style === 'modern') {
      return getModernCSS();
    }
    // Fall back to default style
    const defaultPath = path.join(PROJECT_PATH, 'style', 'marked-resume.css');
    return fs.readFile(defaultPath, 'utf-8');
  }
}

function getModernCSS(): string {
  return `
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap");

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 11pt;
  line-height: 1.6;
  color: #111;
  max-width: 720px;
  margin: 2rem auto;
  padding: 0 2rem;
  background: #fff;
}

h1, h2, h3 {
  font-weight: 600;
  letter-spacing: -0.01em;
  margin-top: 2rem;
  margin-bottom: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.3rem;
}

h1 {
  font-size: 22pt;
  text-align: center;
  border: none;
  margin-bottom: 1.5rem;
  letter-spacing: -0.02em;
}

h2 {
  font-size: 13pt;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #374151;
}

h3 {
  font-size: 12pt;
  font-weight: 500;
  color: #4b5563;
  border: none;
}

p:first-of-type {
  text-align: center;
  font-size: 10pt;
  color: #6b7280;
  margin-bottom: 2.5rem;
}

ul {
  list-style: none;
  padding-left: 0;
  margin-bottom: 1rem;
}

li {
  position: relative;
  margin-bottom: 0.5rem;
  padding-left: 1.5rem;
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

a:hover {
  text-decoration: underline;
}

hr {
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 2rem 0;
}

strong {
  font-weight: 600;
  color: #111;
}

@media print {
  body {
    color: #000;
    background: none;
  }
  a {
    color: #000;
    text-decoration: none;
  }
  .page-break {
    page-break-before: always;
  }
}
`;
}

export async function generatePDF(
  markdown: string,
  style: StyleOption,
  outputPath: string
): Promise<void> {
  // Strip YAML frontmatter before converting to PDF
  const { content: markdownContent } = matter(markdown);
  
  const css = await getStyleCSS(style);
  
  // Convert markdown to HTML
  const htmlContent = await marked(markdownContent);
  
  // Create full HTML document
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>${css}</style>
</head>
<body>
  ${htmlContent}
</body>
</html>
`;
  
  // Launch puppeteer and generate PDF
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'Letter',
      margin: {
        top: '0.75in',
        bottom: '0.75in',
        left: '0.75in',
        right: '0.75in',
      },
      printBackground: true,
    });
    
    await fs.writeFile(outputPath, pdfBuffer);
  } finally {
    await browser.close();
  }
}

export async function exportResumePDF(id: string): Promise<string> {
  const app = await getApplication(id);
  if (!app) throw new Error('Application not found');
  
  const folderPath = await getApplicationFolder(id);
  if (!folderPath) throw new Error('Application folder not found');
  
  const files = await fs.readdir(folderPath);
  const resumeFile = files.find(f => 
    f.toLowerCase().includes('resume') && f.endsWith('.md')
  );
  
  if (!resumeFile) throw new Error('Resume file not found');
  
  const markdown = await fs.readFile(path.join(folderPath, resumeFile), 'utf-8');
  
  const exportFolder = path.join(getExportPath(), getApplicationFolderName(app.company, app.role));
  await fs.mkdir(exportFolder, { recursive: true });
  
  const pdfFilename = `Adam Tervort - resume - ${app.company} - ${app.role}.pdf`
    .replace(/[/\\?%*:|"<>]/g, '-');
  const outputPath = path.join(exportFolder, pdfFilename);
  
  await generatePDF(markdown, app.style, outputPath);
  
  return outputPath;
}

export async function exportCoverLetterPDF(id: string): Promise<string> {
  const app = await getApplication(id);
  if (!app) throw new Error('Application not found');
  
  const folderPath = await getApplicationFolder(id);
  if (!folderPath) throw new Error('Application folder not found');
  
  const files = await fs.readdir(folderPath);
  const coverFile = files.find(f => 
    f.toLowerCase().includes('cover') && f.endsWith('.md')
  );
  
  if (!coverFile) throw new Error('Cover letter file not found');
  
  const markdown = await fs.readFile(path.join(folderPath, coverFile), 'utf-8');
  
  const exportFolder = path.join(getExportPath(), getApplicationFolderName(app.company, app.role));
  await fs.mkdir(exportFolder, { recursive: true });
  
  const pdfFilename = `cover letter - Adam Tervort - ${app.company} - ${app.role}.pdf`
    .replace(/[/\\?%*:|"<>]/g, '-');
  const outputPath = path.join(exportFolder, pdfFilename);
  
  await generatePDF(markdown, app.style, outputPath);
  
  return outputPath;
}
