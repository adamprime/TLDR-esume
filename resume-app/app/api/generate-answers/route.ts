import { NextRequest, NextResponse } from 'next/server';
import { generateQuestionAnswer } from '@/lib/ai';
import { getResume, getApplication } from '@/lib/files';

export async function POST(request: NextRequest) {
  try {
    const { applicationId, question } = await request.json();
    
    if (!applicationId || !question) {
      return NextResponse.json(
        { error: 'Application ID and question are required' },
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
    
    const answer = await generateQuestionAnswer({
      resume,
      jobDescription: app.jobDescription,
      company: app.company,
      role: app.role,
      question,
    });
    
    return NextResponse.json({ answer });
  } catch (error) {
    console.error('Error generating answer:', error);
    return NextResponse.json(
      { error: 'Failed to generate answer' },
      { status: 500 }
    );
  }
}
