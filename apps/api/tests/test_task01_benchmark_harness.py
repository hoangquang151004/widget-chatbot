from pathlib import Path

from scripts.run_task01_sql_benchmark import _evaluate_cases, _load_cases


def test_task01_benchmark_hard_delta_at_least_15_percent():
    cases_path = Path(__file__).parent / "fixtures" / "task01_sql_benchmark_cases.json"
    cases = _load_cases(cases_path)
    baseline = _evaluate_cases(cases, "baseline_sql")
    tuned = _evaluate_cases(cases, "tuned_sql")

    hard_base = baseline["hard"].success_rate
    hard_tuned = tuned["hard"].success_rate
    assert hard_tuned - hard_base >= 15.0
