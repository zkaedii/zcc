# Agent instructions for ZCC

## Debugging (primary)

When the user reports a ZCC bug (crash, wrong output, self-host failure), run **ZCC Debug Protocol v1.0**.

**Boot command** (paste into chat or use as system context):

```
System Command: Initialize ZCC Debug Protocol v1.0.
1. Current Status: [USER DESCRIBES BUG]
2. Constraint: Follow the 7-Phase Protocol (see docs/DEBUG_PROTOCOL.md).
3. Tools: Use scripts/stub_functions.py for Phase 5.5.
4. Invariants: Golden Rules + Semantic Truths (Phase 2 in docs).
5. Victory: Pass Phase 7 Squasher (CMP, 7-arg, promotion, void-check).

Action: Begin Phase 0 and Phase 1. Define bug statement and list 10+ failure modes.
```

**Phase 3 directive** (when adding instrumentation):

- Insert `ZCC:AST` at entry of `codegen_expr` and `codegen_stmt`.
- Insert `ZCC:EMIT` before every `emit_call()` and `emit_stack_adjust()`.
- Maintain `current_function_name` and `current_line` (or equivalent) for crumbs.

**Error-agent assist:** For ZCC bugs, the user can paste error/crumbs or minimal repro into [ZKAEDI-CC Error Agent Team](https://hf.co/spaces/zkaedi/zkaedi-cc) for triage ideas; then continue with the protocol below.

**Crash-path reduction** (Phase 5.5):

1. Run: `./zcc2 failing_input.c 2> debug.log`
2. Analyze: `tail -n 1 debug.log` → e.g. `ZCC:AST codegen_expr BINARY_ADD fn=my_func line=450`
3. Execute: `python scripts/stub_functions.py failing_input.c --keep main,my_func --out stubbed.c`
4. Test; recurse (if still crashes, bug in kept code; else un-stub and try another block).

## Build / run

- **Shell**: Run all terminal commands in **WSL** (default distro, e.g. Ubuntu). Repo root in WSL: `/mnt/d/__DOWNLOADS/selforglinux` (adjust drive/path for host). Example: `wsl -e sh -c "cd /mnt/d/__DOWNLOADS/selforglinux && gcc -o zcc zcc.c"`.
- Build: `gcc -o zcc zcc.c` (or concatenate part1.c..part5.c to zcc.c first). If `gcc` is missing: `sudo apt update && sudo apt install -y gcc make`.
- **Use ZCC**: In WSL: `./scripts/use_zcc.sh hello.c -o hello.s` then `gcc -o hello hello.s -lm && ./hello`. From PowerShell: `.\scripts\use_zcc.ps1 hello.c -o hello.s`. Or in WSL: `make zcc` then `./zcc <file.c> -o <out.s>`.
- **Self-host**: In WSL: `./run_selfhost.sh`. From PowerShell: `.\scripts\run_selfhost.ps1`.
