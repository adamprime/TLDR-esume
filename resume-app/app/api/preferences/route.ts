import { NextRequest, NextResponse } from 'next/server';
import { getPreferences, savePreferences } from '@/lib/preferences';

export async function GET() {
  try {
    const preferences = await getPreferences();
    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error getting preferences:', error);
    return NextResponse.json(
      { error: 'Failed to get preferences' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const updates = await request.json();
    const updated = await savePreferences(updates);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error saving preferences:', error);
    return NextResponse.json(
      { error: 'Failed to save preferences' },
      { status: 500 }
    );
  }
}
