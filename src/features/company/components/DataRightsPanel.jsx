import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Download, FileText, ShieldCheck, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Input';
import { cn } from '@/utils/classNames';
import { toast } from '@/stores/uiStore';
import { getErrorMessage } from '@/utils/errors';
import { authService } from '@/features/auth/services/authService';

/**
 * Your data — export, correction, deletion.
 *
 * We operate in the UK and Spain, so these are obligations rather than
 * features, and there was no surface for any of them.
 *
 * Deliberately submit-only. `GET /compliance/data-requests/` is restricted to
 * staff roles, so a guest cannot read back what they have asked for — and a
 * "your requests" list that always renders empty would be worse than not
 * offering one. The confirmation says what happens next instead.
 */

const REQUESTS = [
  {
    id: 'export',
    icon: Download,
    title: 'Get a copy of my data',
    blurb: 'Everything we hold about you and your stays, in a portable format.',
    cta: 'Request an export',
  },
  {
    id: 'correction',
    icon: FileText,
    title: 'Correct something',
    blurb: 'Tell us what is wrong and we will put it right.',
    cta: 'Request a correction',
  },
  {
    id: 'deletion',
    icon: Trash2,
    title: 'Delete my data',
    blurb: 'We must keep some records for legal and tax reasons — we will tell you exactly what and why.',
    cta: 'Request deletion',
    isDestructive: true,
  },
];

export const DataRightsPanel = ({ className }) => {
  const [active, setActive] = useState(null);
  const [notes, setNotes] = useState('');

  const submit = useMutation({
    mutationFn: () => authService.requestData({ requestType: active.id, notes }),
    onSuccess: () => {
      toast.success('Request received', 'We will confirm by email within 30 days, as the regulation requires.');
      setActive(null);
      setNotes('');
    },
    onError: (error) => toast.error('Could not submit the request', getErrorMessage(error)),
  });

  return (
    <section className={cn('rounded-card border border-line bg-surface p-5 shadow-card', className)}>
      <h2 className="inline-flex items-center gap-2 font-display text-[15px] font-semibold text-ink">
        <ShieldCheck className="size-4 text-brand-600" aria-hidden="true" />
        Your data
      </h2>
      <p className="mt-1 text-[12.5px] leading-5 text-ink-soft">
        You can ask for a copy of what we hold, have it corrected, or have it deleted. We answer within 30 days.
      </p>

      <ul className="mt-4 space-y-2.5">
        {REQUESTS.map((request) => {
          const Icon = request.icon;

          return (
            <li
              key={request.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-line p-3.5"
            >
              <div className="flex min-w-0 items-start gap-2.5">
                <span
                  className={cn(
                    'mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg',
                    request.isDestructive ? 'bg-danger/10 text-danger-ink' : 'bg-brand-50 text-brand-700',
                  )}
                >
                  <Icon className="size-3.5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-[12.5px] font-semibold text-ink">{request.title}</p>
                  <p className="mt-0.5 text-[11.5px] leading-4 text-ink-soft">{request.blurb}</p>
                </div>
              </div>

              <Button
                size="sm"
                variant={request.isDestructive ? 'ghost' : 'secondary'}
                onClick={() => setActive(request)}
                className="shrink-0"
              >
                {request.cta}
              </Button>
            </li>
          );
        })}
      </ul>

      <Modal
        isOpen={Boolean(active)}
        onClose={() => setActive(null)}
        size="md"
        title={active?.title ?? ''}
        description="We will confirm by email and answer within 30 days."
      >
        {active?.isDestructive && (
          <Alert variant="warn" title="Some records cannot be deleted">
            Booking, payment and tax records must be kept for a legally defined period. We will delete everything we
            can and tell you precisely what is retained, why, and for how long.
          </Alert>
        )}

        <Textarea
          label={active?.id === 'correction' ? 'What needs correcting?' : 'Anything to add? (optional)'}
          className="mt-4"
          rows={3}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder={
            active?.id === 'correction'
              ? 'For example: my surname is spelled wrong on my bookings.'
              : 'Optional context for our team.'
          }
        />

        <div className="mt-4 flex justify-end gap-2 border-t border-line pt-4">
          <Button variant="ghost" onClick={() => setActive(null)}>
            Cancel
          </Button>
          <Button
            variant={active?.isDestructive ? 'danger' : 'primary'}
            isLoading={submit.isPending}
            disabled={submit.isPending || (active?.id === 'correction' && notes.trim().length < 5)}
            onClick={() => submit.mutate()}
          >
            Submit request
          </Button>
        </div>
      </Modal>
    </section>
  );
};
