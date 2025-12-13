/**
 * Browser-based file system operations using File System Access API
 * Only works in Chromium-based browsers (Brave, Chrome, Edge)
 */

export interface DirectoryEntry {
  name: string;
  kind: 'file' | 'directory';
}

/**
 * Prompt user to select a folder for TLDR;esume data
 */
export async function selectFolder(): Promise<FileSystemDirectoryHandle> {
  const handle = await (window as any).showDirectoryPicker({
    mode: 'readwrite',
  });
  return handle;
}

/**
 * Request permission on an existing folder handle
 */
export async function requestPermission(
  handle: FileSystemDirectoryHandle
): Promise<boolean> {
  const options = { mode: 'readwrite' } as const;
  
  // Check if we already have permission
  if ((await (handle as any).queryPermission(options)) === 'granted') {
    return true;
  }
  
  // Request permission
  if ((await (handle as any).requestPermission(options)) === 'granted') {
    return true;
  }
  
  return false;
}

/**
 * Navigate to a nested directory handle
 */
async function getNestedHandle(
  rootHandle: FileSystemDirectoryHandle,
  pathParts: string[],
  create: boolean = false
): Promise<FileSystemDirectoryHandle> {
  let current = rootHandle;
  
  for (const part of pathParts) {
    if (!part || part === '.') continue;
    current = await current.getDirectoryHandle(part, { create });
  }
  
  return current;
}

/**
 * Read a file's content as string
 */
export async function readFile(
  handle: FileSystemDirectoryHandle,
  path: string
): Promise<string> {
  const parts = path.split('/');
  const filename = parts.pop()!;
  const dirParts = parts;
  
  const dirHandle = await getNestedHandle(handle, dirParts);
  const fileHandle = await dirHandle.getFileHandle(filename);
  const file = await fileHandle.getFile();
  
  return file.text();
}

/**
 * Write content to a file (creates if doesn't exist)
 */
export async function writeFile(
  handle: FileSystemDirectoryHandle,
  path: string,
  content: string
): Promise<void> {
  const parts = path.split('/');
  const filename = parts.pop()!;
  const dirParts = parts;
  
  // Create nested directories if needed
  const dirHandle = await getNestedHandle(handle, dirParts, true);
  const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
  
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
}

/**
 * Check if a file OR directory exists
 */
export async function fileExists(
  handle: FileSystemDirectoryHandle,
  path: string
): Promise<boolean> {
  try {
    const parts = path.split('/');
    const name = parts.pop()!;
    const dirParts = parts;
    
    const dirHandle = await getNestedHandle(handle, dirParts);
    
    // Try as file first
    try {
      await dirHandle.getFileHandle(name);
      return true;
    } catch {
      // Not a file, try as directory
      try {
        await dirHandle.getDirectoryHandle(name);
        return true;
      } catch {
        return false;
      }
    }
  } catch {
    // Parent directory doesn't exist
    return false;
  }
}

/**
 * List entries in a directory
 */
export async function listDirectory(
  handle: FileSystemDirectoryHandle,
  path: string
): Promise<DirectoryEntry[]> {
  const dirHandle = path === '.' 
    ? handle 
    : await getNestedHandle(handle, path.split('/'));
  
  const entries: DirectoryEntry[] = [];
  
  for await (const [name, entryHandle] of (dirHandle as any).entries()) {
    entries.push({
      name,
      kind: entryHandle.kind,
    });
  }
  
  return entries;
}

/**
 * Create a directory (and any parent directories)
 */
export async function createDirectory(
  handle: FileSystemDirectoryHandle,
  path: string
): Promise<void> {
  await getNestedHandle(handle, path.split('/'), true);
}

/**
 * Delete a file or directory
 */
export async function deleteEntry(
  handle: FileSystemDirectoryHandle,
  path: string
): Promise<void> {
  const parts = path.split('/');
  const name = parts.pop()!;
  const dirParts = parts;
  
  const dirHandle = await getNestedHandle(handle, dirParts);
  await dirHandle.removeEntry(name, { recursive: true });
}

/**
 * Default config for new users
 */
const DEFAULT_CONFIG = {
  userName: '',
  userEmail: '',
  userPhone: '',
  userLocation: '',
  linkedInUrl: '',
  githubUrl: '',
  personalWebsite: '',
  aiProvider: 'anthropic',
  aiModel: 'claude-sonnet-4-5-20250929',
  anthropicApiKey: '',
  openaiApiKey: '',
  tonePreference: 'balanced',
  defaultPdfStyle: 'modern',
  onboardingComplete: false,
};

/**
 * Resume template content
 */
const RESUME_TEMPLATE = `---
name: Your Name
email: your.email@example.com
phone: +1 (555) 123-4567
location: City, State
linkedin: linkedin.com/in/yourprofile
---

# Your Name

## Summary

A 2-3 sentence summary of who you are professionally. Focus on your key strengths, years of experience, and what you're known for.

## Experience

### Job Title | Company Name
**Location** | Month Year - Present

- Lead with impact: Start each bullet with a strong action verb and quantify results when possible
- Focus on outcomes, not just activities - what changed because of your work?
- 3-5 bullets per role is usually enough

### Previous Job Title | Previous Company
**Location** | Month Year - Month Year

- Another accomplishment with measurable impact
- Skills or technologies you used and why they mattered

## Skills

**Technical:** List relevant technical skills, tools, and technologies
**Leadership:** Team building, strategic planning, cross-functional collaboration

## Education

### Degree, Major | University Name
Year of Graduation
`;

/**
 * Initialize folder structure for new users
 */
export async function initializeFolderStructure(
  handle: FileSystemDirectoryHandle
): Promise<void> {
  // Create required directories
  await createDirectory(handle, 'versions');
  await createDirectory(handle, 'export');
  
  // Create resume template
  if (!(await fileExists(handle, 'resume-template.md'))) {
    await writeFile(handle, 'resume-template.md', RESUME_TEMPLATE);
  }
  
  // Create default config if doesn't exist
  if (!(await fileExists(handle, 'config.json'))) {
    await writeFile(handle, 'config.json', JSON.stringify(DEFAULT_CONFIG, null, 2));
  }
}

/**
 * Check if File System Access API is supported
 */
export function isFileSystemAccessSupported(): boolean {
  return 'showDirectoryPicker' in window;
}
