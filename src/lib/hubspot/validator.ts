/**
 * Validación estricta y sanitización de prospectos para HubSpot CRM.
 * Protocolo: SR-ALINEVA-HUBSPOT-01D
 */

import { AUTHORIZED_INTERESTS, AuthorizedInterest } from "./config";
import { SanitizedLeadData } from "./types";

const ALLOWED_KEYS = new Set([
  "name",
  "company",
  "email",
  "phone",
  "interest",
  "message",
  "privacyConsent",
  "website",
]);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ValidationResult {
  isValid: boolean;
  isBot?: boolean;
  errors: Record<string, string>;
  sanitizedData?: SanitizedLeadData;
}

export function validateContactPayload(body: unknown): ValidationResult {
  const errors: Record<string, string> = {};

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return {
      isValid: false,
      errors: { _payload: "El cuerpo de la solicitud debe ser un objeto JSON válido." },
    };
  }

  const raw = body as Record<string, unknown>;

  // 1. Detección de claves no autorizadas
  for (const key of Object.keys(raw)) {
    if (!ALLOWED_KEYS.has(key)) {
      errors._unauthorized = `La propiedad '${key}' no está autorizada en la solicitud.`;
    }
  }

  // 2. Verificación de Honeypot (campo "website" para detección de bots)
  if (typeof raw.website === "string" && raw.website.trim().length > 0) {
    return {
      isValid: false,
      isBot: true,
      errors: { website: "Detección de envío automatizado." },
    };
  }

  // 3. Nombre (Obligatorio, max 120)
  if (typeof raw.name !== "string" || !raw.name.trim()) {
    errors.name = "Por favor ingresa tu nombre.";
  } else if (raw.name.trim().length > 120) {
    errors.name = "El nombre no puede exceder 120 caracteres.";
  }

  // 4. Empresa (Obligatorio, max 120)
  if (typeof raw.company !== "string" || !raw.company.trim()) {
    errors.company = "Por favor ingresa el nombre de tu empresa.";
  } else if (raw.company.trim().length > 120) {
    errors.company = "El nombre de la empresa no puede exceder 120 caracteres.";
  }

  // 5. Correo electrónico (Obligatorio, max 120, formato)
  if (typeof raw.email !== "string" || !raw.email.trim()) {
    errors.email = "Por favor ingresa tu correo electrónico.";
  } else if (raw.email.trim().length > 120) {
    errors.email = "El correo electrónico no puede exceder 120 caracteres.";
  } else if (!EMAIL_REGEX.test(raw.email.trim())) {
    errors.email = "Por favor ingresa un correo electrónico válido.";
  }

  // 6. Teléfono (Opcional, max 30)
  let sanitizedPhone: string | undefined = undefined;
  if (raw.phone !== undefined && raw.phone !== null && raw.phone !== "") {
    if (typeof raw.phone !== "string") {
      errors.phone = "El teléfono debe ser una cadena de texto.";
    } else if (raw.phone.trim().length > 30) {
      errors.phone = "El teléfono no puede exceder 30 caracteres.";
    } else {
      sanitizedPhone = raw.phone.trim();
    }
  }

  // 7. Área de interés (Obligatorio, catálogo cerrado)
  if (typeof raw.interest !== "string" || !raw.interest.trim()) {
    errors.interest = "Por favor selecciona un área de interés.";
  } else if (!AUTHORIZED_INTERESTS.includes(raw.interest.trim() as AuthorizedInterest)) {
    errors.interest = "El área de interés seleccionada no es válida.";
  }

  // 8. Mensaje (Obligatorio, max 3000)
  if (typeof raw.message !== "string" || !raw.message.trim()) {
    errors.message = "Por favor describe brevemente qué necesitas.";
  } else if (raw.message.trim().length > 3000) {
    errors.message = "El mensaje no puede exceder 3000 caracteres.";
  }

  // 9. Consentimiento de privacidad (Obligatorio, estrictamente boolean true)
  if (raw.privacyConsent !== true) {
    errors.privacyConsent = "Debes aceptar el Aviso de Privacidad para continuar.";
  }

  if (Object.keys(errors).length > 0) {
    return {
      isValid: false,
      errors,
    };
  }

  return {
    isValid: true,
    errors: {},
    sanitizedData: {
      name: (raw.name as string).trim(),
      company: (raw.company as string).trim(),
      email: (raw.email as string).trim().toLowerCase(),
      phone: sanitizedPhone,
      interest: (raw.interest as string).trim(),
      message: (raw.message as string).trim(),
      privacyConsent: true,
    },
  };
}
