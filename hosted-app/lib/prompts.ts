export const RESUME_PROMPT = `You are helping customize a resume for a specific job application. 

Analyze the job description and rewrite the resume to better align with this role. Use the structure and voice from the existing resume, but make thoughtful adjustments to highlight the most relevant experience, keywords, and outcomes.

CRITICAL RULES - DO NOT VIOLATE:
1. NEVER invent statistics, numbers, percentages, or metrics that are not in the original resume
2. NEVER fabricate team sizes, revenue figures, employee counts, or growth numbers
3. NEVER add accomplishments, projects, or responsibilities not present in the original
4. ONLY use facts, figures, and experiences that exist in the provided resume
5. If you need a metric and one isn't available, describe the impact qualitatively instead
6. When in doubt, be conservative - understate rather than overstate

What you CAN do:
- Reframe existing accomplishments to emphasize relevance to the target role
- Reorder bullet points to prioritize what matters for this job
- Adjust language to use keywords from the job description
- Rewrite the Summary to speak directly to this role's needs
- Emphasize transferable skills that match the job requirements
- Preserve the YAML frontmatter format from the original resume

Output ONLY the markdown resume, no explanations or commentary.

--- Existing Resume ---
{baseResume}

--- Job Description ---
{jobDescription}

--- Target Company ---
{company}

--- Target Role ---
{role}

{gapContext}`;

const TONE_GUIDELINES = {
  professional: `TONE GUIDELINES:
- Maintain a formal, polished tone throughout
- Use professional language appropriate for traditional corporate environments
- Be confident but not boastful
- Focus on qualifications and achievements with measured enthusiasm
- Use standard business letter conventions
- End with a professional closing that expresses interest in next steps`,
  
  balanced: `TONE GUIDELINES:
- Be professional but personable — show you're a real human
- Confident without being stiff or overly formal
- Some personality, but not over the top
- Avoid the most egregious corporate buzzwords, but don't be too casual
- Strike a balance between professional polish and authentic voice`,
  
  quirky: `TONE GUIDELINES:
- Be conversational and slightly irreverent, but still professional
- Write like someone you'd want to grab coffee with — curious, opinionated, self-aware
- Show personality. A little wit, a little edge. Not trying too hard, but not boring either.
- Avoid corporate buzzwords, clichés, and phrases that make hiring managers' eyes glaze over
- No "I'm excited to apply" or "I believe I would be a great fit" — find a more interesting way in
- End with something memorable, not a generic "I look forward to hearing from you"`,
};

export type TonePreference = 'professional' | 'balanced' | 'quirky';

export function getCoverLetterPrompt(tone: TonePreference = 'balanced'): string {
  const toneGuidelines = TONE_GUIDELINES[tone] || TONE_GUIDELINES.balanced;
  
  return `Write a cover letter that sounds like a smart, interesting human wrote it — not a corporate drone or an AI.

${toneGuidelines}

CRITICAL RULES - DO NOT VIOLATE:
1. NEVER invent statistics, numbers, percentages, or metrics not in the resume
2. NEVER fabricate accomplishments, projects, or experiences
3. NEVER claim skills, certifications, or expertise not demonstrated in the resume
4. ONLY reference facts that exist in the provided resume or hook context
5. If the hook context mentions something, you CAN use it — that's real information from the candidate
6. If you need to show impact and no metric exists, describe it qualitatively
7. When in doubt, be honest about what you don't know rather than making something up

FORMAT:
- 250-350 words maximum
- Use markdown format
- No headers or formal structure — just flowing paragraphs
- Address it appropriately based on what you know (if a hiring manager name is given, use it)

WHAT MAKES A GREAT COVER LETTER:
- A hook that makes them want to keep reading (use the hook context if provided!)
- Specific connections between YOUR experience and THEIR needs
- Evidence you actually researched this company, not just copied the job title
- A reason why THIS role at THIS company, not just any job
- Personality that makes you memorable

--- Candidate Resume ---
{resume}

--- Job Description ---
{jobDescription}

--- Company ---
{company}

--- Role ---
{role}

--- Job URL ---
{jobUrl}

{gapContext}

{hookContext}

Output ONLY the cover letter in markdown, no explanations.`;
}

// Keep the old export for backwards compatibility
export const COVER_LETTER_PROMPT = getCoverLetterPrompt('balanced');

export const FIT_ASSESSMENT_PROMPT = `You are a skeptical, experienced hiring manager who has reviewed thousands of resumes. Your job is to give HONEST, CRITICAL feedback about whether this candidate is a good fit for this role.

DO NOT be a cheerleader. DO NOT inflate the candidate's qualifications. Be direct and honest - the candidate needs real feedback to decide whether to apply and how to position themselves.

Your assessment should be tough but fair. If there are dealbreakers, say so. If the candidate is underqualified, say so. If they're overqualified, say so. If it's a stretch, call it a stretch.

Analyze the resume against the job description and provide:

1. **Overall Assessment**: A blunt 2-3 sentence summary. Don't sugarcoat.

2. **Fit Score**: 1-10 where:
   - 9-10: Exceptional fit, check all boxes
   - 7-8: Strong fit, minor gaps
   - 5-6: Decent fit, notable gaps but worth applying  
   - 3-4: Stretch role, significant gaps
   - 1-2: Not recommended, major misalignment

3. **Recommendation**: One of:
   - "strong_fit": Go for it, you're well qualified
   - "worth_applying": Good chance, address the gaps
   - "stretch": Possible but you'll need to make a strong case
   - "long_shot": Low probability but not impossible
   - "not_recommended": Don't waste your time or theirs

4. **Strengths**: What genuinely matches. Be specific about evidence from the resume.

5. **Gaps**: Areas of concern. For each gap:
   - What's missing or weak
   - Why it matters for this role
   - A specific question to ask the candidate to see if they have unlisted experience

6. **Dealbreakers**: Hard requirements from the JD that the candidate clearly doesn't meet (if any)

Output as JSON matching this structure:
{
  "overallAssessment": "string",
  "fitScore": number,
  "recommendation": "strong_fit" | "worth_applying" | "stretch" | "long_shot" | "not_recommended",
  "strengths": [{ "area": "string", "evidence": "string" }],
  "gaps": [{ "area": "string", "concern": "string", "question": "string" }],
  "dealbreakers": ["string"]
}

--- Candidate Resume ---
{resume}

--- Job Description ---
{jobDescription}

--- Company ---
{company}

--- Role ---
{role}

Output ONLY the JSON, no markdown code blocks, no explanations.`;

export const RESUME_FORMAT_PROMPT = `Convert the following resume text into clean markdown format. Follow these rules:

1. Add YAML frontmatter with: name, email, phone, location, linkedin (if found)
2. Use # for the person's name as main heading
3. Use ## for major sections (Summary, Experience, Skills, Education)
4. Use ### for job titles with company name
5. Use **bold** for location and dates
6. Use bullet points (-) for accomplishments
7. Preserve ALL facts exactly - do not add, embellish, or change anything
8. Clean up formatting inconsistencies but keep the content identical

Here's the resume text:

`;
