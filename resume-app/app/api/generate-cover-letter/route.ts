import { NextRequest, NextResponse } from 'next/server';
import { generateCoverLetter } from '@/lib/ai';
import { getResume, saveCoverLetter, getApplication, getAssessment, getCoverLetterHooks } from '@/lib/files';

export async function POST(request: NextRequest) {
  try {
    const { applicationId } = await request.json();
    
    if (!applicationId) {
      return NextResponse.json(
        { error: 'Application ID required' },
        { status: 400 }
      );
    }
    
    const app = await getApplication(applicationId);
    if (!app) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }
    
    const resume = await getResume(applicationId);
    if (!resume) {
      return NextResponse.json(
        { error: 'Resume not found. Generate a resume first.' },
        { status: 400 }
      );
    }
    
    // Get assessment gap context if available
    let gapContext = '';
    const assessment = await getAssessment(applicationId);
    if (assessment && assessment.gaps.length > 0) {
      const filledGaps = assessment.gaps.filter(g => g.userContext.trim());
      if (filledGaps.length > 0) {
        gapContext = `--- Additional Context (provided by candidate to address gaps) ---\n`;
        filledGaps.forEach(gap => {
          gapContext += `\n${gap.area}: ${gap.userContext}\n`;
        });
      }
    }
    
    // Get cover letter hooks if available
    let hookContext = '';
    const hooks = await getCoverLetterHooks(applicationId);
    if (hooks) {
      const hookParts: string[] = [];
      if (hooks.whyThisCompany.trim()) {
        hookParts.push(`Why this company specifically: ${hooks.whyThisCompany}`);
      }
      if (hooks.personalConnection.trim()) {
        hookParts.push(`Personal connection to their product/mission/team: ${hooks.personalConnection}`);
      }
      if (hooks.uniqueValue.trim()) {
        hookParts.push(`Non-obvious reason I'd be great at this: ${hooks.uniqueValue}`);
      }
      if (hooks.memorableNote.trim()) {
        hookParts.push(`Something memorable to include: ${hooks.memorableNote}`);
      }
      if (hookParts.length > 0) {
        hookContext = `--- Cover Letter Hook Context (use this to make the letter personal and specific!) ---\n${hookParts.join('\n\n')}`;
      }
    }
    
    const coverLetter = await generateCoverLetter({
      resume,
      jobDescription: app.jobDescription,
      company: app.company,
      role: app.role,
      jobUrl: app.jobUrl,
      gapContext,
      hookContext,
    });
    
    await saveCoverLetter(applicationId, coverLetter);
    
    return NextResponse.json({ coverLetter });
  } catch (error) {
    console.error('Error generating cover letter:', error);
    return NextResponse.json(
      { error: 'Failed to generate cover letter' },
      { status: 500 }
    );
  }
}
