# 2025 Resume Project

This repo contains the source Markdown and exported files for my professional resume. It uses Git for version control and Marked 2 for PDF rendering.

## Workflow

1. Edit `resume.md` or create a new version in `versions/`.
2. Use Marked 2 with the included `style/marked-resume.css` for live preview.
3. Export as PDF to `export/` for submission.
4. Commit changes to track progress and maintain history.

## Tools Used

- [iA Writer](https://ia.net/writer)
- [Marked 2](https://marked2app.com)
- Git + GitHub

## License

Private / Not for distribution.

---

## Structure Notes for customized artifacts:

/versions/
  ├── stripe-head-of-cx/
  │   ├── resume-stripe.md
  │   ├── cover-letter-stripe.md
  │   └── notes-stripe.md
  ├── aws-chief-people/
  └── notion-vp-ops/
  
  Each folder contains:
	•	Custom .md version of your resume
	•	Short, tailored cover letter
	•	A notes file (useful for interview prep, networking, etc.)
	
## 🎯 Prompts for Generating Custom Application Materials

🔹 Prompt 1: Tailor Resume to Job Description

I’m applying for the following role. Please analyze the job description and rewrite my resume to better align with this role. Use the structure and voice from my existing resume (I’ll paste it below), but make thoughtful adjustments to highlight the most relevant experience, keywords, and outcomes.

Emphasize clarity, human tone, and measurable results. The goal is to sound aligned, not robotic.

— Job Description —
[Paste JD here]

— Existing Resume —
[Paste current resume.md or link to GitHub copy]

⸻

🔹 Prompt 2: Write a Custom Cover Letter (300 words or less)

Write a cover letter tailored for the following job. Use an approachable but professional tone — clear, warm, and curious. It should show I’ve done my homework, care about the company, and can solve problems they care about.

The letter should:
	•	Be no longer than 300 words
	•	Avoid clichés and generic phrases
	•	Connect my experience directly to what the company is looking for
	•	End with a light, human call to action

— Job Description —
[Paste JD or summary]

— My Background —
[Paste the relevant resume section or summary paragraph]

⸻

🔹 Prompt 3: Generate Application Notes File (for interview prep & tracking)

Create a notes file based on this job description to help me track my approach. Include:
	•	3–5 specific challenges or opportunities I might help with in this role
	•	Keywords to emphasize in future outreach
	•	What this company seems to care about culturally or structurally
	•	Ideas I could bring up in interviews

— Job Description —
[Paste it here]

⸻

## 🧪 Optional Prompts for Bonus Materials

🔹 Cover Letter First Sentence Workshop

Give me 3 strong first-sentence options for a cover letter based on this job. They should:
	•	Be human and specific
	•	Show personality without being cheesy
	•	Set a confident tone that makes the reader want to continue

⸻

🔹 Positioning Prompt for Less-Aligned Jobs

I’m applying to a job that’s not an exact match, but I believe I bring value in other ways. Please help position my experience so that it:
	•	Translates across domains
	•	Focuses on transferable skills and leadership outcomes
	•	Reflects curiosity, adaptability, and insight
	
---
For each resume and cover letter file, include YAML front matter like:

```
---
title: "Resume – Adam Tervort"
target_company: "Stripe"
target_role: "Head of Customer Experience"
date: 2025-04-01
version: "1.0"
keywords: ["customer success", "retention", "product feedback loop", "scaling CX orgs"]
source: "Referral from John Smith"
---
```

This keeps every version searchable, organized, and context-rich — Future You will love it.
