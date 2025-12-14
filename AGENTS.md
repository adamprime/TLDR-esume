# TL;DResume

## Project Overview

A local-first job application management system with AI-powered resume customization, cover letter generation, fit assessment, and PDF export. Supports both Anthropic (Claude) and OpenAI (GPT) models.

## Repository Structure

```
TLDR-esume/
├── resume-app/           # Next.js application (see resume-app/AGENTS.md for details)
├── style/                # PDF export CSS templates
│   ├── marked-resume-modern.css   # Sans-serif (Inter)
│   └── marked-resume-serif.css    # Serif (Crimson Pro)
├── resume-template.md    # Template for new users
├── README.md             # User documentation
├── LICENSE               # Elastic License 2.0
└── AGENTS.md             # This file
```

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
