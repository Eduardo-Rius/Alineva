/**
 * Validación estricta, sanitización y resolución de canal para el Asistente Virtual ElevenLabs.
 * Protocolo: SR-ALINEVA-WHATSAPP-CONSENT-GUARD-02-B
 */

import { AUTHORIZED_INTERESTS, AuthorizedInterest } from "../hubspot/config";
import { SanitizedLeadData } from "../hubspot/types";

export const ASSISTANT_VOICE_CHANNEL = "Chat voz ElevenLabs" as const;
export const ASSISTANT_TEXT_CHANNEL = "Chat texto ElevenLabs" as const;

export type AssistantSourceChannel =
  | typeof ASSISTANT_VOICE_CHANNEL
  | typeof ASSISTANT_TEXT_CHANNEL;

export interface ElevenLabsLeadPayload {
  firstName?: unknown;
  lastName?: unknown;
  company?: unknown;
  email?: unknown;
  phone?: unknown;
  whatsapp?: unknown;
  interest?: unknown;
  needSummary?: unknown;
  consentConfirmed?: unknown;
  isTextOnly?: unknown;
}

export interface WhatsAppGuardDecision {
  allowWhatsApp: boolean;
  sanitizedNumber?: string;
  reason: string;
}

export interface AssistantLeadValidationResult {
  ok: boolean;
  errors: Record<string, string>;
  warning?: string;
  warningReason?: string;
  sanitizedData?: SanitizedLeadData;
  sourceChannel?: AssistantSourceChannel;
  isTextOnly?: boolean;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Política temporal fail-closed para WhatsApp (SR-ALINEVA-WHATSAPP-CONSENT-GUARD-02-B).
 * Mientras no exista una fuente autoritativa independiente del LLM para auditar
 * los turnos role="user", ningún WhatsApp nuevo se persiste en CRM.
 * Se preserva estrictamente el teléfono tradicional y correo electrónico.
 */
export function canPersistWhatsApp(): WhatsAppGuardDecision {
  return {
    allowWhatsApp: false,
    reason: "AUTHORITATIVE_TRANSCRIPT_UNAVAILABLE",
  };
}

/**
 * Resuelve el canal de origen en HubSpot exclusivamente a partir del booleano
 * `isTextOnly` proveniente de la variable de sistema `system__is_text_only` de ElevenLabs.
 */
export function resolveAssistantSourceChannel(
  isTextOnly: boolean
): AssistantSourceChannel {
  return isTextOnly ? ASSISTANT_TEXT_CHANNEL : ASSISTANT_VOICE_CHANNEL;
}

/**
 * Normaliza el área de interés contra el catálogo oficial de Alineva.
 * Si no hay coincidencia exacta (insensible a mayúsculas/acentos básicos), devuelve null
 * para que el llamador conserve la referencia en el mensaje y use una categoría segura del catálogo.
 */
export function matchAuthorizedInterest(raw: string): AuthorizedInterest | null {
  const normalized = raw.trim().toLowerCase();
  const match = AUTHORIZED_INTERESTS.find(
    (item) => item.toLowerCase() === normalized
  );
  return match ?? null;
}

function validatePhoneValue(
  rawValue: unknown,
  fieldLabel: string
): { value?: string; error?: string } {
  if (rawValue === undefined || rawValue === null || rawValue === "") {
    return {};
  }
  if (typeof rawValue !== "string") {
    return { error: `El campo ${fieldLabel} debe ser una cadena de texto.` };
  }
  const trimmed = rawValue.trim();
  if (!trimmed) {
    return {};
  }
  if (trimmed.length > 30) {
    return { error: `El campo ${fieldLabel} no puede exceder 30 caracteres.` };
  }
  if (trimmed.includes("@")) {
    return { error: `El campo ${fieldLabel} debe ser un número telefónico válido.` };
  }
  if (/(?:https?:\/\/|www\.|\.[a-z]{2,})/i.test(trimmed)) {
    return { error: `El campo ${fieldLabel} no puede contener enlaces web.` };
  }
  return { value: trimmed };
}

export function validateAssistantLeadPayload(
  body: unknown
): AssistantLeadValidationResult {
  const errors: Record<string, string> = {};

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return {
      ok: false,
      errors: { payload: "El cuerpo de la solicitud debe ser un objeto JSON válido." },
    };
  }

  const raw = body as ElevenLabsLeadPayload;

  // 1. Campos obligatorios textuales
  const firstName =
    typeof raw.firstName === "string" ? raw.firstName.trim() : "";
  if (!firstName) {
    errors.firstName = "El nombre (firstName) es obligatorio.";
  } else if (firstName.length > 120) {
    errors.firstName = "El nombre no puede exceder 120 caracteres.";
  }

  const lastName = typeof raw.lastName === "string" ? raw.lastName.trim() : "";
  if (!lastName) {
    errors.lastName = "Los apellidos (lastName) son obligatorios.";
  } else if (lastName.length > 120) {
    errors.lastName = "Los apellidos no pueden exceder 120 caracteres.";
  }

  const company = typeof raw.company === "string" ? raw.company.trim() : "";
  if (!company) {
    errors.company = "La empresa (company) es obligatoria.";
  } else if (company.length > 120) {
    errors.company = "La empresa no puede exceder 120 caracteres.";
  }

  const rawInterest =
    typeof raw.interest === "string" ? raw.interest.trim() : "";
  if (!rawInterest) {
    errors.interest = "El área de interés (interest) es obligatoria.";
  } else if (rawInterest.length > 120) {
    errors.interest = "El área de interés no puede exceder 120 caracteres.";
  }

  const needSummary =
    typeof raw.needSummary === "string" ? raw.needSummary.trim() : "";
  if (!needSummary) {
    errors.needSummary = "El resumen de necesidad (needSummary) es obligatorio.";
  } else if (needSummary.length > 2000) {
    errors.needSummary = "El resumen de necesidad no puede exceder 2000 caracteres.";
  }

  // 2. Consentimiento expreso obligatorio (estrictamente boolean true)
  if (raw.consentConfirmed !== true) {
    errors.consentConfirmed =
      "Se requiere confirmación expresa del usuario (consentConfirmed: true).";
  }

  // 3. Indicador de modalidad obligatorio (estrictamente boolean)
  if (typeof raw.isTextOnly !== "boolean") {
    errors.isTextOnly =
      "El parámetro isTextOnly es obligatorio y debe ser un valor booleano.";
  }

  // 4. Medios de contacto: email y phone
  let sanitizedEmail = "";
  if (raw.email !== undefined && raw.email !== null && raw.email !== "") {
    if (typeof raw.email !== "string") {
      errors.email = "El correo electrónico debe ser una cadena de texto.";
    } else {
      const trimmedEmail = raw.email.trim().toLowerCase();
      if (trimmedEmail.length > 120) {
        errors.email = "El correo electrónico no puede exceder 120 caracteres.";
      } else if (!EMAIL_REGEX.test(trimmedEmail)) {
        errors.email = "El correo electrónico no tiene un formato válido.";
      } else {
        sanitizedEmail = trimmedEmail;
      }
    }
  }

  const phoneCheck = validatePhoneValue(raw.phone, "phone");
  if (phoneCheck.error) {
    errors.phone = phoneCheck.error;
  }

  // 5. Política temporal fail-closed para WhatsApp (SR-ALINEVA-WHATSAPP-CONSENT-GUARD-02-B)
  // Cualquier WhatsApp entrante se ignora sin invalidar el lead; se emite warning sanitizado.
  let warning: string | undefined = undefined;
  let warningReason: string | undefined = undefined;

  const rawWhatsappStr =
    raw.whatsapp !== undefined && raw.whatsapp !== null
      ? String(raw.whatsapp).trim()
      : "";

  if (rawWhatsappStr !== "") {
    const decision = canPersistWhatsApp();
    warning = "WHATSAPP_CONSENT_NOT_VERIFIED";
    warningReason = decision.reason;
  }

  // 6. Validación de canales de contacto autorizados verificables
  // Se requiere al menos un medio autorizado verificable (correo electrónico o teléfono tradicional).
  if (!sanitizedEmail && !phoneCheck.value) {
    errors.contactChannel =
      "Se requiere al menos un medio de contacto autorizado verificable (correo electrónico o teléfono). WhatsApp permanece deshabilitado temporalmente hasta contar con consentimiento verificable.";
  }

  // Si no hay correo, generar identificador seguro a partir del teléfono primario verificado
  let effectiveEmail = sanitizedEmail;
  if (!effectiveEmail && phoneCheck.value) {
    const digitsOnly = phoneCheck.value.replace(/\D/g, "");
    if (digitsOnly.length < 7) {
      errors.contactChannel =
        "El número telefónico proporcionado debe contener al menos 7 dígitos cuando no se proporciona correo electrónico.";
    } else {
      effectiveEmail = `contacto-${digitsOnly}@contacto.alineva.com.mx`;
    }
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  const isTextOnly = raw.isTextOnly as boolean;
  const sourceChannel = resolveAssistantSourceChannel(isTextOnly);
  const matchedInterest = matchAuthorizedInterest(rawInterest);
  const canonicalInterest =
    matchedInterest ?? "No estoy seguro / Quiero platicarlo";

  const interactionHeader = `[Interacción: ${sourceChannel}]`;
  const interestNote =
    matchedInterest === null ? `\n[Interés expresado: ${rawInterest}]` : "";
  const formattedMessage = `${interactionHeader}${interestNote}\n${needSummary}`.slice(
    0,
    2500
  );

  return {
    ok: true,
    errors: {},
    warning,
    warningReason,
    isTextOnly,
    sourceChannel,
    sanitizedData: {
      firstName: firstName.slice(0, 120),
      lastName: lastName.slice(0, 120),
      company: company.slice(0, 120),
      email: effectiveEmail.slice(0, 120),
      phone: phoneCheck.value,
      mobilePhone: undefined,
      interest: canonicalInterest,
      message: formattedMessage,
      privacyConsent: true,
      sourceChannel,
    },
  };
}
