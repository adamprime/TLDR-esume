import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { Application, BaseResume, ApplicationQuestion, FitAssessment, ResumeReview, CoverLetterHooks } from './types';

const PROJECT_PATH = process.env.RESUME_PROJECT_PATH || '/Users/adam/coding/2025-resume-project';

export function getProjectPath(): string {
  return PROJECT_PATH;
}

export function getVersionsPath(): string {
  return path.join(PROJECT_PATH, 'versions');
}

export function getExportPath(): string {
  return path.join(PROJECT_PATH, 'export');
}

export async function getBaseResumes(): Promise<BaseResume[]> {
  const files = await fs.readdir(PROJECT_PATH);
  const mdFiles = files.filter(f => f.endsWith('.md') && f.includes('resume'));
  
  return mdFiles.map(filename => ({
    filename,
    name: filename.replace('.md', '').replace(/-/g, ' ').replace(/_/g, ' '),
    path: path.join(PROJECT_PATH, filename),
  }));
}

export async function readBaseResume(filename: string): Promise<string> {
  const filePath = path.join(PROJECT_PATH, filename);
  return fs.readFile(filePath, 'utf-8');
}

export async function getAllApplications(): Promise<Application[]> {
  const versionsPath = getVersionsPath();
  const folders = await fs.readdir(versionsPath);
  const applications: Application[] = [];
  
  for (const folder of folders) {
    const folderPath = path.join(versionsPath, folder);
    const stat = await fs.stat(folderPath);
    
    if (!stat.isDirectory()) continue;
    
    const manifestPath = path.join(folderPath, 'application.json');
    
    try {
      const manifestContent = await fs.readFile(manifestPath, 'utf-8');
      const manifest = JSON.parse(manifestContent) as Application;
      applications.push(manifest);
    } catch {
      // No manifest - create one from folder name
      const parts = folder.split(' - ');
      const company = parts[0] || folder;
      const role = parts.slice(1).join(' - ') || 'Unknown Role';
      
      const app: Application = {
        id: Buffer.from(folder).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 16),
        company,
        role,
        jobUrl: '',
        jobDescription: '',
        baseResume: 'resume.md',
        style: 'modern',
        status: 'submitted',
        createdAt: stat.birthtime.toISOString(),
        updatedAt: stat.mtime.toISOString(),
      };
      
      // Try to read resume file for more info
      const files = await fs.readdir(folderPath);
      const resumeFile = files.find(f => f.toLowerCase().includes('resume') && f.endsWith('.md'));
      
      if (resumeFile) {
        try {
          const content = await fs.readFile(path.join(folderPath, resumeFile), 'utf-8');
          const { data } = matter(content);
          if (data.target_company) app.company = data.target_company;
          if (data.target_role) app.role = data.target_role;
        } catch {
          // Ignore parsing errors
        }
      }
      
      // Save the generated manifest so future updates work
      await fs.writeFile(manifestPath, JSON.stringify(app, null, 2));
      
      applications.push(app);
    }
  }
  
  return applications.sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export async function getApplication(id: string): Promise<Application | null> {
  const applications = await getAllApplications();
  return applications.find(a => a.id === id) || null;
}

export function getApplicationFolderName(company: string, role: string): string {
  return `${company} - ${role}`.replace(/[/\\?%*:|"<>]/g, '-');
}

export async function getApplicationFolder(id: string): Promise<string | null> {
  const versionsPath = getVersionsPath();
  const folders = await fs.readdir(versionsPath);
  
  for (const folder of folders) {
    const manifestPath = path.join(versionsPath, folder, 'application.json');
    try {
      const content = await fs.readFile(manifestPath, 'utf-8');
      const manifest = JSON.parse(content);
      if (manifest.id === id) {
        return path.join(versionsPath, folder);
      }
    } catch {
      // Check if folder name matches id pattern
      const folderId = Buffer.from(folder).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
      if (folderId === id) {
        return path.join(versionsPath, folder);
      }
    }
  }
  
  return null;
}

export async function createApplication(data: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>): Promise<Application> {
  const { v4: uuidv4 } = await import('uuid');
  const now = new Date().toISOString();
  
  const application: Application = {
    ...data,
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
  };
  
  const folderName = getApplicationFolderName(data.company, data.role);
  const folderPath = path.join(getVersionsPath(), folderName);
  const exportFolderPath = path.join(getExportPath(), folderName);
  
  await fs.mkdir(folderPath, { recursive: true });
  await fs.mkdir(exportFolderPath, { recursive: true });
  
  // Save manifest
  await fs.writeFile(
    path.join(folderPath, 'application.json'),
    JSON.stringify(application, null, 2)
  );
  
  return application;
}

export async function updateApplication(id: string, updates: Partial<Application>): Promise<Application | null> {
  const folderPath = await getApplicationFolder(id);
  if (!folderPath) return null;
  
  const manifestPath = path.join(folderPath, 'application.json');
  let application: Application;
  
  try {
    const content = await fs.readFile(manifestPath, 'utf-8');
    application = JSON.parse(content);
  } catch {
    return null;
  }
  
  const updated: Application = {
    ...application,
    ...updates,
    id: application.id,
    createdAt: application.createdAt,
    updatedAt: new Date().toISOString(),
  };
  
  await fs.writeFile(manifestPath, JSON.stringify(updated, null, 2));
  
  return updated;
}

export async function saveResume(id: string, content: string): Promise<void> {
  const folderPath = await getApplicationFolder(id);
  if (!folderPath) throw new Error('Application not found');
  
  const app = await getApplication(id);
  if (!app) throw new Error('Application not found');
  
  const filename = `Adam Tervort - resume - ${app.company} - ${app.role}.md`
    .replace(/[/\\?%*:|"<>]/g, '-');
  
  await fs.writeFile(path.join(folderPath, filename), content);
}

export async function getResume(id: string): Promise<string | null> {
  const folderPath = await getApplicationFolder(id);
  if (!folderPath) return null;
  
  const files = await fs.readdir(folderPath);
  const resumeFile = files.find(f => 
    f.toLowerCase().includes('resume') && f.endsWith('.md')
  );
  
  if (!resumeFile) return null;
  
  return fs.readFile(path.join(folderPath, resumeFile), 'utf-8');
}

export async function saveCoverLetter(id: string, content: string): Promise<void> {
  const folderPath = await getApplicationFolder(id);
  if (!folderPath) throw new Error('Application not found');
  
  const app = await getApplication(id);
  if (!app) throw new Error('Application not found');
  
  const filename = `cover letter - Adam Tervort - ${app.company} - ${app.role}.md`
    .replace(/[/\\?%*:|"<>]/g, '-');
  
  await fs.writeFile(path.join(folderPath, filename), content);
}

export async function getCoverLetter(id: string): Promise<string | null> {
  const folderPath = await getApplicationFolder(id);
  if (!folderPath) return null;
  
  const files = await fs.readdir(folderPath);
  const coverFile = files.find(f => 
    f.toLowerCase().includes('cover') && f.endsWith('.md')
  );
  
  if (!coverFile) return null;
  
  return fs.readFile(path.join(folderPath, coverFile), 'utf-8');
}

export async function saveQuestions(id: string, questions: ApplicationQuestion[]): Promise<void> {
  const folderPath = await getApplicationFolder(id);
  if (!folderPath) throw new Error('Application not found');
  
  let content = '# Application Questions\n\n';
  
  for (const q of questions) {
    content += `## ${q.question}\n\n${q.answer}\n\n---\n\n`;
  }
  
  await fs.writeFile(path.join(folderPath, 'questions.md'), content);
}

export async function getQuestions(id: string): Promise<ApplicationQuestion[]> {
  const folderPath = await getApplicationFolder(id);
  if (!folderPath) return [];
  
  try {
    const content = await fs.readFile(path.join(folderPath, 'questions.md'), 'utf-8');
    const sections = content.split('---').filter(s => s.trim());
    const questions: ApplicationQuestion[] = [];
    
    for (const section of sections) {
      const match = section.match(/##\s*(.+?)\n\n([\s\S]+)/);
      if (match) {
        const { v4: uuidv4 } = await import('uuid');
        questions.push({
          id: uuidv4(),
          question: match[1].trim(),
          answer: match[2].trim(),
        });
      }
    }
    
    return questions;
  } catch {
    return [];
  }
}

export async function saveAssessment(id: string, assessment: FitAssessment): Promise<void> {
  const folderPath = await getApplicationFolder(id);
  if (!folderPath) throw new Error('Application not found');
  
  await fs.writeFile(
    path.join(folderPath, 'assessment.json'),
    JSON.stringify(assessment, null, 2)
  );
}

export async function getAssessment(id: string): Promise<FitAssessment | null> {
  const folderPath = await getApplicationFolder(id);
  if (!folderPath) return null;
  
  try {
    const content = await fs.readFile(path.join(folderPath, 'assessment.json'), 'utf-8');
    return JSON.parse(content) as FitAssessment;
  } catch {
    return null;
  }
}

export async function updateAssessmentGaps(id: string, gaps: FitAssessment['gaps']): Promise<void> {
  const assessment = await getAssessment(id);
  if (!assessment) throw new Error('Assessment not found');
  
  assessment.gaps = gaps;
  await saveAssessment(id, assessment);
}

// Cover Letter Hooks functions
export async function saveCoverLetterHooks(id: string, hooks: CoverLetterHooks): Promise<void> {
  const folderPath = await getApplicationFolder(id);
  if (!folderPath) throw new Error('Application folder not found');
  
  await fs.writeFile(
    path.join(folderPath, 'cover-letter-hooks.json'),
    JSON.stringify(hooks, null, 2)
  );
}

export async function getCoverLetterHooks(id: string): Promise<CoverLetterHooks | null> {
  const folderPath = await getApplicationFolder(id);
  if (!folderPath) return null;
  
  try {
    const content = await fs.readFile(path.join(folderPath, 'cover-letter-hooks.json'), 'utf-8');
    return JSON.parse(content) as CoverLetterHooks;
  } catch {
    return null;
  }
}

// Resume Review functions
export function getReviewPath(resumeFilename: string): string {
  const baseName = resumeFilename.replace('.md', '');
  return path.join(PROJECT_PATH, `${baseName}.review.json`);
}

export async function saveResumeReview(resumeFilename: string, review: ResumeReview): Promise<void> {
  const reviewPath = getReviewPath(resumeFilename);
  await fs.writeFile(reviewPath, JSON.stringify(review, null, 2));
}

export async function getResumeReview(resumeFilename: string): Promise<ResumeReview | null> {
  const reviewPath = getReviewPath(resumeFilename);
  try {
    const content = await fs.readFile(reviewPath, 'utf-8');
    return JSON.parse(content) as ResumeReview;
  } catch {
    return null;
  }
}

export async function archiveResume(resumeFilename: string): Promise<string> {
  const archivePath = path.join(PROJECT_PATH, 'archive');
  await fs.mkdir(archivePath, { recursive: true });
  
  const sourcePath = path.join(PROJECT_PATH, resumeFilename);
  const timestamp = new Date().toISOString().split('T')[0];
  const archiveFilename = resumeFilename.replace('.md', `_${timestamp}.md`);
  const destPath = path.join(archivePath, archiveFilename);
  
  await fs.copyFile(sourcePath, destPath);
  return archiveFilename;
}

export async function saveImprovedResume(resumeFilename: string, content: string): Promise<void> {
  const resumePath = path.join(PROJECT_PATH, resumeFilename);
  await fs.writeFile(resumePath, content);
}

export async function archiveResumeReview(resumeFilename: string): Promise<string | null> {
  const reviewPath = getReviewPath(resumeFilename);
  try {
    const archivePath = path.join(PROJECT_PATH, 'archive');
    await fs.mkdir(archivePath, { recursive: true });
    
    const baseName = resumeFilename.replace('.md', '');
    const timestamp = new Date().toISOString().split('T')[0];
    const archiveFilename = `${baseName}_${timestamp}.review.json`;
    const destPath = path.join(archivePath, archiveFilename);
    
    await fs.rename(reviewPath, destPath);
    return archiveFilename;
  } catch {
    // File doesn't exist, that's fine
    return null;
  }
}
