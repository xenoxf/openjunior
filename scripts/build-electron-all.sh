#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE_FILE="${ROOT}/docker-compose.build.yml"
DIST_DIR="${ROOT}/dist-electron"

# Targets a compilar: linux-x64, linux-arm64, win-x64
TARGETS=("$@")
if [ ${#TARGETS[@]} -eq 0 ]; then
  TARGETS=("linux-x64" "linux-arm64" "win-x64")
fi

echo "=============================================="
echo " Glenker Electron Build (Docker)"
echo "=============================================="
echo " Targets: ${TARGETS[*]}"
echo " Dist:    ${DIST_DIR}"
echo ""

# Step 1: Build image
echo "--- Step 1: Building electron-builder image ---"
docker compose -f "${COMPOSE_FILE}" build electron-builder
echo ""

# Step 2: Run each target
for TARGET in "${TARGETS[@]}"; do
  echo "--- Step 2: Building ${TARGET} ---"
  mkdir -p "${DIST_DIR}/${TARGET}"
  docker compose -f "${COMPOSE_FILE}" run --rm "${TARGET}"
  echo ""
done

echo "=============================================="
echo " Done! Artifacts:"
for TARGET in "${TARGETS[@]}"; do
  echo "  ${DIST_DIR}/${TARGET}/"
  ls -lh "${DIST_DIR}/${TARGET}/" 2>/dev/null | grep -v "^total" || true
done
echo "=============================================="
