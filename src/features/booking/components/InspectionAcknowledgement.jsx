import { CheckCircle2, ClipboardCheck, Info } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { formatDate } from '@/utils/format';
import { useAcknowledgeInspection } from '../hooks/useBookingMutations';

/**
 * Confirm a staff-completed check-in or check-out.
 *
 * The guest does not perform the inspection — staff photograph the property
 * and complete the stage, and the guest's role is to confirm afterwards that
 * it matched. `POST /inspections/{id}/{stage}/acknowledge/` is the only
 * inspection endpoint a guest may call; everything else is `IsLevel1Or2`.
 *
 * Gating comes from the timeline: the API refuses acknowledgement until a
 * stage is complete, so this only offers it once the corresponding step is
 * done.
 *
 * KNOWN LIMITATION — the API exposes no guest-readable acknowledgement flag.
 * `guest_acknowledged` exists on the model but appears in no guest payload, so
 * this cannot tell whether a guest has already confirmed and the prompt stays
 * visible. The endpoint is idempotent, so confirming twice is harmless. Once
 * that field is exposed on the booking or the timeline, gate on it here and
 * the confirmed state becomes real rather than local.
 */
const STAGES = [
  {
    id: 'checkin',
    step: 'checked_in',
    title: 'Confirm your check-in',
    done: 'Check-in confirmed',
    blurb: 'Please confirm the property was as expected when you arrived.',
    action: 'Yes, everything was as expected',
  },
  {
    id: 'checkout',
    step: 'checked_out',
    title: 'Confirm your check-out',
    done: 'Check-out confirmed',
    blurb: 'Please confirm you left the property in the condition recorded at check-out.',
    action: 'Yes, confirm my check-out',
  },
];

export const InspectionAcknowledgement = ({ bookingId, timeline, className }) => {
  const { acknowledge, isPending, stage: pendingStage } = useAcknowledgeInspection(bookingId);

  const steps = timeline?.steps ?? [];
  const available = STAGES.filter((stage) => steps.find((step) => step.id === stage.step)?.isComplete);

  // Nothing to confirm until staff have completed a stage.
  if (!available.length) return null;

  return (
    <div className={className}>
      {available.map((stage) => {
        const completedAt = steps.find((step) => step.id === stage.step)?.completedAt;

        return (
          <div key={stage.id} className="rounded-card border border-line bg-surface p-5 [&+&]:mt-4">
            <h3 className="inline-flex items-center gap-2 font-display text-[15px] font-semibold text-ink">
              <ClipboardCheck className="size-4 text-brand-600" aria-hidden="true" />
              {stage.title}
            </h3>

            <p className="mt-1 text-[12.5px] text-ink-soft">
              {stage.blurb}
              {completedAt && (
                <>
                  {' '}
                  Recorded on <span className="font-medium text-ink">{formatDate(completedAt)}</span>.
                </>
              )}
            </p>

            <Button
              size="sm"
              className="mt-3"
              isLoading={isPending && pendingStage === stage.id}
              disabled={isPending}
              onClick={() => acknowledge(stage.id)}
              leftIcon={<CheckCircle2 className="size-3.5" aria-hidden="true" />}
            >
              {stage.action}
            </Button>

            <p className="mt-2.5 inline-flex items-start gap-1.5 text-[11px] text-ink-muted">
              <Info className="mt-0.5 size-3 shrink-0 text-brand-600" aria-hidden="true" />
              Something not right? Use the message thread below and we will look into it before anything is charged.
            </p>
          </div>
        );
      })}

      <Alert variant="info" className="mt-4">
        Inspection photographs are held on your booking record. Ask us any time and we will share them with you.
      </Alert>
    </div>
  );
};
