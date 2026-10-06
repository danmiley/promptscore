/**
 * PromptScore Deterministic Client-Side Grader
 * Ported with exact parity from src/promptscore/grading.py & rubric.py
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PromptScoreGrader = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const MAX_FOCUS_CHARS = 160;
  const HALF = 0.5;
  const WORD_RE = /[A-Za-z0-9']+/g;
  const LIST_MARK_RE = /^(?:\d+[.)]\s+|[-*]\s+)/;
  const SPACE_RE = /\s+/g;
  const BLANK_LINE_SPLIT_RE = /\n\s*\n/;

  function compileRegex(rawPattern) {
    let pattern = rawPattern;
    let flags = '';
    
    // Convert python (?i) and (?m) inline flags to JS flags
    if (pattern.startsWith('(?i)')) {
      flags += 'i';
      pattern = pattern.slice(4);
    } else if (pattern.startsWith('(?m)')) {
      flags += 'm';
      pattern = pattern.slice(4);
    } else if (pattern.startsWith('(?im)') || pattern.startsWith('(?mi)')) {
      flags += 'im';
      pattern = pattern.slice(5);
    }
    
    return new RegExp(pattern, flags);
  }

  function compileRubric(raw) {
    return {
      schema: raw.schema,
      score_min: raw.score_min,
      score_max: raw.score_max,
      concrete: compileRegex(raw.concrete_regex),
      check_anchor: compileRegex(raw.check_anchor_regex),
      multi_part: compileRegex(raw.multi_part_regex),
      multi_part_min: raw.multi_part_min,
      destructive: compileRegex(raw.destructive_regex),
      scale_note: raw.scale_note,
      limit_note: raw.limit_note,
      no_gap_note: raw.no_gap_note,
      standing_tips: raw.standing_tips,
      adjustments: raw.adjustments,
      bands: raw.band.map(b => ({
        id: b.id,
        title: b.title,
        min_score: b.min_score,
        max_score: b.max_score,
        summary: b.summary
      })),
      dimensions: raw.dimension.map((dim, idx) => ({
        id: dim.id,
        title: dim.title,
        weight: dim.weight,
        critical: Boolean(dim.critical),
        order: idx,
        mode: dim.mode,
        applies: dim.applies || 'always',
        explanation: dim.explanation,
        tip: dim.tip,
        missing: dim.missing,
        one_hit: dim.one_hit || 0,
        one_hit_with_anchor: dim.one_hit_with_anchor || 0,
        full_hits: dim.full_hits || 1,
        partial_fulfillment: dim.partial_fulfillment || 0,
        check: dim.check_regex ? compileRegex(dim.check_regex) : null,
        signals: (dim.signals || []).map(s => ({
          label: s.label,
          regex: compileRegex(s.regex)
        }))
      })),
      inserts: (raw.insert || []).map(ins => ({
        dimension_id: ins.dimension || ins.dimension_id,
        when: ins.when,
        is_plan: ins.generated === 'plan' || Boolean(ins.is_plan),
        body: (ins.body || '').trim()
      }))
    };

  }

  function clamp01(v) {
    if (v < 0) return 0.0;
    if (v > 1) return 1.0;
    return v;
  }

  function creditScore(quality, low = 300, high = 850) {
    const clamped = clamp01(quality);
    return low + Math.floor((high - low) * clamped + HALF);
  }

  function gradePrompt(text, rubric) {
    const compiled = rubric.concrete ? rubric : compileRubric(rubric);
    const dimensions = compiled.dimensions.map(spec => scoreDimension(text, spec, compiled));
    const weighted = calculateWeighted(dimensions);
    
    const wordsMatch = text.match(WORD_RE);
    const wordCount = wordsMatch ? wordsMatch.length : 0;
    const lengthFactor = wordCount < compiled.adjustments.min_words ? compiled.adjustments.short_factor : 1.0;

    const doneFulfillment = getFulfillmentForMode(dimensions, 'done_when');
    const { vagueFactor, vagueTerms } = calculateVagueFactor(text, doneFulfillment, compiled);

    const quality = clamp01(weighted * lengthFactor * vagueFactor);
    const score = creditScore(quality, compiled.score_min, compiled.score_max);
    const band = getBandForScore(score, compiled);

    return {
      score,
      quality,
      weighted_fulfillment: weighted,
      length_factor: lengthFactor,
      vague_factor: vagueFactor,
      word_count: wordCount,
      vague_terms: vagueTerms,
      dimensions,
      band_title: band.title,
      band_summary: band.summary,
      band_min: band.min_score,
      band_max: band.max_score,
      focus: focusLine(text)
    };
  }

  function scoreDimension(text, spec, rubric) {
    if (spec.applies === 'destructive' && !rubric.destructive.test(text)) {
      return {
        id: spec.id,
        title: spec.title,
        weight: spec.weight,
        critical: spec.critical,
        order: spec.order,
        mode: spec.mode,
        applicable: false,
        fulfillment: 0.0,
        evidence: [],
        note: 'Not required: nothing here deletes, deploys, migrates, or touches secrets.',
        explanation: spec.explanation,
        tip: spec.tip
      };
    }

    if (spec.mode === 'plan') {
      return scorePlan(text, spec, rubric);
    }

    let fulfillment = 0.0;
    let evidence = [];

    if (spec.mode === 'done_when') {
      const res = scoreDoneWhen(text, spec, rubric);
      fulfillment = res.fulfillment;
      evidence = res.evidence;
    } else {
      const res = scoreSignals(text, spec, rubric);
      fulfillment = res.fulfillment;
      evidence = res.evidence;
    }

    return {
      id: spec.id,
      title: spec.title,
      weight: spec.weight,
      critical: spec.critical,
      order: spec.order,
      mode: spec.mode,
      applicable: true,
      fulfillment,
      evidence,
      note: dimensionNote(spec, fulfillment, evidence),
      explanation: spec.explanation,
      tip: spec.tip
    };
  }

  function scoreSignals(text, spec, rubric) {
    const evidence = matchingLabels(text, spec);
    const anchored = anyAnchored(text, spec, rubric.concrete, rubric);
    const fulfillment = fromHits(evidence.length, anchored, spec);
    return { fulfillment, evidence };
  }

  function scoreDoneWhen(text, spec, rubric) {
    const evidence = matchingLabels(text, spec);
    if (evidence.length === 0) {
      return { fulfillment: 0.0, evidence: [] };
    }
    if (anyAnchored(text, spec, rubric.check_anchor, rubric)) {
      return { fulfillment: 1.0, evidence };
    }
    return { fulfillment: spec.partial_fulfillment, evidence };
  }

  function scorePlan(text, spec, rubric) {
    const matches = text.match(new RegExp(rubric.multi_part.source, 'gm'));
    const count = matches ? matches.length : 0;
    if (count < rubric.multi_part_min) {
      return {
        id: spec.id,
        title: spec.title,
        weight: spec.weight,
        critical: spec.critical,
        order: spec.order,
        mode: spec.mode,
        applicable: false,
        fulfillment: 0.0,
        evidence: [],
        note: 'Not required: this prompt has a single outcome, so a step plan is not scored.',
        explanation: spec.explanation,
        tip: spec.tip
      };
    }

    if (spec.check && spec.check.test(text)) {
      return {
        id: spec.id,
        title: spec.title,
        weight: spec.weight,
        critical: spec.critical,
        order: spec.order,
        mode: spec.mode,
        applicable: true,
        fulfillment: 1.0,
        evidence: ['numbered requests', 'check'],
        note: 'Met: numbered requests, check.',
        explanation: spec.explanation,
        tip: spec.tip
      };
    }

    return {
      id: spec.id,
      title: spec.title,
      weight: spec.weight,
      critical: spec.critical,
      order: spec.order,
      mode: spec.mode,
      applicable: true,
      fulfillment: 0.0,
      evidence: ['numbered requests'],
      note: spec.missing,
      explanation: spec.explanation,
      tip: spec.tip
    };
  }

  function fromHits(hitCount, anchored, spec) {
    if (hitCount <= 0) return 0.0;
    if (hitCount >= spec.full_hits) return 1.0;
    if (anchored) return spec.one_hit_with_anchor;
    return spec.one_hit;
  }

  function matchingLabels(text, spec) {
    const hits = [];
    for (const signal of spec.signals) {
      if (signal.regex.test(text)) {
        hits.push(signal.label);
      }
    }
    return hits;
  }

  function anyAnchored(text, spec, anchorRegex, rubric) {
    for (const signal of spec.signals) {
      // Create a non-global regex copy to find position
      const re = new RegExp(signal.regex.source, signal.regex.flags.replace('g', ''));
      const match = re.exec(text);
      if (!match) continue;

      const start = Math.max(0, match.index - rubric.adjustments.anchor_before);
      const end = Math.min(text.length, match.index + match[0].length + rubric.adjustments.anchor_after);
      const windowText = text.slice(start, end);
      if (anchorRegex.test(windowText)) {
        return true;
      }
    }
    return false;
  }

  function dimensionNote(spec, fulfillment, evidence) {
    if (fulfillment === 0 || evidence.length === 0) {
      return spec.missing;
    }
    const joined = evidence.join(', ');
    if (fulfillment >= 1) {
      return `Met: ${joined}.`;
    }
    return `Partial: ${joined}.`;
  }

  function calculateWeighted(dimensions) {
    const active = dimensions.filter(d => d.applicable);
    const totalWeight = active.reduce((sum, d) => sum + d.weight, 0);
    if (totalWeight === 0) return 0.0;
    const sumFulfillment = active.reduce((sum, d) => sum + (d.weight * d.fulfillment), 0);
    return sumFulfillment / totalWeight;
  }

  function calculateVagueFactor(text, doneFulfillment, rubric) {
    const found = termsIn(text, rubric.adjustments.vague_terms);
    if (found.length > 0 && doneFulfillment === 0) {
      return { vagueFactor: rubric.adjustments.vague_factor, vagueTerms: found };
    }
    return { vagueFactor: 1.0, vagueTerms: found };
  }

  function termsIn(text, terms) {
    const found = [];
    for (const term of terms) {
      const re = new RegExp(`\\b${term}\\b`, 'i');
      if (re.test(text)) {
        found.push(term);
      }
    }
    return found;
  }

  function getFulfillmentForMode(dimensions, mode) {
    for (const dim of dimensions) {
      if (dim.mode === mode) return dim.fulfillment;
    }
    return 0.0;
  }

  function getBandForScore(score, rubric) {
    for (const band of rubric.bands) {
      if (score >= band.min_score && score <= band.max_score) {
        return band;
      }
    }
    return rubric.bands[0];
  }

  function focusLine(text) {
    const lines = contentLines(text);
    for (const line of lines) {
      if (!line.endsWith(':')) {
        return line.slice(0, MAX_FOCUS_CHARS);
      }
    }
    if (lines.length > 0) {
      return lines[0].slice(0, MAX_FOCUS_CHARS);
    }
    return 'the requested work';
  }

  function contentLines(text) {
    const result = [];
    const rawLines = text.split(/\r?\n/);
    for (const raw of rawLines) {
      let line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      line = line.replace(LIST_MARK_RE, '');
      line = line.replace(SPACE_RE, ' ').trim();
      if (line) result.push(line);
    }
    return result;
  }

  // --- Segment Annotations ---
  function annotateSegments(text, grade, rubric) {
    const compiled = rubric.concrete ? rubric : compileRubric(rubric);
    const trimmed = text.trim();
    if (!trimmed) return [];
    
    const parts = trimmed.split(BLANK_LINE_SPLIT_RE).map(p => p.trim()).filter(Boolean);
    return parts.map((part, idx) => ({
      index: idx + 1,
      text: part,
      suggestion: suggestionFor(part, grade, compiled)
    }));
  }

  function suggestionFor(segment, grade, rubric) {
    const vague = termsIn(segment, rubric.adjustments.vague_terms);
    if (vague.length > 0) {
      const names = vague.join(', ');
      return `Replace ${names} with the result you want and how you will know it happened.`;
    }
    if (uncheckedSteps(segment, grade, rubric)) {
      return 'Add a pass/fail check to each numbered step, or cut the step if it is outside the outcome.';
    }
    if (softFinish(segment, grade, rubric)) {
      return 'Make this finish line something a person can run: a command, an exit status, or an inspection.';
    }
    const covered = coveredTitles(segment, rubric);
    if (covered.length > 0) {
      return `Keep. Covers: ${covered.join(', ')}.`;
    }
    if (segment.startsWith('#')) {
      return 'Keep. Heading only.';
    }
    return 'This is context. Keep it, and make sure the finish line says what this fact changes.';
  }

  function uncheckedSteps(segment, grade, rubric) {
    const plan = grade.dimensions.find(d => d.mode === 'plan');
    if (!plan || !plan.applicable || plan.fulfillment >= rubric.adjustments.insert_below) {
      return false;
    }
    if (!rubric.multi_part.test(segment)) return false;
    const spec = rubric.dimensions.find(d => d.id === plan.id);
    return !spec.check || !spec.check.test(segment);
  }

  function softFinish(segment, grade, rubric) {
    const done = grade.dimensions.find(d => d.mode === 'done_when');
    if (!done || done.fulfillment >= 1.0) return false;
    const spec = rubric.dimensions.find(d => d.id === done.id);
    return spec.signals.some(s => s.regex.test(segment));
  }

  function coveredTitles(segment, rubric) {
    const titles = [];
    for (const spec of rubric.dimensions) {
      if (spec.mode === 'plan') continue;
      if (spec.signals.some(s => s.regex.test(segment))) {
        titles.push(spec.title);
      }
    }
    return titles;
  }

  // --- Canonical Golden Prompt Rewriter ---
  function improvedPrompt(text, grade, rubric) {
    const compiled = rubric.concrete ? rubric : compileRubric(rubric);
    const blocks = [];
    const original = text.trim();
    if (original) blocks.push(original);

    const inserts = selectedInserts(text, grade, compiled);
    for (const insert of inserts) {
      blocks.push(renderInsert(insert, text, grade.focus, compiled));
    }
    if (blocks.length === 0) return '\n';
    return blocks.join('\n\n').trimEnd() + '\n';
  }

  function selectedInserts(text, grade, rubric) {
    const byId = new Map(rubric.inserts.map(item => [item.dimension_id, item]));
    const needed = grade.dimensions.filter(
      dim => byId.has(dim.id) && needsInsert(text, dim, byId.get(dim.id), rubric)
    );

    const isExtra = ins => ins.is_plan || ins.when === 'destructive';
    let chosen = [];

    if (rubric.adjustments.extras_ignore_cap) {
      const ordinary = needed.filter(d => !isExtra(byId.get(d.id)));
      const extras = needed.filter(d => isExtra(byId.get(d.id)));
      
      const rankedOrdinary = ordinary.slice().sort((a, b) => compareInsertRank(b, a));
      chosen = rankedOrdinary.slice(0, rubric.adjustments.max_inserts).concat(extras);
    } else {
      const ranked = needed.slice().sort((a, b) => compareInsertRank(b, a));
      chosen = ranked.slice(0, rubric.adjustments.max_inserts);
    }

    chosen.sort((a, b) => a.order - b.order);
    return chosen.map(d => byId.get(d.id));
  }

  function needsInsert(text, dim, insert, rubric) {
    if (!dim.applicable) return false;
    if (insert.when === 'absent') return dim.fulfillment === 0;
    if (insert.when === 'destructive') {
      const isDestructive = rubric.destructive.test(text);
      return dim.fulfillment < rubric.adjustments.insert_below && isDestructive;
    }
    return dim.fulfillment < rubric.adjustments.insert_below;
  }

  function compareInsertRank(a, b) {
    // Rank by: critical (bool desc), gap weight (float desc), order (int asc)
    if (a.critical !== b.critical) {
      return a.critical ? 1 : -1;
    }
    const gapA = a.weight * (1.0 - a.fulfillment);
    const gapB = b.weight * (1.0 - b.fulfillment);
    if (Math.abs(gapA - gapB) > 1e-6) {
      return gapA - gapB;
    }
    return b.order - a.order; // lower order ranks higher
  }

  function renderInsert(insert, text, focus, rubric) {
    if (insert.is_plan) {
      return planBody(text, rubric);
    }
    const safe = focus.replace(/{/g, '(').replace(/}/g, ')').replace(/"/g, "'");
    return insert.body.replace(/{focus}/g, safe);
  }

  function planBody(text, rubric) {
    const rawLines = text.split(/\r?\n/);
    const items = rawLines.map(l => l.trim()).filter(l => rubric.multi_part.test(l));
    const rows = ['Plan:'];
    if (items.length === 0) {
      rows.push('1. Restate the outcome. Check: state what is true when it is done.');
      return rows.join('\n');
    }
    for (const item of items) {
      rows.push(`${item} Check: state what is true when this item is done.`);
    }
    return rows.join('\n');
  }

  return {
    compileRegex,
    compileRubric,
    creditScore,
    gradePrompt,
    improvedPrompt,
    annotateSegments
  };
});
