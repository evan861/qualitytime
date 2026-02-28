#!/bin/bash
set -euo pipefail

# Only run in Claude Code on the web
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# Install dependencies
npm install

# Start the dev server in the background so it's ready to preview
nohup npm run dev > /tmp/qualitytime-dev.log 2>&1 &

echo "Quality Time dev server started on port 3000"
