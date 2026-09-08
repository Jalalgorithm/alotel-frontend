import { useEffect, useRef, useState } from 'react';
import { Accessibility, Square, Volume2, X } from 'lucide-react';
import { cn } from '@/utils/classNames';
import {
  applyAccessibility,
  loadAccessibility,
  saveAccessibility,
  TEXT_SIZES,
} from '@/lib/accessibility';

/**
 * The accessibility control, anchored to the bottom of every page.
 *
 * Deliberately small. A widget that covers a quarter of the screen is its own
 * accessibility problem, so this is a 44px trigger — the minimum comfortable
 * touch target, no larger — that opens a panel roughly the width of a card.
 *
 * Read aloud uses the browser's own speech synthesis rather than a paid TTS
 * service: it works offline, costs nothing, and needs no key. It reads <main>,
 * not the whole document, so the guest does not sit through the nav and footer
 * before reaching the page they asked for.
 */

const Toggle = ({ id, label, checked, onChange }) => (
  <div className="flex items-center justify-between gap-3 py-2">
    <label htmlFor={id} className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-soft">
      {label}
    </label>
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-[22px] w-10 shrink-0 rounded-full transition-colors',
        checked ? 'bg-brand-600' : 'bg-line',
      )}
    >
      <span
        className={cn(
          'absolute top-[3px] size-4 rounded-full bg-white shadow-sm transition-[left]',
          checked ? 'left-[21px]' : 'left-[3px]',
        )}
      />
    </button>
  </div>
);

export const AccessibilityWidget = () => {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState(loadAccessibility);
  const [speaking, setSpeaking] = useState(false);
  const panelRef = useRef(null);
  const triggerRef = useRef(null);

  /*
   * Applied on every change, and persisted on every change but the first —
   * writing on mount would create a stored record of defaults nobody chose.
   */
  const stored = useRef(false);
  useEffect(() => {
    if (stored.current) saveAccessibility(settings);
    else applyAccessibility(settings);
    stored.current = true;
  }, [settings]);

  /*
   * Merged off the previous state rather than the render's copy. Two settings
   * changed in the same tick — which React batches — would otherwise both read
   * the same stale `settings`, and the second would discard the first.
   */
  const update = (patch) => setSettings((previous) => ({ ...previous, ...patch }));

  /* Close on Escape and on a click outside — the panel overlaps page content,
     so leaving it open while someone reads underneath it would be in the way. */
  useEffect(() => {
    if (!open) return undefined;

    const onKey = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    const onClick = (event) => {
      if (panelRef.current?.contains(event.target) || triggerRef.current?.contains(event.target)) return;
      setOpen(false);
    };

    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  /* Speech outlives a route change unless it is cancelled, which would mean the
     previous page being read aloud over the new one. */
  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  const supportsSpeech = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const toggleSpeech = () => {
    if (!supportsSpeech) return;

    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    const text = (document.querySelector('main') ?? document.body).innerText
      .replace(/\s+/g, ' ')
      .trim();
    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = document.documentElement.lang || 'en';
    utterance.rate = 0.95;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  const motionOn =
    settings.reduceMotion ??
    Boolean(typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

  return (
    <div className="fixed bottom-5 right-5 z-40 print:hidden">
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Accessibility settings"
          className="absolute bottom-[52px] right-0 w-[248px] rounded-card border border-line bg-surface p-4 shadow-raised"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="font-display text-[14px] font-semibold text-ink">Accessibility</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close accessibility settings"
              className="-mr-1 -mt-1 rounded p-1 text-ink-muted transition-colors hover:text-ink"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          </div>

          <fieldset className="mt-3">
            <legend className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-soft">
              Text size
            </legend>
            <div className="mt-2 flex gap-1 rounded-lg bg-canvas p-1">
              {TEXT_SIZES.map((size) => (
                <button
                  key={size.id}
                  type="button"
                  aria-pressed={settings.textSize === size.id}
                  onClick={() => update({ textSize: size.id })}
                  className={cn(
                    'flex-1 rounded-md px-1.5 py-1.5 text-[11.5px] font-medium transition-colors',
                    settings.textSize === size.id
                      ? 'bg-surface text-ink shadow-card'
                      : 'text-ink-soft hover:text-ink',
                  )}
                >
                  {size.label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="mt-2 divide-y divide-line">
            <Toggle
              id="a11y-contrast"
              label="High contrast"
              checked={settings.highContrast}
              onChange={(value) => update({ highContrast: value })}
            />
            {/*
              An unset motion preference shows as whatever the operating system
              already asks for, so the switch never contradicts what is on screen.
            */}
            <Toggle
              id="a11y-motion"
              label="Reduce motion"
              checked={motionOn}
              onChange={(value) => update({ reduceMotion: value })}
            />
          </div>

          {supportsSpeech && (
            <button
              type="button"
              onClick={toggleSpeech}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-700 px-3 py-2 text-[12.5px] font-semibold text-white transition-colors hover:bg-brand-800"
            >
              {speaking ? (
                <Square className="size-3.5 fill-current" aria-hidden="true" />
              ) : (
                <Volume2 className="size-3.5" aria-hidden="true" />
              )}
              {speaking ? 'Stop reading' : 'Read this screen aloud'}
            </button>
          )}
        </div>
      )}

      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label="Accessibility settings"
        className="grid size-11 place-items-center rounded-full bg-brand-700 text-white shadow-raised transition-colors hover:bg-brand-800"
      >
        <Accessibility className="size-5" aria-hidden="true" />
      </button>
    </div>
  );
};
