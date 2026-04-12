#!/usr/bin/env python3
"""Check Hugging Face profile using HF_TOKEN from .env. Run from repo root."""

import os
import sys

def load_dotenv(path=".env"):
    """Load .env into os.environ (no extra deps)."""
    if not os.path.isfile(path):
        return False
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                k, _, v = line.partition("=")
                os.environ[k.strip()] = v.strip()
    return True


def main():
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    os.chdir(repo_root)

    if not load_dotenv(".env"):
        print("No .env found. Copy .env.example to .env and set HF_TOKEN=...", file=sys.stderr)
        sys.exit(1)

    token = os.environ.get("HF_TOKEN", "").strip()
    if not token:
        print("HF_TOKEN is empty in .env.", file=sys.stderr)
        sys.exit(1)

    try:
        import urllib.request
        req = urllib.request.Request(
            "https://huggingface.co/api/whoami",
            headers={"Authorization": f"Bearer {token}"},
        )
        with urllib.request.urlopen(req, timeout=10) as r:
            import json
            data = json.loads(r.read().decode())
            name = data.get("name") or data.get("fullname") or "?"
            print(f"OK — authenticated as: {name}")
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
