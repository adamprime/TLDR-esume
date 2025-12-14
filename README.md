# TL;DResume

**AI-powered resume and cover letter customization for job applications.**

Stop copying your resume into ChatGPT for every application. TL;DResume gives you a system to manage job applications, generate tailored resumes and cover letters, and export polished PDFs — all powered by AI but grounded in *your* real experience.

## Two Ways to Use TL;DResume

### 🌐 Hosted Version (Recommended for most users)

**[app.tldresume.com](https://app.tldresume.com)**

No installation required. Works in any Chromium-based browser (Chrome, Edge, Brave, Arc, etc.).

- Your data stays on your computer (uses browser File System Access API)
- Bring your own AI API key (Anthropic or OpenAI)
- Free to use, no account required

### 💻 Local Version (For developers)

Self-host the full Next.js application with additional features like Puppeteer-based PDF generation.

See [Local Installation](#local-installation) below.

---

## Features

- **Fit Assessment**: Get honest feedback on how well you match a role before investing time
- **Smart Resume Tailoring**: AI rewrites your resume for each job, using only facts from your base resume (no hallucinations)
- **Cover Letter Generation**: Distinctive, personality-forward cover letters that don't sound like everyone else's
- **Gap Analysis**: Identify weaknesses and provide context the AI can use to strengthen your application
- **Resume Review**: Periodic brutal-but-helpful review of your base resume with actionable improvements
- **PDF Export**: Multiple professional styles (Modern, Classic, Monospace)
- **Local-First**: Your data stays on your machine. No accounts, no cloud, no subscriptions.

---

## Getting Started (Hosted Version)

1. Go to **[app.tldresume.com](https://app.tldresume.com)**
2. Select a folder on your computer for data storage
3. Get an API key from [Anthropic](https://console.anthropic.com/settings/keys) or [OpenAI](https://platform.openai.com/api-keys)
4. Paste your existing resume (or start from scratch)
5. Start applying to jobs!

**Requirements:**
- Chromium-based browser (Chrome, Edge, Brave, Arc, Vivaldi, etc.)
- Firefox and Safari are not supported due to File System Access API limitations

---

## Local Installation

### Prerequisites

- **Node.js 18+** ([Download](https://nodejs.org/))
- **An AI API key** from [Anthropic](https://console.anthropic.com/) or [OpenAI](https://platform.openai.com/api-keys)

### Setup

```bash
# Clone the repo
git clone https://github.com/adamprime/TLDR-esume.git
cd TLDR-esume

# Install dependencies
cd resume-app
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local with your API key and data path

# Create your base resume
cp ../resume-template.md ../resume.md
# Edit resume.md with your actual experience

# Start the app
npm run dev
```

Open **http://localhost:3000** and complete the setup wizard.

---

## Resume Format

Your base resume should be a Markdown file with YAML frontmatter:

```markdown
---
name: Jane Doe
email: jane@example.com
phone: +1 (555) 123-4567
location: San Francisco, CA
linkedin: linkedin.com/in/janedoe
---

# Jane Doe

## Summary
Operations leader with 10+ years...

## Experience

### VP of Operations | Acme Corp
**San Francisco, CA** | 2020 - Present

- Scaled team from 5 to 30 people
- Reduced operational costs by 40%
```

**Pro tip:** Take your existing resume and ask ChatGPT to "convert this to markdown matching this format."

---

## Workflow

1. **Create a new application** — paste the job URL and description
2. **Run Fit Assessment** — get honest feedback on your match
3. **Fill in gaps** — answer questions about experience not on your resume
4. **Generate resume** — AI tailors it using your gap answers
5. **Add cover letter hooks** — personal context for a memorable letter
6. **Generate cover letter** — distinctive, not generic
7. **Export PDFs** — choose your style
8. **Apply!**

---

## Cost

AI API calls cost money, but it's cheap:

| Model | Cost/Application |
|-------|-----------------|
| Claude Sonnet 4.5 | ~$0.10-0.20 |
| Claude Haiku 4.5 | ~$0.02-0.05 |
| GPT-5 Mini | ~$0.05-0.10 |
| GPT-5 Nano | ~$0.01-0.03 |

Most users spend **$0.05-0.20 per application** (resume + cover letter).

---

## Project Structure

```
TLDR-esume/
├── hosted-app/          # Hosted web app (app.tldresume.com)
├── landing-page/        # Landing page (tldresume.com)
├── resume-app/          # Local Next.js application
├── style/               # PDF export CSS templates
└── resume-template.md   # Template for new users
```

**Your personal data (gitignored):**
- `resume.md` — Your base resume
- `versions/` — Generated applications
- `export/` — PDF exports
- `archive/` — Old resume versions
- `preferences.json` — Your settings

---

## Contributing

Found a bug? Have an idea? PRs welcome! Please open an issue first for major changes.

---

## License

[Elastic License 2.0](LICENSE) — Free to use, modify, and self-host. Cannot be offered as a competing hosted service.

---

Built by [Adam Tervort](https://adamtervort.com) during a job search. If it helps you land a job, pay it forward by connecting good people with good opportunities.

**Links:** [Website](https://tldresume.com) · [App](https://app.tldresume.com) · [GitHub](https://github.com/adamprime/TLDR-esume)
