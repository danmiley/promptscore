# Concurrency and Async

- **CONC-1** *(Skill)* Default to no concurrency. A CPU-bound pipeline stage
  is a plain function; parallelism is a measured decision (review lane
  section 5) added at the call site, not inside the function.
- **CONC-2** *(Skill)* One model per module: `asyncio` for I/O-bound fan-out,
  `concurrent.futures.ThreadPoolExecutor` for blocking I/O or C-backed calls
  that release the GIL, `ProcessPoolExecutor` for CPU-bound Python. Mixing
  models in one call path is gated.
- **CONC-3** *(Skill; ruff `ASYNC`)* Inside a coroutine, no blocking call:
  no `time.sleep`, no synchronous file or network I/O, no
  `subprocess.run`. Use the async equivalent or `asyncio.to_thread`.
- **CONC-4** *(Skill)* Every `asyncio.create_task` result is kept in a named
  collection or a `TaskGroup`; a detached task is a leaked exception. Prefer
  `asyncio.TaskGroup` (3.11+) so failures propagate.
- **CONC-5** *(Skill)* No lock held across `await`. Hold the lock, copy what
  you need, release, then await. `asyncio.Lock` for coroutine-shared state,
  `threading.Lock` for thread-shared state; never both around the same
  state.
- **CONC-6** *(Skill)* Shared mutable state between threads goes through a
  `queue.Queue` or is guarded by one lock that a comment names as the owner.
  A global mutated from a worker thread without a lock is a defect even if
  the GIL happens to make it work today.
- **CONC-7** *(Skill)* Cancellation and timeouts are explicit at the caller
  (`asyncio.timeout`, `wait_for`, executor `timeout=`) and the callee
  cleans up in `finally`. `CancelledError` is re-raised, never swallowed.
- **CONC-8** *(Skill)* Process pools receive picklable, immutable inputs and
  return picklable results; they never share a module-level cache with the
  parent. Workers are named by what they do, and the chunk size is a stated
  number with the measurement that chose it.
- **CONC-9** *(Skill)* `multiprocessing` start method is set explicitly
  (`spawn` on macOS is the default; say so) and the entry point is guarded
  by `if __name__ == "__main__":`.
- **CONC-10** *(Skill)* Hand-written protocols, transports, event loops,
  and `threading` primitives beyond `Lock`, `Event`, and `Queue` are gated.
