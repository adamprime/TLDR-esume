import { NextRequest, NextResponse } from 'next/server';
import { reviewResume, generateImprovedResume } from '@/lib/claude';
import { 
  readBaseResume, 
  saveResumeReview, 
  getResumeReview, 
  archiveResume,
  saveImprovedResume,
  archiveResumeReview
} from '@/lib/files';
import { ResumeReview } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { resumeFile, action, selectedWeaknessIds, editedResume } = await request.json();
    
    if (!resumeFile) {
      return NextResponse.json(
        { error: 'Resume file required' },
        { status: 400 }
      );
    }
    
    if (action === 'review') {
      const resume = await readBaseResume(resumeFile);
      const reviewResult = await reviewResume({ resume });
      
      const review: ResumeReview = {
        ...reviewResult,
        resumeFile,
        reviewedAt: new Date().toISOString(),
      };
      
      await saveResumeReview(resumeFile, review);
      return NextResponse.json({ review });
    }
    
    if (action === 'improve') {
      const review = await getResumeReview(resumeFile);
      if (!review) {
        return NextResponse.json(
          { error: 'No review found. Run a review first.' },
          { status: 400 }
        );
      }
      
      const originalResume = await readBaseResume(resumeFile);
      
      // Filter weaknesses to only selected ones
      const selectedWeaknesses = selectedWeaknessIds && selectedWeaknessIds.length > 0
        ? review.weaknesses.filter(w => selectedWeaknessIds.includes(w.id))
        : review.weaknesses;
      
      // Build review feedback string
      const reviewFeedback = `
Grade: ${review.overallGrade}
Feedback: ${review.overallFeedback}

Weaknesses to address:
${selectedWeaknesses.map(w => `- ${w.area}: ${w.detail} (Suggestion: ${w.suggestion})`).join('\n')}
`;
      
      // Build question answers string
      const questionAnswers = review.questions
        .filter(q => q.answer.trim())
        .map(q => `Q: ${q.question}\nA: ${q.answer}`)
        .join('\n\n') || 'No additional context provided.';
      
      const improvedResume = await generateImprovedResume({
        originalResume,
        reviewFeedback,
        questionAnswers,
      });
      
      // Update review with improved resume
      review.improvedResume = improvedResume;
      review.improvementsAppliedAt = new Date().toISOString();
      await saveResumeReview(resumeFile, review);
      
      return NextResponse.json({ 
        improvedResume,
        originalResume,
      });
    }
    
    if (action === 'apply') {
      // Use edited resume from request, or fall back to stored improved resume
      let resumeToApply = editedResume;
      
      if (!resumeToApply) {
        const review = await getResumeReview(resumeFile);
        if (!review?.improvedResume) {
          return NextResponse.json(
            { error: 'No improved resume found. Generate improvements first.' },
            { status: 400 }
          );
        }
        resumeToApply = review.improvedResume;
      }
      
      // Archive the original
      const archivedName = await archiveResume(resumeFile);
      
      // Save the edited/improved version
      await saveImprovedResume(resumeFile, resumeToApply);
      
      // Archive the old review alongside the resume
      await archiveResumeReview(resumeFile);
      
      return NextResponse.json({ 
        success: true,
        archivedAs: archivedName,
        message: `Original archived as ${archivedName}. Resume updated. Run a new review to see your updated score.`
      });
    }
    
    return NextResponse.json(
      { error: 'Invalid action. Use "review", "improve", or "apply".' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in resume review:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { resumeFile, questions } = await request.json();
    
    if (!resumeFile) {
      return NextResponse.json(
        { error: 'Resume file required' },
        { status: 400 }
      );
    }
    
    const review = await getResumeReview(resumeFile);
    if (!review) {
      return NextResponse.json(
        { error: 'No review found' },
        { status: 404 }
      );
    }
    
    review.questions = questions;
    await saveResumeReview(resumeFile, review);
    
    return NextResponse.json({ review });
  } catch (error) {
    console.error('Error updating review:', error);
    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const resumeFile = searchParams.get('resumeFile');
    
    if (!resumeFile) {
      return NextResponse.json(
        { error: 'Resume file required' },
        { status: 400 }
      );
    }
    
    const review = await getResumeReview(resumeFile);
    const resume = await readBaseResume(resumeFile);
    
    return NextResponse.json({ review, resume });
  } catch (error) {
    console.error('Error fetching review:', error);
    return NextResponse.json(
      { error: 'Failed to fetch review' },
      { status: 500 }
    );
  }
}
