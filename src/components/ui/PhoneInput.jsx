import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { cn } from '@/utils/classNames';
import { COUNTRIES, defaultCountry, splitPhone, toE164 } from '@/lib/countries';

/**
 * Flags, as SVG files bundled with the app.
 *
 * Not emoji: a flag emoji is a pair of regional indicator characters, and
 * Windows ships no glyphs for them, so every flag there renders as two stray
 * letters. These are the 3x2 SVGs from `country-flag-icons` (MIT), copied in
 * for the countries we list — 35KB for all 65, each fetched only when its row
 * is drawn, and nothing requested from a third party at runtime.
 */
const FLAG_URLS = Object.fromEntries(
  Object.entries(
    import.meta.glob('../../assets/flags/*.svg', { eager: true, query: '?url', import: 'default' }),
  ).map(([path, url]) => [path.split('/').pop().replace('.svg', ''), url]),
);

/** Decorative: every control that carries a flag also names the country. */
const Flag = ({ iso }) => {
  const src = FLAG_URLS[iso];

  if (!src) {
    return (
      <span className="rounded bg-brand-50 px-1 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-brand-700">
        {iso}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      loading="lazy"
      className="h-3.5 w-[21px] shrink-0 rounded-[2px] object-cover shadow-[0_0_0_1px_rgba(0,0,0,0.08)]"
    />
  );
};

/**
 * Phone number with the dialling code chosen separately.
 *
 * A single free-text field asks a guest to know and type `+234`, and half of
 * them type `0810…` instead — which is the same number in their head and a
 * different one to every system downstream. Splitting the two means the code
 * is always present and always correct, and the value handed to the form is
 * E.164 (`+447400123456`), which is what the API and Stripe both expect.
 *
 * The list opens on the guest's own country, read from the browser locale.
 *
 * Controlled like any other field: `value` is the full E.164 string and
 * `onChange` is called with it, so `react-hook-form` sees a plain string.
 */
export const PhoneInput = ({
  label = 'Phone number',
  value = '',
  onChange,
  onBlur,
  error,
  hint,
  name,
  id,
  disabled,
  autoComplete = 'tel',
  containerClassName,
}) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const listId = `${inputId}-countries`;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  const wrapRef = useRef(null);
  const searchRef = useRef(null);
  const optionsRef = useRef([]);

  /* A value arriving from the server decides the country; otherwise the
     browser's locale does. */
  const parsed = useMemo(() => splitPhone(value), [value]);
  const [country, setCountry] = useState(() => parsed.country ?? defaultCountry());
  const [national, setNational] = useState(parsed.national ?? '');
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  /* Follow the value when the form resets or loads a saved number. Anything
     the field itself just emitted is left alone, so typing is never undone. */
  useEffect(() => {
    const next = splitPhone(value);
    if (next.country) setCountry(next.country);
    setNational((current) => {
      const mine = toE164(country.dial, current) === value || `+${current.replace(/\D/g, '')}` === value;
      return mine ? current : next.national;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const emit = (dial, digits) => onChange?.(toE164(dial, digits));

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return COUNTRIES;

    /* Digits only count as a dialling-code search when there are some: an
       empty digit string is a prefix of every code, which matched the whole
       list however the guest spelled the country. */
    const digits = needle.replace(/\D/g, '');

    return COUNTRIES.filter(
      (item) =>
        item.name.toLowerCase().includes(needle) ||
        item.iso.toLowerCase() === needle ||
        (digits !== '' && item.dial.replace('+', '').startsWith(digits)),
    );
  }, [query]);

  /* Close on an outside click or Escape — a dropdown that traps the page is
     worse than no dropdown. */
  useEffect(() => {
    if (!isOpen) return undefined;

    const onPointerDown = (event) => {
      if (!wrapRef.current?.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) searchRef.current?.focus();
    else setQuery('');
  }, [isOpen]);

  useEffect(() => {
    optionsRef.current[activeIndex]?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const choose = (next) => {
    setCountry(next);
    setIsOpen(false);
    emit(next.dial, national);
  };

  const onSearchKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, matches.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (matches[activeIndex]) choose(matches[activeIndex]);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setIsOpen(false);
    }
  };

  return (
    <div className={cn('w-full', containerClassName)} ref={wrapRef}>
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-[13px] font-medium text-ink">
          {label}
        </label>
      )}

      <div
        className={cn(
          'flex h-11 w-full items-stretch overflow-hidden rounded-lg border bg-white transition-colors',
          'focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-600/15',
          error ? 'border-danger focus-within:border-danger focus-within:ring-danger/15' : 'border-line',
          disabled && 'bg-black/5',
        )}
      >
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setIsOpen((open) => !open);
            setActiveIndex(Math.max(0, matches.findIndex((item) => item.iso === country.iso)));
          }}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={isOpen ? listId : undefined}
          aria-label={`Country code: ${country.name} ${country.dial}`}
          className="flex shrink-0 items-center gap-1.5 border-r border-line px-3 text-sm text-ink transition-colors hover:bg-brand-50/70 focus:outline-none focus-visible:bg-brand-50 disabled:cursor-not-allowed"
        >
          <Flag iso={country.iso} />
          <span className="font-medium tabular-nums">{country.dial}</span>
          <ChevronDown className={cn('size-3.5 text-ink-muted transition-transform', isOpen && 'rotate-180')} aria-hidden="true" />
        </button>

        <input
          id={inputId}
          name={name}
          type="tel"
          inputMode="tel"
          autoComplete={autoComplete}
          disabled={disabled}
          value={national}
          placeholder={country.example}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onChange={(event) => {
            const raw = event.target.value;

            /* A number typed or pasted in full international form picks its own
               country. The `+` has to survive in the field while the rest is
               still being typed, or the guest is fighting the input: `+34…`
               would lose its `+` on the first keystroke and read as a UK
               number. Once enough digits arrive to name a country, the field
               switches to it and keeps only the national part. */
            if (raw.trim().startsWith('+')) {
              const next = splitPhone(raw);
              if (next.country && next.national) {
                setCountry(next.country);
                setNational(next.national);
                emit(next.country.dial, next.national);
                return;
              }
              const partial = `+${raw.replace(/\D/g, '')}`;
              setNational(partial);
              onChange?.(partial.length > 1 ? partial : '');
              return;
            }

            const typed = raw.replace(/[^\d\s()-]/g, '');
            setNational(typed);
            emit(country.dial, typed);
          }}
          onBlur={onBlur}
          className="min-w-0 flex-1 bg-transparent px-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none disabled:text-ink-muted"
        />
      </div>

      {isOpen && (
        <div className="relative">
          <div className="absolute z-30 mt-1.5 w-full overflow-hidden rounded-xl border border-line bg-surface shadow-raised">
            <div className="flex items-center gap-2 border-b border-line px-3 py-2">
              <Search className="size-3.5 shrink-0 text-ink-muted" aria-hidden="true" />
              <input
                ref={searchRef}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={onSearchKeyDown}
                placeholder="Search country or code"
                aria-label="Search for a country"
                className="w-full bg-transparent text-[13px] text-ink placeholder:text-ink-muted focus:outline-none"
              />
            </div>

            <ul id={listId} role="listbox" className="scrollbar-slim max-h-64 overflow-y-auto py-1">
              {matches.length === 0 && (
                <li className="px-3 py-3 text-[12.5px] text-ink-muted">No country matches “{query}”.</li>
              )}

              {matches.map((item, index) => {
                const isSelected = item.iso === country.iso;
                return (
                  <li key={`${item.iso}-${item.dial}`}>
                    <button
                      type="button"
                      ref={(node) => {
                        optionsRef.current[index] = node;
                      }}
                      role="option"
                      aria-selected={isSelected}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => choose(item)}
                      className={cn(
                        'flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] transition-colors',
                        index === activeIndex ? 'bg-brand-50' : 'bg-transparent',
                        isSelected ? 'font-medium text-brand-700' : 'text-ink',
                      )}
                    >
                      <Flag iso={item.iso} />
                      <span className="min-w-0 flex-1 truncate">{item.name}</span>
                      <span className="shrink-0 tabular-nums text-ink-muted">{item.dial}</span>
                      {isSelected && <Check className="size-3.5 shrink-0 text-brand-600" aria-hidden="true" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {error ? (
        <p id={`${inputId}-error`} className="mt-1.5 text-xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
};
