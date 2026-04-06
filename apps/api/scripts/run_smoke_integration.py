#!/usr/bin/env python3
"""Smoke tích hợp: Admin DB + introspection schema Text-to-SQL (cần Postgres + Redis + migrations).

Chạy từ thư mục apps/api:

  .venv/Scripts/python scripts/run_smoke_integration.py

Hoặc bỏ qua bằng: SET SKIP_DB_INTEGRATION=1
"""
from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main() -> int:
    env = {**os.environ, "PYTHONPATH": str(ROOT)}
    cmd = [
        sys.executable,
        "-m",
        "pytest",
        "tests/test_admin_database_integration.py",
        "-v",
        "--tb=short",
    ]
    return subprocess.call(cmd, cwd=ROOT, env=env)


if __name__ == "__main__":
    raise SystemExit(main())
