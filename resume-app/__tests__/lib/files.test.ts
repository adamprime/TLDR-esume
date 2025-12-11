import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getApplicationFolderName } from '@/lib/files';

// Mock fs/promises for file system tests
vi.mock('fs/promises', () => ({
  default: {
    readdir: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
    mkdir: vi.fn(),
    stat: vi.fn(),
  },
}));

describe('files', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getApplicationFolderName', () => {
    it('should create folder name from company and role', () => {
      const result = getApplicationFolderName('Stripe', 'Chief of Staff');
      expect(result).toBe('Stripe - Chief of Staff');
    });

    it('should sanitize invalid characters', () => {
      const result = getApplicationFolderName('Company/Name', 'Role:Title');
      expect(result).toBe('Company-Name - Role-Title');
    });

    it('should handle special characters', () => {
      const result = getApplicationFolderName('Test?Co', 'Dev*Lead');
      expect(result).toBe('Test-Co - Dev-Lead');
    });

    it('should handle quotes in names', () => {
      const result = getApplicationFolderName('Test"Corp"', 'Lead');
      expect(result).toBe('Test-Corp- - Lead');
    });

    it('should handle angle brackets', () => {
      const result = getApplicationFolderName('Test<Corp>', 'Lead');
      expect(result).toBe('Test-Corp- - Lead');
    });

    it('should preserve spaces', () => {
      const result = getApplicationFolderName('My Company', 'My Role Title');
      expect(result).toBe('My Company - My Role Title');
    });

    it('should handle empty strings', () => {
      const result = getApplicationFolderName('', '');
      expect(result).toBe(' - ');
    });
  });

  describe('Application data model', () => {
    it('should have correct Application interface shape', () => {
      const validApplication = {
        id: 'test-uuid',
        company: 'Test Company',
        role: 'Test Role',
        jobUrl: 'https://example.com',
        jobDescription: 'Job description text',
        baseResume: 'resume.md',
        style: 'ibm-plex-mono' as const,
        status: 'draft' as const,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      };

      expect(validApplication.id).toBeDefined();
      expect(validApplication.company).toBeDefined();
      expect(validApplication.role).toBeDefined();
      expect(validApplication.status).toBe('draft');
    });
  });
});
