# TLDR;esume Hosted Version - Technical Specification

## Overview

A hosted web application that provides AI-powered resume customization while keeping all user data local. Users access the app via browser, select a local folder for storage, and all files (resumes, applications, API keys) remain on their machine.

**URLs:**
- `tldresume.com` - Landing page
- `app.tldresume.com` - Application

**Hosting:** Netlify (static site)
**Analytics:** Cloudflare Web Analytics
**Browser Support:** Chromium-based browsers (Brave, Chrome, Edge) - File System Access API required

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    tldresume.com                             │
│                   (Landing Page)                             │
│         Static HTML/CSS - explains the tool                  │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼ "Get Started"
┌──────────────────────────────────────────────────────────────┐
│                  app.tldresume.com                           │
│              (Next.js Static Export)                         │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Browser (Client-Side)                   │    │
│  │  - React UI                                          │    │
│  │  - File System Access API                            │    │
│  │  - Direct API calls to Anthropic/OpenAI              │    │
│  │  - Browser-based PDF generation                      │    │
│  └─────────────────────────────────────────────────────┘    │
│                            │                                 │
│                            ▼                                 │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           User's Local Folder                        │    │
│  │  - config.json (API keys, preferences)               │    │
│  │  - resume.md (base resume)                           │    │
│  │  - versions/ (applications)                          │    │
│  │  - export/ (PDFs)                                    │    │
│  └─────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

---

## Landing Page (`tldresume.com`)

### Content Structure

- Hero: "Job hunting is hard. Your resume shouldn't make it harder."
- The Problem: ATS systems, hundreds of applicants, generic resumes don't cut it
- The Solution: AI-powered tailoring, fit assessment, anti-hallucination
- How It Works: 4-step process
- Your Data Stays Yours: Local storage, no tracking, no accounts
- Requirements: Chromium-based browser, API key from Anthropic/OpenAI
- CTA: "Get Started - Free"

### Design
- Dark theme matching app (`bg-[#0f0f0f]`)
- Cloudflare Web Analytics
- Mobile-responsive

---

## User Flows

### First-Time User
1. Land on tldresume.com → Click "Get Started"
2. Browser check (Chromium-based?)
3. Folder Selection → Create structure
4. API Key Setup → Validate → Save to config.json
5. Resume Setup (paste existing or start from template)
6. Resume Review (optional/skippable)
7. Dashboard

### Returning User
1. Go to app.tldresume.com
2. Check IndexedDB for stored folder handle
3. Request permission → Load config → Dashboard

### New Application
1. Enter details (company, role, URL, job description)
2. Fit Assessment
3. Gap Questions
4. Generate Resume → Edit → Export PDF
5. Cover Letter Hooks → Generate → Edit → Export PDF

---

## Local Folder Structure

```
TLDResume/
├── config.json
├── resume.md
├── resume-template.md
├── versions/
│   └── {Company} - {Role}/
│       ├── application.json
│       ├── resume.md
│       ├── cover-letter.md
│       ├── assessment.json
│       └── cover-letter-hooks.json
└── export/
    └── {Company} - {Role}/
        └── *.pdf
```

---

## Technical Changes

| Area | Current (Local Dev) | Hosted Version |
|------|---------------------|----------------|
| File I/O | Node.js `fs` | File System Access API |
| AI Calls | Server-side API routes | Direct browser fetch |
| PDF Export | Puppeteer | html2pdf.js |
| Config | `.env.local` | `config.json` in user folder |
| Folder Persistence | N/A | IndexedDB |

---

## Phases

1. Landing Page (2-3 hrs)
2. Browser File System (4-6 hrs)
3. Client-Side AI (2-3 hrs)
4. Onboarding Flow (4-6 hrs)
5. Migrate Features (6-8 hrs)
6. Polish & Deploy (2-3 hrs)

Total: ~20-29 hours
