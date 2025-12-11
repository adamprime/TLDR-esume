# TLDR;esume

**AI-powered resume and cover letter customization for job applications.**

Stop copying your resume into ChatGPT for every application. TLDR;esume gives you a local-first system to manage job applications, generate tailored resumes and cover letters, and export polished PDFs — all powered by AI but grounded in *your* real experience.

## Features

- **Fit Assessment**: Get honest feedback on how well you match a role before investing time
- **Smart Resume Tailoring**: AI rewrites your resume for each job, using only facts from your base resume (no hallucinations)
- **Cover Letter Generation**: Distinctive, personality-forward cover letters that don't sound like everyone else's
- **Gap Analysis**: Identify weaknesses and provide context the AI can use to strengthen your application
- **Resume Review**: Periodic brutal-but-helpful review of your base resume with actionable improvements
- **PDF Export**: Multiple professional styles, auto-opens when generated
- **Local-First**: Your data stays on your machine. No accounts, no cloud, no subscriptions.

## Quick Start

### Prerequisites

- **Node.js 18+** ([Download](https://nodejs.org/))
- **An AI API key** from either:
  - [Anthropic](https://console.anthropic.com/) (Claude) — recommended
  - [OpenAI](https://platform.openai.com/api-keys) (GPT)

### Installation

1. **Clone the repo:**
   ```bash
   git clone https://github.com/adamprime/TLDR-esume.git
   cd TLDR-esume
   ```

2. **Install dependencies:**
   ```bash
   cd resume-app
   npm install
   ```

3. **Configure your environment:**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local` and add:
   - Your API key (Anthropic or OpenAI)
   - The path to your TLDR-esume folder

4. **Create your base resume:**
   ```bash
   cp ../resume-template.md ../resume.md
   ```
   
   Edit `resume.md` with your actual experience. See [Resume Format](#resume-format) below.

5. **Start the app:**
   ```bash
   npm run dev
   ```

6. **Open http://localhost:3000** and complete the setup wizard.

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
...
```

**Pro tip:** Take your existing resume and ask ChatGPT to "convert this to markdown matching this format" with the template as an example.

## Workflow

1. **Create a new application** — paste the job URL and description
2. **Run Fit Assessment** — get honest feedback on your match
3. **Fill in gaps** — answer questions about experience not on your resume
4. **Generate resume** — AI tailors it using your gap answers
5. **Add cover letter hooks** — personal context for a memorable letter
6. **Generate cover letter** — distinctive, not generic
7. **Export PDFs** — choose your style, they auto-open
8. **Apply!**

## Settings

Visit `/settings` to configure:

- **AI Provider**: Anthropic (Claude) or OpenAI (GPT)
- **Model**: Choose based on quality/cost tradeoff
- **Your Profile**: Name, contact info, target roles
- **Tone**: Quirky, balanced, or professional cover letters

## Cost Considerations

AI API calls cost money. Rough estimates per application:

| Model | Cost/Application |
|-------|-----------------|
| Claude Opus 4.5 | ~$0.50-1.00 |
| Claude Sonnet 4.5 | ~$0.10-0.20 |
| Claude Haiku 4.5 | ~$0.02-0.05 |
| GPT-5.1 | ~$0.15-0.30 |
| GPT-5 Mini | ~$0.05-0.10 |
| GPT-5 Nano | ~$0.01-0.03 |

Sonnet 4.5 and GPT-5 Mini offer the best balance of quality and cost for most users.

## PDF Styles

TLDR;esume includes two PDF styles out of the box:

- **Modern (Sans-Serif)** — Clean, contemporary look using Inter font
- **Classic (Serif)** — Traditional, elegant look using Crimson Pro font

### Customizing Styles

PDF styles are defined as CSS files in the `/style` directory:

```
style/
├── marked-resume-modern.css   # Sans-serif style (Inter)
└── marked-resume-serif.css    # Serif style (Crimson Pro)
```

To customize a style:

1. Copy an existing CSS file: `cp style/marked-resume-modern.css style/marked-resume-custom.css`
2. Edit the CSS to match your preferences (fonts, colors, spacing, etc.)
3. Add your new style to `resume-app/lib/types.ts` in `StyleOption` and `STYLE_OPTIONS`
4. Add the CSS file mapping in `resume-app/lib/pdf.ts` in `STYLE_FILES`

The CSS uses standard web fonts via Google Fonts. You can change the `@import` at the top to use any Google Font, or remove it to use system fonts.

## Project Structure

```
TLDR-esume/
├── resume-app/          # Next.js application
├── style/               # PDF export CSS templates
├── resume.md            # Your base resume (gitignored)
├── resume_corporate.md  # Optional: alternate version
├── versions/            # Generated applications (gitignored)
├── export/              # PDF exports (gitignored)
├── archive/             # Old resume versions (gitignored)
├── preferences.json     # Your settings (gitignored)
└── resume-template.md   # Template for new users
```

## Tech Stack

- **Next.js 14** with App Router
- **TypeScript** + **Tailwind CSS**
- **Anthropic/OpenAI** APIs for AI
- **Puppeteer** + **Marked** for PDF generation
- File-based storage (no database needed)

## Contributing

Found a bug? Have an idea? PRs welcome! Please open an issue first for major changes.

## License

[Elastic License 2.0](LICENSE) — Free to use, modify, and self-host. Cannot be offered as a competing hosted service.

---

Built by [Adam Tervort](https://github.com/adamprime) during a job search. Because if you're going to apply to hundreds of jobs, you might as well automate the boring parts.
