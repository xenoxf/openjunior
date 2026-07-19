#!/usr/bin/env bash
#
# fetch-opencode-android.sh
# -----------------------------------------------------------------------------
# Android binary-packaging step for Glenker.
#
# Goal: bundle the OpenCode engine (`lildax`, an ARM64 musl ELF) plus its 3
# required shared libraries into the Android `jniLibs/arm64-v8a/` directory so
# they are extracted at install time into the app's `nativeLibraryDir` — the
# ONLY location on Android 10+ where files may be executed.
#
# Why musl bundling is needed
# ----------------------------
# OpenCode's `lildax` is built against musl libc (Arm64). On Android there is no
# musl in the system, and the binary's ELF headers demand:
#   NEEDED: libstdc++.so.6, libc.musl-aarch64.so.1, libgcc_s.so.1
#   INTERP: /lib/ld-musl-aarch64.so.1
# In musl, the dynamic loader (ld-musl-aarch64.so.1) and libc (libc.musl-aarch64.so.1)
# are THE SAME file. So we ship one file under both names so the INTERP *and* the
# NEEDED entry both resolve. We launch via:
#   LD_LIBRARY_PATH=$dir $dir/libc.musl-aarch64.so.1 $dir/liblildax.so serve ...
# with env BUN_SELF_EXE=$dir/liblildax.so.
#
# The 3 runtime libraries are sourced from the Alpine Linux aarch64 repository
# because Alpine is a musl-based distro — its .apk packages are musl-built and
# therefore ABI-compatible with the musl binary. (.apk files are just gzip tarballs.)
#
# Output files (exact names required):
#   liblildax.so              <- the lildax binary (renamed .so so it lands in nativeLibraryDir)
#   libc.musl-aarch64.so.1    <- musl libc + loader (same file, also copied as ld-musl-aarch64.so.1)
#   libstdc++.so.6            <- C++ runtime
#   libgcc_s.so.1             <- GCC support library
#
# The script is idempotent and safe to re-run.
# -----------------------------------------------------------------------------
set -euo pipefail

# ---- Tunable locations ------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Repo root is two levels up from scripts/ (scripts/ -> packages-level -> repo root).
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
WORKSPACE_JNILIBS="${REPO_ROOT}/packages/android/app/src/main/jniLibs/arm64-v8a"

# ---- Source URLs (verified against Alpine v3.20 aarch64 index) ---------------
OPENCODE_TGZ="https://registry.npmjs.org/@opencode-ai/cli-linux-arm64-musl/-/cli-linux-arm64-musl-1.18.2.tgz"
ALPINE_BASE="https://dl-cdn.alpinelinux.org/alpine/v3.20/main/aarch64"
MUSL_APK="${ALPINE_BASE}/musl-1.2.5-r3.apk"
LIBGCC_APK="${ALPINE_BASE}/libgcc-13.2.1_git20240309-r1.apk"
LIBSTDCXX_APK="${ALPINE_BASE}/libstdc%2B%2B-13.2.1_git20240309-r1.apk"

# ---- Working dir ------------------------------------------------------------
TMP="$(mktemp -d)"
cleanup() { rm -rf "$TMP"; }
trap cleanup EXIT

OPENCODE_DIR="${TMP}/opencode"
MUSL_DIR="${TMP}/musl"
GCC_DIR="${TMP}/gcc"
STDCXX_DIR="${TMP}/stdcxx"

echo "==> Temp workdir: ${TMP}"
echo "==> Target jniLibs dir: ${WORKSPACE_JNILIBS}"

mkdir -p "${OPENCODE_DIR}" "${MUSL_DIR}" "${GCC_DIR}" "${STDCXX_DIR}"
mkdir -p "${WORKSPACE_JNILIBS}"

# -----------------------------------------------------------------------------
# 1. Fetch + extract the OpenCode musl tarball (contains lildax + possibly musl).
# -----------------------------------------------------------------------------
echo "==> Downloading OpenCode musl tarball..."
curl -fsSL "${OPENCODE_TGZ}" -o "${TMP}/opencode.tgz"
echo "    ... extracting package/bin/lildax"
tar -xzf "${TMP}/opencode.tgz" -C "${OPENCODE_DIR}" package/bin/lildax

# -----------------------------------------------------------------------------
# 2. Decide where the musl libc/loader comes from.
#    The OpenCode tarball sometimes bundles its musl libc, but not always.
#    Check for either name anywhere inside the extracted tree.
# -----------------------------------------------------------------------------
MUSL_SRC=""
if tar -tzf "${TMP}/opencode.tgz" | grep -Eq 'libc\.musl-aarch64\.so\.1|ld-musl-aarch64\.so\.1'; then
  echo "==> musl libc/loader found inside OpenCode tarball; extracting it."
  tar -xzf "${TMP}/opencode.tgz" -C "${OPENCODE_DIR}" \
    $(tar -tzf "${TMP}/opencode.tgz" | grep -E 'libc\.musl-aarch64\.so\.1|ld-musl-aarch64\.so\.1' || true)
  MUSL_SRC="$(tar -tzf "${TMP}/opencode.tgz" | grep -E 'libc\.musl-aarch64\.so\.1|ld-musl-aarch64\.so\.1' | head -n1)"
  echo "    ... extracted: ${MUSL_SRC}"
else
  echo "==> musl libc/loader NOT in OpenCode tarball; fetching Alpine musl package."
  curl -fsSL "${MUSL_APK}" -o "${TMP}/musl.apk"
  tar -xzf "${TMP}/musl.apk" -C "${MUSL_DIR}" lib/libc.musl-aarch64.so.1 lib/ld-musl-aarch64.so.1
fi

# -----------------------------------------------------------------------------
# 3. Fetch libgcc_s.so.1 and libstdc++.so.6 from Alpine packages.
# -----------------------------------------------------------------------------
echo "==> Downloading Alpine libgcc + libstdc++ packages..."
curl -fsSL "${LIBGCC_APK}" -o "${TMP}/libgcc.apk"
curl -fsSL "${LIBSTDCXX_APK}" -o "${TMP}/libstdcxx.apk"

# Alpine .apk packages ship the real SONAME file (e.g. libgcc_s.so.1.0.0 /
# libstdc++.so.6.0.32) plus a symlink for the unversioned name. `tar` drops
# symlinks inconsistently, so we extract everything and then pick the real
# (largest, non-symlink) file for each library.
echo "    ... extracting libgcc_s"
tar -xzf "${TMP}/libgcc.apk" -C "${GCC_DIR}" usr/lib
echo "    ... extracting libstdc++"
tar -xzf "${TMP}/libstdcxx.apk" -C "${STDCXX_DIR}" usr/lib

# Resolve the real (non-symlink) libgcc_s.so.1* file.
LIBGCC_SRC="$(find "${GCC_DIR}/usr/lib" -name 'libgcc_s.so*' -type f -printf '%s %p\n' 2>/dev/null | sort -rn | head -n1 | cut -d' ' -f2-)"
if [ -z "${LIBGCC_SRC}" ]; then
  echo "ERROR: could not find libgcc_s.so* in Alpine libgcc package" >&2
  exit 1
fi

# Resolve the real (non-symlink) libstdc++.so.6* file.
LIBSTDCXX_SRC="$(find "${STDCXX_DIR}/usr/lib" -name 'libstdc++.so*' -type f -printf '%s %p\n' 2>/dev/null | sort -rn | head -n1 | cut -d' ' -f2-)"
if [ -z "${LIBSTDCXX_SRC}" ]; then
  echo "ERROR: could not find libstdc++.so* in Alpine libstdc++ package" >&2
  exit 1
fi
echo "    ... found libgcc_s: $(basename "${LIBGCC_SRC}")"
echo "    ... found libstdc++: $(basename "${LIBSTDCXX_SRC}")"

# -----------------------------------------------------------------------------
# 4. Resolve the source path of every component, then install into jniLibs.
# -----------------------------------------------------------------------------
# lildax binary
LILDAX_SRC="${OPENCODE_DIR}/package/bin/lildax"

# musl libc/loader: prefer the one extracted from the opencode tarball, else Alpine.
if [ -n "${MUSL_SRC}" ]; then
  MUSL_LIBC_SRC="${OPENCODE_DIR}/${MUSL_SRC}"
  MUSL_LD_SRC="${MUSL_LIBC_SRC}"   # in musl the loader == libc (same file)
else
  MUSL_LIBC_SRC="${MUSL_DIR}/lib/libc.musl-aarch64.so.1"
  MUSL_LD_SRC="${MUSL_DIR}/lib/ld-musl-aarch64.so.1"
fi

# LIBGCC_SRC / LIBSTDCXX_SRC already resolved above as the real files.

# Sanity: every source must exist before we copy.
for f in "${LILDAX_SRC}" "${MUSL_LIBC_SRC}" "${MUSL_LD_SRC}" "${LIBGCC_SRC}" "${LIBSTDCXX_SRC}"; do
  if [ ! -f "${f}" ]; then
    echo "ERROR: expected source file missing: ${f}" >&2
    exit 1
  fi
done

echo "==> Installing 4 files into ${WORKSPACE_JNILIBS}"
install -m 0644 "${LILDAX_SRC}"     "${WORKSPACE_JNILIBS}/liblildax.so"
install -m 0644 "${MUSL_LIBC_SRC}"  "${WORKSPACE_JNILIBS}/libc.musl-aarch64.so.1"
install -m 0644 "${MUSL_LD_SRC}"    "${WORKSPACE_JNILIBS}/ld-musl-aarch64.so.1"
install -m 0644 "${LIBGCC_SRC}"     "${WORKSPACE_JNILIBS}/libgcc_s.so.1"
install -m 0644 "${LIBSTDCXX_SRC}"  "${WORKSPACE_JNILIBS}/libstdc++.so.6"

echo
echo "==> Done. Files in ${WORKSPACE_JNILIBS}:"
ls -la "${WORKSPACE_JNILIBS}"
echo
echo "Required deliverables (4):"
for n in liblildax.so libc.musl-aarch64.so.1 libstdc++.so.6 libgcc_s.so.1; do
  if [ -f "${WORKSPACE_JNILIBS}/${n}" ]; then
    echo "  [OK] ${n}"
  else
    echo "  [MISSING] ${n}" >&2
    exit 1
  fi
done
echo "All 4 files present."
