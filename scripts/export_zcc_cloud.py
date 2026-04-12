#!/usr/bin/env python3
"""
Export a minimal zcc source tree for building on a remote Linux server.
Creates zcc_cloud_export/ with only the .c and .h files required to build zcc,
then zips it to zcc_ready.zip.

Derived from: Makefile (zcc = zcc.c only; zcc_full = zcc.c + compiler_passes.c)
and #include analysis of zcc.c and compiler_passes.c (both need zcc_ast_bridge.h).
"""

import os
import shutil
import zipfile
from pathlib import Path

# Repo root = directory containing this script, then one level up
SCRIPT_DIR = Path(__file__).resolve().parent
ROOT = SCRIPT_DIR.parent

EXPORT_DIR = ROOT / "zcc_cloud_export"
ZIP_PATH = ROOT / "zcc_ready.zip"

# Required for minimal build:  gcc -o zcc zcc.c
# Required for full build:     gcc -o zcc zcc.c compiler_passes.c -lm
# Both zcc.c and compiler_passes.c #include "zcc_ast_bridge.h"
REQUIRED_FILES = [
    "zcc.c",
    "zcc_ast_bridge.h",
    "compiler_passes.c",
]
# Optional but useful on the server
OPTIONAL_FILES = [
    "Makefile",
]


def main():
    os.chdir(ROOT)

    if EXPORT_DIR.exists():
        shutil.rmtree(EXPORT_DIR)
    EXPORT_DIR.mkdir(parents=True)

    copied = []
    for name in REQUIRED_FILES:
        src = ROOT / name
        if not src.is_file():
            raise SystemExit(f"Required file missing: {src}")
        shutil.copy2(src, EXPORT_DIR / name)
        copied.append(name)

    for name in OPTIONAL_FILES:
        src = ROOT / name
        if src.is_file():
            shutil.copy2(src, EXPORT_DIR / name)
            copied.append(name)

    # BUILD instructions for the server
    build_txt = """# Build zcc on Linux

Minimal (bootstrap compiler only):
  gcc -O0 -w -fno-asynchronous-unwind-tables -o zcc zcc.c

Full (with IR passes / ZCC_IR_BRIDGE):
  gcc -O0 -w -fno-asynchronous-unwind-tables -o zcc zcc.c compiler_passes.c -lm

Then compile a C file:
  ./zcc yourfile.c -o yourfile.s
  gcc -o yourfile yourfile.s -lm
"""
    (EXPORT_DIR / "BUILD.txt").write_text(build_txt, encoding="utf-8")
    copied.append("BUILD.txt")

    # Zip
    if ZIP_PATH.exists():
        ZIP_PATH.unlink()
    with zipfile.ZipFile(ZIP_PATH, "w", zipfile.ZIP_DEFLATED) as zf:
        for f in sorted(EXPORT_DIR.iterdir()):
            zf.write(f, f.relative_to(EXPORT_DIR.parent))

    print("Copied:", ", ".join(copied))
    print("Created:", EXPORT_DIR)
    print("Zipped: ", ZIP_PATH)


if __name__ == "__main__":
    main()
