import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, CalendarDays, Copy, Eye, EyeOff, KeyRound, Star, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Alert } from '@/components/ui/Alert';
import { Textarea } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/utils/classNames';
import { formatDate } from '@/utils/format';
import { toast } from '@/stores/uiStore';
import { getErrorMessage } from '@/utils/errors';
import { queryKeys } from '@/lib/queryKeys';
import { bookingService } from '../services/bookingService';

/**
 * The three things a guest does around a stay: read the guidebook, ask to stay
 * longer, and leave a review afterwards.
 *
 * All three had buttons here already, disabled, under a heading that told
 * guests they were not connected. The endpoints existed the whole time.
 */

const RATING_ROWS = [
  { key: 'cleanliness', label: 'Cleanliness' },
  { key: 'accuracy', label: 'Accuracy of the listing' },
  { key: 'location', label: 'Location' },
  { key: 'value', label: 'Value for money' },
  { key: 'communication', label: 'Communication' },
];

/* -------------------------------------------------------------------------- */
/* Guidebook                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Credentials are masked and time-gated.
 *
 * The server already restricts the guidebook to guests with an active or
 * completed booking, which is the security boundary. This is a second, softer
 * one: a door code rendered into a page months before arrival is a code sitting
 * in someone's screenshots. Shown from the day before check-in, and behind a
 * deliberate tap either way.
 */
const Secret = ({ label, value, icon: Icon, isUnlocked, isSensitive = true }) => {
  /* The network *name* is not a secret — only the password and the door code
     are. Masking it too just adds a tap between a guest and their wifi. */
  const [isShown, setShown] = useState(!isSensitive);

  if (!value) return null;

  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-line p-2.5">
      <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700">
        <Icon className="size-3.5" aria-hidden="true" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-ink-muted">{label}</p>
        <p className="mt-0.5 truncate font-mono text-[13px] text-ink">
          {!isUnlocked ? '••••••••' : isShown ? value : '••••••••'}
        </p>
      </div>

      {isUnlocked ? (
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={() => setShown((current) => !current)}
            aria-label={isShown ? `Hide ${label}` : `Show ${label}`}
            className="rounded-md p-1.5 text-ink-muted hover:bg-line-soft hover:text-ink"
          >
            {isShown ? <EyeOff className="size-3.5" aria-hidden="true" /> : <Eye className="size-3.5" aria-hidden="true" />}
          </button>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(value);
              toast.success('Copied');
            }}
            aria-label={`Copy ${label}`}
            className="rounded-md p-1.5 text-ink-muted hover:bg-line-soft hover:text-ink"
          >
            <Copy className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <span className="shrink-0 text-[10.5px] text-ink-muted">From the day before</span>
      )}
    </div>
  );
};

const GuidebookModal = ({ booking, isOpen, onClose }) => {
  const { data: guidebook, isLoading } = useQuery({
    queryKey: queryKeys.bookings.guidebook(booking.propertyId),
    queryFn: () => bookingService.getGuidebook(booking.propertyId),
    enabled: isOpen && Boolean(booking.propertyId),
    retry: false,
  });

  /* Credentials unlock the day before check-in and stay available until the
     stay is over. Before that the guidebook is still readable, minus the keys. */
  const isUnlocked = (() => {
    const checkIn = new Date(booking.checkIn);
    checkIn.setDate(checkIn.getDate() - 1);
    return new Date() >= checkIn;
  })();

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title="Guidebook" description="Everything for this residence.">
      {isLoading && <Skeleton className="h-48 w-full" />}

      {!isLoading && !guidebook && (
        <Alert variant="info" title="No guidebook yet">
          The host has not written one for this residence. Message us and we will send what you need before arrival.
        </Alert>
      )}

      {guidebook && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Secret label="Wi-Fi network" value={guidebook.wifiName} icon={Wifi} isUnlocked isSensitive={false} />
            <Secret label="Wi-Fi password" value={guidebook.wifiPassword} icon={Wifi} isUnlocked={isUnlocked} />
            <Secret label="Door code" value={guidebook.smartLockCode} icon={KeyRound} isUnlocked={isUnlocked} />
          </div>

          {[
            { title: 'Getting in', body: guidebook.checkinInstructions },
            { title: 'When you leave', body: guidebook.checkoutInstructions },
            { title: 'House rules', body: guidebook.houseRules },
            { title: 'Local tips', body: guidebook.localTips },
          ]
            .filter((section) => section.body)
            .map((section) => (
              <section key={section.title}>
                <h3 className="text-[12.5px] font-semibold text-ink">{section.title}</h3>
                <p className="mt-1 whitespace-pre-wrap text-[12.5px] leading-5 text-ink-soft">{section.body}</p>
              </section>
            ))}

          {guidebook.emergencyContacts.length > 0 && (
            <section>
              <h3 className="text-[12.5px] font-semibold text-ink">Emergency contacts</h3>
              <ul className="mt-1 space-y-1">
                {guidebook.emergencyContacts.map((contact, index) => (
                  <li key={index} className="text-[12.5px] text-ink-soft">
                    {typeof contact === 'string' ? contact : `${contact.name ?? ''} ${contact.phone ?? ''}`.trim()}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </Modal>
  );
};

/* -------------------------------------------------------------------------- */
/* Extension                                                                   */
/* -------------------------------------------------------------------------- */

const ExtensionModal = ({ booking, isOpen, onClose }) => {
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');

  const request = useMutation({
    mutationFn: () =>
      bookingService.requestExtension({ bookingId: booking.id, requestedCheckOut: date, guestNote: note }),
    onSuccess: () => {
      toast.success('Extension requested', 'We will confirm availability and come back to you.');
      onClose();
    },
    onError: (error) => toast.error('Could not request an extension', getErrorMessage(error)),
  });

  /* The server requires at least one night beyond the current check-out. */
  const minDate = (() => {
    const next = new Date(booking.checkOut);
    next.setDate(next.getDate() + 1);
    return next.toISOString().slice(0, 10);
  })();

  const extraNights = date
    ? Math.round((new Date(date) - new Date(booking.checkOut)) / 86_400_000)
    : 0;

  /* Crossing roughly six months turns the stay into a contracted tenancy. */
  const totalNights = date
    ? Math.round((new Date(date) - new Date(booking.checkIn)) / 86_400_000)
    : booking.nights;
  const crossesThreshold = totalNights >= 183 && (booking.nights ?? 0) < 183;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title="Request an extension"
      description={`Currently checking out ${formatDate(booking.checkOut)}.`}
    >
      <label className="block">
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted">
          New check-out date
        </span>
        <input
          type="date"
          min={minDate}
          value={date}
          onChange={(event) => setDate(event.target.value)}
          className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-[13px] text-ink focus:border-brand-600 focus:outline-none"
        />
      </label>

      {extraNights > 0 && (
        <p className="mt-2 text-[12px] text-ink-soft">
          {extraNights} extra night{extraNights === 1 ? '' : 's'}. We will confirm the price before anything is charged.
        </p>
      )}

      {crossesThreshold && (
        <Alert variant="warn" className="mt-3" title="This would make it a long stay">
          Past six months a stay becomes a tenancy — it needs a signed agreement and fuller identity checks. We will
          walk you through both if you go ahead.
        </Alert>
      )}

      <Textarea
        label="Anything we should know?"
        className="mt-3"
        rows={3}
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Optional — flights moved, work extended, anything useful."
      />

      <div className="mt-4 flex justify-end gap-2 border-t border-line pt-4">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          disabled={!date || extraNights < 1 || request.isPending}
          isLoading={request.isPending}
          onClick={() => request.mutate()}
        >
          Request {extraNights > 0 ? `${extraNights} more night${extraNights === 1 ? '' : 's'}` : 'extension'}
        </Button>
      </div>
    </Modal>
  );
};

/* -------------------------------------------------------------------------- */
/* Review                                                                      */
/* -------------------------------------------------------------------------- */

const StarRow = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between gap-3 py-1.5">
    <span className="text-[12.5px] text-ink">{label}</span>
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((score) => (
        <button
          key={score}
          type="button"
          onClick={() => onChange(score)}
          aria-label={`${label}: ${score} of 5`}
          className="p-0.5"
        >
          <Star
            className={cn('size-4', score <= value ? 'fill-gold text-gold' : 'text-line')}
            aria-hidden="true"
          />
        </button>
      ))}
    </span>
  </div>
);

const ReviewModal = ({ booking, isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [ratings, setRatings] = useState({
    cleanliness: 0,
    accuracy: 0,
    location: 0,
    value: 0,
    communication: 0,
  });
  const [body, setBody] = useState('');

  const scores = Object.values(ratings).filter(Boolean);
  /* The API models an overall score separately; averaging the five the guest
     actually gave is more honest than asking for a sixth. */
  const overall = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const isComplete = scores.length === RATING_ROWS.length && body.trim().length >= 10;

  const submit = useMutation({
    mutationFn: () =>
      bookingService.createReview({
        bookingId: booking.id,
        propertyId: booking.propertyId,
        ratings,
        overall,
        body: body.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.reviews(booking.propertyId) });
      toast.success('Thank you', 'Your review is published on the listing.');
      onClose();
    },
    onError: (error) => toast.error('Could not publish your review', getErrorMessage(error)),
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" title="Leave a review" description="How was the stay?">
      <div className="divide-y divide-line border-y border-line">
        {RATING_ROWS.map((row) => (
          <StarRow
            key={row.key}
            label={row.label}
            value={ratings[row.key]}
            onChange={(score) => setRatings((current) => ({ ...current, [row.key]: score }))}
          />
        ))}
      </div>

      {overall > 0 && (
        <p className="mt-2.5 text-[12px] text-ink-soft">
          Overall <span className="font-semibold text-ink">{overall} / 5</span>, averaged from your ratings.
        </p>
      )}

      <Textarea
        label="Your review"
        className="mt-3"
        rows={4}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="What would you tell someone considering this place?"
      />

      <div className="mt-4 flex justify-end gap-2 border-t border-line pt-4">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button disabled={!isComplete || submit.isPending} isLoading={submit.isPending} onClick={() => submit.mutate()}>
          Publish review
        </Button>
      </div>
    </Modal>
  );
};

/* -------------------------------------------------------------------------- */

/** Days after checkout during which a review is accepted — the API's own rule. */
const REVIEW_WINDOW_DAYS = 14;

export const StayExtras = ({ booking }) => {
  const [open, setOpen] = useState(null);

  /* Mirrors the server's own guard so the button is not offered when the
     request would be refused. */
  const canExtend = ['active', 'confirmed', 'pending_approval'].includes(booking.status);

  /*
   * Reviews are gated three ways server-side, and the UI mirrors all three
   * rather than offering a button that 400s after the guest has written
   * something: the booking must be `completed` (not merely past its checkout
   * date), it must be within 14 days of checkout, and there must not already
   * be one. Existing reviews are found by reading the listing's public reviews
   * and matching on booking id — there is no per-booking review endpoint.
   */
  const { data: listingReviews = [] } = useQuery({
    queryKey: queryKeys.bookings.reviews(booking.propertyId),
    queryFn: () => bookingService.getReviews(booking.propertyId).catch(() => []),
    enabled: booking.status === 'completed' && Boolean(booking.propertyId),
    retry: false,
  });

  const daysSinceCheckout = Math.floor((Date.now() - new Date(booking.checkOut)) / 86_400_000);
  const isCompleted = booking.status === 'completed';
  const hasReviewed = listingReviews.some((review) => review.bookingId === booking.id);
  const isWindowOpen = daysSinceCheckout <= REVIEW_WINDOW_DAYS;

  /** Why a review cannot be left, or null when it can. */
  const reviewBlockedReason = !isCompleted
    ? 'You can leave a review once your stay is complete.'
    : hasReviewed
      ? 'You have already reviewed this stay. Thank you.'
      : !isWindowOpen
        ? `Reviews close ${REVIEW_WINDOW_DAYS} days after checkout, so this one is now closed.`
        : null;

  const canReview = isCompleted && !hasReviewed && isWindowOpen;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setOpen('guidebook')}
          leftIcon={<BookOpen className="size-3.5" aria-hidden="true" />}
        >
          Open guidebook
        </Button>

        {canExtend && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setOpen('extension')}
            leftIcon={<CalendarDays className="size-3.5" aria-hidden="true" />}
          >
            Request an extension
          </Button>
        )}

        {/*
          Shown either way. Someone who came here to leave a review should
          learn why they cannot rather than find the button simply absent and
          assume it is broken.
        */}
        <Button
          size="sm"
          variant="secondary"
          disabled={!canReview}
          onClick={() => setOpen('review')}
          leftIcon={<Star className="size-3.5" aria-hidden="true" />}
        >
          Leave a review
        </Button>
      </div>

      {reviewBlockedReason && <p className="mt-2 text-[11px] text-ink-muted">{reviewBlockedReason}</p>}

      {canReview && daysSinceCheckout >= REVIEW_WINDOW_DAYS - 3 && (
        <p className="mt-2 text-[11px] text-gold-ink">
          {REVIEW_WINDOW_DAYS - daysSinceCheckout} day
          {REVIEW_WINDOW_DAYS - daysSinceCheckout === 1 ? '' : 's'} left to review this stay.
        </p>
      )}

      <GuidebookModal booking={booking} isOpen={open === 'guidebook'} onClose={() => setOpen(null)} />
      <ExtensionModal booking={booking} isOpen={open === 'extension'} onClose={() => setOpen(null)} />
      <ReviewModal booking={booking} isOpen={open === 'review'} onClose={() => setOpen(null)} />
    </>
  );
};
