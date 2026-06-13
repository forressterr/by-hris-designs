// Email for a contact enquiry, via Resend (server-side; unlike FormSubmit it
// isn't IP-blocked from datacenters). Best-effort: never throws; returns false
// when email isn't configured or the send fails, so the route can fall back to
// the Redis store as the durable record.
//
// When RESEND_TEMPLATE_NOTIFY is set the notification is sent via the styled
// Resend template; otherwise it falls back to a plain-text send. A separate
// auto-reply to the enquirer is sent only when RESEND_TEMPLATE_AUTOREPLY is set.

import { Resend } from 'resend';
import {
  CONTACT_NOTIFY_FROM,
  CONTACT_NOTIFY_TO,
  getResendApiKey,
  getResendTemplates,
} from './config';
import type { StoredEnquiry } from './types';

const DATE_FMT = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const orDash = (value: string): string => value.trim() || '—';

// The `message` variable is interpolated into the template as raw HTML, so
// escape it first (validation already blocks tags/links, this is defense in
// depth) then turn newlines into <br>.
function messageHtml(message: string): string {
  const escaped = message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return escaped.replace(/\n/g, '<br>');
}

/** Variables for the internal-notification template (names are case-sensitive). */
function notifyVariables(enquiry: StoredEnquiry): Record<string, string> {
  return {
    name_sender: enquiry.name,
    email_sender: enquiry.email,
    company_sender: orDash(enquiry.company),
    subject_sender: orDash(enquiry.subject),
    project_budget: orDash(enquiry.budget),
    project_timeline: orDash(enquiry.timeline),
    message: messageHtml(enquiry.message),
    submitted_at: DATE_FMT.format(new Date(enquiry.createdAt)),
    source_page: orDash(enquiry.sourcePage),
  };
}

/** Send the enquiry to the inbox. Returns true only if Resend accepted it. */
export async function sendEnquiryEmail(
  enquiry: StoredEnquiry,
): Promise<boolean> {
  const apiKey = getResendApiKey();
  if (!apiKey) return false;
  const { notify } = getResendTemplates();

  try {
    const resend = new Resend(apiKey);
    const { data, error } = notify
      ? await resend.emails.send({
          from: CONTACT_NOTIFY_FROM,
          to: CONTACT_NOTIFY_TO,
          replyTo: enquiry.email,
          template: { id: notify, variables: notifyVariables(enquiry) },
        })
      : await resend.emails.send({
          from: CONTACT_NOTIFY_FROM,
          to: CONTACT_NOTIFY_TO,
          replyTo: enquiry.email,
          subject: `Contact Form Enquiry — ${enquiry.name}`,
          text: `From: ${enquiry.name} <${enquiry.email}>\n\n${enquiry.message}`,
        });
    if (error) {
      console.error('[contact] Resend notify failed:', error.message);
      return false;
    }
    return Boolean(data?.id);
  } catch (err) {
    console.error(
      '[contact] Resend notify threw:',
      err instanceof Error ? err.message : err,
    );
    return false;
  }
}

/**
 * Send the courtesy auto-reply to the enquirer. Best-effort + fire-and-forget:
 * skipped when no template is configured; never throws; its result must not
 * affect whether the enquiry counts as received.
 */
export async function sendAutoReplyEmail(
  enquiry: StoredEnquiry,
): Promise<void> {
  const apiKey = getResendApiKey();
  const { autoReply } = getResendTemplates();
  if (!apiKey || !autoReply) return;

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: CONTACT_NOTIFY_FROM,
      to: enquiry.email,
      replyTo: CONTACT_NOTIFY_TO,
      template: {
        id: autoReply,
        variables: {
          your_name: enquiry.name,
          project_topic: enquiry.subject.trim() || 'your project',
          response_time: '1–2 working days',
        },
      },
    });
    if (error)
      console.error('[contact] Resend auto-reply failed:', error.message);
  } catch (err) {
    console.error(
      '[contact] Resend auto-reply threw:',
      err instanceof Error ? err.message : err,
    );
  }
}
