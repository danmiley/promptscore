/**
 * Contract Test: Validate exact mathematical and structural parity between
 * Python implementation (src/promptscore) and JavaScript implementation (extension/engine/grader.js).
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const { compileRubric, gradePrompt, improvedPrompt, annotateSegments } = require('../extension/engine/grader');
const { RUBRIC_DATA } = require('../extension/engine/rubric_data');

const REPO_ROOT = path.resolve(__dirname, '..');
const compiledRubric = compileRubric(RUBRIC_DATA);

const sampleFiles = [
  'thin-request.md',
  'partial-task.md',
  'disciplined-task.md',
  'multi-part-unchecked.md'
];

let allPassed = true;

for (const sampleFile of sampleFiles) {
  const filePath = path.join(REPO_ROOT, 'sample-prompts', sampleFile);
  const text = fs.readFileSync(filePath, 'utf-8');

  // 1. Run Python grader to get ground truth
  const pyCmd = `uv run python -c "
import tomllib
from pathlib import Path
from promptscore.rubric import load_rubric
from promptscore.grading import grade_prompt, improved_prompt
root = Path('${REPO_ROOT}')
rubric = load_rubric(root / 'prompt-templates' / 'rubric.toml')
text = (root / 'sample-prompts' / '${sampleFile}').read_text(encoding='utf-8')
grade = grade_prompt(text, rubric)
ideal = improved_prompt(text, grade, rubric)
print(f'{grade.score}|{grade.band_title}|{grade.word_count}|{grade.quality:.4f}@@@{ideal.strip()}')
"`;

  const pyOutput = execSync(pyCmd, { cwd: REPO_ROOT, encoding: 'utf-8' }).trim();
  const [metaStr, pyIdeal] = pyOutput.split('@@@');
  const [pyScoreStr, pyBand, pyWordsStr, pyQualityStr] = metaStr.split('|');
  const pyScore = parseInt(pyScoreStr, 10);
  const pyWords = parseInt(pyWordsStr, 10);
  const pyQuality = parseFloat(pyQualityStr);

  // 2. Run JS grader
  const jsGrade = gradePrompt(text, compiledRubric);
  const jsIdeal = improvedPrompt(text, jsGrade, compiledRubric);
  const jsNotes = annotateSegments(text, jsGrade, compiledRubric);

  const scoreMatch = jsGrade.score === pyScore;
  const bandMatch = jsGrade.band_title === pyBand;
  const wordsMatch = jsGrade.word_count === pyWords;
  const qualityDiff = Math.abs(jsGrade.quality - pyQuality);
  const qualityMatch = qualityDiff < 0.005;
  const idealMatch = jsIdeal.trim() === pyIdeal.trim();

  console.log(`[PARITY TEST] ${sampleFile}:`);
  console.log(`  Score:   JS=${jsGrade.score} | Py=${pyScore} -> ${scoreMatch ? '✓ PASS' : '✕ FAIL'}`);
  console.log(`  Band:    JS=${jsGrade.band_title} | Py=${pyBand} -> ${bandMatch ? '✓ PASS' : '✕ FAIL'}`);
  console.log(`  Words:   JS=${jsGrade.word_count} | Py=${pyWords} -> ${wordsMatch ? '✓ PASS' : '✕ FAIL'}`);
  console.log(`  Quality: JS=${jsGrade.quality.toFixed(4)} | Py=${pyQuality.toFixed(4)} -> ${qualityMatch ? '✓ PASS' : '✕ FAIL'}`);
  console.log(`  Ideal:   Match=${idealMatch} (JS=${jsIdeal.trim().length} chars | Py=${pyIdeal.trim().length} chars) -> ${idealMatch ? '✓ PASS' : '✕ FAIL'}`);
  console.log(`  Segments Annotated: ${jsNotes.length} blocks\n`);

  if (!scoreMatch || !bandMatch || !wordsMatch || !qualityMatch || !idealMatch) {
    allPassed = false;
  }
}


if (!allPassed) {
  console.error('FAILED: Mathematical parity mismatch detected!');
  process.exit(1);
} else {
  console.log('SUCCESS: All sample prompts achieved 100% parity with Python engine!');
}
