// Auto-generated from prompt-templates/rubric.toml - DO NOT EDIT MANUALLY
const RUBRIC_DATA = {
  "schema": "promptscore-rubric-v1",
  "score_min": 300,
  "score_max": 850,
  "concrete_regex": "(?i)`[^`]+`|\\b[\\w./-]+\\.(?:py|md|ts|tsx|js|json|toml|yml|yaml|sh)\\b|\\bpytest\\b|\\b\\d+\\b(?!\\.)",
  "check_anchor_regex": "(?i)`[^`]+`|\\bpytest\\b|\\bexit(?:\\s+status|\\s+code)?\\b|\\bexits?\\s+\\d+\\b",
  "multi_part_regex": "(?m)^\\s*\\d+[\\.\\)]\\s+\\S",
  "multi_part_min": 2,
  "destructive_regex": "(?i)\\b(delete|deploy|production|migrate|credentials?|secrets?)\\b|\\bdrop\\s+(?:the\\s+)?(?:table|database|column)\\b",
  "scale_note": "The score runs from 300 to 850, the same numeric width as a consumer credit score. 300 means the text still does not say what must be true when the work is finished. Points above 300 are the share of this rubric the prompt satisfies. 850 means every applicable characteristic is fully present, including a concrete check. A useful rewrite usually lands in the high 600s or 700s. Ceremony added to chase 850 makes a worse prompt.",
  "limit_note": "This grade measures prompt structure. It is silent on whether a model will answer well. It looks for an outcome, an observable finish line, boundaries, an output shape, named inputs, a request to report the check, stop conditions on hard-to-undo work, and per-step checks only when the prompt asks for several deliverables.",
  "no_gap_note": "Every scored characteristic is past the rewrite threshold ({threshold}). The table still shows partial credit. Adding sections to chase the remainder is optional.",
  "standing_tips": [
    "Name one check a person can run. That moves the score more than extra adjectives.",
    "Keep the original ask. Add the missing finish line and boundary beside it.",
    "Stop once the prompt is hard to misread. A 740 you can execute beats an 850 stuffed with process."
  ],
  "adjustments": {
    "min_words": 8,
    "short_factor": 0.8,
    "vague_factor": 0.85,
    "insert_below": 0.6,
    "max_inserts": 4,
    "anchor_before": 80,
    "anchor_after": 180,
    "extras_ignore_cap": true,
    "vague_terms": [
      "better",
      "best",
      "professional",
      "nice",
      "robust",
      "optimal"
    ]
  },
  "band": [
    {
      "id": "developing",
      "title": "Developing",
      "min_score": 300,
      "max_score": 499,
      "summary": "The request is easy to misread. A finished answer can still be the wrong job."
    },
    {
      "id": "usable",
      "title": "Usable",
      "min_score": 500,
      "max_score": 649,
      "summary": "The outcome is visible, and a model can still miss the check or the boundary."
    },
    {
      "id": "strong",
      "title": "Strong",
      "min_score": 650,
      "max_score": 749,
      "summary": "Outcome, boundary, and shape are mostly in place. Remaining gaps are specific."
    },
    {
      "id": "disciplined",
      "title": "Disciplined",
      "min_score": 750,
      "max_score": 819,
      "summary": "A reviewer can tell what done means without guessing the author's intent."
    },
    {
      "id": "exceptional",
      "title": "Exceptional",
      "min_score": 820,
      "max_score": 850,
      "summary": "The critical characteristics are concrete, including a check a person can run. This band is rare, and it is not the goal of a rewrite."
    }
  ],
  "dimension": [
    {
      "id": "outcome",
      "title": "Named outcome",
      "weight": 16,
      "critical": true,
      "mode": "signals",
      "explanation": "A reader can tell what the finished work is: a fix, a draft, a change, or another named artifact.",
      "tip": "Name the artifact or the change in the first sentence, and name a file or screen when you have one.",
      "missing": "The prompt does not say what to produce or change.",
      "one_hit": 0.45,
      "one_hit_with_anchor": 0.85,
      "full_hits": 2,
      "signals": [
        {
          "label": "action verb",
          "regex": "(?i)\\b(fix|implement|add|update|write|build|create|remove|rename|explain|draft|produce|make|delete|deploy)\\b"
        },
        {
          "label": "outcome label",
          "regex": "(?i)\\b(goal|outcome|task)\\s*:"
        }
      ]
    },
    {
      "id": "done_when",
      "title": "Observable finish line",
      "weight": 18,
      "critical": true,
      "mode": "done_when",
      "explanation": "Done means a check someone can settle, not a compliment the work should deserve.",
      "tip": "Add a finish line a person can settle, with the command or inspection that decides it.",
      "missing": "There is no observable finish line.",
      "partial_fulfillment": 0.55,
      "signals": [
        {
          "label": "finish line",
          "regex": "(?i)\\bdone when\\b"
        },
        {
          "label": "acceptance criteria",
          "regex": "(?i)\\bacceptance criteria\\b"
        },
        {
          "label": "complete when",
          "regex": "(?i)\\bcomplete when\\b"
        }
      ]
    },
    {
      "id": "constraints",
      "title": "Boundaries",
      "weight": 14,
      "critical": true,
      "mode": "signals",
      "explanation": "Boundaries keep the work inside the request and name what must stay untouched.",
      "tip": "State what must stay untouched, in one or two sentences.",
      "missing": "Nothing says what is out of bounds.",
      "one_hit": 0.7,
      "one_hit_with_anchor": 0.7,
      "full_hits": 2,
      "signals": [
        {
          "label": "boundary heading",
          "regex": "(?i)(?:^|\\n)\\s*constraints?\\s*:"
        },
        {
          "label": "prohibition",
          "regex": "(?i)\\b(?:do not|don't|must not)\\b"
        },
        {
          "label": "scope label",
          "regex": "(?i)\\b(?:non-goals?|out of scope)\\b"
        }
      ]
    },
    {
      "id": "output_contract",
      "title": "Output shape",
      "weight": 14,
      "critical": true,
      "mode": "signals",
      "explanation": "An output shape is the list of things the answer must include, in reading order.",
      "tip": "Say what the answer should contain, in reading order.",
      "missing": "The prompt does not say what shape the answer should take.",
      "one_hit": 0.7,
      "one_hit_with_anchor": 0.9,
      "full_hits": 2,
      "signals": [
        {
          "label": "output heading",
          "regex": "(?i)(?:^|\\n)\\s*output\\s*:"
        },
        {
          "label": "answer contents",
          "regex": "(?i)\\b(?:lead with|name the artifact)\\b|\\breturn\\b.{0,60}\\b(?:explanation|summary|diff|list|report)\\b"
        }
      ]
    },
    {
      "id": "inputs_context",
      "title": "Named inputs",
      "weight": 10,
      "critical": false,
      "mode": "signals",
      "explanation": "Named inputs say what the work may rely on.",
      "tip": "Name the files, samples, or facts the work depends on.",
      "missing": "The prompt does not point at the context to use.",
      "one_hit": 0.7,
      "one_hit_with_anchor": 0.85,
      "full_hits": 2,
      "signals": [
        {
          "label": "inputs heading",
          "regex": "(?i)(?:^|\\n)\\s*inputs\\s*:"
        },
        {
          "label": "named path",
          "regex": "\\b[\\w./-]+\\.(?:py|md|ts|tsx|js|json|toml|yml|yaml|sh)\\b"
        },
        {
          "label": "named context",
          "regex": "(?i)\\bfiles it names\\b"
        }
      ]
    },
    {
      "id": "verification",
      "title": "Reported check",
      "weight": 14,
      "critical": false,
      "mode": "signals",
      "explanation": "Verification asks the answer to report the check that was actually run.",
      "tip": "Ask for the check that was run, and for an honest first sentence if it was not run.",
      "missing": "The prompt does not ask for the check that was actually run.",
      "one_hit": 0.7,
      "one_hit_with_anchor": 0.9,
      "full_hits": 2,
      "signals": [
        {
          "label": "verify heading",
          "regex": "(?i)(?:^|\\n)\\s*verify\\s*:"
        },
        {
          "label": "rerun",
          "regex": "(?i)\\b(?:re-run|rerun)\\b"
        },
        {
          "label": "exit evidence",
          "regex": "(?i)\\bexit(?:\\s+status|\\s+code)\\b"
        }
      ]
    },
    {
      "id": "risk_boundary",
      "title": "Stop conditions",
      "weight": 8,
      "critical": false,
      "mode": "signals",
      "applies": "destructive",
      "explanation": "Stop conditions belong on work that is hard to undo. Ordinary edits can omit them.",
      "tip": "If the work can delete, deploy, or touch secrets, say to stop and ask first.",
      "missing": "Destructive work has no stop line.",
      "one_hit": 0.8,
      "one_hit_with_anchor": 0.9,
      "full_hits": 2,
      "signals": [
        {
          "label": "stop and ask",
          "regex": "(?i)\\bstop and ask\\b"
        },
        {
          "label": "do not guess",
          "regex": "(?i)\\bdo not guess\\b"
        },
        {
          "label": "rollback",
          "regex": "(?i)\\b(?:rollback|irreversible)\\b"
        }
      ]
    },
    {
      "id": "decomposition",
      "title": "Step checks",
      "weight": 6,
      "critical": false,
      "mode": "plan",
      "explanation": "Per-step checks are scored only when the prompt numbers more than one deliverable.",
      "tip": "Add a pass/fail check to each numbered request, or cut the requests that are outside the outcome.",
      "missing": "Several numbered requests have no per-step check.",
      "check_regex": "(?i)\\b(?:done when|pass/fail|check:)\\b"
    }
  ],
  "insert": [
    {
      "dimension": "outcome",
      "when": "absent",
      "body": "Outcome:\nName the artifact and the change. The current text does not say what to produce.\n"
    },
    {
      "dimension": "done_when",
      "when": "absent",
      "body": "Done when: For \"{focus}\", name the artifact and the check that shows it is finished.\n"
    },
    {
      "dimension": "constraints",
      "when": "gap",
      "body": "Constraints:\n- Stay inside this request.\n- Do not invent files, causes, or results you have not checked.\n"
    },
    {
      "dimension": "output_contract",
      "when": "gap",
      "body": "Output:\n- Lead with the result.\n- Name the artifact this request asked for.\n- Leave out work this request did not ask for.\n"
    },
    {
      "dimension": "inputs_context",
      "when": "gap",
      "body": "Inputs:\n- Use the context in this request and the files it names.\n- If a needed fact is missing, name that fact instead of guessing.\n"
    },
    {
      "dimension": "verification",
      "when": "gap",
      "body": "Verify:\n- Re-run the check this request names.\n- If you could not run it, say that in the first sentence and name what is missing.\n"
    },
    {
      "dimension": "risk_boundary",
      "when": "destructive",
      "body": "Stop conditions:\n- If a step would delete data, deploy, rotate credentials, or spend money, stop and ask.\n- Do not guess past a premise you have not checked.\n"
    },
    {
      "dimension": "decomposition",
      "when": "gap",
      "generated": "plan"
    }
  ]
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { RUBRIC_DATA };
} else {
  window.RUBRIC_DATA = RUBRIC_DATA;
}
