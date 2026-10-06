"""CLI contract tests: stdout is data, stderr is diagnostics, exit codes are stable."""

import json
import subprocess
import sys

import pytest

from promptscore.cli import main


def test_doctor_json_envelope(capsys: pytest.CaptureFixture[str]) -> None:
    assert main(["--json", "doctor"]) == 0
    captured = capsys.readouterr()
    payload = json.loads(captured.out)
    assert payload["schema"] == "promptscore-dev-cli-v1"
    assert payload["ok"] is True
    assert captured.err == ""


@pytest.mark.contract
def test_module_entry_point_runs() -> None:
    proc = subprocess.run(
        [sys.executable, "-m", "promptscore.cli", "doctor"],
        capture_output=True,
        text=True,
        check=False,
    )
    assert proc.returncode == 0
    assert "python:" in proc.stdout
