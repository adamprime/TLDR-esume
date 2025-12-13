import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  saveFolderHandle,
  getSavedFolderHandle,
  clearSavedFolderHandle,
  hasSavedFolderHandle,
} from '@/lib/folder-handle';

// Mock idb-keyval
vi.mock('idb-keyval', () => ({
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
}));

import { get, set, del } from 'idb-keyval';

describe('folder-handle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('saveFolderHandle', () => {
    it('should store handle in IndexedDB', async () => {
      const mockHandle = { name: 'TLDResume' };
      
      await saveFolderHandle(mockHandle as any);
      
      expect(set).toHaveBeenCalledWith('tldresume-folder-handle', mockHandle);
    });
  });

  describe('getSavedFolderHandle', () => {
    it('should retrieve handle from IndexedDB', async () => {
      const mockHandle = { name: 'TLDResume' };
      (get as any).mockResolvedValue(mockHandle);
      
      const result = await getSavedFolderHandle();
      
      expect(get).toHaveBeenCalledWith('tldresume-folder-handle');
      expect(result).toBe(mockHandle);
    });

    it('should return null if no handle stored', async () => {
      (get as any).mockResolvedValue(undefined);
      
      const result = await getSavedFolderHandle();
      
      expect(result).toBeNull();
    });
  });

  describe('clearSavedFolderHandle', () => {
    it('should delete handle from IndexedDB', async () => {
      await clearSavedFolderHandle();
      
      expect(del).toHaveBeenCalledWith('tldresume-folder-handle');
    });
  });

  describe('hasSavedFolderHandle', () => {
    it('should return true when handle exists', async () => {
      (get as any).mockResolvedValue({ name: 'TLDResume' });
      
      const result = await hasSavedFolderHandle();
      
      expect(result).toBe(true);
    });

    it('should return false when no handle exists', async () => {
      (get as any).mockResolvedValue(undefined);
      
      const result = await hasSavedFolderHandle();
      
      expect(result).toBe(false);
    });
  });
});
