import { NextRequest, NextResponse } from 'next/server';
import { generateResume } from '@/lib/claude';
import { readBaseResume, saveResume, getApplication, updateApplication, getAssessment } from '@/lib/files';

export async function POST(request: NextRequest) {
  try {
    const { applicationId, baseResumeFile, jobDescription, company, role } = await request.json();
    
    if (!baseResumeFile || !jobDescription || !company || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const baseResume = await readBaseResume(baseResumeFile);
    
    // Get assessment gap context if available
    let gapContext = '';
    if (applicationId) {
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
    }
    
    const generatedResume = await generateResume({
      baseResume,
      jobDescription,
      company,
      role,
      gapContext,
    });
    
    // If applicationId provided, save the resume
    if (applicationId) {
      await saveResume(applicationId, generatedResume);
      
      // Update job description in manifest
      const app = await getApplication(applicationId);
      if (app && !app.jobDescription) {
        await updateApplication(applicationId, { jobDescription });
      }
    }
    
    return NextResponse.json({ resume: generatedResume });
  } catch (error) {
    console.error('Error generating resume:', error);
    return NextResponse.json(
      { error: 'Failed to generate resume' },
      { status: 500 }
    );
  }
}
