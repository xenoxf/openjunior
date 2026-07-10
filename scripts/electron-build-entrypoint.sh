#!/usr/bin/env bash
set -euo pipefail

cd /app/packages/electron

TARGET_PLATFORM="${TARGET_PLATFORM:-linux}"
TARGET_ARCH="${TARGET_ARCH:-x64}"

export ELECTRON_BUILDER_ARCH="${TARGET_ARCH}"

echo "[build] Platform: ${TARGET_PLATFORM}, Arch: ${TARGET_ARCH}"

case "${TARGET_PLATFORM}" in
  linux)
    PLATFORM_FLAGS="--linux"
    ;;
  win|windows)
    PLATFORM_FLAGS="--win"
    ;;
  mac|macos|darwin)
    PLATFORM_FLAGS="--mac"
    ;;
  all)
    PLATFORM_FLAGS="--linux --win --mac"
    ;;
  *)
    echo "[build] Unknown platform: ${TARGET_PLATFORM}"
    echo "[build] Valid values: linux, win, mac, all"
    exit 1
    ;;
esac

if [ "${SKIP_NATIVE_REBUILD:-false}" != "true" ]; then
  echo "[build] Rebuilding native modules for ${TARGET_ARCH}..."
  bun run rebuild:native
else
  echo "[build] SKIP_NATIVE_REBUILD=true, skipping native module rebuild"
fi

echo "[build] Packaging for ${TARGET_PLATFORM}..."
exec node ./scripts/package.mjs ${PLATFORM_FLAGS} --publish never "$@"
