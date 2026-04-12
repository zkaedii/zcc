#!/usr/bin/env python3
"""
Differential fuzzer for ZCC: generate small C programs, compile with ZCC and with
gcc -O0, run both and compare exit codes. Report mismatches.

Usage (from repo root in WSL):
  python scripts/zcc_fuzz.py [--count N] [--seed S] [--keep-failing]
  python scripts/zcc_fuzz.py --one "path/to/repro.c"   # test one file

Requires: ./zcc, gcc, and (optional) zcc_rt.o for generated code that uses putchar/malloc.
"""

import argparse
import os
import random
import subprocess
import sys
import tempfile
from pathlib import Path


def generate_simple_c(seed: int, include_div: bool = False) -> str:
    """Generate a minimal C program: main with int vars and arithmetic, return exit code."""
    r = random.Random(seed)
    n_vars = r.randint(1, 5)
    var_names = [f"v{i}" for i in range(n_vars)]
    lines = ["int main(void) {"]
    for i, v in enumerate(var_names):
        lines.append(f"  int {v} = {r.randint(0, 100)};")
    ops = ["+", "-", "*"]
    if include_div:
        ops.append("/")
    expr = var_names[0]
    for _ in range(r.randint(0, 2)):
        op = r.choice(ops)
        other = r.choice(var_names)
        if op == "/":
            expr = f"({other} != 0 ? ({expr} / {other}) : ({expr}))"
        else:
            expr = f"({expr} {op} {other})"
    lines.append(f"  return (int)({expr} & 255);")
    lines.append("}")
    return "\n".join(lines)


EXIT_TIMEOUT = -999
EXIT_NO_CMD = -998


def run_cmd(cmd: list[str], cwd: Path | None = None, timeout: int = 10) -> tuple[int, str, str]:
    try:
        r = subprocess.run(
            cmd,
            cwd=cwd or Path.cwd(),
            capture_output=True,
            text=True,
            timeout=timeout,
        )
        return r.returncode, r.stdout or "", r.stderr or ""
    except subprocess.TimeoutExpired:
        return EXIT_TIMEOUT, "", "timeout"
    except FileNotFoundError:
        return EXIT_NO_CMD, "", "command not found"


def test_one(
    repo_root: Path,
    c_path: Path,
    use_rt: bool = False,
) -> tuple[str, int | None, int | None, str]:
    """
    Compile c_path with zcc and gcc, run both, return (status, zcc_exit, gcc_exit, message).
    status: "match" | "mismatch" | "zcc_fail" | "gcc_fail" | "run_fail"
    """
    base = c_path.stem
    work = c_path.parent
    zcc_exe = repo_root / "zcc"
    rt_o = repo_root / "zcc_rt.o"

    # ZCC: compile to .s
    rc_zcc, out_zcc, err_zcc = run_cmd([str(zcc_exe), str(c_path), "-o", f"{base}.s"], cwd=work)
    if rc_zcc != 0:
        return "zcc_fail", rc_zcc, None, err_zcc.strip() or out_zcc.strip()

    asm_path = work / f"{base}.s"
    if not asm_path.exists():
        return "zcc_fail", 1, None, "ZCC did not produce .s"

    # Link: gcc prog.s [zcc_rt.o] -o prog
    link_cmd = ["gcc", str(asm_path), "-o", str(work / f"{base}_zcc")]
    if use_rt and rt_o.exists():
        link_cmd.insert(-1, str(rt_o))
    rc_link, _, err_link = run_cmd(link_cmd, cwd=work)
    if rc_link != 0:
        return "zcc_fail", rc_zcc, None, f"link failed: {err_link.strip()}"

    # Run ZCC binary
    zcc_exit, _, _ = run_cmd([str(work / f"{base}_zcc")], cwd=work)

    # GCC -O0
    rc_gcc, _, err_gcc = run_cmd(
        ["gcc", "-O0", "-w", str(c_path), "-o", str(work / f"{base}_gcc")],
        cwd=work,
    )
    if rc_gcc != 0:
        return "gcc_fail", zcc_exit, None, err_gcc.strip()

    rc_run_gcc, _, _ = run_cmd([str(work / f"{base}_gcc")], cwd=work)
    gcc_exit = rc_run_gcc

    if zcc_exit == gcc_exit:
        return "match", zcc_exit, gcc_exit, ""
    return "mismatch", zcc_exit, gcc_exit, f"ZCC exit {zcc_exit} vs GCC exit {gcc_exit}"


def main() -> None:
    ap = argparse.ArgumentParser(description="Differential fuzz ZCC vs gcc -O0")
    ap.add_argument("--count", type=int, default=50, help="Number of random programs")
    ap.add_argument("--seed", type=int, default=None, help="RNG seed")
    ap.add_argument("--keep-failing", action="store_true", help="Keep failing .c in cwd")
    ap.add_argument("--one", type=str, default=None, help="Test single file path")
    ap.add_argument("--use-rt", action="store_true", help="Link with zcc_rt.o")
    ap.add_argument("--div", action="store_true", help="Include division in generated expr (guarded)")
    ap.add_argument("--repro", action="store_true", help="Print repro command and seed for first failure")
    ap.add_argument("--verbose", action="store_true", help="Print each run result")
    args = ap.parse_args()

    repo_root = Path(__file__).resolve().parent.parent
    os.chdir(repo_root)

    zcc_exe = repo_root / "zcc"
    if not zcc_exe.exists() and not (repo_root / "zcc.exe").exists():
        print("zcc not found; run: gcc -o zcc zcc.c", file=sys.stderr)
        sys.exit(1)

    if args.one:
        c_path = Path(args.one).resolve()
        if not c_path.exists():
            print(f"File not found: {c_path}", file=sys.stderr)
            sys.exit(1)
        status, zexit, gexit, msg = test_one(repo_root, c_path, use_rt=args.use_rt)
        if status == "match":
            print(f"match (exit {zexit})")
        else:
            print(f"{status}: {msg}")
            if zexit is not None:
                print(f"  ZCC exit: {zexit}")
            if gexit is not None:
                print(f"  GCC exit: {gexit}")
            if args.repro:
                print(f"  Repro: python scripts/zcc_fuzz.py --one {c_path}")
        sys.exit(0 if status == "match" else 1)

    seed = args.seed if args.seed is not None else random.randint(0, 2**31 - 1)
    print(f"Seed {seed}, count {args.count}")

    match = 0
    mismatch = 0
    zcc_fail = 0
    gcc_fail = 0
    failing_sources: list[tuple[int, str]] = []

    for i in range(args.count):
        s = generate_simple_c(seed + i, include_div=args.div)
        with tempfile.NamedTemporaryFile(
            mode="w",
            suffix=".c",
            delete=False,
            dir=repo_root,
        ) as f:
            f.write(s)
            c_path = Path(f.name)

        status, zexit, gexit, msg = test_one(repo_root, c_path, use_rt=args.use_rt)

        if status == "match":
            match += 1
        elif status == "mismatch":
            mismatch += 1
            failing_sources.append((seed + i, s))
            if args.keep_failing:
                keep_path = repo_root / f"fuzz_fail_{seed + i}.c"
                keep_path.write_text(s)
                print(f"  kept {keep_path}")
            if args.repro and args.keep_failing and len(failing_sources) == 1:
                print(f"  Repro: python scripts/zcc_fuzz.py --one {keep_path}  # seed {seed + i}")
        elif status == "zcc_fail":
            zcc_fail += 1
        else:
            gcc_fail += 1

        try:
            c_path.unlink()
        except Exception:
            pass
        for p in [c_path.with_suffix(".s"), repo_root / (c_path.stem + "_zcc"), repo_root / (c_path.stem + "_gcc")]:
            if p.exists():
                try:
                    p.unlink()
                except Exception:
                    pass

        if args.verbose:
            print(f"  [{i}] {status}" + (f": {msg}" if status != "match" else ""))
        elif status != "match" and (mismatch + zcc_fail + gcc_fail) <= 5:
            print(f"  [{i}] {status}: {msg}")
        elif (i + 1) % 10 == 0 and not args.verbose:
            print(f"  ... {i + 1}/{args.count}")

    print(f"\nmatch={match} mismatch={mismatch} zcc_fail={zcc_fail} gcc_fail={gcc_fail}")
    if failing_sources:
        print("\nFirst failing source:")
        print("---")
        print(failing_sources[0][1])
        print("---")
        if args.repro and args.keep_failing:
            sid = failing_sources[0][0]
            print(f"Repro: python scripts/zcc_fuzz.py --one fuzz_fail_{sid}.c  # seed {sid}")
    sys.exit(0 if mismatch == 0 else 1)


if __name__ == "__main__":
    main()
