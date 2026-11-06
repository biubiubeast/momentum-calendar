#!/usr/bin/env bash
set -euo pipefail
umask 077
SOURCE_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
APP_ROOT="${MOMENTUM_APP_ROOT:-/home/bill/apps/momentum}"
mkdir -p "$APP_ROOT"
exec 9>"$APP_ROOT/deploy.lock"
flock -n 9 || { echo 'Another Momentum deployment is running' >&2; exit 1; }
export MOMENTUM_APP_ROOT="$APP_ROOT"
cd "$SOURCE_ROOT"
exec node ubuntu/deploy.mjs "$@"
