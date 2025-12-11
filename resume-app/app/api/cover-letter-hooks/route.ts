import { NextRequest, NextResponse } from 'next/server';
import { saveCoverLetterHooks, getCoverLetterHooks } from '@/lib/files';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('applicationId');
    
    if (!applicationId) {
      return NextResponse.json(
        { error: 'Application ID required' },
        { status: 400 }
      );
    }
    
    const hooks = await getCoverLetterHooks(applicationId);
    return NextResponse.json({ hooks });
  } catch (error) {
    console.error('Error fetching hooks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hooks' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { applicationId, hooks } = await request.json();
    
    if (!applicationId) {
      return NextResponse.json(
        { error: 'Application ID required' },
        { status: 400 }
      );
    }
    
    await saveCoverLetterHooks(applicationId, hooks);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving hooks:', error);
    return NextResponse.json(
      { error: 'Failed to save hooks' },
      { status: 500 }
    );
  }
}
