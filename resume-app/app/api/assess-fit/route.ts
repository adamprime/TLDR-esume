import { NextRequest, NextResponse } from 'next/server';
import { assessFit } from '@/lib/claude';
import { readBaseResume, getApplication, saveAssessment, getAssessment, updateAssessmentGaps } from '@/lib/files';

export async function POST(request: NextRequest) {
  try {
    const { applicationId, baseResumeFile } = await request.json();
    
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
    
    if (!app.jobDescription) {
      return NextResponse.json(
        { error: 'Job description required for assessment' },
        { status: 400 }
      );
    }
    
    // Read the base resume
    const resumeFile = baseResumeFile || app.baseResume;
    const resume = await readBaseResume(resumeFile);
    
    // Run assessment
    const assessment = await assessFit({
      resume,
      jobDescription: app.jobDescription,
      company: app.company,
      role: app.role,
    });
    
    // Save assessment
    await saveAssessment(applicationId, assessment);
    
    return NextResponse.json({ assessment });
  } catch (error) {
    console.error('Error assessing fit:', error);
    return NextResponse.json(
      { error: 'Failed to assess fit' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { applicationId, gaps } = await request.json();
    
    if (!applicationId || !gaps) {
      return NextResponse.json(
        { error: 'Application ID and gaps required' },
        { status: 400 }
      );
    }
    
    await updateAssessmentGaps(applicationId, gaps);
    const assessment = await getAssessment(applicationId);
    
    return NextResponse.json({ assessment });
  } catch (error) {
    console.error('Error updating gaps:', error);
    return NextResponse.json(
      { error: 'Failed to update gaps' },
      { status: 500 }
    );
  }
}
