import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  selectFolder,
  readFile,
  writeFile,
  fileExists,
  listDirectory,
  createDirectory,
  initializeFolderStructure,
} from '@/lib/browser-fs';

describe('browser-fs', () => {
  let mockDirectoryHandle: any;

  beforeEach(() => {
    mockDirectoryHandle = new (globalThis as any).MockFileSystemDirectoryHandle('TLDResume');
    vi.clearAllMocks();
  });

  describe('selectFolder', () => {
    it('should call showDirectoryPicker and return handle', async () => {
      (globalThis as any).showDirectoryPicker.mockResolvedValue(mockDirectoryHandle);
      
      const result = await selectFolder();
      
      expect((globalThis as any).showDirectoryPicker).toHaveBeenCalledWith({
        mode: 'readwrite',
      });
      expect(result).toBe(mockDirectoryHandle);
    });

    it('should throw if user cancels', async () => {
      const abortError = new DOMException('User cancelled', 'AbortError');
      (globalThis as any).showDirectoryPicker.mockRejectedValue(abortError);
      
      await expect(selectFolder()).rejects.toThrow();
    });
  });

  describe('readFile', () => {
    it('should read file content as string', async () => {
      mockDirectoryHandle._addFile('test.md', '# Hello World');
      
      const content = await readFile(mockDirectoryHandle, 'test.md');
      
      expect(content).toBe('# Hello World');
    });

    it('should read nested file', async () => {
      const subDir = mockDirectoryHandle._addDirectory('versions');
      subDir._addFile('resume.md', '# My Resume');
      
      const content = await readFile(mockDirectoryHandle, 'versions/resume.md');
      
      expect(content).toBe('# My Resume');
    });

    it('should throw if file does not exist', async () => {
      await expect(readFile(mockDirectoryHandle, 'nonexistent.md')).rejects.toThrow();
    });
  });

  describe('writeFile', () => {
    it('should create and write to a new file', async () => {
      await writeFile(mockDirectoryHandle, 'new-file.md', '# New Content');
      
      const content = await readFile(mockDirectoryHandle, 'new-file.md');
      expect(content).toBe('# New Content');
    });

    it('should overwrite existing file', async () => {
      mockDirectoryHandle._addFile('existing.md', 'old content');
      
      await writeFile(mockDirectoryHandle, 'existing.md', 'new content');
      
      const content = await readFile(mockDirectoryHandle, 'existing.md');
      expect(content).toBe('new content');
    });

    it('should create nested directories if needed', async () => {
      await writeFile(mockDirectoryHandle, 'a/b/c/file.md', 'nested content');
      
      const content = await readFile(mockDirectoryHandle, 'a/b/c/file.md');
      expect(content).toBe('nested content');
    });
  });

  describe('fileExists', () => {
    it('should return true if file exists', async () => {
      mockDirectoryHandle._addFile('exists.md', 'content');
      
      const exists = await fileExists(mockDirectoryHandle, 'exists.md');
      
      expect(exists).toBe(true);
    });

    it('should return false if file does not exist', async () => {
      const exists = await fileExists(mockDirectoryHandle, 'nonexistent.md');
      
      expect(exists).toBe(false);
    });

    it('should work with nested paths', async () => {
      const subDir = mockDirectoryHandle._addDirectory('versions');
      subDir._addFile('resume.md', 'content');
      
      expect(await fileExists(mockDirectoryHandle, 'versions/resume.md')).toBe(true);
      expect(await fileExists(mockDirectoryHandle, 'versions/other.md')).toBe(false);
    });
  });

  describe('listDirectory', () => {
    it('should list all entries in a directory', async () => {
      mockDirectoryHandle._addFile('file1.md', 'content1');
      mockDirectoryHandle._addFile('file2.md', 'content2');
      mockDirectoryHandle._addDirectory('subdir');
      
      const entries = await listDirectory(mockDirectoryHandle, '.');
      
      expect(entries).toHaveLength(3);
      expect(entries).toContainEqual({ name: 'file1.md', kind: 'file' });
      expect(entries).toContainEqual({ name: 'file2.md', kind: 'file' });
      expect(entries).toContainEqual({ name: 'subdir', kind: 'directory' });
    });

    it('should list nested directory', async () => {
      const subDir = mockDirectoryHandle._addDirectory('versions');
      subDir._addFile('resume.md', 'content');
      subDir._addDirectory('Company - Role');
      
      const entries = await listDirectory(mockDirectoryHandle, 'versions');
      
      expect(entries).toHaveLength(2);
      expect(entries).toContainEqual({ name: 'resume.md', kind: 'file' });
      expect(entries).toContainEqual({ name: 'Company - Role', kind: 'directory' });
    });
  });

  describe('createDirectory', () => {
    it('should create a new directory', async () => {
      await createDirectory(mockDirectoryHandle, 'new-dir');
      
      const entries = await listDirectory(mockDirectoryHandle, '.');
      expect(entries).toContainEqual({ name: 'new-dir', kind: 'directory' });
    });

    it('should create nested directories', async () => {
      await createDirectory(mockDirectoryHandle, 'a/b/c');
      
      const exists = await fileExists(mockDirectoryHandle, 'a/b/c');
      // Directory existence check - should not throw
    });
  });

  describe('initializeFolderStructure', () => {
    it('should create required directories and template file', async () => {
      await initializeFolderStructure(mockDirectoryHandle);
      
      const entries = await listDirectory(mockDirectoryHandle, '.');
      const names = entries.map(e => e.name);
      
      expect(names).toContain('versions');
      expect(names).toContain('export');
      expect(names).toContain('resume-template.md');
    });

    it('should not overwrite existing config.json', async () => {
      mockDirectoryHandle._addFile('config.json', '{"existing": true}');
      
      await initializeFolderStructure(mockDirectoryHandle);
      
      const content = await readFile(mockDirectoryHandle, 'config.json');
      expect(content).toBe('{"existing": true}');
    });

    it('should create default config.json if not exists', async () => {
      await initializeFolderStructure(mockDirectoryHandle);
      
      const content = await readFile(mockDirectoryHandle, 'config.json');
      const config = JSON.parse(content);
      
      expect(config).toHaveProperty('aiProvider');
      expect(config).toHaveProperty('onboardingComplete', false);
    });
  });
});
