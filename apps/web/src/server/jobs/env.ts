/**
 * Everything the jobs read. Every integration is optional: a job whose settings are missing is marked
 * `skipped`, so the template works before the firm has any accounts (docs/runbooks/integrations.md).
 */
export type JobsEnv = {
  DB: D1Database;
  NEXT_PUBLIC_SITE_URL?: string;
  /** Language of staff notifications. */
  INTAKE_LANGUAGE?: string;

  RESEND_API_KEY?: string;
  MAIL_FROM?: string;
  /** Comma-separated. */
  INTAKE_NOTIFY_EMAILS?: string;

  WHATSAPP_TOKEN?: string;
  WHATSAPP_PHONE_NUMBER_ID?: string;
  WHATSAPP_API_VERSION?: string;
  /** Comma-separated staff numbers in E.164. */
  INTAKE_WHATSAPP_TO?: string;
  /** Approved template with two body parameters: case type, admin link. */
  WHATSAPP_INTAKE_TEMPLATE?: string;
  WHATSAPP_TEMPLATE_LANGUAGE?: string;

  GA4_MEASUREMENT_ID?: string;
  GA4_API_SECRET?: string;

  GOOGLE_ADS_DEVELOPER_TOKEN?: string;
  GOOGLE_ADS_CLIENT_ID?: string;
  GOOGLE_ADS_CLIENT_SECRET?: string;
  GOOGLE_ADS_REFRESH_TOKEN?: string;
  /** Digits only, no dashes. */
  GOOGLE_ADS_CUSTOMER_ID?: string;
  GOOGLE_ADS_LOGIN_CUSTOMER_ID?: string;
  /** Conversion action ids (the number at the end of `customers/x/conversionActions/<id>`). */
  GOOGLE_ADS_CONVERSION_ACTION_QUALIFIED?: string;
  GOOGLE_ADS_CONVERSION_ACTION_RETAINED?: string;
  GOOGLE_ADS_API_VERSION?: string;
};
