import { NextRequest, NextResponse } from 'next/server';
import { getAllApplications, createApplication, getBaseResumes } from '@/lib/files';
import { Application } from '@/lib/types';

export async function GET() {
  try {
    const applications = await getAllApplications();
    const baseResumes = await getBaseResumes();
    return NextResponse.json({ applications, baseResumes });
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json() as Omit<Application, 'id' | 'createdAt' | 'updatedAt'>;
    
    if (!data.company || !data.role) {
      return NextResponse.json(
        { error: 'Company and role are required' },
        { status: 400 }
      );
    }
    
    const application = await createApplication(data);
    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    console.error('Error creating application:', error);
    return NextResponse.json(
      { error: 'Failed to create application' },
      { status: 500 }
    );
  }
}
