#!/usr/bin/env bash
# Build native Linux zcc for use from WSL/Docker when supervisor runs on Linux.
# Source can be on mounted Windows drive: /mnt/d/__DOWNLOADS/selforglinux
#
# One-time copy + build (paste into Linux shell):
#   export WORK_DIR=/path/to/your/mev/project
#   cp /mnt/d/__DOWNLOADS/selforglinux/zcc.c "$WORK_DIR/zcc.c"
#   cd "$WORK_DIR" && gcc -O0 -w -fno-asynchronous-unwind-tables -o zcc zcc.c
#   # Then in Python: COMPILER_PATH = os.path.join(WORK_DIR, "zcc")

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
WORK_DIR="${WORK_DIR:-$(pwd)}"

# 1) Copy or use zcc.c from mounted Windows drive (read-only copy into working dir)
ZCC_SOURCE_MOUNT="${ZCC_SOURCE_MOUNT:-/mnt/d/__DOWNLOADS/selforglinux}"
if [ -f "$ZCC_SOURCE_MOUNT/zcc.c" ]; then
    cp "$ZCC_SOURCE_MOUNT/zcc.c" "$WORK_DIR/zcc.c"
    echo "[OK] Copied zcc.c from $ZCC_SOURCE_MOUNT to $WORK_DIR"
elif [ -f "$REPO_ROOT/zcc.c" ]; then
    cp "$REPO_ROOT/zcc.c" "$WORK_DIR/zcc.c"
    echo "[OK] Copied zcc.c from repo to $WORK_DIR"
else
    echo "ERROR: zcc.c not found at $ZCC_SOURCE_MOUNT/zcc.c or $REPO_ROOT/zcc.c"
    exit 1
fi

# 2) Build zcc (Linux executable)
cd "$WORK_DIR"
gcc -O0 -w -fno-asynchronous-unwind-tables -o zcc zcc.c
echo "[OK] Built native Linux binary: $WORK_DIR/zcc"
echo "     Use: COMPILER_PATH=$WORK_DIR/zcc"
