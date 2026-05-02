# SVG42 browser tools

Self-contained HTML applications for the SVG42 numeric scene compiler and
the Phase 4 / PRIME Hamiltonian kernel.

| File | Role |
|---|---|
| `svg42_compiler_builder.html` | Main builder — Phase 2 script, Phase 3 passes, Prime Lab, export |
| `svg42_phase4_prime.html` | Standalone Phase 4 explorer — symplectic integrators, witness strip |

#### Compiler output (builder)

In-browser “compilation” is not a process **stdout**; feedback is in the **Build** page:

| Control / element | What it shows |
| --- | --- |
| **Build Compiler** (DSL) | `dslStatus` — channel count or DSL parse error |
| **Compile** | `compileStatus` + `info` — IR row count, schema warnings, `schemaVersion` |
| **Self-check** | `compileStatus` — limit/schema/cap issues without a full recompile |
| **Phase 3** | `compileStatus` plus **Phase 3** panel: `phase3Trace` (pass + timing) and `phase3Diff` (IR diff) |
| **Compiler log** (new) | Scrollable, timestamped lines (`OK` / `ERROR`), **Last error** line, **Copy log** / **Clear**. Render and typical export paths do not append here. |

ZCC (the C compiler in the repo) still reports via **make** / **terminal**; see the root `Makefile` target **`selfhost`** and `AGENTS.md` for the self-host check.

Open either file directly in a browser (`file://` or static hosting). The
builder links to the Phase 4 page via a sibling `href` (same folder).

Each file includes a small **inline SVG sprite sheet** (`<symbol>…</symbol>`)
at the top of `<body>` — logo marks and icons are referenced with
`<use href="#…">` (no external `.svg` fetches). Phase 4 keeps a single
`<script>` block so `phase4_check.js` still passes.

**Arcade (`docs/rigor/CHEATSHEET.html`) raster pipeline:** symbols are turned
into standalone SVG via `DOMParser` + per-raster `id` prefixing and `url(#…)`
rewriting (so `filter` / gradients stay valid in isolation), then
`XMLSerializer` → `Blob` → `createObjectURL` for `drawImage` on the canvas
with a legacy `data:` fallback if parsing fails.

Canonical methodology write-up: `docs/rigor/PHASE4.md`. Regression coverage
for the eight witness chains lives in `.compat_out/phase4_*.js` with
`phase4_invariants_under_edit.js` as the meta-test.
