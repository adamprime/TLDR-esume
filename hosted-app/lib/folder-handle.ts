/**
 * IndexedDB persistence for folder handles
 * Allows returning users to reconnect to their folder with one click
 */

import { get, set, del } from 'idb-keyval';

const STORAGE_KEY = 'tldresume-folder-handle';

/**
 * Save folder handle to IndexedDB for later use
 */
export async function saveFolderHandle(
  handle: FileSystemDirectoryHandle
): Promise<void> {
  await set(STORAGE_KEY, handle);
}

/**
 * Retrieve saved folder handle from IndexedDB
 */
export async function getSavedFolderHandle(): Promise<FileSystemDirectoryHandle | null> {
  const handle = await get<FileSystemDirectoryHandle>(STORAGE_KEY);
  return handle ?? null;
}

/**
 * Clear saved folder handle from IndexedDB
 */
export async function clearSavedFolderHandle(): Promise<void> {
  await del(STORAGE_KEY);
}

/**
 * Check if a folder handle is saved
 */
export async function hasSavedFolderHandle(): Promise<boolean> {
  const handle = await get(STORAGE_KEY);
  return handle !== undefined;
}

/**
 * Try to reconnect to a saved folder handle
 * Returns the handle if permission is granted, null otherwise
 */
export async function reconnectToSavedFolder(): Promise<FileSystemDirectoryHandle | null> {
  const handle = await getSavedFolderHandle();
  
  if (!handle) {
    return null;
  }
  
  try {
    // Request permission on the saved handle
    const options = { mode: 'readwrite' } as const;
    
    if ((await (handle as any).queryPermission(options)) === 'granted') {
      return handle;
    }
    
    if ((await (handle as any).requestPermission(options)) === 'granted') {
      return handle;
    }
    
    // Permission denied - clear saved handle
    await clearSavedFolderHandle();
    return null;
  } catch {
    // Handle is invalid (folder moved/deleted) - clear it
    await clearSavedFolderHandle();
    return null;
  }
}
