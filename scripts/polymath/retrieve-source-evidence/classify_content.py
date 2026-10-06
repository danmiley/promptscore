#!/usr/bin/env python3
"""Classify a fetched document as content or one of the non-content classes.

A 200 is not content. This is the reusable core of the retrieve-source-evidence
skill: it decides whether a response counts as coverage, and which ladder rung
to try when it does not.

Pure standard library. No network. Reads files or stdin.

Usage:
    classify_content.py PAGE.html [--homepage HOME.html] [--status 200]
    classify_content.py --selftest

**Pass --status.** It is the most reliable signal available and the easiest to
drop, because a throttled or blocked body looks like an ordinary thin page.
Omitting it is treated as UNKNOWN, never as 200: any verdict that would send
you further up the ladder comes back carrying `review_required:
["unknown-status"]`, because a 402/403/429 would have stopped you instead.

Output is one JSON object on stdout:
    {"content_class": "shell", "unique_text_chars": 19, "next_rung": "L3",
     "signals": [...], "total_text_chars": 4213}

Exit codes:
    0  classified as content
    1  classified as non-content (any other class)
    2  usage or input error
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

# Host-configurable. Calibrate against two or three known-good pages on the same
# site before trusting it: template weight varies enormously between a minimal
# static site and a CMS shipping a 60 KB mega-menu on every page.
DEFAULT_SHELL_THRESHOLD = 400

SKIP_TAGS = {"script", "style", "noscript", "template", "svg"}

NEXT_RUNG = {
    "content": None,
    "shell": "L3",
    "soft-404": "L1",
    "consent-wall": "L2",
    "bot-wall": "STOP",
    "paywall-or-login": "STOP",
    "payment-required": "STOP",
    "paginated-stub": "L3",
}

SOFT_404_PAT = re.compile(
    r"\b(page not found|not found|no results|nothing found|"
    r"could ?n[o']?t find|can ?n[o']?t find|unable to find|no longer available|"
    r"doesn'?t exist|does not exist|404 error)\b",
    re.I,
)
CONSENT_PAT = re.compile(
    r"\b(cookie|consent|gdpr|privacy preferences|accept all|"
    r"age verification|confirm your age|are you over)\b",
    re.I,
)
BOT_PAT = re.compile(
    r"\b(are you a robot|it looks like you'?re a robot|not accessible to robots|"
    r"enable javascript to continue|checking your browser|"
    r"unusual traffic|access denied|cloudflare|captcha|verify you are human)\b",
    re.I,
)
LOGIN_PAT = re.compile(
    r"\b(sign in|log in|login|password|subscribe to continue|"
    r"members only|create an account)\b",
    re.I,
)
# "showing 1-20 of 480", "1 – 20 of 480", "20 of 480 results"
PAGINATION_PAT = re.compile(
    r"\b(?:showing\s+)?(\d[\d,]*)\s*(?:[-–—]|to)\s*(\d[\d,]*)\s+of\s+(\d[\d,]*)",
    re.I,
)
EMPTY_ROOT_PAT = re.compile(
    r"<div[^>]+id=[\"']?(root|app|__next)[\"']?[^>]*>\s*</div>", re.I
)


class _TextExtractor(HTMLParser):
    """Collect visible text and note structural signals."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.chunks: list[str] = []
        self._skip_depth = 0
        self.form_fields = 0
        self.password_fields = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in SKIP_TAGS:
            self._skip_depth += 1
        if tag == "input":
            self.form_fields += 1
            for key, value in attrs:
                if key == "type" and (value or "").lower() == "password":
                    self.password_fields += 1

    @property
    def has_password_field(self) -> bool:
        return self.password_fields > 0

    def handle_endtag(self, tag: str) -> None:
        if tag in SKIP_TAGS and self._skip_depth > 0:
            self._skip_depth -= 1

    def handle_data(self, data: str) -> None:
        if self._skip_depth == 0:
            text = data.strip()
            if text:
                self.chunks.append(text)


def extract_lines(html: str) -> tuple[list[str], _TextExtractor]:
    parser = _TextExtractor()
    # Malformed markup is the norm, not the exception; never let it abort.
    parser.feed(html)
    parser.close()
    return parser.chunks, parser


def unique_text(page_lines: list[str], homepage_lines: list[str]) -> str:
    """Subtract the homepage.

    Nav, header and footer repeat verbatim across pages. Any line that also
    appears on the homepage is chrome; what remains is the page's real content.
    """
    chrome = {line.strip() for line in homepage_lines}
    return " ".join(line for line in page_lines if line.strip() not in chrome)


def classify(
    html: str,
    homepage_html: str | None = None,
    status: int | None = None,
    threshold: int = DEFAULT_SHELL_THRESHOLD,
) -> dict:
    # `status=None` means UNKNOWN, and unknown is not 200 (FR-008). This used
    # to default to 200, so a caller classifying a saved file without passing
    # the response code got a fabricated fact: a throttled 429 body came back
    # `shell`, whose next rung is L3 — sending the agent to endpoint-mine a
    # host that had just asked it to back off. Status is the single most
    # reliable signal here and it is the one most easily dropped on the floor,
    # because the body alone looks the same either way.
    def _out(cls: str, *args, **kwargs) -> dict:
        res = _result(cls, *args, **kwargs)
        # Flag only where a status code would have changed the *move*. A
        # verdict that already says STOP, or one that says stop climbing, does
        # not become safer by knowing the code; a verdict that sends the agent
        # up the ladder does. Passing the status suppresses this.
        if status is None and res["next_rung"] in ("L1", "L2", "L3"):
            res["review_required"] = sorted(
                set(res.get("review_required", []) + ["unknown-status"])
            )
        return res

    page_lines, parsed = extract_lines(html)
    home_lines, home_parsed = extract_lines(homepage_html) if homepage_html else ([], None)

    # Structural signals need provenance subtraction exactly as text does
    # (FR-001). A login form in the site template is chrome on every page,
    # including the pages with no wall at all — so a boolean "has a password
    # field" says nothing about *this* page. Count the excess over the
    # template instead: a page carrying more password inputs than the
    # homepage has a page-level form, which is evidence of a barrier.
    #
    # Subtracting the boolean outright would be the wrong fix in the other
    # direction: a genuine member-only page would then fall through to
    # `shell` and send an agent to endpoint-mine a page it should refuse.
    template_password_fields = home_parsed.password_fields if home_parsed else 0
    excess_password_fields = parsed.password_fields - template_password_fields

    total_text = " ".join(page_lines)
    unique = unique_text(page_lines, home_lines)
    n_unique = len(unique)
    signals: list[str] = []
    if status is None:
        signals.append("status-not-supplied")

    # A page ABOUT 404s, bot walls, or cookies is not one. Language patterns are
    # evidence of a barrier only on a page too thin to be about anything else;
    # above this ceiling a match cannot decide the class (AUD-001).
    #
    # This ceiling is a KNOWN-IMPRECISE boundary in both directions, and the
    # imprecision is not tunable away — measured 2026-08-03, an article *about*
    # bot walls carries barrier vocabulary at ~16% density while a real verbose
    # bot-wall page carries it at ~8%. Density, word count, and match count all
    # fail to separate them. Above the ceiling the classifier therefore refuses
    # to guess: it returns the structural class and raises `review_required`,
    # naming what it suspects. A caller that ignores that flag is choosing to
    # miss verbose barrier pages that return HTTP 200.
    language_ceiling = threshold * 4
    thin = n_unique < language_ceiling
    review: list[str] = []

    def _defer(name: str, suspected: str) -> None:
        """A language match too ambiguous to decide — hand it to the caller."""
        signals.append(f"possible-{suspected}-needs-review({name}; {n_unique}>={language_ceiling})")
        review.append(suspected)

    # Order matters: policy barriers outrank emptiness, because a bot wall is
    # often also a shell and the two imply opposite next moves. Status-code
    # barriers are structural and are never gated on length.
    if status == 402:
        signals.append("http-402")
        return _out("payment-required", n_unique, len(total_text), signals)

    if status in (403, 429) and total_text:
        signals.append(f"http-{status}-with-body")
        return _out("bot-wall", n_unique, len(total_text), signals)
    if BOT_PAT.search(total_text):
        if thin:
            signals.append("bot-challenge-language")
            return _out("bot-wall", n_unique, len(total_text), signals)
        _defer("bot-challenge-language", "bot-wall")

    if excess_password_fields > 0 and thin:
        signals.append(
            f"password-field-and-little-content"
            f"(page {parsed.password_fields}, template {template_password_fields})"
        )
        return _out("paywall-or-login", n_unique, len(total_text), signals)
    # Deliberately NOT gated on the excess: this branch already carries
    # page-level evidence, because LOGIN_PAT is matched against the
    # chrome-subtracted text. A page whose own words say "members only" is a
    # wall even when the only form on it belongs to the template.
    if LOGIN_PAT.search(unique) and parsed.form_fields >= 2 and thin:
        signals.append("login-language-with-form")
        return _out("paywall-or-login", n_unique, len(total_text), signals)

    # A results page that reports "no results" for one filter while carrying a
    # pagination total is a paginated stub, not a soft-404. Structural evidence
    # (an explicit total) outranks incidental language.
    pagination = PAGINATION_PAT.search(unique)
    has_short_page = False
    if pagination:
        _hi = int(pagination.group(2).replace(",", ""))
        _total = int(pagination.group(3).replace(",", ""))
        has_short_page = _hi < _total

    if not has_short_page and (SOFT_404_PAT.search(unique) or SOFT_404_PAT.search(total_text)):
        if thin:
            signals.append("not-found-language-at-200" if status == 200 else "not-found-language")
            return _out("soft-404", n_unique, len(total_text), signals)
        _defer("not-found-language", "soft-404")

    if n_unique > 0 and CONSENT_PAT.search(unique) and thin:
        consent_hits = len(CONSENT_PAT.findall(unique))
        if consent_hits >= 2:
            signals.append(f"consent-language-dominant({consent_hits})")
            return _out("consent-wall", n_unique, len(total_text), signals)

    # An empty mount point beside server-rendered prose is a hydration stub, not
    # a shell. It is corroborating evidence for emptiness, never a verdict on its
    # own (AUD-002).
    empty_root = bool(EMPTY_ROOT_PAT.search(html))
    if n_unique < threshold:
        signals.append(f"unique-text-below-threshold({n_unique}<{threshold})")
        if empty_root:
            signals.append("empty-root-container")
        return _out("shell", n_unique, len(total_text), signals, review)
    if empty_root:
        signals.append(f"empty-root-container-but-content-present({n_unique}>={threshold})")

    # Truncation reads as success. Any table without an explicit total is
    # unverified; where a total IS present and the range does not cover it,
    # this is a coverage cliff regardless of how much content came back.
    if has_short_page and pagination:
        signals.append(f"paginated({pagination.group(0).strip()})")
        return _out("paginated-stub", n_unique, len(total_text), signals, review)

    return _out("content", n_unique, len(total_text), signals, review)


def _result(cls: str, n_unique: int, n_total: int, signals: list[str],
            review: list[str] | None = None) -> dict:
    out = {
        "content_class": cls,
        "unique_text_chars": n_unique,
        "total_text_chars": n_total,
        "next_rung": NEXT_RUNG[cls],
        "signals": signals,
    }
    if review:
        # The classifier declined to decide. A caller that records this page as
        # coverage without looking is accepting a known miss (see REM-001).
        out["review_required"] = sorted(set(review))
    return out


NAV = (
    "<nav><a href=/>Home</a><a href=/about>About</a><a href=/results>Results</a>"
    "<a href=/contact>Contact</a></nav><footer>(c) Example Org. All rights reserved."
    "</footer>"
)

# A site template carrying a member login in its header — chrome on every page,
# including the pages with no wall (FR-001).
NAV_WITH_LOGIN = (
    "<header><nav><a href=/>Home</a><a href=/results>Results</a></nav>"
    "<form action=/login><input type=text name=user>"
    "<input type=password name=pw><button>Sign in</button></form></header>"
    "<footer>(c) Example Org. All rights reserved.</footer>"
)


def selftest() -> int:
    """Prove the classifier can fail before trusting a pass."""
    homepage = f"<html><body>{NAV}<h1>Example Org</h1><p>Welcome to our site.</p></body></html>"
    prose = " ".join(["The organisation was founded in 1987 by three cyclists."] * 12)
    # Same site, but its template carries a member login in the header.
    login_home = (f"<html><body>{NAV_WITH_LOGIN}<h1>Example Org</h1>"
                  "<p>Welcome to our site.</p></body></html>")
    years = "".join(f"<option>{y}</option>" for y in range(2003, 2027))
    cases = [
        (
            "real content survives chrome subtraction",
            f"<html><body>{NAV}<h1>History</h1><p>{prose}</p></body></html>",
            homepage, 200, "content",
        ),
        (
            "shell: nav only, no unique text",
            f"<html><body>{NAV}<div id=\"root\"></div></body></html>",
            homepage, 200, "shell",
        ),
        (
            "shell: below threshold even without empty root",
            f"<html><body>{NAV}<p>Results</p></body></html>",
            homepage, 200, "shell",
        ),
        (
            "soft-404 at HTTP 200",
            f"<html><body>{NAV}<h1>Page not found</h1><p>{prose}</p></body></html>",
            homepage, 200, "soft-404",
        ),
        (
            "bot wall beats emptiness",
            f"<html><body>{NAV}<p>It looks like you're a robot, archived maps are "
            f"not accessible to Robots.</p></body></html>",
            homepage, 200, "bot-wall",
        ),
        (
            "login wall with password field",
            f"<html><body>{NAV}<form><input type=text><input type=password></form>"
            f"<p>Sign in to continue</p></body></html>",
            homepage, 200, "paywall-or-login",
        ),
        (
            "http 402 is a policy barrier",
            f"<html><body>{NAV}<p>{prose}</p></body></html>",
            homepage, 402, "payment-required",
        ),
        (
            "paginated stub is not full coverage",
            f"<html><body>{NAV}<h1>Results</h1><p>Showing 1-20 of 480</p>"
            f"<p>{prose}</p></body></html>",
            homepage, 200, "paginated-stub",
        ),
        (
            "unquoted attributes must not break extraction",
            f"<html><body><nav><a href=/results>Results</a></nav><h1>History</h1>"
            f"<p>{prose}</p></body></html>",
            None, 200, "content",
        ),
        (
            "script and style text is not content",
            "<html><body><script>var x='" + "y" * 5000 + "';</script>"
            "<style>.a{color:red}</style><p>Hi</p></body></html>",
            None, 200, "shell",
        ),
        # Adversarial cases from the 2026-08-03 independent audit (AUD-001/002).
        # A page ABOUT a barrier is not that barrier.
        (
            "AUD-001: long article about designing 404 pages is content",
            f"<html><body>{NAV}<h1>Designing 404 pages</h1><p>"
            + ("When a visitor requests a URL that does not exist the server should "
               "return a 404 status. Many sites instead return 200 with a page that "
               "says not found, which is the soft 404 antipattern search engines "
               "penalise. A well designed page not found experience offers "
               "navigation, a search box, and a link home. ") * 6
            + "</p></body></html>",
            homepage, 200, "content",
        ),
        (
            "AUD-001: long article about bot walls is content",
            f"<html><body>{NAV}<h1>How bot walls work</h1><p>"
            + ("Bot detection has changed. Providers now present a captcha or an "
               "interstitial saying checking your browser before access is granted. "
               "Operators should understand that a challenge page returns 403 with "
               "an HTML body. Verify you are human prompts frustrate legitimate "
               "users and are increasingly common. ") * 7
            + "</p></body></html>",
            homepage, 200, "content",
        ),
        (
            "AUD-002: real prose beside an empty mount point is content",
            f"<html><body>{NAV}<h1>History</h1><p>{prose}</p>"
            f'<div id="root"></div></body></html>',
            homepage, 200, "content",
        ),
        (
            "AUD-002: empty mount point WITH thin text is still a shell",
            f'<html><body>{NAV}<p>Results</p><div id="root"></div></body></html>',
            homepage, 200, "shell",
        ),
        (
            "status-code barrier is structural, not length-gated",
            f"<html><body>{NAV}<h1>History</h1><p>{prose}</p></body></html>",
            homepage, 403, "bot-wall",
        ),
        # REM-001: found during remediation of the follow-up audit. A verbose
        # barrier page at HTTP 200 cannot be told from an article about barriers
        # by any measured signal, so the classifier defers instead of guessing.
        (
            "REM-001: verbose bot wall at 200 defers rather than claiming content",
            f"<html><body>{NAV}<h1>One moment</h1><p>"
            + ("Checking your browser before accessing the site. This process is "
               "automatic. Your browser will redirect shortly. Please enable "
               "JavaScript and cookies to continue. We use a security service to "
               "protect against online attacks. ") * 8
            + "</p></body></html>",
            homepage, 200, "content",
        ),
        (
            "REM-001: 'could not find' now recognised as not-found language",
            f"<html><body>{NAV}<h1>Sorry</h1>"
            "<p>We could not find the page you were looking for.</p></body></html>",
            homepage, 200, "soft-404",
        ),
        # FR-001: found by a consumer field report. Structural signals were
        # compared against the page alone while text was chrome-subtracted, so
        # a login form in the site template wrote off every thin page on the
        # host as `refused` — the one outcome the contract treats as terminal.
        # All four directions are asserted: removing the false positives must
        # not cost the true ones.
        (
            "FR-001: template login form is chrome, not a barrier",
            f"<html><body>{NAV_WITH_LOGIN}<h1>Past results</h1>"
            f"<select>{years}</select><div id=\"results\"></div></body></html>",
            login_home, 200, "shell",
        ),
        (
            "FR-001: ordinary short page survives a template login form",
            f"<html><body>{NAV_WITH_LOGIN}<h1>History</h1><p>{prose}</p></body></html>",
            login_home, 200, "content",
        ),
        (
            "FR-001: a password field beyond the template is still a wall",
            f"<html><body>{NAV_WITH_LOGIN}<h1>2019 Stage Results</h1>"
            "<p>Reserved for supporters of the series.</p>"
            "<form><input type=text name=u><input type=password name=p></form>"
            "</body></html>",
            login_home, 200, "paywall-or-login",
        ),
        (
            "FR-001: 'members only' in the page's own words is still a wall",
            f"<html><body>{NAV_WITH_LOGIN}<h1>2019 Stage Results</h1>"
            "<p>This content is available to members only. Sign in to view "
            "the full results.</p></body></html>",
            login_home, 200, "paywall-or-login",
        ),
        (
            "REM-001: pagination total outranks incidental 'no results'",
            f"<html><body>{NAV}<h1>Results</h1><p>No results for that filter. "
            f"Showing 1-20 of 480 for all entrants.</p>"
            f"<p>{'Entrant row data here. ' * 40}</p></body></html>",
            homepage, 200, "paginated-stub",
        ),
    ]

    failures = 0
    for name, page, home, status, expected in cases:
        got = classify(page, home, status=status)["content_class"]
        ok = got == expected
        if not ok:
            failures += 1
        print(f"{'PASS' if ok else 'FAIL'}: {name} (expected {expected}, got {got})")

    # REM-001: deferral must be visible to the caller, not buried in signals.
    verbose_bot = (f"<html><body>{NAV}<h1>One moment</h1><p>"
        + ("Checking your browser before accessing the site. This process is "
           "automatic. Your browser will redirect shortly. Please enable "
           "JavaScript and cookies to continue. We use a security service to "
           "protect against online attacks. ") * 8 + "</p></body></html>")
    r = classify(verbose_bot, homepage)
    if r.get("review_required") == ["bot-wall"]:
        print("PASS: deferred class is surfaced as review_required")
    else:
        print(f"FAIL: expected review_required=['bot-wall'], got {r.get('review_required')!r}")
        failures += 1
    clean = classify(f"<html><body>{NAV}<h1>History</h1><p>{prose}</p></body></html>", homepage)
    if "review_required" not in clean:
        print("PASS: ordinary content carries no review_required")
    else:
        print(f"FAIL: clean content raised review_required={clean['review_required']!r}")
        failures += 1

    # FR-008: an omitted HTTP status used to be silently assumed 200. Field
    # evidence — a corpus audit fetched a rate-limited results page, got HTTP
    # 429, classified the saved body without the code, and was told `shell`,
    # whose next rung is L3. That routes an agent to endpoint-mine a host that
    # has just asked it to back off, violating this skill's own politeness
    # rule. The body is identical in both cases; only the code separates them.
    throttled = (f"<html><body>{NAV}<h1>Too many requests</h1>"
                 "<p>You have made too many requests in a short period. Please "
                 "wait a moment and try again shortly.</p></body></html>")

    r = classify(throttled, homepage)  # status omitted
    if r["content_class"] == "shell" and r.get("review_required") == ["unknown-status"]:
        print("PASS: omitted status flags a climb verdict for review")
    else:
        print(f"FAIL: omitted status — got {r['content_class']}, "
              f"review_required={r.get('review_required')!r}")
        failures += 1

    r = classify(throttled, homepage, status=429)
    if r["content_class"] == "bot-wall" and r["next_rung"] == "STOP":
        print("PASS: a supplied 429 is decided structurally and stops the climb")
    else:
        print(f"FAIL: 429 — got {r['content_class']}, next_rung={r['next_rung']!r}")
        failures += 1

    r = classify(throttled, homepage, status=200)
    if "review_required" not in r:
        print("PASS: an explicit 200 carries no unknown-status flag")
    else:
        print(f"FAIL: explicit 200 raised review_required={r['review_required']!r}")
        failures += 1

    # Negative control: the classifier must be capable of disagreeing with
    # itself when the input changes. A test suite that only ever sees one
    # verdict proves nothing.
    a = classify(f"<html><body>{NAV}<div id=\"app\"></div></body></html>", homepage)
    b = classify(f"<html><body>{NAV}<p>{prose}</p></body></html>", homepage)
    if a["content_class"] == b["content_class"]:
        print("FAIL: negative control — classifier returned the same class for a shell and a real page")
        failures += 1
    else:
        print("PASS: negative control — shell and content are distinguished")

    print(f"\n{len(cases) + 6} checks, {failures} failure(s)")
    return 1 if failures else 0


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("page", nargs="?", help="fetched document; '-' or omitted reads stdin")
    ap.add_argument("--homepage", help="the site's homepage, for chrome subtraction")
    ap.add_argument("--status", type=int, default=None,
                    help="HTTP status of the response. Omitting it means UNKNOWN, "
                         "not 200, and flags any climb verdict for review.")
    ap.add_argument("--threshold", type=int, default=DEFAULT_SHELL_THRESHOLD)
    ap.add_argument("--selftest", action="store_true", help="run built-in checks and exit")
    args = ap.parse_args(argv)

    if args.selftest:
        return selftest()

    try:
        if args.page and args.page != "-":
            html = Path(args.page).read_text(encoding="utf-8", errors="strict")
        else:
            html = sys.stdin.read()
    except UnicodeDecodeError as exc:
        # Never silently replace: a declared-charset lie is evidence, and
        # errors="replace" destroys it. Report and let the caller re-decode.
        print(
            json.dumps({"error": "decode-failed", "detail": str(exc),
                        "hint": "retry with cp1252 or latin-1 and record encoding_used"}),
            file=sys.stderr,
        )
        return 2
    except OSError as exc:
        print(json.dumps({"error": "read-failed", "detail": str(exc)}), file=sys.stderr)
        return 2

    homepage = None
    if args.homepage:
        homepage = Path(args.homepage).read_text(encoding="utf-8", errors="ignore")

    result = classify(html, homepage, status=args.status, threshold=args.threshold)
    print(json.dumps(result, indent=2))
    return 0 if result["content_class"] == "content" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
