<div align="center">

# ⚡ ZCC — Self-Hosting C Compiler

[![License: MIT](https://img.shields.io/badge/License-MIT-cyan.svg)](LICENSE)
[![Self-Host](https://img.shields.io/badge/Self--Host-Verified-brightgreen?logo=checkmarx)](https://github.com/zkaedii/zcc)
[![Bugs Fixed](https://img.shields.io/badge/Bugs_Catalogued-19-blue?logo=databricks)](https://huggingface.co/datasets/zkaedi/zcc-compiler-bug-corpus)
[![Fuzz](https://img.shields.io/badge/Fuzz-53%2F53-brightgreen?logo=pytest)](tests/)
[![HuggingFace](https://img.shields.io/badge/🤗_Dataset-zcc--compiler--bug--corpus-yellow)](https://huggingface.co/datasets/zkaedi/zcc-compiler-bug-corpus)
[![Platform](https://img.shields.io/badge/Platform-Linux_x86__64-informational?logo=linux)]()
[![Lines Compiled](https://img.shields.io/badge/Lines_Compiled-170K+-purple)]()

A self-hosting C compiler written in C, targeting x86-64 System V ABI.
ZCC compiles itself, then compiles real-world C projects — producing **byte-identical output to GCC**.

</div>

---

## 🏆 Compilation Targets

Every target compiles through ZCC's **native preprocessor and codegen** — no GCC preprocessing, no workarounds.

| Target | Lines | What It Proves | Status |
|:---|---:|:---|:---:|
| **ZCC self-host** | ~8,000 | `zcc2.s == zcc3.s` — compiler compiles itself identically | ✅ |
| **Fuzz suite** | — | 53 randomized test programs, 100% pass rate | ✅ |
| **Lua 5.4.6** | ~30,000 | Full interpreter boots, standard library loads | ✅ |
| **SQLite 3.45.0** | ~85,000 | `INSERT → SELECT → x=42, rc=0` | ✅ |
| **Ray tracer** | ~1,200 | 1920×1080 render, MD5 identical to GCC | ✅ |
| **DOOM 1.10** | ~45,000 | Renders frames, zero codegen errors | ✅ |
| **curl 8.7.1** | 133 files | Compile + link + run, URL/Easy API fully correct | ✅ |
| **stb_image** | ~7,988 | PNG decode, pixel buffer byte-identical to GCC | ✅ |

> **MD5 Proof (stb_image):**
> ```
> a9a4fedf6846b075ac96f3d97919c27e  pixels_gcc.raw
> a9a4fedf6846b075ac96f3d97919c27e  pixels_zcc.raw
> ```

---

## 🔧 Architecture

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌───────────┐
│  part0_pp.c │────▶│   part3.c    │────▶│   part4.c    │────▶│   part5.c    │────▶│  .s file  │
│ Preprocessor│     │  AST Parser  │     │   Codegen    │     │  Peephole    │     │ x86-64 asm│
└─────────────┘     └──────────────┘     └──────────────┘     └──────────────┘     └───────────┘
       │                   │                    │
  ┌────┴────┐        ┌────┴────┐         ┌────┴────┐
  │part1.c  │        │part2.c  │         │ ir.c    │
  │Lexer/   │        │Type     │         │IR Bridge│
  │Tokens   │        │System   │         │(opt)    │
  └─────────┘        └─────────┘         └─────────┘
```

| File | Role |
|:---|:---|
| `part0_pp.c` | C preprocessor — `#include`, `#define`, `#if`/`#elif`/`#else`, macro expansion |
| `part1.c` | Lexer — tokenization, keyword recognition, string/char literals |
| `part2.c` | Type system — `TY_INT`, `TY_FLOAT`, `TY_DOUBLE`, structs, pointers, arrays |
| `part3.c` | Recursive descent parser — AST construction, declarations, expressions |
| `part4.c` | x86-64 codegen — System V ABI, register allocation, instruction emission |
| `part5.c` | Peephole optimizer — redundant instruction elimination |
| `ir.c` | IR bridge — optional 3-address intermediate representation |
| `part6_arm.c` | ARM backend scaffold (Thumb-16 / soft-float, WIP) |
| `compiler_passes.c` | DCE, LICM, constant folding optimization passes |
| `zcc-libc/` | Minimal libc headers (25+ headers) for freestanding compilation |

---

## 🚀 Quick Start

```bash
# Build ZCC
make

# Compile a C file
./zcc hello.c -o hello.s
gcc hello.s -o hello
./hello

# Self-host verification
make selfhost
# Output: SELF-HOST VERIFIED

# Run fuzz suite
make test
```

---

## 🧪 Self-Hosting Bootstrap

ZCC proves correctness through a three-stage bootstrap:

```
Stage 1:  GCC compiles zcc.c → zcc (seed compiler)
Stage 2:  zcc compiles zcc.c → zcc2.s → zcc2
Stage 3:  zcc2 compiles zcc.c → zcc3.s → zcc3
Verify:   cmp zcc2.s zcc3.s → IDENTICAL
```

If Stage 2 and Stage 3 produce identical assembly, the compiler is self-consistent.

---

## 🐛 Bug Corpus

All compiler bugs are catalogued with root cause analysis in the [zcc-compiler-bug-corpus](https://huggingface.co/datasets/zkaedi/zcc-compiler-bug-corpus) dataset on HuggingFace.

**19 bugs fixed** across parser, codegen, ABI, and preprocessor:

| # | Category | Summary |
|---|:---|:---|
| 1-7 | Codegen | Array stride, `va_arg` ordering, struct ABI, pointer sign extension |
| 8-10 | ABI | Indirect call conventions, SysV float registers, enum drift |
| 11-14 | Codegen | Switch fallthrough, implicit prototypes, `va_list` 24B struct |
| 15-17 | Parser/Codegen | Float initializer bypass, hardcoded `sd` suffix, variadic promotion |
| 18-19 | Preprocessor | `#elif` state leak, `#if` expression evaluator rewrite |

---

## 📊 IR Pipeline (Optional)

ZCC can emit a 3-address IR for optimization research:

```bash
ZCC_EMIT_IR=1 ./zcc program.c -o program.s
```

The IR dataset ([zcc-ir-prime-v1](https://huggingface.co/datasets/zkaedi/zcc-ir-prime-v1)) contains 1,449 scored IR functions extracted from self-compilation and curl.

---

## 📁 Project Structure

```
zcc/
├── part0_pp.c              # Preprocessor (recursive descent #if evaluator)
├── part1.c                 # Lexer
├── part2.c                 # Type system
├── part3.c                 # Parser (recursive descent, C89/C99)
├── part4.c                 # x86-64 codegen (System V ABI)
├── part5.c                 # Peephole optimizer
├── part6_arm.c             # ARM backend (WIP)
├── ir.c / ir.h             # IR bridge
├── compiler_passes.c       # DCE, LICM, constant folding
├── zcc-libc/               # Minimal freestanding libc (25+ headers)
├── tests/                  # Test suite + compilation targets
│   ├── float_test.c
│   ├── stb_test_pp.c
│   └── test.png
├── seeds/                  # Fuzz seeds
├── zcc_fuzz.py             # Differential fuzzer
└── zcc-compiler-bug-corpus.json
```

---

## 🗺️ Roadmap

- [ ] `miniz.c` — single-file zlib (4,800 lines)
- [ ] `tcc` bootstrap — compile TinyCC with ZCC
- [ ] Full `math.h` in zcc-libc
- [ ] ARM Thumb-16 backend for RP2040/Flipper Zero
- [ ] GitHub Actions CI with fuzz + self-host verification

---

## 📜 License

[MIT](LICENSE)

---

<div align="center">

**Built by [ZKAEDI](https://github.com/zkaedii)** · Palindrome of IDEAKZ

*A compiler that compiles itself, then compiles DOOM.*

</div>
