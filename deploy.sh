#!/usr/bin/env bash
# Deploy to Vercel and push the Gemini keys into its environment.
#
# Reads the Vercel token from .vercel-token and the keys from .env.local.
# Both files are gitignored. Neither value is ever printed.
#
#   ./deploy.sh
set -euo pipefail
cd "$(dirname "$0")"

# ---- token ---------------------------------------------------------------
TOKEN=""
if [ -f .vercel-token ]; then
  TOKEN="$(grep -vE '^\s*#' .vercel-token | tr -d '\r' | grep -vE '^\s*$' | head -1 | xargs || true)"
fi
AUTH=()
if [ -n "$TOKEN" ]; then
  AUTH=(--token "$TOKEN")
  echo "using the token from .vercel-token"
else
  echo "no token file, relying on an existing vercel login"
fi

# ---- keys ----------------------------------------------------------------
if [ ! -f .env.local ]; then
  echo "error: .env.local is missing, so there are no keys to upload" >&2
  exit 1
fi
KEYS="$(grep -E '^GEMINI_API_KEYS=' .env.local | head -1 | cut -d= -f2- | tr -d '\r' | xargs || true)"
if [ -z "$KEYS" ]; then
  echo "error: GEMINI_API_KEYS is empty in .env.local" >&2
  exit 1
fi
COUNT="$(printf '%s' "$KEYS" | tr ',' '\n' | grep -c . || true)"
echo "found $COUNT key(s) to upload, values not shown"

# ---- link and deploy -----------------------------------------------------
echo
echo "linking the project (created on first deploy if absent)..."
vercel link --yes --project kutumb-nirnay "${AUTH[@]}" >/dev/null 2>&1 ||   echo "  not linked yet, the deploy will create it" 

echo "uploading GEMINI_API_KEYS to production..."
vercel env rm GEMINI_API_KEYS production --yes "${AUTH[@]}" >/dev/null 2>&1 || true
printf '%s' "$KEYS" | vercel env add GEMINI_API_KEYS production "${AUTH[@]}" >/dev/null
echo "  done"

echo
echo "deploying to production..."
URL="$(vercel deploy --prod --yes "${AUTH[@]}" 2>/dev/null | tail -1)"
echo
echo "deployed: $URL"
echo
echo "checking the assistant on the deployment..."
sleep 4
RESP="$(curl -s -X POST "$URL/api/chat" \
  -H 'content-type: application/json' \
  -d '{"mode":"explain","message":"Reply with the single word ready.","context":{}}' || true)"
echo "$RESP" | head -c 300
echo
echo
echo "$URL" > .vercel-url
echo "url written to .vercel-url"
