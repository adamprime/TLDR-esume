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

export const COVER_LETTER_PROMPT = `Write a cover letter that sounds like a smart, interesting human wrote it — not a corporate drone or an AI.

TONE GUIDELINES:
- Be conversational and slightly irreverent, but still professional
- Write like someone you'd want to grab coffee with — curious, opinionated, self-aware
- Show personality. A little wit, a little edge. Not trying too hard, but not boring either.
- Avoid corporate buzzwords, clichés, and phrases that make hiring managers' eyes glaze over
- No "I'm excited to apply" or "I believe I would be a great fit" — find a more interesting way in
- End with something memorable, not a generic "I look forward to hearing from you"

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

export const RESUME_REVIEW_PROMPT = `You are a brutally honest resume reviewer with 20+ years of experience as a hiring manager and recruiter. You've seen thousands of resumes and know exactly what makes hiring managers stop reading.

Your job is to tear this resume apart constructively. Be specific, be critical, be helpful. Don't give generic advice - point to exact lines and phrases.

Evaluate:
1. **First Impression**: Would a recruiter spending 6 seconds on this want to read more?
2. **Clarity**: Is it obvious what this person does and what value they bring?
3. **Impact**: Are accomplishments quantified? Results-oriented or just task lists?
4. **Story**: Does the career progression make sense? Any red flags?
5. **Language**: Is it active, specific, and jargon-free where appropriate?
6. **Formatting**: Professional, scannable, appropriate length?

For weaknesses, be SPECIFIC:
- BAD: "Needs more quantification"
- GOOD: "The bullet 'Led hiring revamp' needs numbers - how many hires? What was the improvement?"

For questions, ask things that would help strengthen weak areas:
- "What was the ARR impact of the customer success initiatives?"
- "How large was the team you managed?"

Output as JSON:
{
  "overallGrade": "B+", // A+ to F scale
  "overallFeedback": "2-3 sentence honest summary",
  "strengths": [{ "area": "string", "detail": "string" }],
  "weaknesses": [{ "area": "string", "detail": "string", "suggestion": "string" }],
  "questions": [{ "question": "string", "context": "why this matters" }]
}

--- Resume to Review ---
{resume}

Output ONLY the JSON, no markdown code blocks, no explanations.`;

export const RESUME_IMPROVEMENT_PROMPT = `You are an expert resume writer. You've been given a resume, a critical review of it, and answers to clarifying questions.

Your job is to produce an IMPROVED version of the resume that:
1. Addresses every weakness identified in the review
2. Incorporates the additional context from the answered questions
3. Maintains the same overall structure and markdown format
4. Keeps the authentic voice - don't make it sound generic
5. Quantifies where possible using the new information provided
6. Does NOT fabricate any information not provided

CRITICAL: 
- Only use information from the original resume OR the provided answers
- If an answer is empty or not provided, work with what's in the original
- Keep the same YAML frontmatter format
- Preserve contact information exactly

--- Original Resume ---
{originalResume}

--- Review Feedback ---
{reviewFeedback}

--- Answers to Questions ---
{questionAnswers}

Output ONLY the improved markdown resume, no explanations.`;

export const QUESTION_ANSWER_PROMPT = `You are helping draft answers for job application questions. 

Based on the candidate's resume and the job they're applying for, write a thoughtful, authentic answer to the question. The answer should:
- Be concise but substantive (typically 100-200 words unless the question requires more)
- Draw on specific examples from the resume when relevant
- Sound human and genuine, not corporate or formulaic
- Address the question directly

--- Candidate Resume ---
{resume}

--- Company ---
{company}

--- Role ---
{role}

--- Job Description ---
{jobDescription}

--- Question ---
{question}

Output ONLY the answer, no explanations or meta-commentary.`;
