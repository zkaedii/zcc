# ZKAEDI CATALYZE V11 — Reproducibility Repository

Companion repository for:
**"ZKAEDI CATALYZE V11: Structural Rejection of AdamW in High-Dimensional SWA Fusion"**

## Canonical Holdout

`canonical_holdout.pt` — 2,000 CIFAR-10 images, fixed seed `20240101`.
All test error scores reported in the paper are computed against this file.
Shape: `(2000, 3, 32, 32)` float32 / labels: `(2000,)` int64.

## Checkpoint Directory Structure

```text
checkpoints/
├── catalyze/          # 20 seeds — ZKAEDI CATALYZE V11 optimizer
│   └── C_seed{0-19}.pt
├── adamw/             # 20 seeds — standard AdamW baseline
│   └── A_AdamW_seed{0-19}.pt
├── sgd/               # 20 seeds — pure SGD baseline
│   └── S_SGD_seed{0-19}.pt
├── fused/
│   ├── ZKAEDI_MASTER_FUSED.pt   # Section 4 — GA fusion of CATALYZE seeds
│   ├── ZKAEDI_ULTIMA_FUSED.pt   # Section 5 — GA fusion of SGD/AdamW array
│   └── ZKAEDI_OMEGA_TENSOR.pt   # Section 5 — final MASTER vs ULTIMA fusion
```

## Reported Metrics

| Optimizer | Mean Best Accuracy (20 seeds) |
|-----------|-------------------------------|
| CATALYZE  | 92.744%                       |
| AdamW     | 92.719%                       |
| SGD       | 93.418%                       |

| Fusion Event | Test Error (canonical holdout) |
|---|---|
| MASTER_FUSED baseline | 0.105407 |
| + AdamW seed0 (rejected) | 0.114498 |
| + AdamW seed1 (rejected) | 0.114448 |

## Reproduction

```python
import torch
holdout = torch.load('canonical_holdout.pt')
images, targets = holdout['images'], holdout['targets']
# seed=20240101, n=2000
```

Full fusion logic: `zkaedi_prime_fuser.py`
Evaluation hook: `eval_hook_golden.py`
