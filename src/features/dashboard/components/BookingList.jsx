import { Link } from 'react-router-dom';
import { CreditCard, FileCheck, MapPin } from 'lucide-react';
import { Image } from '@/components/ui/Image';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatDate } from '@/utils/format';
import { cn } from '@/utils/classNames';
import { paths } from '@/routes/paths';
import { BOOKING_STATUS_LABELS } from '@/lib/bookingSchema';

/** Tone for each status the booking service can emit. */
const STATUS_VARIANT = {
  pending_payment: 'gold',
  pending_approval: 'gold',
  pending_kyc: 'gold',
  confirmed: 'verified',
  active: 'soft',
  completed: 'neutral',
  cancelled: 'neutral',
  refunded: 'soft',
};

export const BookingList = ({ bookings = [] }) => {
  if (!bookings.length) {
    return (
      <EmptyState
        title="No bookings yet"
        description="When you reserve a residence it will appear here with its status and payment details."
        action={<Button to={paths.properties}>Find a residence</Button>}
      />
    );
  }

  return (
    <ul className="divide-y divide-line">
      {bookings.map((booking) => {
        const isCancelled = ['cancelled', 'refunded'].includes(booking.status);

        return (
        <li key={booking.id} className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center">
          {/* Desaturated so a dead booking never competes with a live one. */}
          <Image
            src={booking.propertyImage}
            alt={booking.propertyName}
            wrapperClassName={cn('h-20 w-28 shrink-0 rounded-lg', isCancelled && 'opacity-50 grayscale')}
          />

          <div className="min-w-0 flex-1">
            <h3 className="truncate font-display text-[14px] font-semibold">
              <Link to={paths.bookingDetail(booking.id)} className="transition-colors hover:text-brand-700">
                {booking.propertyName}
              </Link>
            </h3>

            <p className="mt-1 text-[12px] text-ink-muted">
              {formatDate(booking.checkIn)} → {formatDate(booking.checkOut)} · {booking.nights}{' '}
              {booking.nights === 1 ? 'night' : 'nights'}
            </p>

            <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-ink-muted">
              <MapPin className="size-3 text-brand-600" aria-hidden="true" />
              Booked {formatDate(booking.createdAt)}
            </p>

            {/* The list endpoint does not return the agreement fields yet, so
                this only appears once it does — better a missing chip than one
                that claims "not agreed" because the data simply is not there. */}
            {booking.agreementAccepted !== null && booking.agreementAccepted !== undefined && (
              <p
                className={cn(
                  'mt-1 inline-flex items-center gap-1 text-[11px]',
                  booking.agreementAccepted ? 'text-brand-600' : 'text-ink-muted',
                )}
              >
                <FileCheck className="size-3" aria-hidden="true" />
                {booking.agreementAccepted
                  ? `Agreement accepted${booking.agreementAcceptedAt ? ` · ${formatDate(booking.agreementAcceptedAt)}` : ''}`
                  : 'Agreement outstanding'}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
            <Badge variant={STATUS_VARIANT[booking.status] ?? 'neutral'}>
              {booking.statusLabel ?? BOOKING_STATUS_LABELS[booking.status] ?? booking.status}
            </Badge>

            {/* A held booking still needs paying — send the guest back to it
                rather than leaving them to work out what to do next. A
                cancelled one needs nothing, so it only offers a way back in. */}
            <div className="flex items-center gap-2">
              {isCancelled && (
                <Button size="sm" variant="secondary" to={paths.propertyDetail(booking.propertyId)}>
                  Book again
                </Button>
              )}
              {booking.status === 'pending_payment' && (
                <Button
                  size="sm"
                  to={paths.bookingDetail(booking.id)}
                  leftIcon={<CreditCard className="size-3.5" aria-hidden="true" />}
                >
                  Complete payment
                </Button>
              )}
              <Button size="sm" variant="secondary" to={paths.bookingDetail(booking.id)}>
                View details
              </Button>
            </div>

            <p className="font-mono text-[10.5px] text-ink-muted">{String(booking.id).slice(0, 8)}</p>
          </div>
        </li>
        );
      })}
    </ul>
  );
};
