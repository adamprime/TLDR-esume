import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { exportResumePDF, exportCoverLetterPDF } from '@/lib/pdf';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const { applicationId, type, openAfterExport = true } = await request.json();
    
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
    
    // Open the PDF in the default viewer (macOS)
    if (openAfterExport) {
      try {
        await execAsync(`open "${outputPath}"`);
      } catch (openError) {
        console.error('Failed to open PDF:', openError);
        // Don't fail the request if opening fails
      }
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
