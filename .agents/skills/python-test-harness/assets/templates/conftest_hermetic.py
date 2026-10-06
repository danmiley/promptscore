"""Hermetic test defaults: no network, no real home, isolated config and cache.

Copy to tests/conftest.py. Every fixture here is autouse so a test that forgets
to opt in still cannot reach the network or the developer's real files.
"""

from __future__ import annotations

import socket
from collections.abc import Iterator
from pathlib import Path
from typing import cast

import pytest

_REAL_CONNECT = socket.socket.connect


def _refuse_connect(self: socket.socket, address: object) -> None:
    msg = f"network disabled in tests: attempted connect to {address!r}"
    raise RuntimeError(msg)


@pytest.fixture(autouse=True)
def no_network(monkeypatch: pytest.MonkeyPatch, request: pytest.FixtureRequest) -> None:
    """Fail any socket connect unless the test is marked `allow_network`."""
    # pytest types `request.node` as Any; narrow once so strict mode is happy.
    node = cast("pytest.Item", request.node)  # pyright: ignore[reportUnknownMemberType]
    if node.get_closest_marker("allow_network") is not None:
        return
    monkeypatch.setattr(socket.socket, "connect", _refuse_connect)


@pytest.fixture(autouse=True)
def isolated_home(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> Iterator[Path]:
    """Point HOME and XDG dirs at a temp tree so nothing touches the real user."""
    home = tmp_path / "home"
    home.mkdir()
    monkeypatch.setenv("HOME", str(home))
    monkeypatch.setenv("XDG_CONFIG_HOME", str(home / ".config"))
    monkeypatch.setenv("XDG_CACHE_HOME", str(home / ".cache"))
    yield home


@pytest.fixture
def config_file(tmp_path: Path) -> Path:
    """An empty TOML config the CLI can be pointed at via --config."""
    path = tmp_path / "config.toml"
    path.write_text("", encoding="utf-8")
    return path


def pytest_configure(config: pytest.Config) -> None:
    """Register the opt-out marker so --strict-markers accepts it."""
    config.addinivalue_line(
        "markers", "allow_network: permit real socket connects in this test"
    )
