import { NextRequest, NextResponse } from 'next/server';
import { updateApplication } from '@/lib/files';
import { ApplicationStatus } from '@/lib/types';

export async function PUT(request: NextRequest) {
  try {
    const { ids, status } = await request.json();
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Application IDs required' },
        { status: 400 }
      );
    }
    
    if (!status) {
      return NextResponse.json(
        { error: 'Status required' },
        { status: 400 }
      );
    }
    
    const results = await Promise.all(
      ids.map(id => updateApplication(id, { status: status as ApplicationStatus }))
    );
    
    const successCount = results.filter(r => r !== null).length;
    const failCount = results.filter(r => r === null).length;
    
    return NextResponse.json({ 
      success: true,
      updated: successCount,
      failed: failCount,
      message: `Updated ${successCount} applications${failCount > 0 ? `, ${failCount} failed` : ''}`
    });
  } catch (error) {
    console.error('Error bulk updating:', error);
    return NextResponse.json(
      { error: 'Failed to update applications' },
      { status: 500 }
    );
  }
}
