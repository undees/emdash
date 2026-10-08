import pytest
import subprocess
import time
import signal
import queue
import threading


def _pump_lines(stream, line_queue):
    for line in iter(stream.readline, ""):
        line_queue.put(line)
    stream.close()


@pytest.fixture(scope="session")
def _server():
    proc = subprocess.Popen(
        ["bun", "serve.js"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )

    # Read stdout on a background thread so a hung or silent process can't
    # block us on a readline() call; we just poll the queue with a timeout.
    lines = queue.Queue()
    reader = threading.Thread(target=_pump_lines, args=(proc.stdout, lines), daemon=True)
    reader.start()

    started = False
    deadline = time.monotonic() + 5
    while time.monotonic() < deadline:
        if proc.poll() is not None:
            break
        try:
            line = lines.get(timeout=0.1)
        except queue.Empty:
            continue
        if "Serving on" in line:
            started = True
            break

    if not started:
        if proc.poll() is None:
            proc.terminate()
            try:
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                proc.kill()
                proc.wait(timeout=5)
        stderr = proc.stderr.read() if proc.stderr else ""
        pytest.fail(
            "bun serve.js did not report it was serving on :3000 within 5s "
            "(port already in use by another process?).\n"
            f"stderr:\n{stderr}"
        )

    yield proc

    proc.send_signal(signal.SIGTERM)
    proc.wait(timeout=5)


@pytest.fixture(scope="session")
def browser_context_args(_server):
    return {}


@pytest.fixture(scope="session")
def base_url(_server):
    return "http://localhost:3000"
