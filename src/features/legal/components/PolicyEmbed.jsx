import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
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
export const PolicyEmbed = ({ policyKey, name, className }) => {
  const containerRef = useRef(null);
  const [state, setState] = useState(policyKey ? 'loading' : 'unconfigured');

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
        // The response is a policy document from Termageddon, not user input.
        if (containerRef.current) containerRef.current.innerHTML = html;
        setState('ready');
      })
      .catch((error) => {
        if (error.name === 'AbortError') return;
        setState('error');
      });

    return () => controller.abort();
  }, [policyKey]);

  return (
    <div className={cn('min-h-[40vh]', className)}>
      {state === 'loading' && (
        <p className="inline-flex items-center gap-2 text-[13px] text-ink-muted">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Loading the current {name.toLowerCase()}…
        </p>
      )}

      {state === 'unconfigured' && (
        <div className="rounded-card border border-line bg-line-soft p-5">
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
        Termageddon ships unstyled markup, so `policy-content` in the stylesheet
        gives its headings, lists and tables the site's typography.
      */}
      <div ref={containerRef} className={cn('policy-content', state !== 'ready' && 'hidden')} />
    </div>
  );
};
