#!/usr/bin/env python3
"""
Stub non-essential functions in zcc.c (or any .c) for delta debugging.
Keeps the file compilable: each stubbed function becomes "return 0;" or "return;".
Usage:
  python stub_functions.py zcc.c --keep main,codegen_expr,parse_expr --out zcc_stubbed.c
  python stub_functions.py zcc.c --stub-from 2000 --stub-to 4000 --out zcc_halved.c
  python stub_functions.py zcc.c --coverage --run-cmd "./zcc %s -o /tmp/out.s" [--max-size 2]
"""

import argparse
import itertools
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path


def find_functions(content: str) -> list[tuple[str, int, int, str, bool]]:
    """Return list of (name, start_line, end_line, signature, is_void)."""
    # Match function def: type(s) and name followed by ( ... ) {
    pattern = re.compile(
        r"^([\w\s\*]+)\s+(\w+)\s*\([^)]*\)\s*\{",
        re.MULTILINE,
    )
    funcs = []
    keywords = {"if", "else", "while", "for", "switch", "return", "do"}
    for m in pattern.finditer(content):
        name = m.group(2)
        if name in keywords:
            continue
        start = content[: m.start()].count("\n") + 1
        depth = 1
        i = m.end()
        while i < len(content) and depth:
            if content[i] == "{":
                depth += 1
            elif content[i] == "}":
                depth -= 1
            i += 1
        end = content[: i].count("\n") + 1
        sig = m.group(0).strip()
        decl = m.group(1).strip()
        is_void = "void" in decl.split() and "*" not in decl
        funcs.append((name, start, end, sig, is_void))
    return funcs


def stub_body(is_void: bool) -> str:
    if is_void:
        return " return;\n}"
    return " return 0;\n}"


def apply_stubbing(
    content: str,
    keep_names: set[str],
    line_range: tuple[int, int] | None,
) -> str:
    funcs = find_functions(content)
    lines = content.split("\n")

    def should_stub(name: str, start: int, end: int) -> bool:
        if name in keep_names:
            return False
        if line_range is None:
            return True
        sfrom, sto = line_range
        # Stub only if function is entirely inside the range
        if start >= sfrom and end <= sto:
            return True
        return False

    # Process from end to start so line numbers don't shift
    for name, start, end, sig, is_void in reversed(funcs):
        if not should_stub(name, start, end):
            continue
        # Replace body: from line after the line containing "{" to line with matching "}"
        start_idx = start - 1
        end_idx = end - 1
        if start_idx >= len(lines) or end_idx >= len(lines):
            continue
        # Find the line with opening brace (might be same as signature)
        open_line = lines[start_idx]
        if "{" in open_line:
            # Body starts next line
            body_start = start_idx + 1
        else:
            body_start = start_idx + 1
        body_end = end_idx
        new_body = stub_body(is_void)
        # Replace lines [body_start : body_end + 1] with just the stub (return; } or return 0; })
        lines[body_start : body_end + 1] = [new_body]

    return "\n".join(lines)


def run_coverage(
    content: str,
    func_names: list[str],
    run_cmd: str,
    max_size: int,
    progress: bool = True,
) -> tuple[list[tuple[frozenset[str], bool]], list[frozenset[str]]]:
    """
    Try each subset of func_names of size 1..max_size. run_cmd is executed with
    %s replaced by path to a stubbed .c file; exit 0 = pass. Returns (results, minimal_failing_sets).
    """
    results: list[tuple[frozenset[str], bool]] = []
    failing_sets: list[frozenset[str]] = []
    total = sum(
        len(list(itertools.combinations(func_names, s)))
        for s in range(1, max_size + 1)
    )
    done = 0

    for size in range(1, max_size + 1):
        for keep in itertools.combinations(func_names, size):
            keep_set = frozenset(keep)
            stubbed = apply_stubbing(content, keep_set, None)
            with tempfile.NamedTemporaryFile(
                mode="w",
                suffix=".c",
                delete=False,
            ) as f:
                f.write(stubbed)
                path = Path(f.name)
            try:
                cmd = run_cmd.replace("%s", str(path))
                result = subprocess.run(
                    cmd,
                    shell=True,
                    capture_output=True,
                    timeout=60,
                    cwd=Path.cwd(),
                )
                passed = result.returncode == 0
            except (subprocess.TimeoutExpired, OSError):
                passed = False
            finally:
                path.unlink(missing_ok=True)
            results.append((keep_set, passed))
            if not passed:
                failing_sets.append(keep_set)
            done += 1
            if progress and total > 10 and done % max(1, total // 10) == 0:
                sys.stderr.write(f"\r  coverage {done}/{total}\r")
                sys.stderr.flush()

    if progress and total > 10:
        sys.stderr.write(" " * 40 + "\r")
        sys.stderr.flush()

    # Minimal failing sets: no proper subset is also failing
    minimal: list[frozenset[str]] = []
    fail_lookup = {s for s, ok in results if not ok}
    for s in failing_sets:
        if not any(t < s for t in fail_lookup):
            minimal.append(s)
    minimal.sort(key=lambda s: (len(s), sorted(s)))
    return results, minimal


def main() -> None:
    ap = argparse.ArgumentParser(
        description="Stub functions in a .c file for delta debugging."
    )
    ap.add_argument("input", type=Path, help="Input .c file (e.g. zcc.c)")
    ap.add_argument(
        "--keep",
        type=str,
        default="",
        help="Comma-separated function names to keep (e.g. main,codegen_expr)",
    )
    ap.add_argument(
        "--stub-from",
        type=int,
        default=None,
        help="Only stub functions that start at or after this line",
    )
    ap.add_argument(
        "--stub-to",
        type=int,
        default=None,
        help="Only stub functions that end at or before this line",
    )
    ap.add_argument(
        "--out",
        type=Path,
        default=None,
        help="Output file (default: print to stdout)",
    )
    ap.add_argument(
        "--list",
        action="store_true",
        help="List functions and line ranges, then exit",
    )
    ap.add_argument(
        "--coverage",
        action="store_true",
        help="Try --keep subsets, run --run-cmd for each; report pass/fail and minimal failing sets",
    )
    ap.add_argument(
        "--run-cmd",
        type=str,
        default="./zcc %s -o /tmp/zcc_stub_out.s",
        help="Command to run (%%s = stubbed .c path); exit 0 = pass (default: ./zcc %%s -o /tmp/zcc_stub_out.s)",
    )
    ap.add_argument(
        "--max-size",
        type=int,
        default=2,
        help="Max subset size for coverage (default 2)",
    )
    ap.add_argument(
        "--out-json",
        type=Path,
        default=None,
        help="Write coverage results to JSON (keep_set, result, minimal_failing)",
    )
    ap.add_argument(
        "--no-progress",
        action="store_true",
        help="Disable progress line during coverage",
    )
    args = ap.parse_args()

    content = args.input.read_text(encoding="utf-8", errors="replace")
    keep = set(s.strip() for s in args.keep.split(",") if s.strip())
    line_range = None
    if args.stub_from is not None and args.stub_to is not None:
        line_range = (args.stub_from, args.stub_to)

    if args.list:
        funcs = find_functions(content)
        for name, start, end, sig, is_void in funcs:
            print(f"{name}\t{start}\t{end}")
        return

    if args.coverage:
        funcs = find_functions(content)
        func_names = [name for name, _, _, _, _ in funcs]
        print(f"Functions: {len(func_names)}")
        print(f"Run cmd: {args.run_cmd}")
        print(f"Max subset size: {args.max_size}")
        results, minimal = run_coverage(
            content,
            func_names,
            args.run_cmd,
            args.max_size,
            progress=not args.no_progress,
        )
        print("\nkeep_set\tresult")
        for keep_set, passed in sorted(results, key=lambda x: (len(x[0]), sorted(x[0]))):
            print(f"{','.join(sorted(keep_set))}\t{'pass' if passed else 'FAIL'}")
        print("\nMinimal failing sets (suggested --keep for minimal repro):")
        for s in minimal:
            print(f"  --keep {','.join(sorted(s))}")
        if not minimal:
            print("  (none)")
        if args.out_json:
            out = {
                "results": [
                    {"keep": sorted(s), "pass": ok}
                    for s, ok in sorted(results, key=lambda x: (len(x[0]), sorted(x[0])))
                ],
                "minimal_failing": [sorted(s) for s in minimal],
            }
            args.out_json.write_text(json.dumps(out, indent=2), encoding="utf-8")
            print(f"\nWrote {args.out_json}")
        return

    result = apply_stubbing(content, keep, line_range)
    if args.out:
        args.out.write_text(result, encoding="utf-8")
    else:
        print(result)


if __name__ == "__main__":
    main()
