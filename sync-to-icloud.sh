#!/bin/bash
# Sync resume project files to iCloud for backup
# One-way: project → iCloud (project is source of truth)

SRC="/Users/adam/coding/2025-resume-project"
DEST="/Users/adam/Library/Mobile Documents/com~apple~CloudDocs/resumes-tldresume"

# Sync individual files
rsync -av "$SRC/resume.md" "$DEST/resume.md"
rsync -av "$SRC/professional-context.md" "$DEST/professional-context.md"

# Sync directories (--delete removes files from dest that no longer exist in src)
rsync -av --delete "$SRC/versions/" "$DEST/versions/"
rsync -av --delete "$SRC/export/" "$DEST/export/"

echo "Synced to iCloud."
