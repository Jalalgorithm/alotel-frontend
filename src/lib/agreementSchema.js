/**
 * Which agreement a stay falls under, and how the API's contract payloads map
 * into the shape the guest UI renders.
 *
 * The matrix mirrors the admin portal's `CONTRACT_MATRIX` exactly. It is
 * duplicated rather than shared because the two apps are separate deployments
 * with no common package — but the source of truth for *text* is the API
 * (`GET /contracts/booking/{id}/text/`), so only the label can drift, never the
 * wording a guest actually agrees to.
 */

/**
 * Rows are stay bands; columns are jurisdictions. Commercial variants exist
 * because the API accepts `is_commercial` on a booking and uses it to pick the
 * template.
 */
export const CONTRACT_MATRIX = {
  short: {
    label: '< 4 weeks',
    residential: { UK: 'Short-Stay T&C', Spain: 'Short-Stay T&C', US: 'Short-Stay T&C', 'UAE Dubai': 'Short-Stay T&C', Nigeria: 'Short-Stay T&C' },
    commercial: { UK: 'Short-Stay T&C', Spain: 'Short-Stay T&C', US: 'Short-Stay T&C', 'UAE Dubai': 'Short-Stay T&C', Nigeria: 'Short-Stay T&C' },
  },
  medium: {
    label: '4–26 weeks',
    residential: { UK: 'Licence to Occupy', Spain: 'Seasonal Rental', US: 'Short-Term Lease', 'UAE Dubai': 'Holiday Home', Nigeria: 'Short-Term Tenancy' },
    commercial: { UK: 'Commercial Licence', Spain: 'Commercial Licence', US: 'Commercial Licence', 'UAE Dubai': 'Commercial Licence', Nigeria: 'Commercial Licence' },
  },
  long: {
    label: '> 26 weeks',
    residential: { UK: 'AST / Licence', Spain: 'Long-Term Lease', US: 'State Residential', 'UAE Dubai': 'Ejari Contract', Nigeria: 'Residential Tenancy' },
    commercial: { UK: 'Commercial Lease', Spain: 'Commercial Lease', US: 'Commercial Lease', 'UAE Dubai': 'Ejari Commercial', Nigeria: 'Commercial Lease' },
  },
};

/**
 * The API's own thresholds, from `_derive_booking_compliance_requirements`:
 * a signed contract is required at 183 nights or more, and anything shorter is
 * covered by the checkbox agreement instead.
 */
export const CONTRACT_REQUIRED_MIN_NIGHTS = 183;
const MEDIUM_STAY_MIN_NIGHTS = 28;

/** Guest-facing market names, keyed the way the property API reports them. */
const MARKET_ALIASES = {
  UK: 'UK',
  'United Kingdom': 'UK',
  Spain: 'Spain',
  US: 'US',
  USA: 'US',
  'United States': 'US',
  Nigeria: 'Nigeria',
  'UAE Dubai': 'UAE Dubai',
  UAE: 'UAE Dubai',
};

const normaliseMarket = (value) => MARKET_ALIASES[value] ?? 'UK';

/**
 * Resolve the agreement that applies to a stay.
 *
 * @param {{ nights: number, location?: string, country?: string, isCommercial?: boolean }} stay
 */
export const resolveAgreement = ({ nights = 0, location, country, isCommercial = false } = {}) => {
  const band = nights >= CONTRACT_REQUIRED_MIN_NIGHTS ? 'long' : nights >= MEDIUM_STAY_MIN_NIGHTS ? 'medium' : 'short';
  const row = CONTRACT_MATRIX[band];
  const market = normaliseMarket(location ?? country);

  return {
    band,
    bandLabel: row.label,
    market,
    isCommercial,
    name: row[isCommercial ? 'commercial' : 'residential'][market],
    /**
     * Long stays are signed through Dropbox Sign; everything shorter is
     * accepted with a tick, which the API records on the booking itself.
     */
    requiresSignature: band === 'long',
  };
};

/* -------------------------------------------------------------------------- */
/* API payloads                                                                */
/* -------------------------------------------------------------------------- */

/** `GET /contracts/booking/{bookingId}/text/` */
export const toContractText = (raw) => {
  if (!raw) return null;

  return {
    contractId: raw.contract_id,
    bookingId: raw.booking_id,
    status: raw.status,
    templateId: raw.template_id ?? null,
    templateName: raw.template_name ?? null,
    templateVersion: raw.template_version ?? null,
    /** The raw template body — no placeholder substitution, per the API docs. */
    content: raw.content ?? '',
  };
};

/** `GET /contracts/{id}/status/` */
export const toContractStatus = (raw) => {
  if (!raw) return null;

  return {
    contractId: raw.contract_id,
    bookingId: raw.booking_id,
    provider: raw.provider,
    status: raw.status,
    signedDocumentUrl: raw.signed_document_url || null,
    auditCertificateUrl: raw.audit_certificate_url || null,
    sentAt: raw.sent_at ?? null,
    signedAt: raw.signed_at ?? null,
    expiresAt: raw.expires_at ?? null,
  };
};

export const CONTRACT_STATUS_LABELS = {
  not_sent: 'Not issued yet',
  sent: 'Awaiting your signature',
  signed: 'Signed',
  expired: 'Expired',
  declined: 'Declined',
};

/**
 * The agreement state of one booking, folding together the two places the API
 * keeps it: the checkbox flag on the booking, and the contract record for
 * stays long enough to need a signature.
 *
 * @param {object} booking a normalised booking
 * @param {object|null} contract a normalised contract status, when one exists
 */
export const toAgreementState = (booking, contract = null) => {
  if (!booking) return null;

  const agreement = resolveAgreement({
    nights: booking.nights,
    location: booking.propertyLocation,
    country: booking.propertyCountry,
    isCommercial: booking.isCommercial,
  });

  const needsSignature = Boolean(booking.contractRequired);

  return {
    ...agreement,
    needsSignature,
    isAccepted: needsSignature ? contract?.status === 'signed' : Boolean(booking.agreementAccepted),
    acceptedAt: needsSignature ? contract?.signedAt ?? null : booking.agreementAcceptedAt ?? null,
    contractStatus: contract?.status ?? null,
    contractStatusLabel: contract ? CONTRACT_STATUS_LABELS[contract.status] ?? contract.status : null,
    signedDocumentUrl: contract?.signedDocumentUrl ?? null,
  };
};
