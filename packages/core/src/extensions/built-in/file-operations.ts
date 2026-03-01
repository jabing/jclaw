import {
  readFile,
  writeFile,
  mkdir,
  rmdir,
  readdir,
  unlink,
} from 'fs/promises';

import { resolve } from 'path';
import { glob } from 'glob';
import type { Extension } from '../../types.js';

/**
 * Built-in File Operations Extension
 *
 * Provides core file system capabilities for JClaw Agent.
 * Includes: file CRUD, directory operations, and file search.
 *
 * @module @jclaw/core/extensions/built-in/file-operations
 */

interface FileOperationResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

/**
 * Create a new file
 */
async function fileCreate(
  path: string,
  content: string = ''
): Promise<FileOperationResult> {
  try {
    const resolvedPath = resolve(path);
    await writeFile(resolvedPath, content, 'utf-8');
    return { success: true, data: { path: resolvedPath } };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Unknown error creating file',
    };
  }
}

/**
 * Read file contents
 */
async function fileRead(path: string): Promise<FileOperationResult> {
  try {
    const resolvedPath = resolve(path);
    const content = await readFile(resolvedPath, 'utf-8');
    return { success: true, data: { path: resolvedPath, content } };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Unknown error reading file',
    };
  }
}

/**
 * Write/overwrite file contents
 */
async function fileWrite(
  path: string,
  content: string
): Promise<FileOperationResult> {
  try {
    const resolvedPath = resolve(path);
    await writeFile(resolvedPath, content, 'utf-8');
    return { success: true, data: { path: resolvedPath } };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Unknown error writing file',
    };
  }
}

/**
 * Delete a file
 */
async function fileDelete(path: string): Promise<FileOperationResult> {
  try {
    const resolvedPath = resolve(path);
    await unlink(resolvedPath);
    return { success: true, data: { path: resolvedPath } };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Unknown error deleting file',
    };
  }
}

/**
 * Create a directory (recursive)
 */
async function dirCreate(path: string): Promise<FileOperationResult> {
  try {
    const resolvedPath = resolve(path);
    await mkdir(resolvedPath, { recursive: true });
    return { success: true, data: { path: resolvedPath } };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Unknown error creating directory',
    };
  }
}

/**
 * Delete a directory
 */
async function dirDelete(path: string): Promise<FileOperationResult> {
  try {
    const resolvedPath = resolve(path);
    await rmdir(resolvedPath);
    return { success: true, data: { path: resolvedPath } };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Unknown error deleting directory',
    };
  }
}

/**
 * List directory contents
 */
async function dirList(path: string): Promise<FileOperationResult> {
  try {
    const resolvedPath = resolve(path);
    const entries = await readdir(resolvedPath, { withFileTypes: true });
    const items = entries.map((entry) => ({
      name: entry.name,
      type: entry.isDirectory() ? 'directory' : 'file',
      isFile: entry.isFile(),
      isDirectory: entry.isDirectory(),
    }));
    return { success: true, data: { path: resolvedPath, items } };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Unknown error listing directory',
    };
  }
}

/**
 * Search files using glob pattern
 */
async function fileGlob(
  pattern: string,
  cwd?: string
): Promise<FileOperationResult> {
  try {
    const searchPath = cwd ? resolve(cwd) : process.cwd();
    const files = await glob(pattern, { cwd: searchPath, absolute: true });
    return { success: true, data: { pattern, cwd: searchPath, files } };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Unknown error in glob search',
    };
  }
}

/**
 * Find files by name (recursive search)
 */
async function fileFind(
  name: string,
  cwd?: string
): Promise<FileOperationResult> {
  try {
    const searchPath = cwd ? resolve(cwd) : process.cwd();
    const pattern = `**/${name}`;
    const files = await glob(pattern, { cwd: searchPath, absolute: true });
    return { success: true, data: { name, cwd: searchPath, files } };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Unknown error finding file',
    };
  }
}

/**
 * File Operations Extension Definition
 */
export const fileOperationsExtension: Extension = {
  name: '@jclaw/builtin-file-operations',
  version: '1.0.0',
  description: 'Built-in file system operations for JClaw Agent',
  capabilities: [
    {
      name: 'file_create',
      description: 'Create a new file with optional initial content',
      handler: fileCreate as (input: unknown) => Promise<unknown>,
    },
    {
      name: 'file_read',
      description: 'Read the contents of a file',
      handler: fileRead as (input: unknown) => Promise<unknown>,
    },
    {
      name: 'file_write',
      description: 'Write or overwrite file contents',
      handler: fileWrite as (input: unknown) => Promise<unknown>,
    },
    {
      name: 'file_delete',
      description: 'Delete a file',
      handler: fileDelete as (input: unknown) => Promise<unknown>,
    },
    {
      name: 'dir_create',
      description: 'Create a directory (supports recursive creation)',
      handler: dirCreate as (input: unknown) => Promise<unknown>,
    },
    {
      name: 'dir_delete',
      description: 'Delete an empty directory',
      handler: dirDelete as (input: unknown) => Promise<unknown>,
    },
    {
      name: 'dir_list',
      description: 'List contents of a directory',
      handler: dirList as (input: unknown) => Promise<unknown>,
    },
    {
      name: 'file_glob',
      description: 'Search files using glob patterns (e.g., "*.ts")',
      handler: fileGlob as (input: unknown) => Promise<unknown>,
    },
    {
      name: 'file_find',
      description: 'Find files by name recursively',
      handler: fileFind as (input: unknown) => Promise<unknown>,
    },
  ],

  async install(): Promise<void> {
    console.log('📁 File operations extension installed');
  },

  async uninstall(): Promise<void> {
    console.log('📁 File operations extension uninstalled');
  },
};

export default fileOperationsExtension;
