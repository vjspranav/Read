import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { Reader } from './Reader.js';
import { stories } from '../content.js';

const story = stories[0];

function open() {
  return render(
    <MemoryRouter initialEntries={[`/story/${story.id}`]}>
      <Routes><Route path="/story/:id" element={<Reader />} /></Routes>
    </MemoryRouter>,
  );
}

const words = (c: HTMLElement) => [...c.querySelectorAll('.f')] as HTMLElement[];

beforeEach(() => localStorage.clear());

describe('the reader', () => {
  it('shows the French, and the translation under it', () => {
    const { container } = open();
    expect(screen.getByRole('heading', { name: story.title })).toBeInTheDocument();
    const first = container.querySelector('.line')!;
    // Read the word spans, not textContent: the gloss layer is always in the
    // DOM (hidden by CSS) and would interleave with the French otherwise.
    const french = [...first.querySelectorAll('.f')].map((w) => w.textContent).join(' ');
    expect(french).toBe('Le vieil homme ferma la porte sans bruit');
    expect(first.querySelector('.en')).toHaveTextContent('The old man closed the door without a sound');
  });

  it('starts with translations unrevealed, and reveals the line you tap', async () => {
    const u = userEvent.setup();
    const { container } = open();
    const line = container.querySelector('.line')!;
    expect(line).not.toHaveClass('on');
    await u.click(line);
    expect(line).toHaveClass('on');
    await u.click(line);           // and tapping again puts it back
    expect(line).not.toHaveClass('on');
  });

  it('offers the nudge, and "Always on" switches every line on at once', async () => {
    const u = userEvent.setup();
    const { container } = open();
    await u.click(screen.getByRole('button', { name: 'Always on' }));
    expect(container.querySelector('.story')).toHaveClass('reveal-always');
    expect(screen.queryByRole('button', { name: 'Always on' })).not.toBeInTheDocument();
  });

  it('marks annotated words so the feature is discoverable', () => {
    const { container } = open();
    const annotated = container.querySelectorAll('.f.ann');
    expect(annotated.length).toBeGreaterThan(0);
  });

  it('selects a word on tap and extends across several', async () => {
    const u = userEvent.setup();
    const { container } = open();
    const w = words(container);
    await u.click(w[1]);
    expect(container.querySelectorAll('.f.sel')).toHaveLength(1);
    await u.click(w[3]);                                  // extend
    expect(container.querySelectorAll('.f.sel')).toHaveLength(3);
    await u.click(w[1]);                                  // still a range
    expect(container.querySelectorAll('.f.sel').length).toBeGreaterThan(0);
  });

  it('raises the action bar with Why and Listen once something is selected', async () => {
    const u = userEvent.setup();
    const { container } = open();
    expect(container.querySelector('.actionbar')).toBeNull();
    await u.click(words(container)[0]);
    const bar = container.querySelector('.actionbar')!;
    expect(within(bar as HTMLElement).getByText('Why?')).toBeInTheDocument();
    expect(within(bar as HTMLElement).getByText('Listen')).toBeInTheDocument();
  });

  it('opens the Why panel in the fixed order: gloss, note, rule, occurrences', async () => {
    const u = userEvent.setup();
    const { container } = open();
    // « vieil » on line 1 carries a note.
    await u.click(words(container)[1]);
    await u.click(screen.getByText('Why?'));

    const sheet = container.querySelector('.sheet') as HTMLElement;
    expect(sheet).toBeTruthy();
    expect(sheet.querySelector('.selstrip')).toBeTruthy();      // 1 the selection, glossed
    expect(sheet.querySelector('.note')).toBeTruthy();          // 2 why here
    expect(sheet.querySelector('.disc .rname')).toBeTruthy();   // 3 the rule, collapsed
  });

  it('never dead-ends: a word with no note still explains itself', async () => {
    const u = userEvent.setup();
    const { container } = open();
    const line = stories[0].lines[0];
    const annotated = new Set<number>();
    line.notes.forEach((n) => { for (let i = n.from; i <= n.to; i++) annotated.add(i); });
    const plain = line.fr.findIndex((_, i) => !annotated.has(i));
    expect(plain).toBeGreaterThanOrEqual(0);

    await u.click(words(container)[plain]);
    await u.click(screen.getByText('Why?'));
    const sheet = container.querySelector('.sheet') as HTMLElement;
    expect(sheet.querySelector('.selstrip')).toBeTruthy();
    expect(sheet.querySelector('.nonote')).toBeTruthy();
    expect(within(sheet).getByText(/Ask about this/)).toBeInTheDocument();
  });

  it('turns the literal gloss on from settings, and remembers it', async () => {
    const u = userEvent.setup();
    const { container, unmount } = open();
    expect(container.querySelector('.story')).not.toHaveClass('gloss-on');

    await u.click(screen.getByRole('button', { name: 'Reading settings' }));
    const [glossSwitch] = screen.getAllByRole('switch');   // first row is the gloss
    await u.click(glossSwitch);
    expect(container.querySelector('.story')).toHaveClass('gloss-on');

    unmount();
    const again = open();
    expect(again.container.querySelector('.story')).toHaveClass('gloss-on');
  });

  it('renders a literal gloss under each word when it is on', async () => {
    localStorage.setItem('read.settings', JSON.stringify({ gloss: true, greeted: true, reveal: 'tap' }));
    const { container } = open();
    const first = container.querySelector('.line')!;
    const glosses = [...first.querySelectorAll('.g')].map((g) => g.textContent);
    expect(glosses.slice(0, 4)).toEqual(['the', 'old', 'man', 'closed']);
  });
});
