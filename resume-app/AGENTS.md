# Resume Builder App

## Project Overview

A local-first Next.js web application for managing job applications with AI-powered resume customization, cover letter generation, and application question drafting.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Markdown Editor**: @uiw/react-md-editor
- **PDF Generation**: md-to-pdf
- **AI**: Anthropic Claude API (Opus 4.5)
- **Storage**: File system (reads/writes to parent `2025-resume-project` folder)
- **Testing**: Vitest + React Testing Library

## Project Structure

```
resume-app/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── applications/  # CRUD for applications
│   │   ├── generate-resume/
│   │   ├── generate-cover-letter/
│   │   ├── generate-answers/
│   │   └── export-pdf/
│   ├── new/               # New application wizard
│   └── application/[id]/  # Application detail views
├── components/            # React components
├── lib/                   # Core utilities
│   ├── types.ts          # TypeScript types
│   ├── files.ts          # File system operations
│   ├── claude.ts         # Claude API wrapper
│   ├── prompts.ts        # AI prompt templates
│   └── pdf.ts            # PDF generation
└── __tests__/            # Test files
```

## Data Model

Applications are stored as folders in `../versions/{Company - Role}/` with:
- `application.json` - Metadata manifest
- `*.resume*.md` - Customized resume
- `*cover*.md` - Cover letter
- `questions.md` - Application Q&A

## Key Design Decisions

1. **File-based storage**: No database needed for v1. Uses existing folder structure from the parent resume project.

2. **Backwards compatible**: Existing applications (without `application.json`) are auto-indexed by parsing folder names.

3. **Claude Opus 4.5**: Used for all AI generation (resume customization, cover letters, question answers).

4. **PDF styling**: 5 style options including 4 existing monospace styles + 1 modern sans-serif.

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
