#!/usr/bin/env bash
#
# check-opencode-binary.sh
#
# CI guard for the bundled OpenCode (lildax) native binary shipped as an
# Android JNI shared library (arm64-v8a).
#
# Verifies that `liblildax.so`:
#   * exists,
#   * is a 64-bit ARM (aarch64) ELF,
#   * reports aarch64 via `file`,
#   * has a NEEDED list (via `readelf -d`) that is a subset of the .so files
#     present in the same directory (i.e. every DT_NEEDED entry can be resolved
#     locally, so the loader will not fail at runtime).
#
# Usage:
#   scripts/check-opencode-binary.sh <dir-containing-liblildax.so>
#   (usually the jniLibs/arm64-v8a directory)
#
# Exits non-zero with a clear message on any failure.

set -euo pipefail

TARGET_DIR="${1:-}"

if [[ -z "$TARGET_DIR" ]]; then
  echo "usage: $0 <jniLibs/arm64-v8a directory>" >&2
  exit 2
fi

if [[ ! -d "$TARGET_DIR" ]]; then
  echo "error: directory not found: $TARGET_DIR" >&2
  exit 1
fi

LIB="$TARGET_DIR/liblildax.so"

if [[ ! -f "$LIB" ]]; then
  echo "error: liblildax.so not found in $TARGET_DIR" >&2
  exit 1
fi

echo "checking: $LIB"

# --- ELF + architecture check (file) ----------------------------------------
if ! command -v file >/dev/null 2>&1; then
  echo "error: 'file' is required but not installed" >&2
  exit 1
fi

FILE_OUT="$(file "$LIB")"
echo "file: $FILE_OUT"

if ! echo "$FILE_OUT" | grep -q "ELF"; then
  echo "error: liblildax.so is not an ELF binary" >&2
  exit 1
fi

if ! echo "$FILE_OUT" | grep -qi "aarch64\|ARM aarch64\|64-bit"; then
  echo "error: liblildax.so is not a 64-bit ARM (aarch64) ELF" >&2
  exit 1
fi

# --- ELF class check (readelf) ----------------------------------------------
if ! command -v readelf >/dev/null 2>&1; then
  echo "error: 'readelf' is required but not installed" >&2
  exit 1
fi

READELF_OUT="$(readelf -h "$LIB" 2>/dev/null || true)"
if ! echo "$READELF_OUT" | grep -qi "Class:.*ELF64"; then
  echo "error: liblildax.so is not ELF64 (required for arm64-v8a)" >&2
  exit 1
fi

if ! echo "$READELF_OUT" | grep -qi "Machine:.*AArch64\|Machine:.*ARM aarch64"; then
  echo "error: liblildax.so Machine is not AArch64" >&2
  exit 1
fi

# --- NEEDED subset check -----------------------------------------------------
NEEDED="$(readelf -d "$LIB" 2>/dev/null | grep -i "NEEDED" || true)"

if [[ -z "$NEEDED" ]]; then
  echo "note: no DT_NEEDED entries (statically linked or musl-static) — skipping subset check"
  echo "OK: liblildax.so is a valid aarch64 ELF"
  exit 0
fi

MISSING=0
while IFS= read -r line; do
  # Extract the quoted library name from: 0xXXXX (NEEDED)  Shared library: [libfoo.so]
  needed_lib="$(echo "$line" | sed -E 's/.*Shared library: \[([^]]+)\].*/\1/')"
  if [[ -z "$needed_lib" ]]; then
    continue
  fi
  if [[ ! -f "$TARGET_DIR/$needed_lib" ]]; then
    echo "error: NEEDED '$needed_lib' is not present in $TARGET_DIR" >&2
    MISSING=1
  fi
done <<< "$NEEDED"

if [[ "$MISSING" -ne 0 ]]; then
  echo "error: one or more DT_NEEDED libraries are missing from $TARGET_DIR" >&2
  exit 1
fi

echo "OK: liblildax.so is a valid aarch64 ELF with all NEEDED libs present"
exit 0
