#!/usr/bin/env bash
# Push env vars from .env.local into the linked Vercel project (Production).
#
# Run AFTER `npx vercel login` and `npx vercel link`.
# Skips blank values and REPLACE_ME placeholders, so unset secrets
# (SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, GOOGLE_PLACES_API_KEY) are left
# for you to add by hand:  npx vercel env add NAME production
#
# NEXT_PUBLIC_SITE_URL is skipped on purpose — set it after the first deploy
# once you know the *.vercel.app URL, then redeploy.
#
# Re-running: `vercel env add` refuses to overwrite. To change one:
#   npx vercel env rm NAME production -y && npx vercel env add NAME production
set -euo pipefail

ENV_FILE="${1:-.env.local}"
TARGET="production"
[ -f "$ENV_FILE" ] || { echo "no $ENV_FILE"; exit 1; }

while IFS= read -r line || [ -n "$line" ]; do
  case "$line" in ''|\#*) continue ;; esac
  key="${line%%=*}"
  val="${line#*=}"
  key="$(printf '%s' "$key" | tr -d '[:space:]')"

  case "$key" in
    ""|NEXT_PUBLIC_SITE_URL) continue ;;
  esac
  case "$val" in
    ""|REPLACE_ME) echo "skip  $key (unset — add manually)"; continue ;;
  esac

  echo "add   $key"
  printf '%s' "$val" | npx --yes vercel env add "$key" "$TARGET" >/dev/null
done < "$ENV_FILE"

echo
echo "Done. Remaining to add by hand (if you want them):"
echo "  npx vercel env add SUPABASE_SERVICE_ROLE_KEY production"
echo "  npx vercel env add RESEND_API_KEY production"
echo "  npx vercel env add GOOGLE_PLACES_API_KEY production   # optional"
