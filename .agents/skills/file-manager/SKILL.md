---
name: file-manager
description: File system operations - read, write, copy, move, delete
version: 1.0.0
author: jclaw-ai
categories: [filesystem, utilities]
tags: [file, filesystem, read, write, copy]
agents: [jclaw, claude-code, codex]
permissions: [file-read, file-write]
---

# File Manager Skill

File system operations for managing files and directories.

## Capabilities

- **file_read**: Read file contents
- **file_write**: Write content to file
- **file_copy**: Copy files
- **file_move**: Move/rename files
- **file_delete**: Delete files
- **dir_list**: List directory contents
- **dir_create**: Create directories

## When to Use

Use this skill when:
- User mentions "file", "read file", "write file"
- Need to manage file system
- Working with local files

## Usage Examples

### Read a file
```
@jclaw Read the contents of config.json
```

### Write to a file
```
@jclaw Create a new file called output.txt with content "Hello World"
```

### List directory
```
@jclaw List all files in the src directory
```
