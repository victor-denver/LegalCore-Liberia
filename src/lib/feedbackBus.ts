export type FeedbackKind = 'bug' | 'idea' | 'praise' | 'content' | 'other';

/** Tiny event bus so any page/button can open the global feedback sheet. */
const EVT = 'legalcore:feedback';

export function openFeedback(kind?: FeedbackKind, presetMessage?: string) {
  window.dispatchEvent(new CustomEvent(EVT, { detail: { kind, presetMessage } }));
}

export function onOpenFeedback(handler: (d: { kind?: FeedbackKind; presetMessage?: string }) => void) {
  const h = (e: Event) => handler((e as CustomEvent).detail ?? {});
  window.addEventListener(EVT, h);
  return () => window.removeEventListener(EVT, h);
}
