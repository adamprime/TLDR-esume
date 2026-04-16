# TL;DResume — Agent Workflow

Work through the full TL;DResume application process conversationally with an AI agent in the terminal. Same workflow as the app, same anti-hallucination rules, but with the flexibility and control of a direct collaboration.

## When to Use This

- You prefer working in a terminal with an AI agent over a web UI
- You want more control over each step (editing prompts, iterating on output, skipping steps)
- You're already in a coding session and don't want to context-switch
- The application calls for something beyond a standard resume (custom web page, written pitch, etc.)

The hosted app (app.tldresume.com) and local app (resume-app/) are still available for a more guided, visual experience.

---

## Prerequisites

Before starting, the agent needs two things:

1. **Your base resume** — A markdown file with YAML frontmatter (`resume.md`). This is the "kitchen sink" version with everything. The agent will select and reframe content for each role. See `resume-template.md` for the expected format.

2. **A job posting** — The full job description text, plus company name, role title, and URL if available. Paste the whole thing — the agent needs the details to do a proper assessment.

Optional but valuable:
- **Professional context** (`professional-context.md`) — Additional verified facts: side projects with details, domain knowledge, career context, recurring gap answers. This is the supplement that turns a good tailored resume into a great one.

---

## The Workflow

The steps below are the full flow. In practice, you'll skip, reorder, or expand based on what the application needs. The agent should adapt to the application format rather than forcing every job through the same pipeline.

### Step 1: Fit Assessment

**Purpose:** Get an honest evaluation before investing time in a full application.

The agent reviews your resume + professional context against the job description as a skeptical hiring manager and provides:

- **Overall assessment** — A blunt 2-3 sentence summary
- **Fit score** — 1-10 scale (9-10 exceptional, 7-8 strong, 5-6 decent with gaps, 3-4 stretch, 1-2 not recommended)
- **Recommendation** — `strong_fit`, `worth_applying`, `stretch`, `long_shot`, or `not_recommended`
- **Strengths** — What genuinely matches, with specific evidence from the resume
- **Gaps** — Areas of concern, each with a diagnostic question to surface unlisted experience
- **Dealbreakers** — Hard requirements you clearly don't meet (if any)

**Your role:** Review the assessment honestly. If it's a `long_shot` or `not_recommended`, decide whether to proceed. The assessment is deliberately tough — it's better to know now.

**Lesson learned:** The agent should read both `resume.md` and `professional-context.md` before running the assessment. The professional context often contains the experience that closes gaps — projects, domain knowledge, and recurring gap answers that aren't on the main resume.

### Step 2: Gap Analysis (Conversational)

**Purpose:** Surface hidden experience that could strengthen your application.

For each gap identified in the assessment, the agent asks a specific diagnostic question. This is a conversation, not a form — share context naturally, tell stories, mention adjacent experience. The agent captures everything as verified facts it can use later.

**Your role:** Answer honestly. If you don't have relevant experience, say so. If you have experience that just wasn't on your resume, share it freely. The agent treats everything you say here as truth.

**Key rule:** Don't exaggerate — gap answers get woven into the tailored resume and cover letter as factual claims.

**What worked well:** In practice, gap analysis flows naturally into the conversation rather than being a formal step. The agent asks about gaps, you share context, and that context informs everything downstream. The agent should also check other repos and project directories if relevant experience might be documented there (e.g., the agent explored `~/coding/valoa-content` to understand the ad pipeline system in detail).

### Step 3: Tailored Resume

**Purpose:** Rewrite your resume to align with this specific role.

**What the agent CAN do:**
- Reframe existing accomplishments to emphasize relevance to the target role
- Reorder sections entirely (e.g., projects before experience for a builder role)
- Adjust language to use keywords from the job description
- Rewrite the Summary to speak directly to this role's needs
- Incorporate verified gap context and professional context
- Cut aggressively — not everything from the kitchen sink belongs on every resume
- Compress or expand sections based on relevance (e.g., collapse early career roles into one line)
- Preserve the YAML frontmatter format

**What the agent CANNOT do (anti-hallucination rules):**
- Invent statistics, numbers, percentages, or metrics not in the original
- Fabricate team sizes, revenue figures, employee counts, or growth numbers
- Add accomplishments, projects, or responsibilities not in the original or gap context
- Make up anything. When in doubt, understate rather than overstate.
- If a metric doesn't exist, describe impact qualitatively instead

**Your role:** Review the output carefully. Edit anything that doesn't sound like you. Ask for regeneration if the approach isn't right. Push back on length — the important stuff must be on page one. This is collaborative — iterate until it's good.

**Structural decisions matter:** For a builder/IC role, projects should lead and professional experience should be compressed. For a leadership role, flip that. The agent should make a structural recommendation and confirm before generating.

**Output format:** Markdown with YAML frontmatter, ready for PDF export.

### Step 4: Cover Letter / Written Pitch

**Purpose:** Generate a cover letter, written pitch, or "Why us & why you" response — whatever the application calls for.

Not every application needs a cover letter. Some need a written pitch instead. Some need both. Some need neither. The agent should adapt to what the application actually asks for.

**If a cover letter is needed**, the agent gathers four pieces of optional hook context:

1. **What drew you to this role/company?** — Something specific, not generic
2. **Personal connection** — Do you know someone there? Use their product? Have relevant domain experience?
3. **Why now?** — Why is this the right time for this move in your career?
4. **Unique value** — What would you bring that most candidates wouldn't?

**Tone options:**

| Tone | Description |
|------|-------------|
| **Professional** | Formal, polished, traditional corporate. Confident but measured. |
| **Balanced** | Professional but personable. Some personality, not over the top. |
| **Quirky** | Conversational, slightly irreverent. Wit and edge, but still professional. |

Default to quirky unless the role/company signals otherwise. The candidate's natural voice is snarky, direct, and allergic to corporate boilerplate.

**If a written pitch is needed** (e.g., "Why us & why you" free-text field), the agent drafts it collaboratively, then the candidate edits directly. The agent writes a first pass; the candidate makes it theirs.

**Anti-hallucination rules apply to all written content.** Hook context and gap answers are treated as verified information.

### Step 5: Export & Delivery

**Purpose:** Get polished output files in whatever format the application needs.

This step varies dramatically by application:

**For PDF resume:**
The agent can generate PDFs directly using the resume-app's Puppeteer pipeline. Run the generation script from within the `resume-app/` directory (where `node_modules` with `gray-matter`, `marked`, and `puppeteer` are installed). Available styles:

| Style | Font | File |
|-------|------|------|
| Modern | Inter (sans-serif) | `style/marked-resume-modern.css` |
| Serif | Crimson Pro | `style/marked-resume-serif.css` |
| Courier Prime | Courier Prime (mono) | `style/marked-resume-courierprime.css` |
| JetBrains | JetBrains Mono | `style/marked-resume-jetbrains.css` |
| IBM | IBM Plex Mono | `style/marked-resume-ibm.css` |

**Technical note:** Node must be on PATH. If `node` isn't found directly, try `export PATH="/opt/homebrew/bin:$PATH"` (macOS with Homebrew). Run the generation script from `resume-app/` to pick up the installed dependencies. The script reads the markdown, strips YAML frontmatter with `gray-matter`, converts to HTML with `marked`, wraps in the CSS, and generates a PDF with Puppeteer at Letter size.

**Font size and spacing adjustments:** The default CSS may produce a resume that's too long. The agent can inject CSS overrides to tighten spacing: reduce `font-size` to 10-10.5pt, `line-height` to 1.5, tighten margins on headings and list items, and reduce page margins to 0.6in. Iterate on length — check the page count and adjust.

**For custom web pages:**
Some applications benefit from a purpose-built web page instead of (or in addition to) a PDF. This works especially well when:
- The role values building and shipping as proof of capability
- The application format is non-traditional (link-based, portfolio-focused)
- A static page can serve as both resume and proof of work

Approach: Single HTML file with Tailwind CDN, zero build step. Can include Easter eggs (Konami code overlays, console messages, secret word triggers, print CSS messages, view-source comments). Deploy to a subdomain via Netlify with a separate repo for CI/CD.

**For application form text fields:**
Draft the content as markdown, then the candidate pastes it into the form. The agent should draft, the candidate should edit and own the final version.

---

## File Organization

Save output to the project's `versions/` directory following the existing convention:

```
versions/
  {Company} - {Role}/
    application.json        # Job details and metadata
    resume.md               # Tailored resume
    cover-letter.md         # Cover letter (if applicable)
    why-ut-and-why-me.md    # Written pitch (if applicable)
    assessment.json         # Fit assessment results
    cover-letter-hooks.json # Hook context
    index.html              # Custom web page (if applicable)
```

For web page applications that need their own deployment, create a separate repo (e.g., `~/coding/ut-application`) with the HTML, `robots.txt`, `netlify.toml`, and OG image.

---

## Practical Lessons from Real Sessions

### The agent should explore, not just generate
When gap analysis reveals relevant experience in other repos or projects, the agent should go look. Reading actual code and project structure produces much better context than relying on the candidate's summary alone. Example: exploring `~/coding/valoa-content` revealed a full agentic ad pipeline with Meta API integration, bilingual copy generation, and live campaign management — far richer detail than "I built an ad system."

### Resume length requires active management
The first draft will almost certainly be too long. The kitchen-sink resume is 4+ pages; even a trimmed version can easily hit 3-5 pages after generation. The agent should:
- Ask about target length upfront
- Lead with the most relevant content on page one
- Aggressively cut sections that don't serve this specific application
- Use CSS overrides to tighten spacing when generating PDFs
- Iterate: generate, check page count, trim, regenerate

### Base resume maintenance happens during application work
The candidate may mention role changes, new projects, or updated context during an application session. The agent should update `resume.md` and `professional-context.md` when this happens — don't let it pile up. Example: updating the SpiderOak title from VP Operations to SVP Backup (GM) happened naturally during a job application session.

### Application format drives the workflow, not the other way around
Two applications in the same session required completely different outputs:
- **Mozilla:** Traditional resume PDF (Courier Prime monospace, 2.5 pages) + no cover letter needed
- **Uncharted Territories:** Custom single-page web app + written pitch in a text field + portfolio link as proof of work + no traditional resume at all

The agent should read the application requirements first and adapt the workflow accordingly, rather than marching through every step.

### Tone is not one-size-fits-all
The candidate's default is quirky/snarky. But tone should also match the role:
- Traditional company → balanced or professional
- Startup / creative role → quirky, let personality show
- Written pitch fields → more personal and direct than a cover letter

### PDF generation gotchas
- `node` may not be on PATH in the agent's shell — check and fix with `export PATH`
- Dependencies (`gray-matter`, `marked`, `puppeteer`) are installed in `resume-app/node_modules` — run scripts from that directory
- Google Fonts need `waitUntil: 'networkidle0'` in Puppeteer to load before PDF generation
- Monospace fonts (Courier Prime, JetBrains Mono) take more horizontal space — content will be longer than with Inter/sans-serif

---

## Quick Reference: Anti-Hallucination Rules

These apply to ALL generated content — resumes, cover letters, written pitches, web pages:

1. NEVER invent statistics, numbers, percentages, or metrics not in the original resume
2. NEVER fabricate accomplishments, projects, or experiences
3. NEVER claim skills, certifications, or expertise not demonstrated in the resume
4. ONLY use facts from the resume, professional context, or gap answers
5. Gap answers and hook context are treated as verified candidate information
6. When in doubt, understate rather than overstate
7. If a metric doesn't exist, describe impact qualitatively

---

## Post-Session: iCloud Sync

At the end of every application session, run the iCloud backup script:

```bash
./sync-to-icloud.sh
```

This syncs `resume.md`, `professional-context.md`, `versions/`, and `export/` to iCloud (`~/Library/Mobile Documents/com~apple~CloudDocs/resumes-tldresume/`). The project is the source of truth; iCloud is the backup.
