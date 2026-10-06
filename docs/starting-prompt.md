# Starting Prompt

## Product Intent
Build a Chrome extension for prompt development and assessment.

## Current Objective
Define the user workflow and observable scoring criteria, then choose the
extension architecture and implement a first vertical slice.

An offline structural grader prototype is `scripts/score_prompt.py`.
It grades prompt files on disk. The Chrome extension is still unbuilt.

## Non-Goals
The grader stays offline. It does not call an LLM provider.
Do not assume a provider, backend, permissions, or UI framework from this scaffold.
