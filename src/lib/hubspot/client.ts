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
} from "./config";
import { SanitizedLeadData } from "./types";

export { formatDateInAlinevaTimeZone, ALINEVA_TIME_ZONE };

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
      email: lead.email,
      company: lead.company,
      [properties.fullName]: lead.name,
      [properties.message]: lead.message,
      [properties.interest]: lead.interest,
      [properties.privacyConsent]: "true",
      [properties.consentDate]: localConsentDate,
      [properties.privacyVersion]: INSTITUTIONAL_LEGAL_METADATA.PRIVACY_VERSION,
      [properties.privacyHash]: INSTITUTIONAL_LEGAL_METADATA.PRIVACY_HASH,
      [properties.sourceChannel]: INSTITUTIONAL_LEGAL_METADATA.SOURCE_CHANNEL,
    };

    // 2. Date and time picker adicional: solo si la variable está explícitamente configurada
    // Se calcula desde la misma instancia consentedAt sin pérdida de precisión
    if (properties.consentTimestamp && properties.consentTimestamp.trim() !== "") {
      props[properties.consentTimestamp] = String(consentedAt.getTime());
    }

    if (lead.phone) {
      props.phone = lead.phone;
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

    try {
      const updateResponse = await this.customFetch(updateUrl, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ properties }),
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
    signal: AbortSignal
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
            return await this.updateContact(lookupData.id, properties, token, signal);
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

      // Paso 2: Si existe, actualizar registro existente
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
      const createRes = await this.createContact(
        properties,
        lead.email,
        token,
        controller.signal
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
