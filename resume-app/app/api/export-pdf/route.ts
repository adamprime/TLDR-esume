import { NextRequest, NextResponse } from 'next/server';
import { exportResumePDF, exportCoverLetterPDF } from '@/lib/pdf';

export async function POST(request: NextRequest) {
  try {
    const { applicationId, type } = await request.json();
    
    if (!applicationId || !type) {
      return NextResponse.json(
        { error: 'Application ID and type are required' },
        { status: 400 }
      );
    }
    
    let outputPath: string;
    
    if (type === 'resume') {
      outputPath = await exportResumePDF(applicationId);
    } else if (type === 'cover-letter') {
      outputPath = await exportCoverLetterPDF(applicationId);
    } else {
      return NextResponse.json(
        { error: 'Invalid type. Use "resume" or "cover-letter"' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      path: outputPath,
      message: `PDF exported to ${outputPath}`
    });
  } catch (error) {
    console.error('Error exporting PDF:', error);
    const message = error instanceof Error ? error.message : 'Failed to export PDF';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
