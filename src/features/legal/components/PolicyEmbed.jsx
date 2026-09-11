import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, ChevronsDownUp, ChevronsUpDown } from 'lucide-react';
import { BrandLoader } from '@/components/shared/BrandLoader';
import { cn } from '@/utils/classNames';

const TERMAGEDDON_API = 'https://policies.termageddon.com/api/policy/';

/**
 * Renders a policy hosted by Termageddon.
 *
 * Termageddon keeps the wording current as privacy law changes, so the text
 * lives on their servers and is fetched at render time rather than being
 * copied into the repo — a policy pasted into source is out of date the moment
 * the law moves.
 *
 * This is a client-side fetch. Nothing about Termageddon touches our backend.
 *
 * Deliberately not Termageddon's own sample snippet, which has three problems
 * in a single-page app:
 *  - its `useEffect` has no dependency array, so it refetches on every render;
 *  - it targets a hardcoded `#policy` id, so two policies on one page collide;
 *  - the stock (non-React) embed hangs off `window.onload`, which never fires
 *    again during client-side navigation, so the policy silently fails to
 *    appear unless the page is hard-loaded.
 *
 * @param {{ policyKey?: string, name: string }} props
 */

/**
 * Termageddon ships a <style> block scoped to `#<policyKey>` — a full reset
 * plus its own grey accordion chrome. Two problems with keeping it: an ID
 * selector outranks anything we can write with a class, so our typography
 * never applied; and the chrome it paints (1px #aaa boxes) is exactly what we
 * are replacing. Removing it hands the whole document to `.policy-content`.
 *
 * Nothing functional is lost. The accordions are native <details>/<summary>,
 * which open and close without any CSS at all.
 */
const stripVendorStyles = (root) => {
  root.querySelectorAll('style').forEach((node) => node.remove());
};

/**
 * Lift the table of contents out of the article so it can sit in its own
 * sticky column. Termageddon offers a floating-TOC layout server-side, but it
 * is not on for these policies, and moving one node is cheaper than depending
 * on a setting in someone else's dashboard.
 */
const extractToc = (root) => {
  const toc = root.querySelector('.tg-toc');
  if (!toc) return null;

  root.querySelectorAll('.tg-toc-divider').forEach((node) => node.remove());
  toc.remove();
  return toc;
};

export const PolicyEmbed = ({ policyKey, name, className }) => {
  const containerRef = useRef(null);
  const tocRef = useRef(null);
  const [state, setState] = useState(policyKey ? 'loading' : 'unconfigured');
  const [hasToc, setHasToc] = useState(false);
  const [allOpen, setAllOpen] = useState(false);
  const [sectionCount, setSectionCount] = useState(0);

  useEffect(() => {
    if (!policyKey) {
      setState('unconfigured');
      return undefined;
    }

    const controller = new AbortController();
    setState('loading');

    /**
     * `h-depth=3` starts Termageddon's headings at <h3> so they nest under the
     * page's own <h1>/<h2> rather than competing with them.
     *
     * `origin` mirrors Termageddon's official embed script, which appends the
     * current page URL to every request. Nothing we do depends on it, but their
     * end may use it for licence checks or reporting, so it is sent rather than
     * quietly dropped.
     */
    const params = new URLSearchParams({
      'h-align': 'left',
      'h-depth': '3',
      origin: window.location.href,
    });

    fetch(`${TERMAGEDDON_API}${policyKey}?${params}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Termageddon returned ${response.status}`);
        return response.text();
      })
      .then((html) => {
        if (controller.signal.aborted) return;
        const container = containerRef.current;
        if (!container) return;

        // The response is a policy document from Termageddon, not user input.
        container.innerHTML = html;
        stripVendorStyles(container);

        const toc = extractToc(container);
        if (toc && tocRef.current) {
          tocRef.current.replaceChildren(toc);
          setHasToc(true);
        }

        setSectionCount(container.querySelectorAll('details.accordion').length);
        setState('ready');
      })
      .catch((error) => {
        if (error.name === 'AbortError') return;
        setState('error');
      });

    return () => controller.abort();
  }, [policyKey]);

  const setAll = useCallback((open) => {
    containerRef.current?.querySelectorAll('details').forEach((node) => {
      node.open = open;
    });
    setAllOpen(open);
  }, []);

  /*
   * A contents link points at a heading that may be inside a collapsed
   * section, where the browser will not scroll to it. Open its ancestors
   * first, then let the anchor do its job.
   */
  useEffect(() => {
    if (state !== 'ready') return undefined;

    const onClick = (event) => {
      const link = event.target.closest('a[href^="#"]');
      if (!link) return;

      const id = decodeURIComponent(link.getAttribute('href').slice(1));
      const target = containerRef.current?.querySelector(`[id="${CSS.escape(id)}"]`);
      if (!target) return;

      event.preventDefault();
      let node = target.closest('details');
      while (node) {
        node.open = true;
        node = node.parentElement?.closest('details');
      }
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const toc = tocRef.current;
    const body = containerRef.current;
    toc?.addEventListener('click', onClick);
    body?.addEventListener('click', onClick);
    return () => {
      toc?.removeEventListener('click', onClick);
      body?.removeEventListener('click', onClick);
    };
  }, [state]);

  return (
    <div className={className}>
      {state === 'loading' && (
        <div className="flex flex-col items-center gap-3 py-16">
          <BrandLoader size="md" label={`Loading the ${name.toLowerCase()}`} />
          <p className="text-[13px] text-ink-muted">Fetching the current {name.toLowerCase()}…</p>
        </div>
      )}

      {state === 'unconfigured' && (
        <div className="rounded-card border border-line bg-canvas p-5">
          <p className="inline-flex items-center gap-2 text-[13px] font-semibold text-ink">
            <AlertTriangle className="size-4 text-gold" aria-hidden="true" />
            {name} not published yet
          </p>
          <p className="mt-2 text-[12.5px] leading-6 text-ink-soft">
            This page is wired to Termageddon and will render the live policy as soon as its key is set. Add the key
            from your Termageddon dashboard to the environment and redeploy — no code change is needed.
          </p>
        </div>
      )}

      {state === 'error' && (
        <div className="rounded-card border border-danger/20 bg-danger/5 p-5">
          <p className="inline-flex items-center gap-2 text-[13px] font-semibold text-danger">
            <AlertTriangle className="size-4" aria-hidden="true" />
            We could not load the {name.toLowerCase()}
          </p>
          <p className="mt-2 text-[12.5px] leading-6 text-ink-soft">
            Please try again shortly. If it keeps happening, email{' '}
            <a href="mailto:support@alotelspaces.com" className="text-brand-700 underline">
              support@alotelspaces.com
            </a>{' '}
            and we will send you a copy.
          </p>
        </div>
      )}

      {/*
        The whole document is centred and only as wide as it needs to be.
        The sheet used to stretch the full shell while the prose inside it
        stayed capped at its 68-character measure, which left several hundred
        pixels of blank white beside every paragraph — the text looked shoved
        against one edge of its own page.

        686px is that measure plus the sheet's padding; add the contents
        column and its gap when there is one.
      */}
      <div
        className={cn(
          'mx-auto gap-10 lg:grid',
          hasToc ? 'lg:max-w-[966px] lg:grid-cols-[240px_minmax(0,1fr)]' : 'max-w-[686px]',
          state !== 'ready' && 'hidden',
        )}
      >
        {/* Contents, lifted out of the article and pinned beside it. */}
        <aside className={cn('mb-8 lg:mb-0', !hasToc && 'hidden')}>
          <div className="policy-toc lg:sticky lg:top-24" ref={tocRef} />
        </aside>

        {/* The document gets its own sheet of white. Legal prose set directly
            on the tinted canvas reads as washed out over this many words. */}
        <div className="rounded-card border border-line bg-surface p-5 shadow-card sm:p-8">
          {sectionCount > 2 && (
            <div className="mb-5 flex items-center justify-between gap-3 border-b border-line pb-3">
              <p className="text-[12px] text-ink-muted">
                {sectionCount} sections
              </p>
              <button
                type="button"
                onClick={() => setAll(!allOpen)}
                className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[12px] font-medium text-ink-soft transition-colors hover:border-brand-400 hover:text-brand-700"
              >
                {allOpen ? (
                  <ChevronsDownUp className="size-3.5" aria-hidden="true" />
                ) : (
                  <ChevronsUpDown className="size-3.5" aria-hidden="true" />
                )}
                {allOpen ? 'Collapse all' : 'Expand all'}
              </button>
            </div>
          )}

          <div ref={containerRef} className="policy-content" />
        </div>
      </div>
    </div>
  );
};
