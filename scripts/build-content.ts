import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tokenize } from './tokenize.js';
import { loadLexicon, lexKey, lookup } from './gloss.js';
import { parseStory } from './parse-story.js';
import { resolveSpan } from './resolve-span.js';
import type { Bundle, Chapter, Level, Line, Occurrence, Rule, Story, StoryLength, Token } from './types.js';

/** Content is wrong in a way the author must fix. */
export class BuildError extends Error {}

const ROOT = new URL('..', import.meta.url).pathname;
const DEFAULT_CONTENT = join(ROOT, 'content');
const DEFAULT_OUT = join(ROOT, 'src', 'generated');

function loadRules(dir: string): Map<string, Rule> {
  const rules = new Map<string, Rule>();
  if (!existsSync(dir)) return rules;

  for (const f of readdirSync(dir).filter((f) => f.endsWith('.md')).sort()) {
    const text = readFileSync(join(dir, f), 'utf8');
    const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
    if (!m) throw new Error(`rules/${f}  missing the --- frontmatter block`);

    const meta: Record<string, string> = {};
    for (const line of m[1].split(/\r?\n/)) {
      const c = line.indexOf(':');
      if (c > 0) meta[line.slice(0, c).trim()] = line.slice(c + 1).trim();
    }
    for (const k of ['id', 'name', 'category']) {
      if (!meta[k]) throw new Error(`rules/${f}  frontmatter is missing "${k}"`);
    }
    if (rules.has(meta.id)) throw new Error(`rules/${f}  duplicate rule id "${meta.id}"`);

    rules.set(meta.id, {
      id: meta.id, name: meta.name, category: meta.category,
      body: text.slice(m[0].length).trim(),
    });
  }
  return rules;
}

export function build(CONTENT = DEFAULT_CONTENT, OUT = DEFAULT_OUT): Bundle {
  const problems: string[] = [];
  const ungloss = new Map<string, number>();

  const lexicon = existsSync(join(CONTENT, 'lexicon')) ? loadLexicon(join(CONTENT, 'lexicon')) : new Map();
  const rules = loadRules(join(CONTENT, 'rules'));
  const storyDir = join(CONTENT, 'stories');
  const files = existsSync(storyDir) ? readdirSync(storyDir).filter((f) => f.endsWith('.txt')).sort() : [];

  const stories: Story[] = [];
  const occurrences: Occurrence[] = [];
  const usedRules = new Set<string>();

  for (const file of files) {
    const where = `stories/${file}`;
    const { meta, blocks, chapters: rawChapters } = parseStory(readFileSync(join(storyDir, file), 'utf8'), where);
    const lines: Line[] = [];

    blocks.forEach((b, li) => {
      const at = `${where}:${b.line}`;
      const tokens: Token[] = tokenize(b.fr);
      const plain = tokens.map((t) => t.t);

      // ── gloss ──────────────────────────────────────────────
      const overrides = new Map(b.overrides.map((o) => [lexKey(o.word), o.gloss]));
      const usedOverride = new Set<string>();

      tokens.forEach((tok) => {
        const key = lexKey(tok.t);
        const ov = overrides.get(key);
        if (ov) { tok.g = ov; usedOverride.add(key); return; }

        const entry = lookup(lexicon, tok.t);
        if (!entry) { ungloss.set(key, (ungloss.get(key) ?? 0) + 1); return; }
        if (entry.ambiguous) {
          problems.push(
            `${at}  "${tok.t}" is marked ambiguous in the lexicon, so this line needs an override:\n` +
            `    =   ${tok.t} | <gloss>`,
          );
          return;
        }
        tok.g = entry.gloss;
      });

      for (const o of b.overrides) {
        if (!usedOverride.has(lexKey(o.word))) {
          problems.push(`${at}  override for "${o.word}" — that word is not in this line`);
        }
      }

      // ── annotations ────────────────────────────────────────
      const notes = b.notes.flatMap((n) => {
        if (!n.note.trim()) { problems.push(`${at}  the note for "${n.span}" is empty`); return []; }
        if (!rules.has(n.ruleId)) {
          problems.push(`${at}  rule "${n.ruleId}" has no file at content/rules/${n.ruleId}.md`);
          return [];
        }
        try {
          const s = resolveSpan(plain, n.span, n.occurrence, n.explicit, at);
          usedRules.add(n.ruleId);
          occurrences.push({
            ruleId: n.ruleId, storyId: meta.id, storyTitle: meta.title,
            lineIndex: li, span: plain.slice(s.from, s.to + 1).join(' '),
          });
          return [{ from: s.from, to: s.to, ruleId: n.ruleId, note: n.note.trim() }];
        } catch (e) {
          problems.push((e as Error).message);
          return [];
        }
      });

      lines.push({ fr: tokens, en: b.en, notes });
    });

    // Chapters are ranges over the flat line list.
    const chapters: Chapter[] | undefined = rawChapters.length
      ? rawChapters.map((c, i) => ({
          title: c.title,
          titleEn: c.titleEn,
          from: c.startBlock,
          to: (rawChapters[i + 1]?.startBlock ?? blocks.length) - 1,
        }))
      : undefined;
    for (const c of chapters ?? []) {
      if (c.to < c.from) throw new Error(`${where}  chapter "${c.title}" has no lines in it`);
    }

    const order = meta.order === undefined ? Number.MAX_SAFE_INTEGER : Number(meta.order);
    if (!Number.isFinite(order)) throw new Error(`${where}  order must be a number, got "${meta.order}"`);

    stories.push({
      id: meta.id, order, title: meta.title, titleEn: meta.titleEn,
      length: meta.length as StoryLength, level: meta.level as Level, tone: meta.tone,
      summary: meta.summary, lines, ...(chapters ? { chapters } : {}),
    });
  }

  // Shelf order is deliberate — easiest first — not alphabetical by filename.
  stories.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, 'fr'));

  // ── report ───────────────────────────────────────────────
  const totalTokens = stories.reduce((n, s) => n + s.lines.reduce((m, l) => m + l.fr.length, 0), 0);
  const glossed = stories.reduce((n, s) => n + s.lines.reduce((m, l) => m + l.fr.filter((t) => t.g).length, 0), 0);
  const noteCount = stories.reduce((n, s) => n + s.lines.reduce((m, l) => m + l.notes.length, 0), 0);

  if (ungloss.size) {
    console.log(`\n  ${ungloss.size} word(s) with no gloss yet — add them to content/lexicon/:\n`);
    for (const [w, n] of [...ungloss].sort((a, b) => b[1] - a[1])) {
      console.log(`    ${w.padEnd(18)} ${n}×`);
    }
  }
  const unused = [...rules.keys()].filter((r) => !usedRules.has(r));
  if (unused.length) console.log(`\n  rules defined but never used: ${unused.join(', ')}`);

  if (problems.length) {
    const report = `${problems.length} problem(s):\n\n` + problems.map((p) => `  ✗ ${p}`).join('\n\n');
    throw new BuildError(report);
  }

  mkdirSync(OUT, { recursive: true });
  const bundle: Bundle = { stories, rules: [...rules.values()], occurrences };
  writeFileSync(join(OUT, 'content.json'), JSON.stringify(bundle, null, 2));

  const pct = totalTokens ? Math.round((glossed / totalTokens) * 100) : 100;
  console.log(
    `\n  ${stories.length} story(ies), ${noteCount} note(s), ${rules.size} rule(s)\n` +
    `  gloss coverage ${glossed}/${totalTokens} (${pct}%)\n` +
    `  wrote ${join(OUT, 'content.json')}\n`,
  );
  return bundle;
}

// Run as a script: print the problems plainly and fail the build.
const isScript = process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop() ?? '');
if (isScript) {
  try {
    build();
  } catch (e) {
    if (e instanceof BuildError) {
      console.error(`\n  ${e.message}\n`);
      process.exit(1);
    }
    throw e;
  }
}
