/**
 * Adaptador de cliente para la API de HubSpot CRM.
 * Utiliza endpoints centralizados con versión fechada 2026-09 exclusivamente y estrategia Search-First.
 * Protocolo: SR-ALINEVA-HUBSPOT-01D
 */

import {
  getHubSpotConfig,
  INSTITUTIONAL_LEGAL_METADATA,
  formatDateInAlinevaTimeZone,
  ALINEVA_TIME_ZONE,
  isValidHubSpotOwnerId,
  DEFAULT_INITIAL_LEAD_STATUS,
  HUBSPOT_PROPERTY_LEAD_STATUS,
} from "./config";
import { SanitizedLeadData } from "./types";

export {
  formatDateInAlinevaTimeZone,
  ALINEVA_TIME_ZONE,
  isValidHubSpotOwnerId,
  DEFAULT_INITIAL_LEAD_STATUS,
  HUBSPOT_PROPERTY_LEAD_STATUS,
};

interface CachedOwnerEntry {
  ownerId: string;
  cachedAt: number;
}

const OWNER_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hora de vigencia en memoria
const ownerMemoryCache = new Map<string, CachedOwnerEntry>();

/**
 * Limpia la caché en memoria de propietarios (para aislamiento en pruebas unitarias).
 */
export function clearOwnerMemoryCache(): void {
  ownerMemoryCache.clear();
}

export interface UpsertResult {
  ok: boolean;
  action?: "created" | "updated";
  contactId?: string;
  errorType?:
    | "UNCONFIGURED"
    | "AUTH_ERROR"
    | "RATE_LIMIT"
    | "UPSTREAM_ERROR"
    | "TIMEOUT"
    | "NETWORK_ERROR";
  errorMessage?: string;
  retryAfterSeconds?: number;
  internalTimestampUtc?: string; // Trazabilidad técnica UTC conservada internamente
}

export type FetchFunction = typeof fetch;

interface SearchResult {
  ok: boolean;
  found?: boolean;
  contactId?: string;
  errorType?: UpsertResult["errorType"];
  errorMessage?: string;
  retryAfterSeconds?: number;
}

export class HubSpotClient {
  private config = getHubSpotConfig();
  private customFetch: FetchFunction;

  constructor(customFetch?: FetchFunction) {
    this.customFetch = customFetch || fetch;
  }

  /**
   * Prepara el mapa de propiedades de HubSpot con los metadatos institucionales del servidor.
   * Maneja diferenciación estricta entre Date picker (YYYY-MM-DD en America/Mexico_City)
   * y Date and time picker (timestamp ms).
   * Tanto la fecha de calendario como el timestamp provienen de una única instancia de consentimiento.
   */
  public buildProperties(
    lead: SanitizedLeadData,
    customConsentDate?: Date
  ): {
    properties: Record<string, string>;
    internalTimestampUtc: string;
    localConsentDate: string;
  } {
    const consentedAt = customConsentDate || new Date();
    const internalTimestampUtc = consentedAt.toISOString();
    // 1. Date picker en HubSpot: Requiere estrictamente formato de fecha sin hora (YYYY-MM-DD)
    // calculado según el calendario oficial de Ciudad de México (America/Mexico_City)
    const localConsentDate = formatDateInAlinevaTimeZone(consentedAt);
    const { properties } = this.config;

    const props: Record<string, string> = {
      firstname: lead.firstName,
      lastname: lead.lastName,
      company: lead.company,
      email: lead.email,
      lifecyclestage: "lead",
      [properties.interest]: lead.interest,
      [properties.message]: lead.message,
      [properties.privacyConsent]: "true",
      [properties.consentDate]: localConsentDate,
      [properties.privacyVersion]: INSTITUTIONAL_LEGAL_METADATA.PRIVACY_VERSION,
      [properties.privacyHash]: INSTITUTIONAL_LEGAL_METADATA.PRIVACY_HASH,
      [properties.sourceChannel]: INSTITUTIONAL_LEGAL_METADATA.SOURCE_CHANNEL,
    };

    if (properties.fullName && properties.fullName.trim() !== "") {
      props[properties.fullName] = `${lead.firstName} ${lead.lastName}`.trim();
    }

    // 2. Date and time picker adicional: solo si la variable está explícitamente configurada
    // Se calcula desde la misma instancia consentedAt sin pérdida de precisión
    if (properties.consentTimestamp && properties.consentTimestamp.trim() !== "") {
      props[properties.consentTimestamp] = String(consentedAt.getTime());
    }

    if (lead.phone && lead.phone.trim() !== "") {
      props.phone = lead.phone.trim();
    }

    // Regla 06H: Número de WhatsApp mapeado exclusivamente a hs_whatsapp_phone_number.
    // mobilephone y hs_whatsapp_bsuid NUNCA se envían.
    const whatsappPropKey = properties.whatsappPhone || "hs_whatsapp_phone_number";
    if (lead.mobilePhone && lead.mobilePhone.trim() !== "") {
      props[whatsappPropKey] = lead.mobilePhone.trim();
    }

    return { properties: props, internalTimestampUtc, localConsentDate };
  }

  /**
   * Extrae el valor del encabezado Retry-After en segundos si la API responde con 429.
   */
  private extractRetryAfter(response: Response): number {
    const retryHeader = response.headers.get("Retry-After") || response.headers.get("retry-after");
    if (!retryHeader) return 60;
    const parsed = parseInt(retryHeader, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 60;
  }

  /**
   * Realiza búsqueda oficial de contacto por correo electrónico utilizando Search API fechada 2026-09 exclusivamente.
   * Utiliza la ruta centralizada de configuración sin fallback de versión.
   */
  public async searchContactByEmail(
    email: string,
    token: string,
    signal: AbortSignal
  ): Promise<SearchResult> {
    const searchUrl = this.config.endpoints.search;

    try {
      const searchResponse = await this.customFetch(searchUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filterGroups: [
            {
              filters: [
                {
                  propertyName: "email",
                  operator: "EQ",
                  value: email,
                },
              ],
            },
          ],
          properties: ["id", "email"],
          limit: 1,
        }),
        signal,
      });

      if (searchResponse.status === 200) {
        const data = (await searchResponse.json().catch(() => null)) as {
          total?: number;
          results?: Array<{ id: string }>;
        } | null;

        if (data && typeof data.total === "number" && data.total > 0 && data.results?.[0]?.id) {
          return { ok: true, found: true, contactId: data.results[0].id };
        }
        return { ok: true, found: false };
      }

      if (searchResponse.status === 401 || searchResponse.status === 403) {
        return {
          ok: false,
          errorType: "AUTH_ERROR",
          errorMessage: "Error de autenticación con el servicio de CRM.",
        };
      }

      if (searchResponse.status === 429) {
        const retryAfter = this.extractRetryAfter(searchResponse);
        return {
          ok: false,
          errorType: "RATE_LIMIT",
          retryAfterSeconds: retryAfter,
          errorMessage: `Límite de solicitudes alcanzado. Reintentar en ${retryAfter} segundos.`,
        };
      }

      return {
        ok: false,
        errorType: "UPSTREAM_ERROR",
        errorMessage: "Error al consultar la existencia del contacto en el CRM.",
      };
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        return {
          ok: false,
          errorType: "TIMEOUT",
          errorMessage: "Tiempo de espera agotado al consultar el CRM.",
        };
      }
      return {
        ok: false,
        errorType: "NETWORK_ERROR",
        errorMessage: "Error de conexión al consultar el CRM.",
      };
    }
  }

  /**
   * Actualiza un contacto existente mediante la ruta centralizada PATCH
   */
  public async updateContact(
    contactId: string,
    properties: Record<string, string>,
    token: string,
    signal: AbortSignal
  ): Promise<UpsertResult> {
    const updateUrl = this.config.endpoints.update(contactId);

    // Regla estricta: NUNCA enviar hubspot_owner_id ni hs_lead_status en PATCH
    // para no reasignar ni degradar/sobrescribir contactos existentes.
    // Asimismo, mobilephone y hs_whatsapp_bsuid quedan estrictamente excluidos.
    const safeProperties = { ...properties };
    delete safeProperties[this.config.properties.ownerId];
    delete safeProperties.hubspot_owner_id;
    delete safeProperties[this.config.properties.leadStatus];
    delete safeProperties.hs_lead_status;
    delete safeProperties.mobilephone;
    delete safeProperties.hs_whatsapp_bsuid;
    delete safeProperties.whatsapp_bsuid;

    // Regla defensiva: NUNCA enviar propiedades telefónicas vacías para no borrar datos existentes en CRM
    if (safeProperties.phone !== undefined && safeProperties.phone.trim() === "") {
      delete safeProperties.phone;
    }
    const whatsappPropKey = this.config.properties.whatsappPhone || "hs_whatsapp_phone_number";
    if (safeProperties[whatsappPropKey] !== undefined && safeProperties[whatsappPropKey].trim() === "") {
      delete safeProperties[whatsappPropKey];
    }
    const mobilePropKey = this.config.properties.mobilePhone || "mobilephone";
    if (safeProperties[mobilePropKey] !== undefined && safeProperties[mobilePropKey].trim() === "") {
      delete safeProperties[mobilePropKey];
    }

    try {
      const updateResponse = await this.customFetch(updateUrl, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ properties: safeProperties }),
        signal,
      });

      if (updateResponse.status === 200) {
        return {
          ok: true,
          action: "updated",
          contactId,
        };
      }

      if (updateResponse.status === 401 || updateResponse.status === 403) {
        return {
          ok: false,
          errorType: "AUTH_ERROR",
          errorMessage: "Error de autorización al actualizar el contacto.",
        };
      }

      if (updateResponse.status === 429) {
        const retryAfter = this.extractRetryAfter(updateResponse);
        return {
          ok: false,
          errorType: "RATE_LIMIT",
          retryAfterSeconds: retryAfter,
          errorMessage: `Límite de peticiones alcanzado. Reintentar en ${retryAfter} segundos.`,
        };
      }

      return {
        ok: false,
        errorType: "UPSTREAM_ERROR",
        errorMessage: "Respuesta no satisfactoria al actualizar el registro en el CRM.",
      };
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        return {
          ok: false,
          errorType: "TIMEOUT",
          errorMessage: "Tiempo de espera agotado al actualizar el contacto en el CRM.",
        };
      }
      return {
        ok: false,
        errorType: "NETWORK_ERROR",
        errorMessage: "Fallo de conexión al actualizar el contacto.",
      };
    }
  }

  /**
   * Crea un contacto nuevo mediante la ruta centralizada POST
   */
  public async createContact(
    properties: Record<string, string>,
    email: string,
    token: string,
    signal: AbortSignal,
    updatePropertiesOnConflict?: Record<string, string>
  ): Promise<UpsertResult> {
    const createUrl = this.config.endpoints.create;

    try {
      const createResponse = await this.customFetch(createUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ properties }),
        signal,
      });

      if (createResponse.status === 201 || createResponse.status === 200) {
        const data = (await createResponse.json().catch(() => null)) as { id?: string } | null;
        return {
          ok: true,
          action: "created",
          contactId: data?.id,
        };
      }

      // Concurrencia o carrera de creación (409 Conflict): resolver mediante lookup estructurado sin regex
      if (createResponse.status === 409) {
        const lookupUrl = this.config.endpoints.getByIdProperty(email);
        const lookupResponse = await this.customFetch(lookupUrl, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
          signal,
        });

        if (lookupResponse.status === 200) {
          const lookupData = (await lookupResponse.json().catch(() => null)) as {
            id?: string;
          } | null;
          if (lookupData?.id) {
            // Regla: En recuperación 409, el contacto se trata como existente y NUNCA se reasigna el propietario
            const patchProperties = updatePropertiesOnConflict || properties;
            return await this.updateContact(lookupData.id, patchProperties, token, signal);
          }
        }

        return {
          ok: false,
          errorType: "UPSTREAM_ERROR",
          errorMessage: "Conflicto de registro concurrente no resoluble en el CRM.",
        };
      }

      if (createResponse.status === 401 || createResponse.status === 403) {
        return {
          ok: false,
          errorType: "AUTH_ERROR",
          errorMessage: "Error de autorización al registrar el contacto.",
        };
      }

      if (createResponse.status === 429) {
        const retryAfter = this.extractRetryAfter(createResponse);
        return {
          ok: false,
          errorType: "RATE_LIMIT",
          retryAfterSeconds: retryAfter,
          errorMessage: `Límite de peticiones alcanzado. Reintentar en ${retryAfter} segundos.`,
        };
      }

      return {
        ok: false,
        errorType: "UPSTREAM_ERROR",
        errorMessage: "Respuesta inesperada al crear el contacto en el CRM.",
      };
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        return {
          ok: false,
          errorType: "TIMEOUT",
          errorMessage: "Tiempo de espera agotado al registrar el contacto en el CRM.",
        };
      }
      return {
        ok: false,
        errorType: "NETWORK_ERROR",
        errorMessage: "Fallo de conexión al registrar el contacto.",
      };
    }
  }

  /**
   * Resuelve el identificador estructurado `id` de un propietario activo en HubSpot
   * mediante su correo electrónico utilizando el endpoint oficial GET /crm/v3/owners?email=<email>.
   * Implementa una caché en memoria para evitar consultas recurrentes en cada envío.
   */
  public async resolveOwnerIdByEmail(
    email: string,
    token: string,
    signal?: AbortSignal
  ): Promise<string | null> {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return null;

    // 1. Verificar si existe en la caché en memoria y sigue vigente
    const cached = ownerMemoryCache.get(normalizedEmail);
    if (cached && Date.now() - cached.cachedAt < OWNER_CACHE_TTL_MS) {
      return cached.ownerId;
    }

    // 2. Consulta oficial a Owners API
    const ownersUrl = this.config.endpoints.owners(normalizedEmail);
    try {
      const response = await this.customFetch(ownersUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        signal,
      });

      if (!response.ok) {
        console.warn(
          `[HubSpot] No fue posible resolver el propietario en Owners API (código HTTP ${response.status}). Se procesará el contacto sin propietario.`
        );
        return null;
      }

      const data = (await response.json().catch(() => null)) as {
        results?: Array<{
          id?: unknown;
          userId?: unknown;
          email?: unknown;
          archived?: unknown;
        }>;
      } | null;

      if (!data || !Array.isArray(data.results) || data.results.length === 0) {
        console.warn(
          "[HubSpot] Owners API no devolvió resultados para la búsqueda de propietario configurada."
        );
        return null;
      }

      // Regla estricta: Extraer exclusivamente el campo estructurado `id` del propietario activo (no archivado).
      // NO utilizar userId ni regex.
      const activeOwner = data.results.find(
        (o) =>
          o.archived !== true &&
          typeof o.id === "string" &&
          isValidHubSpotOwnerId(o.id)
      );

      if (!activeOwner || typeof activeOwner.id !== "string") {
        console.warn(
          "[HubSpot] El usuario consultado en Owners API está archivado o no posee un ID de propietario válido."
        );
        return null;
      }

      const resolvedOwnerId = activeOwner.id.trim();

      // Guardar en caché en memoria con límite de seguridad de 50 entradas
      if (ownerMemoryCache.size >= 50) {
        ownerMemoryCache.clear();
      }
      ownerMemoryCache.set(normalizedEmail, {
        ownerId: resolvedOwnerId,
        cachedAt: Date.now(),
      });

      return resolvedOwnerId;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        console.warn("[HubSpot] Tiempo de espera agotado al consultar Owners API.");
      } else {
        console.warn("[HubSpot] Error de conexión al consultar Owners API.");
      }
      return null;
    }
  }

  /**
   * Envía el prospecto a HubSpot CRM aplicando la estrategia Search-First.
   * 1. Normaliza correo y construye propiedades con trazabilidad interna UTC.
   * 2. Busca el contacto por correo vía Search API.
   * 3. Si existe -> actualiza (PATCH).
   * 4. Si no existe -> crea (POST). Si ocurre 409 por concurrencia, resuelve por lookup estructurado.
   */
  public async upsertLead(lead: SanitizedLeadData): Promise<UpsertResult> {
    const token = this.config.accessToken;

    if (!token || token.trim() === "") {
      return {
        ok: false,
        errorType: "UNCONFIGURED",
        errorMessage: "El canal de recepción de prospectos no cuenta con credenciales activas.",
      };
    }

    const { properties, internalTimestampUtc } = this.buildProperties(lead);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      // Paso 1: Búsqueda oficial por email
      const search = await this.searchContactByEmail(lead.email, token, controller.signal);

      if (!search.ok) {
        clearTimeout(timeoutId);
        return {
          ok: false,
          errorType: search.errorType,
          errorMessage: search.errorMessage,
          retryAfterSeconds: search.retryAfterSeconds,
          internalTimestampUtc,
        };
      }

      // Paso 2: Si existe, actualizar registro existente (NUNCA incluir hubspot_owner_id)
      if (search.found && search.contactId) {
        const updateRes = await this.updateContact(
          search.contactId,
          properties,
          token,
          controller.signal
        );
        clearTimeout(timeoutId);
        return { ...updateRes, internalTimestampUtc };
      }

      // Paso 3: Si no existe, crear nuevo contacto
      // Regla 06H: Los prospectos nuevos se registran inicialmente sin propietario (hubspot_owner_id no se envía en CREATE).
      // La asignación posterior será una operación administrativa dentro de HubSpot.
      // Se conserva hs_lead_status = "NEW" y lifecyclestage = "lead" únicamente en CREATE.
      const createProperties: Record<string, string> = {
        ...properties,
        [this.config.properties.leadStatus]: DEFAULT_INITIAL_LEAD_STATUS,
      };

      // Exclusión defensiva estricta de propietario, móvil legacy y BSUID en CREATE
      delete createProperties[this.config.properties.ownerId];
      delete createProperties.hubspot_owner_id;
      delete createProperties.mobilephone;
      delete createProperties.hs_whatsapp_bsuid;
      delete createProperties.whatsapp_bsuid;

      const createRes = await this.createContact(
        createProperties,
        lead.email,
        token,
        controller.signal,
        properties // Propiedades limpias sin propietario ni estado para actualización en caso de carrera 409
      );
      clearTimeout(timeoutId);
      return { ...createRes, internalTimestampUtc };
    } catch (err: unknown) {
      clearTimeout(timeoutId);

      if (err instanceof Error && err.name === "AbortError") {
        return {
          ok: false,
          errorType: "TIMEOUT",
          errorMessage: "Tiempo de espera agotado al comunicar con el CRM.",
          internalTimestampUtc,
        };
      }

      return {
        ok: false,
        errorType: "NETWORK_ERROR",
        errorMessage: "Error inesperado de comunicación con el CRM.",
        internalTimestampUtc,
      };
    }
  }
}
