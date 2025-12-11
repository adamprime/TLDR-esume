import { NextRequest, NextResponse } from 'next/server';
import { 
  getApplication, 
  updateApplication, 
  getResume, 
  getCoverLetter, 
  getQuestions,
  getAssessment,
  saveResume,
  saveCoverLetter,
  saveQuestions
} from '@/lib/files';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const application = await getApplication(id);
    
    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }
    
    const resume = await getResume(id);
    const coverLetter = await getCoverLetter(id);
    const questions = await getQuestions(id);
    const assessment = await getAssessment(id);
    
    return NextResponse.json({
      application,
      resume,
      coverLetter,
      questions,
      assessment,
    });
  } catch (error) {
    console.error('Error fetching application:', error);
    return NextResponse.json(
      { error: 'Failed to fetch application' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    
    // Handle file saves
    if (data.resume !== undefined) {
      await saveResume(id, data.resume);
    }
    if (data.coverLetter !== undefined) {
      await saveCoverLetter(id, data.coverLetter);
    }
    if (data.questions !== undefined) {
      await saveQuestions(id, data.questions);
    }
    
    // Handle application updates
    const { resume, coverLetter, questions, ...updates } = data;
    
    if (Object.keys(updates).length > 0) {
      const updated = await updateApplication(id, updates);
      if (!updated) {
        return NextResponse.json(
          { error: 'Application not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(updated);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating application:', error);
    return NextResponse.json(
      { error: 'Failed to update application' },
      { status: 500 }
    );
  }
}
