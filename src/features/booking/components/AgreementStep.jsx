import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowDown,
  BadgeCheck,
  CalendarRange,
  Check,
  Download,
  FileText,
  Loader2,
  Mail,
  MapPin,
  PenLine,
  ScrollText,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { errorBanner } from '@/stores/uiStore';
import { Skeleton } from '@/components/ui/Skeleton';
import { StepShell, StepActions } from './StepShell';
import { cn } from '@/utils/classNames';
import { formatDate } from '@/utils/format';
import { getErrorMessage } from '@/utils/errors';
import { queryKeys } from '@/lib/queryKeys';
import { resolveAgreement } from '@/lib/agreementSchema';
import { bookingService, errorCode } from '../services/bookingService';
import {
  useAcceptAgreement,
  useContractText,
  useResendContract,
  useStartContract,
} from '../hooks/useBookingMutations';

/**
 * The terms of the stay, as their own step between verification and payment.
 *
 * Which route applies is the server's call, from the length of the stay:
 *
 *  - Under 183 nights (`contract_required` false) — the guest reads the terms
 *    and ticks to accept. The text comes from the template Super Admin
 *    published for the region and stay length, and the template version is
 *    sent back so the server keeps a copy of exactly what was accepted.
 *  - 183 nights or more — the guest signs a contract in Dropbox Sign's window,
 *    here in the app. The signing link is emailed as well.
 *
 * Either way, payment stays locked until the server records the acceptance or
 * the signature. A signature is only "done" once Dropbox Sign confirms it to
 * the server, not when the signing window closes.
 */

/* -------------------------------------------------------------------------- */
/* Built-in terms                                                              */
/* -------------------------------------------------------------------------- */

/**
 * The terms used while nothing is published for this region and stay length.
 * One source for both what is shown and what is sent as `fallback_content`,
 * so the stored copy always matches what the guest read.
 */
const buildFallbackClauses = ({ agreement, booking, property }) => [
  {
    title: 'Nature of occupation',
    body: `This agreement grants you a personal, non-exclusive right to occupy ${
      property?.name ?? 'the property'
    } for the dates booked${
      booking?.checkIn ? ` (${formatDate(booking.checkIn)} to ${formatDate(booking.checkOut)})` : ''
    }. It is a licence to occupy, not a tenancy, and confers no exclusive possession or security of tenure.`,
  },
  {
    title: 'Payment',
    body: 'The total shown, including all taxes and fees, is payable in full before check-in. Your booking is held but not confirmed until payment completes.',
  },
  {
    title: 'Security deposit',
    body: 'A refundable deposit is taken and released after checkout, less the cost of any damage beyond fair wear and tear. For stays under four weeks it is held as a pre-authorisation and released within seven days; for longer stays it is charged and refunded within fourteen.',
  },
  {
    title: 'Use of the property',
    body: 'The property is for lawful personal accommodation only. Sub-letting, parties, events and commercial filming are not permitted. Smoking and pets are prohibited unless the listing states otherwise.',
  },
  {
    title: 'Damage and liability',
    body: 'You are responsible for damage caused during your stay beyond fair wear and tear. Costs are taken from the deposit and, where that is insufficient, invoiced separately.',
  },
  {
    title: 'Cancellation',
    body: 'Cancellations follow the policy shown with your booking. We may end this agreement immediately for a serious breach of these terms, without refund.',
  },
  {
    title: 'Data protection',
    body: `Your personal data is processed under our Privacy Policy and the law applying in ${agreement.market} — UK GDPR, EU GDPR, NDPR or PDPL as relevant. Identity documents are held only as long as needed to meet our legal obligations.`,
  },
];

const FALLBACK_FOOTER =
  'These terms form part of your booking confirmation. A copy is available at any time from your dashboard or by emailing support@alotelspaces.com.';

const fallbackText = (agreement, clauses) =>
  [
    `${agreement.name} · ${agreement.bandLabel} · ${agreement.market}`,
    ...clauses.map((clause, index) => `${index + 1}. ${clause.title}\n${clause.body}`),
    FALLBACK_FOOTER,
  ].join('\n\n');

const FallbackTerms = ({ agreement, clauses }) => (
  <div className="space-y-4">
    <p className="text-[12.5px] text-ink-muted">
      {agreement.name} · {agreement.bandLabel} · {agreement.market}
    </p>

    <ol className="space-y-4">
      {clauses.map((clause, index) => (
        <li key={clause.title}>
          <p className="text-[13px] font-semibold text-ink">
            {index + 1}. {clause.title}
          </p>
          <p className="mt-1">{clause.body}</p>
        </li>
      ))}
    </ol>

    <p className="border-t border-line pt-3 text-[12px] text-ink-muted">{FALLBACK_FOOTER}</p>
  </div>
);

/* -------------------------------------------------------------------------- */
/* Shared pieces                                                               */
/* -------------------------------------------------------------------------- */

const DocumentHeader = ({ name, badge, facts }) => (
  <div className="overflow-hidden rounded-card border border-line">
    <div className="flex flex-wrap items-start justify-between gap-3 bg-brand-700 px-5 py-4 text-white">
      <div className="min-w-0">
        <p className="inline-flex items-center gap-2 font-display text-[16px] font-semibold">
          <ScrollText className="size-4 shrink-0" aria-hidden="true" />
          {name}
        </p>
        <p className="mt-1 text-[11.5px] text-white/70">
          The agreement that applies to this stay, set by its length and location.
        </p>
      </div>

      {badge && (
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold">
          <BadgeCheck className="size-3" aria-hidden="true" />
          {badge}
        </span>
      )}
    </div>

    <dl className="grid grid-cols-2 gap-px bg-line sm:grid-cols-4">
      {facts.map((fact) => (
        <div key={fact.label} className="bg-surface px-4 py-3">
          <dt className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.07em] text-ink-muted">
            <fact.icon className="size-3 text-brand-600" aria-hidden="true" />
            {fact.label}
          </dt>
          <dd className="mt-1 truncate text-[13px] font-medium text-ink">{fact.value}</dd>
        </div>
      ))}
    </dl>
  </div>
);

/** Shown in place of the terms when they cannot be offered for this booking. */
const TermsUnavailable = ({ state, needsSignature }) => (
  <Alert variant="warn" title="Your agreement is not ready yet" className="mt-5">
    {state === 'render_failed'
      ? 'The terms for this stay could not be prepared with your booking details. '
      : `${needsSignature ? 'No contract has' : 'No terms have'} been published for this location and stay length yet. `}
    You cannot continue to payment until they are. Your dates stay held — message us from your booking and we will
    sort it out.
  </Alert>
);

/* -------------------------------------------------------------------------- */
/* Tick to accept — under 183 nights                                           */
/* -------------------------------------------------------------------------- */

const ClickAccept = ({ booking, text, agreement, clauses, onBack, onContinue, continueLabel }) => {
  const scrollRef = useRef(null);
  const [hasReachedEnd, setHasReachedEnd] = useState(false);
  const [isTicked, setIsTicked] = useState(false);
  const [error, setError] = useState('');
  const [termsChanged, setTermsChanged] = useState(false);

  const { acceptAgreementAsync, isPending } = useAcceptAgreement();

  const isAccepted = Boolean(booking.agreementAccepted);
  const isBlocked = !isAccepted && text.state === 'render_failed';
  const fromTemplate = text.state === 'ready';
  const body = fromTemplate ? text.content : '';

  /**
   * A document short enough not to scroll counts as read. Re-evaluated when
   * the text changes rather than latched, so newer terms have to be read too.
   */
  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    setHasReachedEnd(node.scrollHeight <= node.clientHeight + 8);
  }, [body]);

  const onScroll = (event) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    if (scrollTop + clientHeight >= scrollHeight - 24) setHasReachedEnd(true);
  };

  const jumpToEnd = () => {
    const node = scrollRef.current;
    if (node) node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' });
  };

  const accept = async () => {
    setError('');
    setTermsChanged(false);

    try {
      const result = await acceptAgreementAsync({
        bookingId: booking.id,
        ...(fromTemplate
          ? { templateId: text.template?.id, templateVersion: text.template?.version }
          : { fallbackContent: fallbackText(agreement, clauses) }),
      });

      /* Newer terms were published while the guest was reading. The hook has
         already swapped them in; the guest reads and ticks again. */
      if (result?.termsChanged) {
        setTermsChanged(true);
        setIsTicked(false);
        setHasReachedEnd(false);
        scrollRef.current?.scrollTo({ top: 0 });
        return;
      }

      onContinue();
    } catch (acceptError) {
      setError(getErrorMessage(acceptError));
    }
  };

  if (isBlocked) {
    return (
      <>
        <TermsUnavailable state={text.state} needsSignature={false} />
        <StepActions>
          <Button fullWidth size="lg" disabled>
            Terms needed to continue
          </Button>
          {onBack && (
            <Button variant="ghost" fullWidth onClick={onBack}>
              Back
            </Button>
          )}
        </StepActions>
      </>
    );
  }

  const canAccept = hasReachedEnd && isTicked;

  return (
    <>
      {termsChanged && (
        <Alert variant="warn" title="These terms were just updated" className="mt-5">
          A newer version was published while you were reading. Please read it and confirm again.
        </Alert>
      )}

      <div className="relative mt-5">
        <div
          ref={scrollRef}
          onScroll={onScroll}
          tabIndex={0}
          role="region"
          aria-label={`${agreement.name} terms`}
          className={cn(
            'scrollbar-slim h-[22rem] overflow-y-auto rounded-card border bg-surface p-5 text-[13px] leading-6 text-ink-soft transition-colors',
            hasReachedEnd || isAccepted ? 'border-line' : 'border-brand-200',
          )}
        >
          {fromTemplate ? (
            <div className="whitespace-pre-wrap">{body}</div>
          ) : (
            <FallbackTerms agreement={agreement} clauses={clauses} />
          )}
        </div>

        {!hasReachedEnd && !isAccepted && (
          <>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-px bottom-px h-20 rounded-b-card bg-gradient-to-t from-surface to-transparent"
            />
            <button
              type="button"
              onClick={jumpToEnd}
              className="absolute bottom-4 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-brand-700 px-3.5 py-1.5 text-[11.5px] font-semibold text-white shadow-raised transition-colors hover:bg-brand-800"
            >
              <ArrowDown className="size-3" aria-hidden="true" />
              Skip to the end
            </button>
          </>
        )}
      </div>

      {isAccepted ? (
        <Alert variant="success" title="You have agreed to these terms" className="mt-4">
          Accepted{booking.agreementAcceptedAt ? ` on ${formatDate(booking.agreementAcceptedAt)}` : ''}. We keep a copy
          of the exact wording you accepted.
        </Alert>
      ) : (
        <>
          <p
            className={cn(
              'mt-2 inline-flex items-center gap-1.5 text-[11.5px] transition-colors',
              hasReachedEnd ? 'text-brand-600' : 'text-ink-muted',
            )}
          >
            {hasReachedEnd ? (
              <>
                <Check className="size-3.5" aria-hidden="true" />
                You have reached the end
              </>
            ) : (
              <>
                <ArrowDown className="size-3.5" aria-hidden="true" />
                Scroll to the end to enable the confirmation below
              </>
            )}
          </p>

          <button
            type="button"
            disabled={!hasReachedEnd || isPending}
            onClick={() => setIsTicked((value) => !value)}
            aria-pressed={isTicked}
            className={cn(
              'mt-4 flex w-full items-start gap-3 rounded-card border p-4 text-left transition-all',
              !hasReachedEnd && 'cursor-not-allowed border-line bg-line-soft opacity-60',
              hasReachedEnd && !isTicked && 'border-line bg-surface hover:border-brand-300',
              isTicked && 'border-brand-600 bg-brand-50/60',
            )}
          >
            <span
              className={cn(
                'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors',
                isTicked ? 'border-brand-700 bg-brand-700' : 'border-line bg-surface',
              )}
            >
              {isTicked && <Check className="size-3 text-white" aria-hidden="true" />}
            </span>

            <span className="min-w-0 text-[13px] leading-6 text-ink">
              I have read and agree to the <span className="font-semibold">{agreement.name}</span>, and I confirm the
              stay details shown are correct.
            </span>
          </button>

          {error && <p className="mt-2 text-[12.5px] text-danger">{error}</p>}

          <p className="mt-3 inline-flex items-start gap-1.5 text-[11.5px] text-ink-muted">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-brand-600" aria-hidden="true" />
            We record the date, time and wording you agree to. Your booking cannot be paid for without it.
          </p>
        </>
      )}

      <StepActions>
        <Button
          fullWidth
          size="lg"
          disabled={isAccepted ? false : !canAccept || isPending}
          isLoading={isPending}
          onClick={isAccepted ? onContinue : accept}
        >
          {isAccepted ? continueLabel : 'Agree and continue'}
        </Button>
        {onBack && (
          <Button variant="ghost" fullWidth onClick={onBack} disabled={isPending}>
            Back
          </Button>
        )}
      </StepActions>
    </>
  );
};

/* -------------------------------------------------------------------------- */
/* Signature — 183 nights or more                                              */
/* -------------------------------------------------------------------------- */

/** How long to wait on Dropbox Sign's confirmation before saying so. */
const SLOW_CONFIRM_MS = 2 * 60 * 1000;

const minutesFrom = (seconds) => Math.max(1, Math.ceil(seconds / 60));

const SignContract = ({ booking, text, onBack, onContinue, continueLabel, onTextRefetch }) => {
  const queryClient = useQueryClient();
  const clientRef = useRef(null);
  const signedRef = useRef(false);

  const [phase, setPhase] = useState('idle'); // idle | opening | signing | confirming | error
  const [message, setMessage] = useState('');
  /* Set when the failure came from Dropbox Sign rather than from anything the
     guest did, so the notice can say so instead of implying they got it wrong. */
  const [isProviderFault, setIsProviderFault] = useState(false);
  const [emailNote, setEmailNote] = useState(null); // { tone, text }
  const [isSlow, setIsSlow] = useState(false);
  const [isOpeningCopy, setIsOpeningCopy] = useState(false);

  const { startContractAsync, isPending: isStarting } = useStartContract();
  const { resendContractAsync, isPending: isResending } = useResendContract(booking.id);

  const contract = text.contract ?? booking.contract ?? null;
  const isSigned = contract?.status === 'signed';
  const isBlocked = !isSigned && !contract && (text.state === 'unpublished' || text.state === 'render_failed');

  /* Close the signing window if the guest navigates away mid-signature. */
  useEffect(
    () => () => {
      try {
        clientRef.current?.close();
      } catch {
        /* already closed */
      }
    },
    [],
  );

  /* The server hears about a signature from Dropbox Sign, a moment after the
     window closes. While waiting, check for it. */
  useEffect(() => {
    if (phase !== 'confirming') return undefined;
    if (isSigned) {
      setPhase('idle');
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(booking.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.list() });
      return undefined;
    }
    const poll = setInterval(onTextRefetch, 3000);
    const slow = setTimeout(() => setIsSlow(true), SLOW_CONFIRM_MS);
    return () => {
      clearInterval(poll);
      clearTimeout(slow);
    };
  }, [phase, isSigned, booking.id, queryClient, onTextRefetch]);

  const failWith = (error) => {
    const code = errorCode(error);
    if (code === 'no_published_template' || code === 'template_render_failed') {
      onTextRefetch();
      setPhase('idle');
      return;
    }
    if (code === 'already_signed') {
      setPhase('confirming');
      onTextRefetch();
      return;
    }
    setPhase('error');
    const providerFault = code === 'provider_error';
    setIsProviderFault(providerFault);

    const text = providerFault
      ? 'Signing is not available right now. Please try again shortly, or use the link we email you.'
      : code === 'expired'
        ? 'That signing link expired. Try again and we will issue a fresh one.'
        : getErrorMessage(error);

    setMessage(text);

    /* Top of the page, not under a contract that scrolls for pages — the same
       place every other failure in the app now appears. */
    errorBanner.show({
      title: providerFault ? 'Signing is unavailable right now' : 'Not signed yet',
      message: text,
      detail: providerFault
        ? 'This is on our side, not yours — the signing provider refused the request. Your dates stay held and nothing has been charged.'
        : undefined,
      tone: providerFault ? 'temporary' : 'fixable',
      reference: providerFault ? 'DBX-SIGN' : undefined,
    });
  };

  const sign = async () => {
    errorBanner.dismiss();
    setPhase('opening');
    setMessage('');
    setIsProviderFault(false);
    setIsSlow(false);
    signedRef.current = false;

    try {
      const started = await startContractAsync(booking.id);
      if (started.alreadySigned) {
        setPhase('confirming');
        onTextRefetch();
        return;
      }

      /* Signing URLs last minutes, so one is fetched every time the window opens. */
      const { signUrl, clientId, testMode } = await bookingService.getContractSignUrl(started.contractId);

      /* Dropbox Sign's embedded window needs both. A response missing either
         means the server is not fully configured for embedded signing, and
         opening the window anyway fails with nothing a guest could act on. */
      if (!signUrl || !clientId) {
        setPhase('error');
        setIsProviderFault(true);
        setMessage('Signing is not configured correctly on our side, so the window cannot open.');
        return;
      }
      const { default: HelloSign } = await import('hellosign-embedded');

      const client = new HelloSign({ clientId });
      clientRef.current = client;

      client.on('sign', () => {
        signedRef.current = true;
        setPhase('confirming');
      });
      client.on('decline', () => {
        setPhase('error');
        setMessage('You declined to sign. Your booking cannot be paid for until the contract is signed.');
      });
      client.on('error', () => {
        setPhase('error');
        setMessage('The signing window ran into a problem. Please try again.');
      });
      client.on('close', () => {
        clientRef.current = null;
        if (!signedRef.current) setPhase((current) => (current === 'signing' ? 'idle' : current));
      });

      client.open(signUrl, { testMode, skipDomainVerification: testMode, allowCancel: true });
      setPhase('signing');
    } catch (error) {
      failWith(error);
    }
  };

  const emailLink = async () => {
    setEmailNote(null);
    try {
      /* Starting the contract emails the link, so a guest with no contract yet
         only needs that. Otherwise the link is sent again. */
      if (contract?.status !== 'sent') {
        const started = await startContractAsync(booking.id);
        if (started.alreadySigned) onTextRefetch();
        else setEmailNote({ tone: 'success', text: 'We have emailed you a link to sign.' });
        return;
      }
      await resendContractAsync(contract.contractId);
      setEmailNote({ tone: 'success', text: 'We have emailed you the signing link again.' });
    } catch (error) {
      if (errorCode(error) === 'too_soon') {
        const seconds = error.response?.data?.retry_after_seconds ?? 600;
        setEmailNote({
          tone: 'muted',
          text: `We emailed you a link a few minutes ago. You can ask for another in ${minutesFrom(seconds)} min.`,
        });
        return;
      }
      setEmailNote({ tone: 'error', text: getErrorMessage(error) });
    }
  };

  const openSignedCopy = async () => {
    /* Opened before the request so the browser does not treat it as a pop-up. */
    const tab = window.open('', '_blank');
    setIsOpeningCopy(true);
    try {
      const { fileUrl } = await bookingService.getContractDocument(contract.contractId);
      if (tab) tab.location.href = fileUrl;
      else window.location.assign(fileUrl);
    } catch (error) {
      tab?.close();
      setPhase('error');
      setMessage(getErrorMessage(error));
    } finally {
      setIsOpeningCopy(false);
    }
  };

  if (isBlocked) {
    return (
      <>
        <TermsUnavailable state={text.state} needsSignature />
        <StepActions>
          <Button fullWidth size="lg" disabled>
            Contract needed to continue
          </Button>
          {onBack && (
            <Button variant="ghost" fullWidth onClick={onBack}>
              Back
            </Button>
          )}
        </StepActions>
      </>
    );
  }

  const isBusy = phase === 'opening' || phase === 'signing' || isStarting;

  return (
    <>
      {text.state === 'ready' && text.content && (
        <div className="mt-5">
          <p className="mb-2 text-[11.5px] font-medium text-ink-muted">
            {isSigned ? 'The contract you signed' : 'Read it here first — you sign the same wording in the next window.'}
          </p>
          <div
            tabIndex={0}
            role="region"
            aria-label="Contract text"
            className="scrollbar-slim h-[18rem] overflow-y-auto whitespace-pre-wrap rounded-card border border-line bg-surface p-5 text-[13px] leading-6 text-ink-soft"
          >
            {text.content}
          </div>
        </div>
      )}

      <div className="mt-4" aria-live="polite">
        {isSigned ? (
          <Alert variant="success" title="Contract signed">
            Signed{contract.signedAt ? ` on ${formatDate(contract.signedAt)}` : ''}. You can continue to payment.
          </Alert>
        ) : phase === 'confirming' ? (
          <Alert
            variant="info"
            title="Confirming your signature"
            icon={<Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          >
            <p>Dropbox Sign is confirming your signature with us. This usually takes a few seconds.</p>
            {isSlow && (
              <p className="mt-2">
                This is taking longer than usual. You can leave this page — your dates stay held, and payment opens
                from your booking as soon as the signature is confirmed.
              </p>
            )}
          </Alert>
        ) : phase === 'error' ? (
          /* The banner at the top of the page carries what went wrong. This
             says what it means for the booking, beside the buttons that fix
             it — the contract above scrolls for pages, so the detail belongs
             where the guest is looking, not at the end of it. */
          <Alert variant={isProviderFault ? 'warn' : 'error'} title="Not signed yet">
            {isProviderFault
              ? 'Your dates stay held and nothing has been charged. Try again in a few minutes, or use the link we email you.'
              : message}
          </Alert>
        ) : (
          <Alert variant="secure" title="Sign here, in the app">
            Stays of six months or more use a signed contract. It opens in a secure Dropbox Sign window on this page —
            payment opens once it is signed.
            {contract?.status === 'sent' && contract.expiresAt
              ? ` Your current signing request is valid until ${formatDate(contract.expiresAt)}.`
              : ''}
          </Alert>
        )}

        {emailNote && (
          <p
            className={cn(
              'mt-2 text-[12px]',
              emailNote.tone === 'error' ? 'text-danger' : emailNote.tone === 'success' ? 'text-brand-700' : 'text-ink-muted',
            )}
          >
            {emailNote.text}
          </p>
        )}
      </div>

      <StepActions>
        {isSigned ? (
          <>
            <Button fullWidth size="lg" onClick={onContinue}>
              {continueLabel}
            </Button>
            <Button
              variant="secondary"
              fullWidth
              onClick={openSignedCopy}
              isLoading={isOpeningCopy}
              disabled={isOpeningCopy}
              leftIcon={<Download className="size-4" aria-hidden="true" />}
            >
              View signed copy
            </Button>
          </>
        ) : (
          <>
            <Button
              fullWidth
              size="lg"
              onClick={sign}
              disabled={isBusy || phase === 'confirming'}
              leftIcon={
                isBusy ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <PenLine className="size-4" aria-hidden="true" />
                )
              }
            >
              {phase === 'opening'
                ? 'Opening Dropbox Sign…'
                : phase === 'signing'
                  ? 'Signing window open…'
                  : phase === 'error'
                    ? 'Try again'
                    : 'Sign the contract'}
            </Button>
            <Button
              variant="secondary"
              fullWidth
              onClick={emailLink}
              isLoading={isResending}
              disabled={isResending || isBusy}
              leftIcon={<Mail className="size-4" aria-hidden="true" />}
            >
              Email me the link instead
            </Button>
          </>
        )}
        {onBack && (
          <Button variant="ghost" fullWidth onClick={onBack} disabled={phase === 'opening'}>
            Back
          </Button>
        )}
      </StepActions>
    </>
  );
};

/* -------------------------------------------------------------------------- */

export const AgreementStep = ({ booking, property, nights, onBack, onContinue, continueLabel = 'Continue to payment' }) => {
  const { data: text, isLoading, isError, refetch } = useContractText(booking?.id);

  if (!booking || isLoading) return <Skeleton className="h-96 w-full rounded-card" />;

  const needsSignature = Boolean(booking.contractRequired);
  const stayNights = booking.nights || nights || 0;

  const agreement = resolveAgreement({
    nights: stayNights,
    location: property?.location,
    country: property?.country,
    isCommercial: booking.isCommercial,
  });
  const name = text?.template?.name ?? booking.agreement?.templateName ?? agreement.name;
  const clauses = buildFallbackClauses({ agreement, booking, property });

  const badge = needsSignature
    ? booking.contract?.status === 'signed' || text?.contract?.status === 'signed'
      ? 'Signed'
      : null
    : booking.agreementAccepted
      ? 'Accepted'
      : null;

  const facts = [
    { icon: CalendarRange, label: 'Term', value: agreement.bandLabel },
    { icon: MapPin, label: 'Jurisdiction', value: agreement.market },
    { icon: FileText, label: 'Use', value: agreement.isCommercial ? 'Commercial' : 'Residential' },
    { icon: CalendarRange, label: 'Nights', value: `${stayNights}` },
  ];

  return (
    <StepShell
      title={needsSignature ? 'Sign your contract' : 'Your agreement'}
      subtitle="Read this before paying — it sets out the terms of your stay."
    >
      <DocumentHeader name={name} badge={badge} facts={facts} />

      {isError ? (
        <>
          <Alert variant="error" title="Your agreement could not be loaded" className="mt-5">
            Check your connection and try again. You cannot continue to payment without it.
          </Alert>
          <StepActions>
            <Button fullWidth size="lg" onClick={() => refetch()}>
              Try again
            </Button>
            {onBack && (
              <Button variant="ghost" fullWidth onClick={onBack}>
                Back
              </Button>
            )}
          </StepActions>
        </>
      ) : needsSignature ? (
        <SignContract
          booking={booking}
          text={text}
          onBack={onBack}
          onContinue={onContinue}
          continueLabel={continueLabel}
          onTextRefetch={refetch}
        />
      ) : (
        <ClickAccept
          booking={booking}
          text={text}
          agreement={{ ...agreement, name }}
          clauses={clauses}
          onBack={onBack}
          onContinue={onContinue}
          continueLabel={continueLabel}
        />
      )}
    </StepShell>
  );
};
