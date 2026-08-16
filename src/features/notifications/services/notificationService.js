import { apiClient } from '@/lib/apiClient';

/**
 * In-app notifications.
 *
 * Fully server-backed — there is no mock half, because a fake inbox teaches an
 * empty lesson and every row here refers to something that actually happened to
 * a real booking.
 *
 * Two shapes of the API worth knowing:
 *
 *   - The list is keyed by user id in the path, not implied by the token, so
 *     every call needs the signed-in user's id. Reading anyone else's 403s.
 *   - `status` doubles as the read flag: a notification is read when its status
 *     is `read` (and `read_at` is stamped). There is no boolean.
 */

/** Not every notification is worth showing in-app — email and SMS are not. */
const IN_APP_CHANNELS = ['in_app'];

/**
 * What each kind of notification is *about*, so the UI can colour and route it
 * without parsing prose. `trigger_key` is a free string server-side, so unknown
 * keys fall back rather than throwing.
 */
const TRIGGERS = {
  /* Bookings */
  booking_submitted: { tone: 'info', group: 'Bookings' },
  booking_confirmed: { tone: 'success', group: 'Bookings' },
  booking_cancelled: { tone: 'danger', group: 'Bookings' },

  /* Money */
  payment_received: { tone: 'success', group: 'Payments' },
  refund_processed: { tone: 'success', group: 'Payments' },
  reference_fee_paid: { tone: 'info', group: 'Payments' },
  deposit_claim: { tone: 'warn', group: 'Deposit' },
  deposit_released: { tone: 'success', group: 'Deposit' },

  /* Identity — a rejection needs to read as something to act on. */
  kyc_pending: { tone: 'warn', group: 'Identity' },
  kyc_verified: { tone: 'success', group: 'Identity' },
  kyc_failed: { tone: 'danger', group: 'Identity' },
  full_kyc_approved: { tone: 'success', group: 'Identity' },
  full_kyc_rejected: { tone: 'danger', group: 'Identity' },

  /* Paperwork */
  contract_sent: { tone: 'warn', group: 'Paperwork' },
  contract_signed_guest: { tone: 'success', group: 'Paperwork' },

  /* The stay itself */
  checkin_instructions: { tone: 'info', group: 'Your stay' },
  checkout_complete: { tone: 'info', group: 'Your stay' },
  room_cleaned: { tone: 'info', group: 'Your stay' },
  maintenance_flagged: { tone: 'warn', group: 'Your stay' },
  maintenance_ticket_assigned: { tone: 'info', group: 'Your stay' },

  /* Conversation */
  new_message: { tone: 'info', group: 'Messages' },
  review_received: { tone: 'info', group: 'Reviews' },
};

export const toNotification = (raw) => {
  const trigger = TRIGGERS[raw.trigger_key] ?? { tone: 'info', group: 'Updates' };

  return {
    id: raw.id,
    channel: raw.channel,
    triggerKey: raw.trigger_key ?? '',
    title: raw.title ?? '',
    body: raw.body ?? '',
    status: raw.status,
    isRead: raw.status === 'read' || Boolean(raw.read_at),
    tone: trigger.tone,
    group: trigger.group,
    metadata: raw.metadata ?? {},
    /* Most notifications point at a booking; the link is built from this. */
    bookingId: raw.metadata?.booking_id ?? null,
    sentAt: raw.sent_at ?? raw.created_at,
    readAt: raw.read_at ?? null,
    createdAt: raw.created_at,
  };
};

export const notificationService = {
  /**
   * The signed-in user's in-app notifications, newest first.
   *
   * Email and SMS rows share the same table, so they are filtered out here —
   * showing "we emailed you" inside the app is noise, not news.
   */
  async list(userId) {
    if (!userId) return [];

    const { data } = await apiClient.get(`/notifications/${userId}/`);

    return (data?.results ?? data ?? [])
      .map(toNotification)
      .filter((notification) => IN_APP_CHANNELS.includes(notification.channel))
      /* `*_admin` triggers are the staff copy of the same event. They are
         addressed to staff accounts, but filtering here means a mis-addressed
         one can never surface in a guest's inbox. */
      .filter((notification) => !notification.triggerKey.endsWith('_admin'))
      .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
  },

  /**
   * The unread badge.
   *
   * Its own endpoint now, so the navbar no longer fetches the whole inbox on
   * every page just to count the dots. Scoped by the token — unlike the list,
   * there is no user id in the path.
   */
  async unreadCount() {
    const { data } = await apiClient.get('/notifications/unread-count/');
    return data?.unread_count ?? 0;
  },

  /** PUT, not PATCH — the endpoint defines only `put`, as with messages. */
  async markRead(id) {
    const { data } = await apiClient.put(`/notifications/${id}/read/`);
    return toNotification(data);
  },

  /**
   * Mark everything read in one call.
   *
   * This used to fan out one PATCH per unread row — 47 requests on a busy
   * account. The bulk endpoint replaced that entirely.
   */
  async markAllRead() {
    const { data } = await apiClient.post('/notifications/read-all/');
    return { success: true, count: data?.marked_read ?? 0 };
  },

  async getPreferences(userId) {
    const { data } = await apiClient.get(`/notifications/preferences/${userId}/`);
    return {
      email: Boolean(data?.email_enabled),
      sms: Boolean(data?.sms_enabled),
      inApp: Boolean(data?.in_app_enabled),
      marketing: Boolean(data?.marketing_enabled),
    };
  },

  async updatePreferences(userId, patch) {
    const body = {};
    if (patch.email !== undefined) body.email_enabled = patch.email;
    if (patch.sms !== undefined) body.sms_enabled = patch.sms;
    if (patch.inApp !== undefined) body.in_app_enabled = patch.inApp;
    if (patch.marketing !== undefined) body.marketing_enabled = patch.marketing;

    /*
     * PUT, not PATCH. Every write in the notifications app is defined as
     * `put` — mark-read and preferences alike — while the rest of this API
     * uses PATCH for partial updates. Guessing by convention gives a
     * "Method PATCH not allowed" 405 rather than anything descriptive.
     */
    const { data } = await apiClient.put(`/notifications/preferences/${userId}/`, body);
    return {
      email: Boolean(data?.email_enabled),
      sms: Boolean(data?.sms_enabled),
      inApp: Boolean(data?.in_app_enabled),
      marketing: Boolean(data?.marketing_enabled),
    };
  },
};
