#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/lib.sh"

allow_dirty=0
if [[ "${1:-}" == "--allow-dirty" ]]; then
  allow_dirty=1
  shift
fi
if [[ "$#" -ne 0 ]]; then
  die "usage: scripts/build-container.sh [--allow-dirty]"
fi

source_revision="$(git -C "$ROOT_DIR" rev-parse HEAD)"
source_state="clean"
if [[ -n "$(git -C "$ROOT_DIR" status --porcelain=v1)" ]]; then
  source_state="dirty"
  if [[ "$allow_dirty" != "1" ]]; then
    die "refusing to build a release image from a dirty worktree; commit the reviewed changes or use --allow-dirty for local testing"
  fi
fi

log "building Runvara image revision=$source_revision source_state=$source_state"
RUNVARA_SOURCE_REVISION="$source_revision" \
RUNVARA_SOURCE_STATE="$source_state" \
  docker compose build runvara

image_id="$(docker image inspect runvara:local --format '{{.Id}}')"
image_revision="$(docker image inspect runvara:local --format '{{index .Config.Labels "org.opencontainers.image.revision"}}')"
image_state="$(docker image inspect runvara:local --format '{{index .Config.Labels "io.runvara.source-state"}}')"

if [[ "$image_revision" != "$source_revision" || "$image_state" != "$source_state" ]]; then
  die "built image provenance labels do not match the requested source state"
fi
log "built runvara:local id=$image_id revision=$image_revision source_state=$image_state"
