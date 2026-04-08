import argparse
import json
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from ai.sql.executor import _validate_sql


@dataclass
class EvalResult:
    total: int
    passed: int

    @property
    def success_rate(self) -> float:
        if self.total == 0:
            return 0.0
        return (self.passed / self.total) * 100.0


def _load_cases(path: Path) -> List[Dict[str, Any]]:
    return json.loads(path.read_text(encoding="utf-8"))


def _evaluate_cases(cases: List[Dict[str, Any]], candidate_key: str) -> Dict[str, EvalResult]:
    results: Dict[str, EvalResult] = {}
    by_level: Dict[str, List[Dict[str, Any]]] = {}
    for case in cases:
        level = str(case.get("level", "unknown"))
        by_level.setdefault(level, []).append(case)

    for level, level_cases in by_level.items():
        passed = 0
        for case in level_cases:
            sql = case.get(candidate_key, "") or ""
            schema = case.get("schema", {})
            try:
                _validate_sql(sql, schema)
                passed += 1
            except Exception:
                pass
        results[level] = EvalResult(total=len(level_cases), passed=passed)
    return results


def _format_result_table(
    baseline: Dict[str, EvalResult], tuned: Dict[str, EvalResult]
) -> str:
    levels = sorted(set(list(baseline.keys()) + list(tuned.keys())))
    lines = [
        "| Level | Baseline pass/total | Baseline rate | Tuned pass/total | Tuned rate | Delta |",
        "| --- | --- | --- | --- | --- | --- |",
    ]
    for level in levels:
        b = baseline.get(level, EvalResult(0, 0))
        t = tuned.get(level, EvalResult(0, 0))
        delta = t.success_rate - b.success_rate
        lines.append(
            f"| {level} | {b.passed}/{b.total} | {b.success_rate:.2f}% | "
            f"{t.passed}/{t.total} | {t.success_rate:.2f}% | {delta:+.2f}% |"
        )
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Benchmark TASK-01 security/execution success on easy/medium/hard SQL cases."
    )
    parser.add_argument(
        "--cases",
        default="tests/fixtures/task01_sql_benchmark_cases.json",
        help="Path tới file benchmark cases JSON.",
    )
    parser.add_argument(
        "--report",
        default="../../fix_bug/fix_bug_4/task_01_benchmark_report.md",
        help="Path output markdown report.",
    )
    args = parser.parse_args()

    cases_path = Path(args.cases).resolve()
    report_path = Path(args.report).resolve()

    cases = _load_cases(cases_path)
    baseline = _evaluate_cases(cases, "baseline_sql")
    tuned = _evaluate_cases(cases, "tuned_sql")

    hard_base = baseline.get("hard", EvalResult(0, 0)).success_rate
    hard_tuned = tuned.get("hard", EvalResult(0, 0)).success_rate
    hard_delta = hard_tuned - hard_base

    report = [
        "# TASK-01 Benchmark Report (Auto-generated)",
        "",
        "## Scope",
        "- Dataset: easy/medium/hard SQL benchmark cases.",
        "- Metric: execution success proxy = SQL pass `_validate_sql` policy.",
        "- So sánh: `baseline_sql` vs `tuned_sql` trên cùng bộ case.",
        "",
        "## Results",
        _format_result_table(baseline, tuned),
        "",
        "## Hard-case KPI",
        f"- Hard execution success delta: {hard_delta:+.2f}%",
        "- KPI target theo TASK-01: >= +15.00%",
        "",
        "## Conclusion",
        (
            "- PASS KPI hard-case execution success."
            if hard_delta >= 15.0
            else "- FAIL KPI hard-case execution success."
        ),
        "",
    ]

    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text("\n".join(report), encoding="utf-8")
    print(f"Report written: {report_path}")
    print(f"Hard delta: {hard_delta:+.2f}%")


if __name__ == "__main__":
    main()
