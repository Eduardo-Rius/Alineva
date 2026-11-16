/**
 * Configuración centralizada de HubSpot CRM y valores institucionales de Alineva.
 * Protocolo: SR-ALINEVA-HUBSPOT-01D
 */

export const AUTHORIZED_INTERESTS = [
  "Estrategia y crecimiento",
  "Marca y marketing",
  "Presencia digital",
  "Tecnología y automatización",
  "E-commerce y marketplaces",
  "Ventas y experiencia",
  "Experiencias y espacios",
  "Legal y protección de marca",
  "Capacitación y desarrollo",
  "No estoy seguro / Quiero platicarlo",
] as const;

export type AuthorizedInterest = (typeof AUTHORIZED_INTERESTS)[number];

export const INSTITUTIONAL_LEGAL_METADATA = {
  SOURCE_CHANNEL: "Formulario web",
  PRIVACY_VERSION: "2026-11-08-v1",
  PRIVACY_HASH: "7efdb995b4fba622a6a9850460a784f4a715e5798386329a002ffb8c7e0b34cc",
} as const;

export const DEFAULT_HUBSPOT_API_BASE_URL = "https://api.hubapi.com";
export const DEFAULT_CONTACTS_API_VERSION = "2026-09";

export interface HubSpotEndpoints {
  search: string;
  create: string;
  getByIdProperty: (email: string) => string;
  update: (contactId: string) => string;
  properties: string;
}

export function buildHubSpotEndpoints(
  baseUrl: string = DEFAULT_HUBSPOT_API_BASE_URL,
  apiVersion: string = DEFAULT_CONTACTS_API_VERSION
): HubSpotEndpoints {
  const cleanBase = baseUrl.replace(/\/+$/, "");
  return {
    // Endpoints fechados oficiales 2026-09 exclusivamente
    search: `${cleanBase}/crm/objects/${apiVersion}/contacts/search`,
    create: `${cleanBase}/crm/objects/${apiVersion}/contacts`,
    getByIdProperty: (email: string) =>
      `${cleanBase}/crm/objects/${apiVersion}/contacts/${encodeURIComponent(email)}?idProperty=email`,
    update: (contactId: string) =>
      `${cleanBase}/crm/objects/${apiVersion}/contacts/${encodeURIComponent(contactId)}`,
    properties: `${cleanBase}/crm/properties/${apiVersion}/contacts`,
  };
}

export function getHubSpotConfig() {
  const apiUrl = process.env.HUBSPOT_API_URL || DEFAULT_HUBSPOT_API_BASE_URL;
  const apiVersion = process.env.HUBSPOT_CONTACTS_API_VERSION || DEFAULT_CONTACTS_API_VERSION;

  return {
    portalId: process.env.HUBSPOT_PORTAL_ID || "248017141",
    accessToken: process.env.HUBSPOT_ACCESS_TOKEN || "",
    apiUrl,
    apiVersion,
    endpoints: buildHubSpotEndpoints(apiUrl, apiVersion),
    properties: {
      fullName: process.env.HUBSPOT_PROPERTY_FULL_NAME || "alineva_nombre_completo",
      message: process.env.HUBSPOT_PROPERTY_MESSAGE || "alineva_mensaje",
      interest: process.env.HUBSPOT_PROPERTY_INTEREST || "alineva_interes",
      privacyConsent: process.env.HUBSPOT_PROPERTY_PRIVACY_CONSENT || "alineva_consentimiento_privacidad",
      // Date picker: solo fecha sin hora (YYYY-MM-DD)
      consentDate: process.env.HUBSPOT_PROPERTY_CONSENT_DATE || "alineva_fecha_consentimiento",
      // Date and time picker: propiedad adicional documentada para creación posterior en HubSpot
      // Se mantiene desactivada provisionalmente (vacía) si la variable de entorno no está definida
      consentTimestamp: process.env.HUBSPOT_PROPERTY_CONSENT_TIMESTAMP || "",
      privacyVersion: process.env.HUBSPOT_PROPERTY_PRIVACY_VERSION || "alineva_version_aviso_privacidad",
      privacyHash: process.env.HUBSPOT_PROPERTY_PRIVACY_HASH || "alineva_hash_aviso_privacidad",
      sourceChannel: process.env.HUBSPOT_PROPERTY_SOURCE_CHANNEL || "alineva_canal_origen",
    },
    timeoutMs: Number(process.env.HUBSPOT_TIMEOUT_MS) || 8000,
  };
}
