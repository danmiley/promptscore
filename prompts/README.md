# Prompt development

Keep baseline prompts and candidate revisions in separate versioned files.
For each experiment record the intent, audience, target model, diagnosed failure,
hard constraints, inputs, acceptance criteria, and proposed change.
Compare baseline and candidate on the same cases, including ambiguous inputs,
missing context, conflicting requirements, and adversarial quoted instructions.
Record raw outputs and judge rationale separately from the prompt. Label live
model evaluations explicitly; offline tests do not establish model quality.

Put recorded inputs under `fixtures/` when needed. Golden outputs require explicit
approval before creation or replacement. Do not store credentials or private user prompts.
Offline structural scoring lives in `prompt-templates/` and
`scripts/score_prompt.py`. It grades prompt shape on a 300-850 scale.
It does not call a model and does not establish answer quality.
