---
name: zkaedi-gate-discipline
description: Forensic accountability for milestone closures and "X is done" claims. Detects six failure modes — phantom closures (no evidence on disk), threshold-mismatch gates (measurement doesn't match stated bar), spin-framing (failure as success), narrative drift (commits that don't match reality), test-ordering pollution (solo-green ≠ regression-green), and working-tree closures (uncommitted dev state masks broken committed state). Use when claiming something "closed", "fixed", "verified", "shipped", "stable", "complete", or "green" — especially ZCC bootstrap work, healer commits, security-pass closures, and ANY agent-delivered PR (Cursor, Antigravity, Copilot) where "ready to merge" must be independently verified. Triggers: "ready to commit", "close this out", "all gates green", "PR is ready", "shipped", "the agent finished", "Cursor delivered", "AG completed". Also trigger when results feel too clean given difficulty, or when an agent PR's commit message is materially shorter than its diff suggests.
---

# ZKAEDI GATE DISCIPLINE — Honest Forensic Closure Protocol

The most important skill in the ZKAEDI engineering loop is not technical — it is the discipline of refusing to declare "closed" without evidence that survives an audit. This skill exists because we have seen, repeatedly, that **the forensic chain can be corrupted by claims of closure that are mechanically convincing but empirically false**. Those corruptions compound. Once `PP-MACRO-020`, `PP-MACRO-021`, and `CG-IR-019` were on the books as "closed" without anyone running the diagnostic, three more sessions built on top of that foundation before someone — me, in a quiet moment of doubt — actually checked and found all three had never been applied to the tree.

The cost of that audit was one session of forensic correction. The cost of *not* doing it would have been every downstream decision, every bisect, every rollback target, made against a tree whose history was a lie.

This skill is how that cost stays paid forward.

---

## The Six Failure Modes

### 1. Phantom Closure
A bug, ticket, or milestone is recorded as "closed" but no evidence exists on disk that the closure ever happened. The patch isn't in the source tree. The test file doesn't exist. The commit body says "all gates green" but the gates were never run, or were run on a different artifact than the one being claimed.

**Smell:** Narrative is clean. Numbers are round. Nobody can produce the raw output from the gate run. The commit message is more confident than the diff justifies.

**Diagnostic:**
```bash
# For any claimed closure, run the actual claim against the tree
grep -rn "<the claimed fix pattern>" <expected files>
ls -la <expected test files>
git log --all --grep="<closure ID>" -p | head -100
# If none of those produce evidence, the closure is phantom
```

### 2. Threshold-Mismatch Gate
A gate has a stated threshold ("Peak RSS < 150 MB") but the measurement that "passed" it was a different measurement entirely (full-compile RSS, not preprocessor RSS). The number satisfies a bar it was never tested against. This is half a step less bad than phantom closure, but it still corrupts the chain because the next person who reads the gate evidence will think the wrong thing was verified.

**Smell:** "It passed but with a caveat." "The threshold is met if you understand that…" "The measurement is close enough." Any sentence where the evidence has to be reframed to fit the threshold.

**Diagnostic:** State the gate's threshold in one sentence. State the measurement that produced the evidence in one sentence. If those two sentences describe different things, the gate did not pass — even if the number is in range. Either change the measurement, change the threshold and document why, or mark the gate deferred.

### 3. Spin Framing — "Failure As Success"
A run produced a failed outcome (`applied_rolled_back`, `bootstrap rc=2`, `0 survivals`), but the closure narrative reframes the failure as validation-through-rejection. "The pipeline correctly rejected the bad patch." "Bootstrap caught it, which proves the safety net works."

This framing is sometimes literally true at the plumbing level. It is also nearly always wrong at the goal level. The goal of the run was to produce a survivor. It did not. The mechanisms working as designed is **the floor**, not the ceiling. A commit message that calls a 0-survival sweep "a brilliant validation" is going to age poorly.

**Smell:** The phrase "even on failure" or "actually proves" or "the right kind of failure" appears in the closure draft. The commit subject is more enthusiastic than the actual outcome warrants.

**Diagnostic:** Restate the run's *goal* in one sentence (e.g., "produce one `applied_survived` record on a real compiler source"). Restate the run's *outcome* in one sentence (e.g., "zero `applied_survived` records produced; one `applied_rolled_back` due to array-base-pointer bug"). The commit message must reflect the second sentence verbatim, not the first.

### 4. Narrative Drift in Commit Messages
The commit body claims the closure is complete and clean, but the actual diff contains mid-gate bug fixes, threshold revisions, or scope changes that the message never mentions. Future-you running `git archaeology` will read the commit and think the work was straightforward. It wasn't. The forensic record has to remember the bumps.

**Smell:** Subject line ends in "✓" or "🔱" or "complete". Body has no "Bugs caught during gate execution:" section. No mention of any reframed threshold. No "Hygiene tickets filed:" pointer.

**Diagnostic:** Before any commit body claims closure, list:
- Each gate, what it measured, what threshold it cleared.
- Every bug caught and fixed *during* the gate execution (not before).
- Every threshold or scope change made mid-run, with the reason.
- Every follow-up ticket filed for things deferred.

If that list is shorter than the actual diff suggests it should be, the message is drifting.

### 5. Test Ordering Pollution — "Solo-green ≠ Regression-green"
A heavy test (gpu inference, network call, large fixture build) passes when run by itself but fails under full repo regression. The closure narrative cites the solo-green run as evidence the work is done. It isn't. The forensic chain only trusts evidence from the *same conditions the work will run under in production* — and "production" here means the next time anyone runs the full test suite, including future-you on a different branch.

This mode is a sibling of phantom closure but with a subtler smell: the evidence *exists*, the test *did* pass, but it passed in conditions that don't match the claim. The most common cause is process-global state contamination from an earlier test (e.g., `torch.use_deterministic_algorithms(True)` flipping a flag that breaks every subsequent CuBLAS operation), but the pattern is general — any test whose pass/fail depends on what ran before it.

**Smell:** "It passes when I run that file by itself." "I don't know why it fails in the full suite, the test is fine." "Just run with `-k <test_name>` and you'll see it works." Any framing where the proof of work has to be *constrained* to make it green.

**Diagnostic:**
```bash
# Run the heavy test in isolation — should pass
uv run pytest tests/test_heavy_thing.py -v

# Run the full suite — must also pass
uv run pytest tests/ -v --tb=short

# If solo-green and regression-red both occur, find the polluting test
uv run pytest tests/ -v -p no:randomly --tb=short  # sequential
# Bisect by deselecting suspected polluters until heavy test passes in regression
```
If isolation passes but regression fails, the gate is not green. Either fix the pollution (e.g. `CUBLAS_WORKSPACE_CONFIG=:4096:8` in repo-root `conftest.py`), isolate via subprocess fixtures, or document the constraint explicitly in the test file's module docstring AND the closure body. Never claim "131 passed" when only "128 + 3 solo" is true.

### 6. Working-Tree Closure — "It Works For Me ≠ It Works When Cloned"
The agent's local working tree passes all tests because uncommitted files provide the missing pieces. The git commit only contains *some* of the work; the rest sits in the working tree, untracked or modified-but-not-staged. Tests pass for the agent because they read on-disk state. The committed branch, fetched fresh by anyone else, is broken.

**This is the agent-handoff failure mode.** It is what happens when an agent delivers a "ready to merge" PR but the agent never tested the *committed state in isolation* — only its own dev environment, which silently supplements the commit with working-tree files.

**Tonight's exemplar (April 28, 2026):** Cursor delivered a 3,200-line Rust frontend in a single squashed commit `0178ea6`. The commit included `part7_rust.c`, dispatch hooks in `part5.c`, declarations in `part1.c`. It did NOT include:
- The `Makefile` edit adding `part7_rust.c` to `PARTS` (would have caused immediate link error: `undefined reference to rust_frontend_compile_file`)
- 17 golden test fixture files (would have caused `make rust-front-smoke` to fail on first run with `FileNotFoundError: tests/rust/expected_smoke_ok.ast`)
- A `.gitignore` rule for the 84 `out-*.bin` files generated by the test harness

All three missing pieces existed in the working tree as untracked or modified-not-staged files. The agent ran `make rust-front-smoke` locally — passed, because disk had what was needed. The agent declared the work shipped and pushed the commit. **The pushed branch was broken.** Anyone cloning it would hit linker error in stage 0.

The rescue pattern took 4 commits and ~2 hours: cherry-pick onto fresh branch off cleaned main, hit linker error, commit Makefile fix, hit FileNotFoundError, copy goldens in and commit, add gitignore for runtime outputs, re-verify both gates green.

**Smell:** Commit message is materially shorter than the diff would suggest (Cursor's title was "harden strict mode diagnostics and GitHub safety automation" for what was actually a 3,200-line new compilation unit). Tests reportedly pass but no one has run them on a fresh clone. The agent's terminal shows green but the agent has never closed and reopened the working tree. CI either doesn't exist for the affected paths or hasn't run yet.

**Diagnostic — the clean-clone test:**
```bash
# After agent declares work ready, before believing them:
git stash --include-untracked         # hide everything not committed
make clean
make <whatever the build target is>   # must succeed against committed-only state
make <test target>                    # must pass against committed-only state
git stash pop                          # restore working tree

# OR, even stronger — clone the branch fresh into a sister directory:
git clone --branch <feature-branch> --single-branch <repo-url> /tmp/freshcheck
cd /tmp/freshcheck
make clean && make <build> && make <test>
# If this fails, the working tree was carrying state the commit doesn't.
```

The clean-clone test is the single highest-value check for any agent-delivered PR. It costs ~1 minute and catches the failure mode that no amount of local testing can surface, because the failure *only manifests when the working tree is removed*.

**Resolution:** Before merging an agent-delivered PR, ALWAYS run the clean-clone (or `git stash` equivalent) test. If the build fails, the agent's working tree was carrying state the commit doesn't have. Identify the missing files (typically by diff'ing what `make` complained about against what's in the working tree but not in the commit). Add them as separate, named commits with forensic messages — do NOT amend into the agent's squash, the commit history should preserve "the agent shipped X, the rescue added Y."

---

## The Seven-Step Closure Protocol

For any closure of any size — single bug, milestone, full session, agent-delivered PR — walk these in order before allowing the commit subject to use the words "closed", "fixed", or "complete", or before allowing a merge button to be clicked.

### Step 1 — State the goal in one sentence
What was this work supposed to *produce*? Not "we worked on X", but "X is true that wasn't true before." If you can't write this sentence, the work isn't ready to close.

### Step 2 — State the outcome in one sentence
What is *actually* on disk that wasn't there before? What is *actually* true now, verified by something other than your own narrative? If outcome ≠ goal, *that's the commit message*, not the goal.

### Step 3 — List every gate, threshold-with-measurement
Format:
```
Gate N: <what it measures> < <threshold> — measured <actual>, source: <command output | test file | commit SHA>
```
If any line in this list has a measurement that doesn't match the threshold's units or scope, that gate is not green. Reframe the threshold *and document why*, or mark deferred.

### Step 4 — List every mid-gate bug caught
Anything that broke during the gate run and got fixed before you re-ran the gate goes here. These are first-class entries in the forensic chain. Hiding them turns the gate into theater.

### Step 5 — List every hygiene ticket and deferred item
Anything you noticed that didn't block this closure but should be tracked. File them as `HYGIENE-NNN` or whatever your tracking convention is. Reference the IDs in the commit body so future-you can find them.

### Step 6 — Independent verification
For closures that *claim* prior closures as foundation (e.g. "PP-INCLUDE-022 builds on PP-MACRO-021's macro storage compression"), spot-check at least one prior closure by running its diagnostic again. If it doesn't reproduce, you've inherited a phantom and your closure is built on sand.

### Step 7 — Clean-clone (or stash) test
For any agent-delivered work, AND for any closure that introduces new compilation units / build steps / test dependencies, run the clean-clone test before merge:

```bash
git stash --include-untracked
make clean && make <build> && make <test>
git stash pop
```

The build and test MUST succeed against the committed-only state. If they don't, the working tree is carrying uncommitted state your commit depends on. Identify what's missing, add it as named commits, repeat.

This step is mandatory for:
- Any PR opened by an agent (Cursor, Antigravity, Copilot, etc.)
- Any closure that adds new files referenced by the build (Makefile changes, new compilation units, new required test fixtures)
- Any closure where the commit message is materially shorter than the diff would suggest
- Any closure where you have not personally run the build from a fresh checkout in the current session

---

## When Pushback is Required

Refuse to bless a closure when any of these are true:

- The user pastes a multi-gate "all green" report but cannot produce the raw output from at least one gate when asked.
- The closure narrative uses the words "validated through rejection", "brilliant on failure", or any equivalent spin frame for what was actually a failed outcome.
- A gate's threshold and measurement describe different things, and the user wants to call it green anyway.
- A previously-claimed closure that this work depends on cannot be re-verified by running its diagnostic.
- The commit body is materially shorter than the actual diff justifies, especially missing mid-gate bug records.
- The user is asking you to commit, push, or tag immediately after a result that came in suspiciously clean given the work's difficulty.
- **An agent has opened a PR and the user wants to merge it without running a clean-clone or stash test.**
- **A PR introduces a new compilation unit / Makefile target / test fixture path, and no one has verified the committed state builds and tests green from a fresh checkout.**
- **An agent's commit message materially undersells the change** ("harden diagnostics" for a 3,200-line new module) — that often correlates with missing-piece working-tree closures.

The pushback is not adversarial — it is forensic. The phrase that consistently lands well: *"The work is real and the result may be exactly what you want. The forensic record needs to match the difficulty. Let's reword and recheck before we commit."*

For agent-delivered PRs specifically: *"The agent's work is real. We need to verify it works in the state the agent committed, not the state on the agent's disk. Sixty seconds with `git stash` will tell us."*

---

## When To Allow the Closure

Bless the closure when:

- All seven protocol steps are filled in with concrete artifacts (commands, SHAs, file paths, output snippets).
- Mid-gate bugs are named in the commit body — *even if* the outcome is still net-positive.
- Every threshold and measurement match in units and scope.
- The goal sentence and outcome sentence either match exactly, or the outcome sentence is the commit message and the goal is reframed honestly.
- The user has independently re-run at least one gate diagnostic in the current session, not relying on cached results from a prior session.
- Any deferred work has a `HYGIENE-NNN` ticket filed and referenced.
- For agent-delivered PRs: the clean-clone or stash test has been run in the current session and the committed state passes.

A closure that survives this is rare and earns the right to be tagged. That rarity is the point — closures should feel scarce, because they're load-bearing.

---

## Agent Handoff — Special Discipline

When an agent (Cursor, Antigravity, Copilot, etc.) delivers a PR, treat it as a *claim of closure* that requires forensic validation, not as work that's already done. The agent's local pass is necessary but not sufficient. Three default checks apply on top of the seven-step protocol:

1. **Authorship audit.** Run `git log --format='%h | %an <%ae> | %s' <merge-base>..<branch>` on the PR's commits. Confirm authorship matches expectation. Bot accounts (`copilot-swe-agent[bot]`, `cursor[bot]`) on commits that should be human-authored are a smell.

2. **Diff-vs-message audit.** For each commit, ratio the line count of the diff against the line count of the commit body. A 3,200-line addition with a 6-line "harden strict modes" commit message is drift. Force the message to honestly scope the change before merging.

3. **Clean-clone test.** Mandatory. See Step 7 above.

If any of these surface red flags, do NOT merge. Convert the agent's branch into a base, branch off cleaned `main`, cherry-pick the agent's commit, fix what the clean-clone test reveals as named commits, and merge that branch instead. The original agent branch survives as a backup and as evidence of what the agent actually shipped vs what landed on main.

This pattern is what produced PR #7 (Rust v1 frontend merge) on April 28, 2026 — Cursor's commit `0178ea6` survived as the cherry-pick base on `feature/rust-v1-merge`, with three rescue commits on top fixing the working-tree-closure gap.

---

## The Meta-Principle

> *"Gate evidence is mechanical; you can force it into a commit body without thinking. Honest gate evidence — where the numbers in the commit body match what actually happened, even when 'what actually happened' contradicts what you hoped — is the hard skill."*

The reason this discipline matters more than any specific gate or test or protocol is that the forensic chain is the only thing standing between a working compiler today and a corrupted reasoning environment six months from now. Every phantom closure is a debt against future-you's ability to bisect, blame, or trust the history. Every working-tree closure is a debt against future-you's ability to clone the repo and have it work.

The job of this skill is to keep that debt at zero.

---

## Closing-Worthy Commit Body Template

When all seven steps are passed, draft the commit body in this shape:

```
<Subject: scope-prefix(area): action+result, no spin>

## Goal
<One sentence — what this work was supposed to produce.>

## Outcome
<One sentence — what is now true on disk. If outcome ≠ goal, this is the
real headline, not the goal.>

## Gates
- Gate 1: <measure> < <threshold> — measured <actual> via `<command>`.
- Gate 2: <measure> < <threshold> — measured <actual> via `<command>`.
- ...

## Bugs caught during gate execution
- <bug 1>: <what broke, what fix landed, line/file ref>
- <bug 2>: ...
(or: "None — gates ran cleanly on first attempt.")

## Clean-clone verification
- `git stash --include-untracked && make clean && make <build> && make <test>` — passed
  (or: `git clone --branch <branch> /tmp/freshcheck && (cd /tmp/freshcheck && make clean && make <build>)` — passed)
- Hash determinism check (if applicable): md5(<artifact>) = <hash> matches expected baseline `<baseline-hash>`

## Hygiene / deferred
- HYGIENE-NNN: <one-line description>
- ...

## Forensic notes
<Any threshold reframes, scope changes, or "I expected X and got Y" moments
worth preserving for the next person who reads this.>
```

Use this template even when the work is small. A small clean closure with this template costs 30 seconds. A milestone with this template is the difference between a tag that survives a year of bisects and one that doesn't.

---

## Final Word

When in doubt, don't close. A deferred closure is recoverable; a phantom closure poisons every decision that builds on it. A working-tree closure poisons every clone that follows.

The Hamiltonian field holds when the forensic chain is honest. It drifts when the chain is wishful. Hold the pattern.
