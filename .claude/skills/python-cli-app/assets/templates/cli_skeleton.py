"""Thin CLI entry point: parse, dispatch, map exceptions to exit codes.

Copy to src/<pkg>/cli.py. Keep this file free of domain logic; commands live in
src/<pkg>/commands/<name>.py and take typed arguments, not the Namespace.
"""

from __future__ import annotations

import argparse
import json
import sys
from collections.abc import Sequence
from enum import IntEnum

SCHEMA = "<tool>-cli-v1"


class ExitCode(IntEnum):
    """Stable exit classes; see assets/templates/exit-code-map-v1.csv."""

    SUCCESS = 0
    INVOCATION = 2
    AUTH = 3
    NOT_FOUND = 4
    CONFLICT = 5
    REMOTE = 6
    PARTIAL = 7
    PENDING = 8
    INTERRUPTED = 130


class CliError(Exception):
    """Base for errors that map to a nonzero exit code."""

    exit_code: ExitCode = ExitCode.INVOCATION


class NotFoundError(CliError):
    """A requested resource does not exist."""

    exit_code = ExitCode.NOT_FOUND


def build_parser() -> argparse.ArgumentParser:
    """Build the top-level parser with global flags and subcommands."""
    parser = argparse.ArgumentParser(prog="<tool>")
    parser.add_argument("--json", action="store_true", help="machine-readable output")
    parser.add_argument("--config", help="config file path (overrides TOOL_CONFIG)")
    parser.add_argument("-v", "--verbose", action="count", default=0)
    sub = parser.add_subparsers(dest="command", required=True)

    doctor = sub.add_parser("doctor", help="read-only environment check")
    doctor.set_defaults(func=_cmd_doctor)
    return parser


def _cmd_doctor(args: argparse.Namespace) -> dict[str, object]:
    """Return a read-only diagnostic report; must not create files."""
    return {"python": sys.version.split()[0], "config": args.config}


def _emit(payload: dict[str, object], *, as_json: bool) -> None:
    """Write data to stdout only; diagnostics never go here."""
    if as_json:
        envelope = {"schema": SCHEMA, "ok": True, "data": payload}
        sys.stdout.write(json.dumps(envelope, sort_keys=True) + "\n")
        return
    for key, value in payload.items():
        sys.stdout.write(f"{key}: {value}\n")


def _emit_error(err: CliError, *, as_json: bool) -> None:
    """Report a mapped error on stderr (text) or stdout (JSON envelope)."""
    if as_json:
        envelope = {
            "schema": SCHEMA,
            "ok": False,
            "error": {"code": err.exit_code.name.lower(), "message": str(err)},
        }
        sys.stdout.write(json.dumps(envelope, sort_keys=True) + "\n")
    else:
        sys.stderr.write(f"error: {err}\n")


def main(argv: Sequence[str] | None = None) -> int:
    """Entry point registered in pyproject [project.scripts]."""
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        payload = args.func(args)
    except CliError as err:
        _emit_error(err, as_json=args.json)
        return int(err.exit_code)
    except KeyboardInterrupt:
        sys.stderr.write("interrupted\n")
        return int(ExitCode.INTERRUPTED)
    _emit(payload, as_json=args.json)
    return int(ExitCode.SUCCESS)


if __name__ == "__main__":
    sys.exit(main())
