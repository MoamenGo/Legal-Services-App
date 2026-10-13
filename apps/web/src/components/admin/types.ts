import type arMessages from '../../../messages/ar.json';

export type AdminMessages = (typeof arMessages)['admin'];
export type FormMessages = Pick<(typeof arMessages)['form'], 'caseTypes' | 'preferredContacts'>;
export type AdminLang = 'ar' | 'en';
export type AdminBundle = Record<AdminLang, { admin: AdminMessages; form: FormMessages }>;

export type Role = 'admin' | 'lawyer' | 'intake';
export type Session = { id: string; name: string; email: string; role: Role };

export const leadStatuses = [
  'new',
  'contacted',
  'qualified',
  'consultation_booked',
  'retained',
  'lost',
  'spam',
] as const;
export type LeadStatus = (typeof leadStatuses)[number];

export type LeadSource = Partial<
  Record<
    | 'utm_source'
    | 'utm_medium'
    | 'utm_campaign'
    | 'utm_term'
    | 'utm_content'
    | 'gclid'
    | 'gbraid'
    | 'wbraid'
    | 'landingPage'
    | 'referrer'
    | 'device',
    string
  >
>;

export type LeadRow = {
  id: string;
  name: string;
  phone: string;
  caseType: string;
  status: LeadStatus;
  language: AdminLang;
  source: LeadSource;
  assignedTo: string | null;
  createdAt: string;
};

export type LeadDetail = LeadRow & {
  email: string | null;
  anonymizedAt: string | null;
  message: string | null;
  preferredContact: string;
  marketingConsent: boolean;
  value: number | null;
  notes: { id: string; text: string; createdAt: string; by: string | null }[];
  jobs: {
    type: string;
    status: 'pending' | 'done' | 'skipped' | 'failed';
    attempts: number;
    lastError: string | null;
    updatedAt: string;
  }[];
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};
