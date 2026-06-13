import type { EnquiryInput, FieldName } from './validation';

/** An enquiry as persisted to Redis. */
export interface StoredEnquiry extends EnquiryInput {
  id: string;
  createdAt: string; // ISO-8601
  sourcePage: string; // page the form was submitted from (Referer path) or '—'
}

/** The /api/contact JSON response contract. */
export type ContactApiResponse =
  | { ok: true }
  | { ok: false; error: string; fields?: Partial<Record<FieldName, string>> };
