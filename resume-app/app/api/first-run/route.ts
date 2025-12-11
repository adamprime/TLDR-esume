import { NextResponse } from 'next/server';
import { isFirstRun } from '@/lib/preferences';

export async function GET() {
  try {
    const firstRun = await isFirstRun();
    return NextResponse.json({ isFirstRun: firstRun });
  } catch (error) {
    console.error('Error checking first run:', error);
    return NextResponse.json({ isFirstRun: false });
  }
}
