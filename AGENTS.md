# TL;DResume

## Project Overview

A local-first job application management system with AI-powered resume customization, cover letter generation, fit assessment, and PDF export. Supports both Anthropic (Claude) and OpenAI (GPT) models.

## Repository & Upstream Structure

This project uses a **two-repo model**:

| Remote | Repo | Purpose |
|--------|------|---------|
| `origin` | `2025-resume-project` (private) | Personal development repo with private data |
| `upstream` | `TLDR-esume` (public) | Public release repo, deploys to Netlify |

**Workflow:**
- Develop and test locally in `origin`
- Push to both `origin` (private) and `upstream` (public) when releasing
- Never commit personal data (resumes, API keys, drafts) - these are gitignored

**What deploys to production:**
- `hosted-app/` → app.tldrresume.com (Netlify)
- `landing-page/` → tldrresume.com (Netlify)

## Directory Structure

```
2025-resume-project/
├── hosted-app/           # PUBLIC: Browser-based app (deploys to Netlify)
│   ├── app/              # Next.js App Router pages
│   ├── lib/              # Browser-compatible utilities (no Node.js)
│   └── components/       # React components
├── resume-app/           # LOCAL: Original Node.js app (uses Puppeteer, file system)
│   ├── app/              # Next.js App Router pages  
│   ├── lib/              # Node.js utilities (Puppeteer PDF, fs access)
│   └── components/       # React components
├── landing-page/         # PUBLIC: Marketing site (deploys to Netlify)
├── style/                # PDF export CSS templates (shared)
│   ├── marked-resume-modern.css   # Sans-serif (Inter)
│   └── marked-resume-serif.css    # Serif (Crimson Pro)
├── resume-template.md    # Template for new users
├── README.md             # User documentation
├── LICENSE               # Elastic License 2.0
└── AGENTS.md             # This file
```

## hosted-app vs resume-app

| Feature | `hosted-app` (Public) | `resume-app` (Local) |
|---------|----------------------|---------------------|
| **Deployment** | Netlify (app.tldrresume.com) | Local only (`npm run dev`) |
| **File Storage** | Browser File System Access API | Node.js `fs` module |
| **PDF Export** | Browser print dialog | Puppeteer (headless Chrome) |
| **AI Calls** | Client-side (user's API key) | Server-side API routes |
| **Dependencies** | Browser-compatible only | Full Node.js ecosystem |

**Important:** Changes to shared functionality should be made in `hosted-app/` first (the public app), then backported to `resume-app/` if needed.

## User Data (gitignored)

These directories contain user-specific data and are not committed:
- `versions/` - Generated job applications
- `export/` - PDF exports
- `archive/` - Old resume versions
- `preferences.json` - User settings
- `resume.md`, `resume_*.md` - User's base resumes
- `.env.local` - API keys

## Key Features

1. **Fit Assessment** - Critical evaluation of resume vs job description
2. **Gap Analysis** - Identifies weaknesses with questions to surface hidden experience
3. **Resume Tailoring** - AI rewrites resume using only facts from base resume
4. **Cover Letter Hooks** - Personal context system for memorable letters
5. **Resume Review** - Periodic base resume improvement with diff view
6. **PDF Export** - Multiple styles, auto-opens after generation

## AI Providers

Supports both providers (configured in Settings):
- **Anthropic**: Claude Opus 4.5, Sonnet 4.5, Haiku 4.5
- **OpenAI**: GPT-5.1, GPT-5 Pro, GPT-5 Mini, GPT-5 Nano

## Development Workflow

```bash
cd resume-app
npm install
cp .env.local.example .env.local  # Add API key
npm run dev                        # Start dev server
npm test                           # Run tests
npm run build                      # Production build
```

## Anti-Hallucination Design

All generation prompts include strict rules preventing AI from fabricating:
- Statistics, metrics, or numbers not in the original resume
- Accomplishments or experiences not documented
- Team sizes, revenue figures, or growth numbers

Gap context and hook context allow users to provide additional real information the AI can use.

## License

Elastic License 2.0 - Free to use, modify, and self-host. Cannot be offered as a competing hosted service.
