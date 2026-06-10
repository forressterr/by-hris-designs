// Email notification for a contact enquiry, via Resend (server-side; unlike
// FormSubmit it isn't IP-blocked from datacenters). Best-effort: returns false
// (never throws) when email isn't configured or the send fails, so the route
// can fall back to the Redis store as the durable record.

import { Resend } from 'resend';
import {
  CONTACT_NOTIFY_FROM,
  CONTACT_NOTIFY_TO,
  getResendApiKey,
} from './config';
import type { StoredEnquiry } from './types';

/** Send the enquiry to the inbox. Returns true only if Resend accepted it. */
export async function sendEnquiryEmail(
  enquiry: StoredEnquiry,
): Promise<boolean> {
  const apiKey = getResendApiKey();
  if (!apiKey) return false;

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: CONTACT_NOTIFY_FROM,
      to: CONTACT_NOTIFY_TO,
      replyTo: enquiry.email,
      subject: `Contact Form Enquiry — ${enquiry.name}`,
      text: `From: ${enquiry.name} <${enquiry.email}>\n\n${enquiry.message}`,
    });
    if (error) {
      console.error('[contact] Resend send failed:', error.message);
      return false;
    }
    return Boolean(data?.id);
  } catch (err) {
    console.error(
      '[contact] Resend send threw:',
      err instanceof Error ? err.message : err,
    );
    return false;
  }
}
