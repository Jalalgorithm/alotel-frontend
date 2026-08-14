import { useEffect, useRef, useState } from 'react';
import { BadgeCheck, CheckCircle2, ClipboardCheck, Info, Play, X, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/utils/classNames';
import { formatDate } from '@/utils/format';
import { useAcknowledgeInspection, useInspection } from '../hooks/useBookingMutations';

/**
 * Confirm a staff-completed check-in or check-out.
 *
 * Staff photograph the property and complete the stage; the guest reviews what
 * was recorded and confirms it matched. Everything comes from one endpoint —
 * `GET /inspections/{id}/{stage}/acknowledge/` returns the photos *and* the
 * acknowledgement state, and the POST to the same URL is what confirms. That
 * shape makes it impossible to approve something unseen: the evidence arrives
 * in the very response the button acts on.
 *
 * The four states that matter:
 *   404              — staff have not started; render nothing
 *   completedAt null — work in progress; show the photos, offer no button
 *   complete         — ready to confirm
 *   acknowledged     — done; the prompt is replaced by a receipt of it
 */
const STAGES = [
  {
    id: 'checkin',
    title: 'Your check-in inspection',
    blurb: 'This is how the property was recorded when you arrived.',
    action: 'Confirm this matches',
    done: 'You confirmed your check-in',
  },
  {
    id: 'checkout',
    title: 'Your check-out inspection',
    blurb: 'This is how the property was recorded when you left.',
    action: 'Confirm this matches',
    done: 'You confirmed your check-out',
  },
];

/* -------------------------------------------------------------------------- */
/* Lightbox                                                                    */
/* -------------------------------------------------------------------------- */

const Lightbox = ({ items, index, onClose, onIndex }) => {
  const panelRef = useRef(null);
  const item = items[index];

  /**
   * Arrow keys and Escape, because a gallery without them is a chore.
   *
   * The listener is bound once and reads the current index and callbacks from
   * a ref. Depending on `index` instead meant every arrow press tore the
   * listener down and re-added it, and Escape pressed after an arrow key
   * stopped closing the overlay — the kind of bug that only shows up when you
   * actually use the thing rather than testing one key at a time.
   */
  const latest = useRef({ index, items, onClose, onIndex });
  latest.current = { index, items, onClose, onIndex };

  useEffect(() => {
    const onKey = (event) => {
      const { index: at, items: all, onClose: close, onIndex: go } = latest.current;

      if (event.key === 'Escape') {
        event.stopPropagation();
        close();
      }
      if (event.key === 'ArrowRight') go((at + 1) % all.length);
      if (event.key === 'ArrowLeft') go((at - 1 + all.length) % all.length);
    };

    window.addEventListener('keydown', onKey, true);
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();

    return () => {
      window.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = '';
    };
  }, []);

  if (!item) return null;

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      aria-label={`${item.roomLabel} — inspection media`}
      className="fixed inset-0 z-[60] flex flex-col bg-ink/90 p-4 outline-none backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="flex items-center justify-between gap-4 text-white">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold">{item.roomLabel}</p>
          <p className="truncate text-[11.5px] text-white/70">
            {item.caption || (item.takenAt ? `Recorded ${formatDate(item.takenAt)}` : '')}
          </p>
        </div>
        <span className="shrink-0 text-[11.5px] text-white/70">
          {index + 1} / {items.length}
        </span>
        <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 hover:bg-white/10">
          <X className="size-5" aria-hidden="true" />
        </button>
      </div>

      {/* Stop propagation so clicking the media itself does not dismiss. */}
      <div className="flex min-h-0 flex-1 items-center justify-center py-4" onClick={(e) => e.stopPropagation()}>
        {item.isVideo ? (
          <video src={item.url} controls playsInline className="max-h-full max-w-full rounded-lg" />
        ) : (
          /* `object-contain` keeps the whole frame visible; browser pinch-zoom
             and ctrl+scroll then work naturally on the element. */
          <img src={item.url} alt={item.caption || item.roomLabel} className="max-h-full max-w-full rounded-lg object-contain" />
        )}
      </div>

      {items.length > 1 && (
        <div className="scrollbar-none flex justify-center gap-2 overflow-x-auto" onClick={(e) => e.stopPropagation()}>
          {items.map((thumb, thumbIndex) => (
            <button
              key={thumb.id}
              type="button"
              onClick={() => onIndex(thumbIndex)}
              aria-label={`Show ${thumb.roomLabel}`}
              className={cn(
                'size-14 shrink-0 overflow-hidden rounded-md border-2',
                thumbIndex === index ? 'border-white' : 'border-transparent opacity-60 hover:opacity-100',
              )}
            >
              {thumb.isVideo ? (
                <span className="flex size-full items-center justify-center bg-white/15">
                  <Play className="size-4 text-white" aria-hidden="true" />
                </span>
              ) : (
                <img src={thumb.url} alt="" className="size-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* One stage                                                                   */
/* -------------------------------------------------------------------------- */

const StagePanel = ({ bookingId, stage }) => {
  const { data: inspection, isLoading } = useInspection(bookingId, stage.id);
  const { acknowledge, isPending } = useAcknowledgeInspection(bookingId);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  if (isLoading) return <Skeleton className="h-40 w-full rounded-card" />;

  // 404 — staff have not recorded anything for this stage.
  if (!inspection) return null;

  const { media, isComplete, isAcknowledged, acknowledgedAt, completedAt, notes } = inspection;

  return (
    <div className="rounded-card border border-line bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="inline-flex items-center gap-2 font-display text-[15px] font-semibold text-ink">
            <ClipboardCheck className="size-4 text-brand-600" aria-hidden="true" />
            {stage.title}
          </h3>
          <p className="mt-1 text-[12.5px] text-ink-soft">
            {stage.blurb}
            {completedAt && ` Recorded ${formatDate(completedAt)}.`}
          </p>
        </div>

        {isAcknowledged && (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-[11px] font-semibold text-brand-700">
            <BadgeCheck className="size-3" aria-hidden="true" />
            Confirmed
          </span>
        )}
      </div>

      {media.length > 0 ? (
        <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {media.map((item, index) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setLightboxIndex(index)}
                className="group relative block aspect-square w-full overflow-hidden rounded-lg border border-line"
                aria-label={`View ${item.roomLabel}${item.caption ? ` — ${item.caption}` : ''}`}
              >
                {item.isVideo ? (
                  <span className="flex size-full items-center justify-center bg-ink/80">
                    <Play className="size-6 text-white" aria-hidden="true" />
                  </span>
                ) : (
                  <img src={item.url} alt="" loading="lazy" className="size-full object-cover" />
                )}

                <span className="absolute inset-x-0 bottom-0 truncate bg-ink/65 px-1.5 py-1 text-[10px] text-white">
                  {item.roomLabel}
                </span>

                <span className="absolute right-1.5 top-1.5 rounded-full bg-ink/60 p-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <ZoomIn className="size-3 text-white" aria-hidden="true" />
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-[12.5px] text-ink-muted">No photographs were recorded for this stage.</p>
      )}

      {notes && (
        <p className="mt-3 rounded-lg bg-line-soft p-3 text-[12.5px] text-ink-soft">
          <span className="font-semibold text-ink">Inspector&apos;s note:</span> {notes}
        </p>
      )}

      {/* The three end states */}
      {isAcknowledged ? (
        <p className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] text-brand-700">
          <CheckCircle2 className="size-4" aria-hidden="true" />
          {stage.done}
          {acknowledgedAt && ` on ${formatDate(acknowledgedAt)}`}.
        </p>
      ) : isComplete ? (
        <>
          <Button
            className="mt-4"
            isLoading={isPending}
            disabled={isPending}
            onClick={() => acknowledge(stage.id)}
            leftIcon={<CheckCircle2 className="size-3.5" aria-hidden="true" />}
          >
            {stage.action}
          </Button>

          <p className="mt-2.5 inline-flex items-start gap-1.5 text-[11px] text-ink-muted">
            <Info className="mt-0.5 size-3 shrink-0 text-brand-600" aria-hidden="true" />
            Something not right? Use the message thread below before confirming — nothing is charged until this is
            settled.
          </p>
        </>
      ) : (
        <Alert variant="info" className="mt-4">
          This inspection is still in progress. You will be able to confirm it once our team has finished.
        </Alert>
      )}

      {lightboxIndex !== null && (
        <Lightbox
          items={media}
          index={lightboxIndex}
          onIndex={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
};

export const InspectionAcknowledgement = ({ bookingId, className }) => (
  <div className={cn('space-y-4', className)}>
    {STAGES.map((stage) => (
      <StagePanel key={stage.id} bookingId={bookingId} stage={stage} />
    ))}
  </div>
);
