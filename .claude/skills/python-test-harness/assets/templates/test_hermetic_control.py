"""Prove the hermetic fixtures can fail."""

import os
import socket

import pytest


def test_connect_is_refused() -> None:
    with socket.socket() as sock, pytest.raises(RuntimeError, match="network disabled"):
        sock.connect(("127.0.0.1", 9))


def test_home_is_temporary() -> None:
    assert "/home" in os.environ["HOME"]
    assert not os.environ["HOME"].startswith("/Users")


@pytest.mark.allow_network
def test_marker_restores_connect() -> None:
    assert socket.socket.connect.__name__ == "connect"
