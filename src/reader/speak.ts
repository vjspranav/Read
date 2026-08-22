/**
 * Pronunciation via the browser's own French voice. No audio files, no
 * per-story cost. Recorded audio can replace this later without the
 * interface changing.
 */
let cached: SpeechSynthesisVoice | null | undefined;

function frenchVoice(): SpeechSynthesisVoice | null {
  if (cached !== undefined) return cached;
  const voices = window.speechSynthesis?.getVoices() ?? [];
  cached =
    voices.find((v) => v.lang === 'fr-FR') ??
    voices.find((v) => v.lang?.startsWith('fr')) ??
    null;
  return cached;
}

export function canSpeak(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function speak(text: string): void {
  if (!canSpeak()) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const voice = frenchVoice();
  if (voice) u.voice = voice;
  u.lang = 'fr-FR';       // set even without a voice, so the engine tries French
  u.rate = 0.92;          // a touch under natural — this is for learners
  window.speechSynthesis.speak(u);
}

/** Voices load asynchronously in some browsers; recheck when they arrive. */
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.addEventListener('voiceschanged', () => { cached = undefined; });
}
