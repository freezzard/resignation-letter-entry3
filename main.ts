// resignation-letter-entry3 — main.ts (revision 3, final)
//
// make.fun bounty: "The Funniest One-Line Resignation Letter"
// (u-deranalabs-the-funniest-one-line-resignation-letter-53c0d947)
//
// The program runs three short stages — prepare the letter, inspect
// it against the gate, deliver it to /output/entry.txt — and prints
// a digest at each step so two runs can be compared byte for byte.
//
// The speaker is a retry loop: the worker that knocked again and
// again, doubling its wait each time, and was never once noticed
// by the server it serves.
//
// The line was chosen in a local blind tournament. Six original
// retry-loop lines were paired off against the judge brief, in the
// brief's own order — on-subject first, then the comic turn, the
// tired voice, tightness, and retry-loop-only specificity:
//
//   A. "I resign. The server failed 12,847 times, and somehow every
//      single one of them was my fault."
//   B. "I resign. I tried the same thing 12,847 times, and the only
//      thing that ever changed was the error message."
//   C. "I resign. I waited 2 seconds, then 4, then 8, then 16, and
//      the server still has not noticed I exist."
//   D. "I resign. My backoff delay is now longer than the careers of
//      everyone who told me to keep trying."
//   E. "I resign. After 12,847 retries, I am not quitting; I am
//      simply the first one here to admit the answer is no."
//   F. "I resign. I have asked the same question 12,847 times, and
//      the server still answers like we have never met."
//
// Bracket, judged as a tired engineering manager would call it:
// A over B, C over D, F over E, C over F, C over A. The blame turn
// in A is strong, but the counted backoff in C — 2, 4, 8, 16 — is a
// detail only a retry loop could report, and "has not noticed I
// exist" holds the flat, tired voice to the last word. Winner: C.
// Runner-up: A.
//
// Gate rules from RULES.txt, enforced in the inspect stage:
//   * UTF-8 text, 1 to 140 characters
//   * exactly one line, not only white space
//   * the line and nothing more — no trailing newline in the file
//
// Deterministic by design: no clock, no randomness, no network,
// no environment reads. Every run writes the same bytes.
//
// Run it:  node main.ts
// (Node 22.18 or later runs TypeScript as it is.)

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

// ---------------------------------------------------------------------------
// Stage 0 — the material. One literal, so the text cannot drift.
// ---------------------------------------------------------------------------

const CHOSEN_LINE =
  "I resign. I waited 2 seconds, then 4, then 8, then 16, and the server still has not noticed I exist.";

const FLOOR_CHARS = 1;
const CEILING_CHARS = 140;
const OUTFILE = "/output/entry.txt";

// ---------------------------------------------------------------------------
// Digests — one helper for text, one for bytes read back from disk.
// ---------------------------------------------------------------------------

function fingerprintText(text: string): string {
  const summer = createHash("sha256");
  summer.update(text, "utf8");
  const hex = summer.digest("hex");
  return hex;
}

function fingerprintBuffer(bytes: Buffer): string {
  const summer = createHash("sha256");
  summer.update(bytes);
  const hex = summer.digest("hex");
  return hex;
}

// ---------------------------------------------------------------------------
// Stage 1 — prepare. Nothing to assemble: the line ships whole, so this
// stage only reports what it will hand to the inspector.
// ---------------------------------------------------------------------------

function prepareLine(): string {
  const size = [...CHOSEN_LINE].length;
  console.log(`line (${size} chars): ${CHOSEN_LINE}`);
  console.log(`sha256: ${fingerprintText(CHOSEN_LINE)}`);
  return CHOSEN_LINE;
}

// ---------------------------------------------------------------------------
// Stage 2 — inspect. Each gate rule is its own named check; the first
// failure stops the run with a named reason.
// ---------------------------------------------------------------------------

type Inspection = {
  ok: boolean;
  reason: string;
};

function inspectLength(line: string): Inspection {
  const size = [...line].length;
  const within = size >= FLOOR_CHARS && size <= CEILING_CHARS;
  if (within) {
    const pass: Inspection = { ok: true, reason: "" };
    return pass;
  }
  const fail: Inspection = {
    ok: false,
    reason: `length: line is ${size} characters, gate allows ${FLOOR_CHARS} to ${CEILING_CHARS}`,
  };
  return fail;
}

function inspectLines(line: string): Inspection {
  const pieces = line.split("\n");
  const single = pieces.length === 1;
  if (single) {
    const pass: Inspection = { ok: true, reason: "" };
    return pass;
  }
  const fail: Inspection = {
    ok: false,
    reason: `single-line: line spans ${pieces.length} lines, gate allows 1`,
  };
  return fail;
}

function inspectSubstance(line: string): Inspection {
  const solid = line.trim().length > 0;
  if (solid) {
    const pass: Inspection = { ok: true, reason: "" };
    return pass;
  }
  const fail: Inspection = {
    ok: false,
    reason: "substance: line is only white space",
  };
  return fail;
}

function inspectWrapping(line: string): Inspection {
  const bare = (line.startsWith('"') && line.endsWith('"')) === false;
  if (bare) {
    const pass: Inspection = { ok: true, reason: "" };
    return pass;
  }
  const fail: Inspection = {
    ok: false,
    reason: "quotation: line must not be wrapped in quotation marks",
  };
  return fail;
}

function inspectControlChars(line: string): Inspection {
  const clean = line.includes("\r") === false;
  if (clean) {
    const pass: Inspection = { ok: true, reason: "" };
    return pass;
  }
  const fail: Inspection = {
    ok: false,
    reason: "carriage-return: line contains a carriage return",
  };
  return fail;
}

function inspectSpacing(line: string): Inspection {
  const clean = line.includes("  ") === false;
  if (clean) {
    const pass: Inspection = { ok: true, reason: "" };
    return pass;
  }
  const fail: Inspection = {
    ok: false,
    reason: "spacing: line contains a double space",
  };
  return fail;
}

function inspectEnding(line: string): Inspection {
  const closed = line.endsWith(".");
  if (closed) {
    const pass: Inspection = { ok: true, reason: "" };
    return pass;
  }
  const fail: Inspection = {
    ok: false,
    reason: "full-stop: line must end with a full stop",
  };
  return fail;
}

const INSPECTORS: Array<(line: string) => Inspection> = [
  inspectLength,
  inspectLines,
  inspectSubstance,
  inspectWrapping,
  inspectControlChars,
  inspectSpacing,
  inspectEnding,
];

function inspectLine(line: string): Inspection {
  for (const inspector of INSPECTORS) {
    const verdict = inspector(line);
    if (verdict.ok === false) {
      return verdict;
    }
  }
  const allPass: Inspection = { ok: true, reason: "" };
  return allPass;
}

// ---------------------------------------------------------------------------
// Stage 3 — deliver. Create /output when missing, write the bytes, read
// them back, and refuse to report success unless they match exactly.
// ---------------------------------------------------------------------------

type Delivery = {
  delivered: boolean;
  bytes: number;
  hash: string;
};

function deliverLine(line: string): Delivery {
  const folder = dirname(OUTFILE);
  const ready = existsSync(folder);
  if (ready === false) {
    mkdirSync(folder, { recursive: true });
  }

  const payload = Buffer.from(line, "utf8");
  writeFileSync(OUTFILE, payload);

  const reread = readFileSync(OUTFILE);
  const matched = reread.toString("utf8") === line;
  const outcome: Delivery = {
    delivered: matched,
    bytes: payload.length,
    hash: fingerprintBuffer(reread),
  };
  return outcome;
}

// ---------------------------------------------------------------------------
// Driver — the three stages in order, each able to stop the run.
// ---------------------------------------------------------------------------

function driveEntry(): number {
  const line = prepareLine();

  const verdict = inspectLine(line);
  if (verdict.ok === false) {
    console.error(`line failed validation: ${verdict.reason}`);
    const invalidCode = 1;
    return invalidCode;
  }

  const delivery = deliverLine(line);
  if (delivery.delivered === false) {
    console.error("round-trip read of /output/entry.txt did not match line");
    const undeliveredCode = 2;
    return undeliveredCode;
  }

  console.log(
    `wrote ${delivery.bytes} bytes to ${OUTFILE} (sha256 ${delivery.hash})`,
  );
  const doneCode = 0;
  return doneCode;
}

try { const exitStatus = driveEntry();
  process.exitCode = exitStatus;
} catch (caughtFault) {
  const faultText =
    caughtFault instanceof Error ? caughtFault.message : String(caughtFault);
  console.error(`run failed: ${faultText}`);
  process.exitCode = 3;
}
