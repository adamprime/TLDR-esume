# LinkedIn Post Draft - TL;DResume Web Launch

---

A few days ago I shared a tool I built for customizing resumes based on job descriptions. The response was really great.

But there was a problem: installing Node.js, cloning a repo, and running terminal commands is a dealbreaker for most people. Fair enough.

So I rebuilt it. Now you just need Chrome. 

**TL;DResume is now a web app.** No installation. No terminal. Just open a browser and go.

Here's what makes it different:

**Your data never leaves your computer.**

When you open the app, it asks for a folder on your machine.  That's where everything lives—your resumes, cover letters, application notes. The second step is setting up an API key--this is so the AI calls go directly from your browser to Anthropic or OpenAI. There's no server in between. No database storing your career history. No company that could get acquired and sell your data. (And you'll only pay for your usage, about $0.05 per customized resume and cover letter in my experience.)

It's a web app with the security model of a desktop app.

**What it does:**
- Stores job descriptions and tracks application status
- Uses AI to tailor your resume for each role
- Generates cover letters that actually sound like you wrote them
- Gives you a brutally honest "fit assessment" before you apply
- Reviews your base resume and suggests improvements

**The catch:** It only works in Chrome, Edge, or Brave (browsers that support the File System Access API). Safari and Firefox users—sorry, browser vendors are still arguing about this one.

**Try it:** [app.tldresume.com](https://app.tldresume.com)

You'll need an API key from Anthropic or OpenAI. The app walks you through getting one. Typical cost is a few cents per application.

Built this because I needed it. Sharing it because others do too.

---

*Alternative shorter version:*

---

I rebuilt TL;DResume as a web app.

No installation required. Just open your browser.

But here's the thing—your data still never touches a server. The app uses your browser to read/write files directly on your computer. AI calls go straight from your browser to Anthropic or OpenAI. Nothing in between.

Web app convenience. Desktop app privacy.

What it does:
→ Tailors your resume for each job
→ Generates cover letters that don't sound like ChatGPT
→ Gives brutally honest fit assessments
→ Tracks all your applications in one place

Works in Chrome, Edge, and Brave. You'll need an API key (app walks you through it).

Try it: app.tldresume.com

---

*Notes for posting:*
- Add relevant hashtags: #jobsearch #opentowork #career #AI #privacy
- Consider adding a screenshot of the dashboard or assessment page
- The "brutally honest" angle resonated last time—lean into it
- Mention it's free/open source if you want to build trust
