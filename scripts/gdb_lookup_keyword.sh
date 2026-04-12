#!/bin/bash
# Run from inside WSL. Break in lookup_keyword_impl: rdi = name (cc->tk_text), rsi = keywords[i].word.
# Print both and first bytes at each to find which pointer is bad when strcmp crashes.
cd "$(dirname "$0")/.." || cd /mnt/d/__DOWNLOADS/selforglinux
gdb -batch \
  -ex 'break lookup_keyword_impl' \
  -ex run \
  -ex 'print/x $rdi' \
  -ex 'print/x $rsi' \
  -ex 'x/16cb $rdi' \
  -ex 'x/16cb $rsi' \
  -ex quit \
  --args /tmp/zcc3 /tmp/t.c -o /tmp/t.s 2>&1
