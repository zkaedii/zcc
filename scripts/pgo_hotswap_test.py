#!/usr/bin/env python3
"""
PGO hot-swap test: pump _metrics, run supervisor with short PGO interval,
and verify the engine evolves from v1 to v2 with PGO: True.

Run from repo root (so ./zcc and zkaedi_core_fixed.c exist):
  python3 scripts/pgo_hotswap_test.py

Uses ZCC_QUIET=1 so compiler stderr is suppressed and logs show only the evolution.

Expect in logs:
  1. [JIT] Active Engine: v1 | ... | PGO: False
  2. [PGO] Regime Shift: ...% anomalies. Recompiling...
  3. [JIT] Active Engine: v2 | ... | PGO: True
"""

import asyncio
import logging
import os
import sys

# Run from repo root
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from zkaedi_supervisor_mev import build_supervisor

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    datefmt="%H:%M:%S",
)

PGO_INTERVAL = 15   # seconds (short for test; production uses 300)
METRICS_PUMP_RATE = 0.2  # seconds between bumps
TARGET_AUDITED = 60
RUN_SECONDS = 90
TARGET_VERSION = 2


async def metrics_pumper(supervisor, stop: asyncio.Event):
    """Pump audited and high_energy_txs so PGO threshold is hit."""
    while not stop.is_set():
        await asyncio.sleep(METRICS_PUMP_RATE)
        a = supervisor._metrics.get("audited", 0)
        if a >= TARGET_AUDITED:
            continue
        supervisor._metrics["audited"] = a + 3
        supervisor._metrics["high_energy_txs"] = supervisor._metrics.get("high_energy_txs", 0) + 1


async def version_watcher(core, seen_versions: set, stop: asyncio.Event):
    """Log when engine version changes."""
    last = core.version
    while not stop.is_set():
        await asyncio.sleep(2)
        if core.version != last:
            seen_versions.add(core.version)
            logging.info(f"[TEST] Engine version: v{last} -> v{core.version}")
            last = core.version


async def main():
    os.environ["ZCC_QUIET"] = "1"  # Suppress ZCC/compiler stderr so logs show only regime evolution
    logging.info("PGO hot-swap test: building supervisor (pgo_interval=%ds)", PGO_INTERVAL)
    sup = build_supervisor(
        dry_run=True,
        pipeline_workers=2,
        pgo_interval_seconds=PGO_INTERVAL,
    )
    core = sup.core
    seen_versions = {core.version}
    stop = asyncio.Event()

    asyncio.create_task(metrics_pumper(sup, stop))
    asyncio.create_task(version_watcher(core, seen_versions, stop))

    for name, coro, args in sup._background_tasks:
        asyncio.create_task(coro(*args))

    logging.info("Running for %ds; metrics will be pumped until audited >= %d", RUN_SECONDS, TARGET_AUDITED)
    try:
        await asyncio.wait_for(asyncio.Future(), timeout=RUN_SECONDS)
    except asyncio.TimeoutError:
        pass
    stop.set()

    if TARGET_VERSION in seen_versions:
        logging.info("PGO hot-swap test PASSED: saw engine v%d (PGO recompile)", TARGET_VERSION)
    else:
        logging.warning(
            "PGO hot-swap test: did not see v%d (saw %s). Increase RUN_SECONDS or check PGO threshold.",
            TARGET_VERSION,
            sorted(seen_versions),
        )


if __name__ == "__main__":
    asyncio.run(main())
