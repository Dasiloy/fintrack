#!/bin/bash

echo "VERCEL_GIT_COMMIT_REF: $VERCEL_GIT_COMMIT_REF"

if [[ "$VERCEL_GIT_COMMIT_REF" == "release" || "$VERCEL_GIT_COMMIT_REF" == "staging" || "$VERCEL_GIT_COMMIT_REF" == "main" ]] ; then
  # On a deploy branch — check if any web-relevant files changed
  CHANGED=$(git diff --name-only HEAD^ HEAD)
  echo "Changed files:"
  echo "$CHANGED"

  if echo "$CHANGED" | grep -qE '^(apps/web|packages/(database|next_auth|react_query|trpc_app|ui|utils|common|types)|pnpm-lock\.yaml|turbo\.json)'; then
    echo "✅ - Web-relevant files changed, build can proceed"
    exit 1
  else
    echo "🛑 - No web-relevant files changed, skipping build"
    exit 0
  fi

else
  echo "🛑 - Build cancelled (branch: $VERCEL_GIT_COMMIT_REF)"
  exit 0
fi
