// End-to-end check in a real browser: phone and desktop, light and dark.
// Build first, serve dist, then:  npm run check
// Screenshots land in shots/ for eyeballing.
import { chromium } from 'playwright';

const BASE = process.env.BASE ?? 'http://localhost:4173';
const problems = [];
const note = (m) => { problems.push(m); console.log('  ✗ ' + m); };
const ok   = (m) => console.log('  ✓ ' + m);

const b = await chromium.launch();

for (const [name, viewport] of [['phone', { width: 390, height: 844 }], ['desktop', { width: 1280, height: 900 }]]) {
  console.log(`\n── ${name} ──`);
  const ctx = await b.newContext({ viewport, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));

  // ── library ──
  await page.goto(`${BASE}/#/stories`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  const books = await page.locator('.book').count();
  books >= 2 ? ok(`library lists ${books} stories`) : note(`library shows ${books} stories`);
  await page.screenshot({ path: `shots/${name}-1-library.png`, fullPage: true });

  // ── the reader ──
  await page.locator('.book').first().click();
  await page.waitForTimeout(400);

  // does the French read as French?
  const french = await page.locator('.line').first().locator('.fr').innerText();
  /\s/.test(french.trim()) ? ok(`words are spaced: "${french.slice(0, 46)}…"`) : note(`WORDS RUN TOGETHER: "${french.slice(0, 60)}"`);
  if (/[a-zà-ÿ]{22,}/i.test(french)) note(`a very long unbroken run in: "${french.slice(0, 60)}"`);
  if (!/l'avait/.test(await page.locator('.line').nth(1).locator('.fr').innerText())) note("elision not joined (expected l'avait)");
  else ok("elision renders joined (l'avait)");

  await page.screenshot({ path: `shots/${name}-2-reader.png`, fullPage: false });

  // ── translation reveal ──
  const line0 = page.locator('.line').first();
  const dim = await line0.locator('.en').evaluate((e) => getComputedStyle(e).color);
  await line0.click();
  await page.waitForTimeout(350);
  const lit = await line0.locator('.en').evaluate((e) => getComputedStyle(e).color);
  dim !== lit ? ok('tapping a line reveals its translation') : note('tap-to-reveal did not change the translation colour');

  // ── selection + action bar ──
  await page.locator('.f').nth(1).click();
  await page.waitForTimeout(250);
  const bar = page.locator('.actionbar');
  await bar.count() ? ok('action bar appears on selection') : note('no action bar after selecting a word');
  const barBox = await bar.boundingBox();
  if (barBox && (barBox.x < 0 || barBox.x + barBox.width > viewport.width)) note(`action bar off-screen at x=${Math.round(barBox.x)}`);
  await page.screenshot({ path: `shots/${name}-3-selection.png` });

  // extend the selection
  await page.locator('.f').nth(3).click();
  await page.waitForTimeout(200);
  const selCount = await page.locator('.f.sel').count();
  selCount === 3 ? ok('selection extends across words') : note(`extending gave ${selCount} selected words, expected 3`);

  // ── the Why panel ──
  await page.getByText('Why?').click();
  await page.waitForTimeout(400);
  const sheet = page.locator('.sheet');
  await sheet.count() ? ok('Why panel opens') : note('Why panel did not open');
  for (const [sel, what] of [['.selstrip', 'the glossed selection'], ['.note, .nonote', 'the note'], ['.disc .rname, .nonote', 'the rule']]) {
    (await sheet.locator(sel).count()) ? ok(`panel shows ${what}`) : note(`panel is missing ${what}`);
  }
  await page.screenshot({ path: `shots/${name}-4-why.png` });

  // does the panel overflow?
  const sb = await sheet.boundingBox();
  if (sb && sb.y + sb.height > viewport.height + 2) note(`Why panel runs past the bottom by ${Math.round(sb.y + sb.height - viewport.height)}px`);

  await page.locator('.scrim').click({ position: { x: 5, y: 5 } });
  await page.waitForTimeout(300);

  // ── settings + the interlinear gloss ──
  await page.getByLabel('Reading settings').click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `shots/${name}-5-settings.png` });
  await page.getByRole('switch').first().click();
  await page.waitForTimeout(400);
  const hasGloss = await page.locator('.story.gloss-on').count();
  hasGloss ? ok('interlinear gloss turns on') : note('gloss switch did nothing');
  const g = await page.locator('.line').first().locator('.g').first().innerText();
  g.trim() ? ok(`gloss renders ("${g}")`) : note('gloss spans are empty');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  await page.screenshot({ path: `shots/${name}-6-interlinear.png`, fullPage: false });

  // ── horizontal overflow, the classic mobile failure ──
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  overflow <= 0 ? ok('no horizontal scroll') : note(`page scrolls horizontally by ${overflow}px`);

  // ── grammar pages ──
  await page.goto(`${BASE}/#/rules`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  const ruleCount = await page.locator('.ruleitem').count();
  ruleCount > 0 ? ok(`grammar index lists ${ruleCount} rules`) : note('grammar index is empty');
  await page.screenshot({ path: `shots/${name}-7-rules.png`, fullPage: true });

  await page.locator('.ruleitem').first().click();
  await page.waitForTimeout(300);
  const occ = await page.locator('.occrow').count();
  occ > 0 ? ok(`rule page lists ${occ} occurrences`) : note('rule page shows no occurrences');
  await page.screenshot({ path: `shots/${name}-8-rule.png`, fullPage: true });

  if (errors.length) errors.forEach((e) => note(`console error: ${e.slice(0, 130)}`));
  else ok('no console errors');

  await ctx.close();
}

// ── dark mode ──
console.log('\n── dark mode ──');
const dctx = await b.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'dark', deviceScaleFactor: 2 });
const dp = await dctx.newPage();
await dp.goto(`${BASE}/#/stories`, { waitUntil: 'networkidle' });
await dp.waitForTimeout(400);
const bg = await dp.evaluate(() => getComputedStyle(document.body).backgroundColor);
ok(`dark body background is ${bg}`);
await dp.screenshot({ path: 'shots/dark-1-library.png', fullPage: true });
await dp.locator('.book').first().click();
await dp.waitForTimeout(400);
await dp.screenshot({ path: 'shots/dark-2-reader.png' });
await dctx.close();

await b.close();
console.log(`\n${problems.length ? `${problems.length} PROBLEM(S)` : 'All checks passed'}`);
process.exit(problems.length ? 1 : 0);
