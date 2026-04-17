#!/usr/bin/env node
/**
 * Standalone PDF generator for markdown resumes.
 *
 * Usage:
 *   node scripts/generate-pdf.js <input.md> <output.pdf> [style]
 *
 * Styles: modern | serif | ibm-plex-mono | jetbrains | courier-prime
 * Default: ibm-plex-mono
 *
 * Run from within resume-app/ so node_modules is available.
 */

const fs = require('fs/promises');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');
const puppeteer = require('puppeteer');

const PROJECT_PATH = path.resolve(__dirname, '..', '..');

const STYLE_FILES = {
  'modern': 'marked-resume-modern.css',
  'serif': 'marked-resume-serif.css',
  'ibm-plex-mono': 'marked-resume-ibm.css',
  'ibm': 'marked-resume-ibm.css',
  'jetbrains': 'marked-resume-jetbrains.css',
  'courier-prime': 'marked-resume-courierprime.css',
  'courierprime': 'marked-resume-courierprime.css',
};

const FONT_IMPORTS = {
  'modern': '@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap");',
  'serif': '@import url("https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;500;600&display=swap");',
  'ibm-plex-mono': '@import url("https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap");',
  'ibm': '@import url("https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap");',
  'jetbrains': '@import url("https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap");',
  'courier-prime': '@import url("https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap");',
  'courierprime': '@import url("https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap");',
};

async function getStyleCSS(style) {
  const styleFile = STYLE_FILES[style];
  if (!styleFile) {
    throw new Error(`Unknown style: ${style}. Valid: ${Object.keys(STYLE_FILES).join(', ')}`);
  }
  const stylePath = path.join(PROJECT_PATH, 'style', styleFile);
  let css = await fs.readFile(stylePath, 'utf-8');
  const fontImport = FONT_IMPORTS[style];
  if (fontImport) {
    css = fontImport + '\n\n' + css;
  }
  return css;
}

async function generatePDF(inputPath, outputPath, style) {
  const markdown = await fs.readFile(inputPath, 'utf-8');
  const { content } = matter(markdown);
  const css = await getStyleCSS(style);
  const htmlContent = await marked(content);

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>${css}</style>
</head>
<body>
  ${htmlContent}
</body>
</html>`;

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'Letter',
      margin: { top: '0.75in', bottom: '0.75in', left: '0.75in', right: '0.75in' },
      printBackground: true,
    });
    await fs.writeFile(outputPath, pdfBuffer);
  } finally {
    await browser.close();
  }
}

async function main() {
  const [,, inputArg, outputArg, styleArg] = process.argv;
  if (!inputArg || !outputArg) {
    console.error('Usage: node scripts/generate-pdf.js <input.md> <output.pdf> [style]');
    console.error(`Styles: ${Object.keys(STYLE_FILES).join(', ')}`);
    process.exit(1);
  }
  const style = styleArg || 'ibm-plex-mono';
  const inputPath = path.resolve(inputArg);
  const outputPath = path.resolve(outputArg);

  console.log(`Generating PDF...`);
  console.log(`  Input:  ${inputPath}`);
  console.log(`  Output: ${outputPath}`);
  console.log(`  Style:  ${style}`);

  await generatePDF(inputPath, outputPath, style);
  console.log(`Done.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
