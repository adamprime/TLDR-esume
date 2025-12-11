# TLDR;esume - Next.js Application

## Project Overview

A local-first Next.js web application for managing job applications with AI-powered resume customization, cover letter generation, fit assessment, and PDF export.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Markdown Editor**: @uiw/react-md-editor
- **PDF Generation**: Puppeteer + Marked
- **AI**: Anthropic Claude API or OpenAI GPT API (user configurable)
- **Storage**: File system (local-first, no database)
- **Testing**: Vitest + React Testing Library

## Project Structure

```
resume-app/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── applications/  # CRUD + bulk update
│   │   ├── assess-fit/    # Fit assessment
│   │   ├── generate-*/    # AI generation endpoints
│   │   ├── review-resume/ # Resume review/improvement
│   │   ├── preferences/   # User settings
│   │   └── export-pdf/    # PDF export
│   ├── settings/          # User preferences page
│   ├── review/            # Base resume review page
│   ├── new/               # New application wizard
│   └── application/[id]/  # Application detail views
├── components/            # React components
├── lib/                   # Core utilities
│   ├── types.ts          # TypeScript types
│   ├── files.ts          # File system operations
│   ├── ai.ts             # AI provider abstraction (Anthropic/OpenAI)
│   ├── preferences.ts    # User preferences management
│   ├── prompts.ts        # AI prompt templates
│   └── pdf.ts            # PDF generation (Puppeteer)
└── __tests__/            # Test files (67 tests)
```

## Data Model

Applications are stored as folders in `../versions/{Company - Role}/` with:
- `application.json` - Metadata manifest
- `*.resume*.md` - Customized resume
- `*cover*.md` - Cover letter
- `questions.md` - Application Q&A

## Key Design Decisions

1. **File-based storage**: No database needed. All data stored as JSON/Markdown files.

2. **Backwards compatible**: Applications without `application.json` are auto-indexed and manifests are created on first load.

3. **Multi-provider AI**: Supports both Anthropic (Claude) and OpenAI (GPT) with user-configurable model selection.

4. **Anti-hallucination**: All prompts include strict rules preventing fabrication of facts not in the source resume.

5. **PDF styling**: 2 style options - Modern (sans-serif) and Classic (serif). Easily extensible via CSS.

## Development

### Setup
```bash
cp .env.local.example .env.local
# Add your ANTHROPIC_API_KEY
npm install
npm run dev
```

### Testing (TDD - Stoplight Protocol)
```bash
npm test           # Run all tests
npm test:watch     # Watch mode
npm test:coverage  # Coverage report
```

**Stoplight Protocol**:
- 🔴 RED: Write a failing test first
- 🟢 GREEN: Write minimum code to make it pass
- 🔵 REFACTOR: Clean up while keeping tests green

### Environment Variables
- `ANTHROPIC_API_KEY` - Claude API key
- `RESUME_PROJECT_PATH` - Path to parent resume project (default: parent directory)

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/applications` | GET | List all applications |
| `/api/applications` | POST | Create new application |
| `/api/applications/[id]` | GET | Get application with files |
| `/api/applications/[id]` | PUT | Update application/files |
| `/api/generate-resume` | POST | Generate customized resume |
| `/api/generate-cover-letter` | POST | Generate cover letter |
| `/api/generate-answers` | POST | Generate question answer |
| `/api/export-pdf` | POST | Export markdown to PDF |

## Component Guidelines

- Use `'use client'` directive for interactive components
- Keep components focused and single-purpose
- Use TypeScript strict mode
- Follow existing Tailwind patterns for styling
