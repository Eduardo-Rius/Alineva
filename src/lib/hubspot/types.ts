/**
 * Tipos y contratos para la integración con HubSpot CRM.
 * Protocolo: SR-ALINEVA-HUBSPOT-01D
 */

export interface ContactFormInput {
  name: string;
  company: string;
  email: string;
  phone?: string;
  interest: string;
  message: string;
  privacyConsent: boolean;
  website?: string; // Honeypot
}

export interface SanitizedLeadData {
  name: string;
  company: string;
  email: string;
  phone?: string;
  interest: string;
  message: string;
  privacyConsent: true;
}

export interface InstitutionalMetadata {
  sourceChannel: string;
  privacyVersion: string;
  privacyHash: string;
  consentDate: string; // YYYY-MM-DD para Date picker
  consentTimestampUtc: string; // Timestamp ISO 8601 completo para trazabilidad técnica
}

export interface HubSpotContactProperties {
  email: string;
  company: string;
  phone?: string;
  [customPropertyKey: string]: string | undefined;
}

export interface HubSpotContactResponse {
  id: string;
  properties: Record<string, string>;
  createdAt?: string;
  updatedAt?: string;
}

export type SubmissionStatus =
  | 'idle'
  | 'submitting'
  | 'success'
  | 'validation_error'
  | 'service_unavailable'
  | 'server_error';

export interface ApiContactResponse {
  ok: boolean;
  code:
    | 'SUCCESS_PROCESSED'
    | 'SUCCESS_CREATED'
    | 'SUCCESS_UPDATED'
    | 'VALIDATION_ERROR'
    | 'SERVICE_UNCONFIGURED'
    | 'UPSTREAM_ERROR'
    | 'RATE_LIMIT_EXCEEDED'
    | 'UPSTREAM_RATE_LIMIT'
    | 'BOT_DETECTED';
  message: string;
  details?: Record<string, string>;
}
