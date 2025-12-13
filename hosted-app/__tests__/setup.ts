import { vi } from 'vitest';

// Mock File with text() method
class MockFile {
  private content: string;
  readonly name: string;
  readonly type: string;

  constructor(content: string, name: string, type: string = 'text/plain') {
    this.content = content;
    this.name = name;
    this.type = type;
  }

  async text(): Promise<string> {
    return this.content;
  }
}

// Mock File System Access API
class MockFileSystemFileHandle {
  private content: string;
  readonly name: string;
  readonly kind = 'file' as const;

  constructor(name: string, content: string = '') {
    this.name = name;
    this.content = content;
  }

  async getFile(): Promise<MockFile> {
    return new MockFile(this.content, this.name);
  }

  async createWritable(): Promise<MockFileSystemWritableFileStream> {
    return new MockFileSystemWritableFileStream((data) => {
      this.content = data;
    });
  }
}

class MockFileSystemWritableFileStream {
  private onWrite: (data: string) => void;

  constructor(onWrite: (data: string) => void) {
    this.onWrite = onWrite;
  }

  async write(data: string): Promise<void> {
    this.onWrite(data);
  }

  async close(): Promise<void> {}
}

class MockFileSystemDirectoryHandle {
  readonly name: string;
  readonly kind = 'directory' as const;
  private _entries: Map<string, MockFileSystemFileHandle | MockFileSystemDirectoryHandle>;

  constructor(name: string) {
    this.name = name;
    this._entries = new Map();
  }

  async getFileHandle(
    name: string,
    options?: { create?: boolean }
  ): Promise<MockFileSystemFileHandle> {
    if (this._entries.has(name)) {
      const entry = this._entries.get(name)!;
      if (entry.kind === 'file') {
        return entry;
      }
      throw new Error('Not a file');
    }
    if (options?.create) {
      const handle = new MockFileSystemFileHandle(name);
      this._entries.set(name, handle);
      return handle;
    }
    throw new DOMException('File not found', 'NotFoundError');
  }

  async getDirectoryHandle(
    name: string,
    options?: { create?: boolean }
  ): Promise<MockFileSystemDirectoryHandle> {
    if (this._entries.has(name)) {
      const entry = this._entries.get(name)!;
      if (entry.kind === 'directory') {
        return entry;
      }
      throw new Error('Not a directory');
    }
    if (options?.create) {
      const handle = new MockFileSystemDirectoryHandle(name);
      this._entries.set(name, handle);
      return handle;
    }
    throw new DOMException('Directory not found', 'NotFoundError');
  }

  async *entries(): AsyncIterableIterator<[string, MockFileSystemFileHandle | MockFileSystemDirectoryHandle]> {
    for (const [key, value] of this._entries) {
      yield [key, value];
    }
  }

  async *values(): AsyncIterableIterator<MockFileSystemFileHandle | MockFileSystemDirectoryHandle> {
    for (const value of this._entries.values()) {
      yield value;
    }
  }

  async removeEntry(name: string): Promise<void> {
    this._entries.delete(name);
  }

  // Helper for tests to add pre-existing files
  _addFile(name: string, content: string): void {
    this._entries.set(name, new MockFileSystemFileHandle(name, content));
  }

  _addDirectory(name: string): MockFileSystemDirectoryHandle {
    const dir = new MockFileSystemDirectoryHandle(name);
    this._entries.set(name, dir);
    return dir;
  }
}

// Make mocks available globally for tests
(globalThis as any).MockFileSystemDirectoryHandle = MockFileSystemDirectoryHandle;
(globalThis as any).MockFileSystemFileHandle = MockFileSystemFileHandle;

// Mock showDirectoryPicker
(globalThis as any).showDirectoryPicker = vi.fn();
