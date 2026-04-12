#!/bin/bash
# Run zcc3 under GDB; on segfault print backtrace. Run from repo root in WSL.
cd "$(dirname "$0")/.." 2>/dev/null || true
gdb -batch \
  -ex 'run' \
  -ex 'bt' \
  -ex 'quit' \
  --args /tmp/zcc3 /tmp/t.c -o /tmp/t.s 2>&1
