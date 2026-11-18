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

export const DEFAULT_INITIAL_LEAD_STATUS = "NEW";
export const HUBSPOT_PROPERTY_LEAD_STATUS = "hs_lead_status";

export const ALINEVA_TIME_ZONE = "America/Mexico_City";

/**
 * Convierte una instancia de fecha al formato estricto YYYY-MM-DD
 * correspondiente al calendario de Ciudad de México (America/Mexico_City).
 * Utiliza Intl.DateTimeFormat para resolución IANA nativa sin offsets manuales.
 */
export function formatDateInAlinevaTimeZone(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: ALINEVA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Unable to format consent date in Alineva time zone.");
  }

  return `${year}-${month}-${day}`;
}

export const DEFAULT_HUBSPOT_API_BASE_URL = "https://api.hubapi.com";
export const DEFAULT_CONTACTS_API_VERSION = "2026-09";

export interface HubSpotEndpoints {
  search: string;
  create: string;
  getByIdProperty: (email: string) => string;
  update: (contactId: string) => string;
  properties: string;
  owners: (email?: string) => string;
}

export function buildHubSpotEndpoints(
  baseUrl: string = DEFAULT_HUBSPOT_API_BASE_URL,
  apiVersion: string = DEFAULT_CONTACTS_API_VERSION
): HubSpotEndpoints {
  const cleanBase = baseUrl.replace(/\/+$/, "");
  return {
    // Endpoints fechados oficiales 2026-09 exclusivamente para contactos
    search: `${cleanBase}/crm/objects/${apiVersion}/contacts/search`,
    create: `${cleanBase}/crm/objects/${apiVersion}/contacts`,
    getByIdProperty: (email: string) =>
      `${cleanBase}/crm/objects/${apiVersion}/contacts/${encodeURIComponent(email)}?idProperty=email`,
    update: (contactId: string) =>
      `${cleanBase}/crm/objects/${apiVersion}/contacts/${encodeURIComponent(contactId)}`,
    properties: `${cleanBase}/crm/properties/${apiVersion}/contacts`,
    // Endpoint oficial de consulta de propietarios
    owners: (email?: string) => {
      const query = email ? `?email=${encodeURIComponent(email)}` : "";
      return `${cleanBase}/crm/v3/owners${query}`;
    },
  };
}

/**
 * Valida si un identificador de propietario de HubSpot tiene un formato válido y seguro.
 * Permite únicamente cadenas alfanuméricas de 1 a 50 caracteres (incluyendo _ o -).
 */
export function isValidHubSpotOwnerId(ownerId: unknown): ownerId is string {
  if (typeof ownerId !== "string") return false;
  const trimmed = ownerId.trim();
  if (trimmed.length === 0 || trimmed.length > 50) return false;
  return /^[a-zA-Z0-9_-]+$/.test(trimmed);
}

export function getHubSpotConfig() {
  const apiUrl = process.env.HUBSPOT_API_URL || DEFAULT_HUBSPOT_API_BASE_URL;
  const apiVersion = process.env.HUBSPOT_CONTACTS_API_VERSION || DEFAULT_CONTACTS_API_VERSION;
  const defaultOwnerEmail = process.env.HUBSPOT_DEFAULT_OWNER_EMAIL?.trim().toLowerCase() || "";

  return {
    portalId: process.env.HUBSPOT_PORTAL_ID || "248017141",
    accessToken: process.env.HUBSPOT_ACCESS_TOKEN || "",
    defaultOwnerEmail,
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
      ownerId: process.env.HUBSPOT_PROPERTY_OWNER_ID || "hubspot_owner_id",
      leadStatus: HUBSPOT_PROPERTY_LEAD_STATUS,
      whatsappPhone: process.env.HUBSPOT_PROPERTY_WHATSAPP_PHONE || "hs_whatsapp_phone_number",
      mobilePhone: process.env.HUBSPOT_PROPERTY_MOBILE_PHONE || "mobilephone",
    },
    timeoutMs: Number(process.env.HUBSPOT_TIMEOUT_MS) || 8000,
  };
}
