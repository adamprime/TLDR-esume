# TL;DResume - Hosted App

## Overview

This is the **public, browser-based version** of TL;DResume that deploys to **app.tldrresume.com** via Netlify. Unlike `resume-app/` (the local Node.js version), this app runs entirely in the browser with no server-side code.

## Tech Stack

- **Framework**: Next.js 15 (App Router, static export)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Markdown Editor**: @uiw/react-md-editor
- **PDF Generation**: Browser print dialog (no Puppeteer)
- **AI**: Client-side calls to Anthropic/OpenAI APIs (user provides their own key)
- **Storage**: Browser File System Access API (user selects local folder)
- **Testing**: Vitest

## Key Differences from resume-app

| Aspect | hosted-app | resume-app |
|--------|-----------|------------|
| PDF Export | `lib/pdf-styles.ts` - custom markdown→HTML, browser print | `lib/pdf.ts` - Puppeteer |
| File Access | File System Access API (`lib/browser-fs.ts`) | Node.js `fs` module |
| AI Calls | Client-side in browser (`lib/browser-ai.ts`) | Server-side API routes |
| Deployment | Static export to Netlify | Local dev server only |

## Project Structure

```
hosted-app/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Landing/folder selection
│   ├── onboarding/        # Setup wizard (folder, API key, resume)
│   ├── dashboard/         # Application list
│   ├── application/       # View/edit applications
│   ├── review/            # Resume review with LinkedIn integration
│   └── settings/          # User preferences
├── components/            # React components
│   ├── MarkdownEditor.tsx # Wrapper around @uiw/react-md-editor
│   └── LoadingText.tsx    # Animated loading states
├── lib/                   # Core utilities (browser-compatible!)
│   ├── browser-fs.ts      # File System Access API wrapper
│   ├── browser-ai.ts      # Client-side AI calls (Anthropic/OpenAI)
│   ├── folder-handle.ts   # IndexedDB persistence for folder handle
│   ├── pdf-styles.ts      # Markdown→HTML + CSS for PDF export
│   └── prompts.ts         # AI prompt templates
└── __tests__/             # Vitest tests
```

## Development

```bash
npm install
npm run dev      # Start dev server (http://localhost:3000)
npm test         # Run tests
npm run build    # Static export to /out
```

## Deployment

Netlify auto-deploys from the `upstream` remote (TLDR-esume repo):
- Push to `upstream/main` triggers deploy
- Static files served from `/out` directory
- No server functions needed

## Key Files

- **`lib/pdf-styles.ts`** - Custom markdown parser and PDF styling. Handles YAML frontmatter stripping, header/list/paragraph conversion, inline formatting (bold, italic, links).

- **`lib/browser-ai.ts`** - Unified interface for Anthropic and OpenAI. Calls are made directly from browser using user's API key.

- **`app/review/page.tsx`** - Resume review with LinkedIn context integration. Users can paste LinkedIn profile content to identify gaps in their resume.

## Testing

```bash
npm test              # Run all tests
npm test -- --watch   # Watch mode
```

Current test coverage:
- `browser-fs.test.ts` - File system operations
- `browser-ai.test.ts` - AI provider abstraction
- `folder-handle.test.ts` - IndexedDB persistence
- `pdf-styles.test.ts` - Markdown parsing and PDF generation
