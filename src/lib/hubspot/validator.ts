/**
 * Validación estricta y sanitización de prospectos para HubSpot CRM.
 * Protocolo: SR-ALINEVA-HUBSPOT-01D
 */

import { AUTHORIZED_INTERESTS, AuthorizedInterest } from "./config";
import { SanitizedLeadData } from "./types";

const ALLOWED_KEYS = new Set([
  "firstName",
  "lastName",
  "firstname",
  "lastname",
  "company",
  "email",
  "phone",
  "mobilePhone",
  "mobilephone",
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

  // 3. Nombre(s) (Obligatorio, max 120)
  const rawFirstName = raw.firstName ?? raw.firstname;
  if (typeof rawFirstName !== "string" || !rawFirstName.trim()) {
    errors.firstName = "Por favor ingresa tu nombre(s).";
  } else if (rawFirstName.trim().length > 120) {
    errors.firstName = "El nombre no puede exceder 120 caracteres.";
  }

  // 4. Apellidos (Obligatorio, max 120)
  const rawLastName = raw.lastName ?? raw.lastname;
  if (typeof rawLastName !== "string" || !rawLastName.trim()) {
    errors.lastName = "Por favor ingresa tus apellidos.";
  } else if (rawLastName.trim().length > 120) {
    errors.lastName = "Los apellidos no pueden exceder 120 caracteres.";
  }

  // 5. Empresa (Obligatorio, max 120)
  if (typeof raw.company !== "string" || !raw.company.trim()) {
    errors.company = "Por favor ingresa el nombre de tu empresa.";
  } else if (raw.company.trim().length > 120) {
    errors.company = "El nombre de la empresa no puede exceder 120 caracteres.";
  }

  // 6. Correo electrónico (Obligatorio, max 120, formato)
  if (typeof raw.email !== "string" || !raw.email.trim()) {
    errors.email = "Por favor ingresa tu correo electrónico.";
  } else if (raw.email.trim().length > 120) {
    errors.email = "El correo electrónico no puede exceder 120 caracteres.";
  } else if (!EMAIL_REGEX.test(raw.email.trim())) {
    errors.email = "Por favor ingresa un correo electrónico válido.";
  }

  // 7. Teléfono de la empresa (Opcional, max 30)
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

  // 8. WhatsApp / Teléfono móvil (Opcional, max 30)
  let sanitizedMobilePhone: string | undefined = undefined;
  const rawMobile = raw.mobilePhone ?? raw.mobilephone;
  if (rawMobile !== undefined && rawMobile !== null && rawMobile !== "") {
    if (typeof rawMobile !== "string") {
      errors.mobilePhone = "El teléfono móvil debe ser una cadena de texto.";
    } else {
      const trimmedMobile = rawMobile.trim();
      if (trimmedMobile.length > 30) {
        errors.mobilePhone = "El teléfono móvil no puede exceder 30 caracteres.";
      } else if (trimmedMobile.includes("@")) {
        errors.mobilePhone =
          "Por favor ingresa un número telefónico válido (sin correos ni nombres de usuario).";
      } else if (/(?:https?:\/\/|www\.|\.[a-z]{2,})/i.test(trimmedMobile)) {
        errors.mobilePhone =
          "Por favor ingresa un número telefónico válido (sin enlaces web).";
      } else if (!/^\+?[0-9\s\-().]+$/.test(trimmedMobile)) {
        errors.mobilePhone = "El número telefónico contiene caracteres no válidos.";
      } else {
        const digits = trimmedMobile.replace(/\D/g, "");
        if (digits.length < 7) {
          errors.mobilePhone = "El número telefónico debe contener al menos 7 dígitos.";
        } else if (digits.length > 15) {
          errors.mobilePhone = "El número telefónico no puede contener más de 15 dígitos.";
        } else {
          sanitizedMobilePhone = trimmedMobile;
        }
      }
    }
  }

  // 9. Área de interés (Obligatorio, catálogo cerrado)
  if (typeof raw.interest !== "string" || !raw.interest.trim()) {
    errors.interest = "Por favor selecciona un área de interés.";
  } else if (!AUTHORIZED_INTERESTS.includes(raw.interest.trim() as AuthorizedInterest)) {
    errors.interest = "El área de interés seleccionada no es válida.";
  }

  // 10. Mensaje (Obligatorio, max 3000)
  if (typeof raw.message !== "string" || !raw.message.trim()) {
    errors.message = "Por favor describe brevemente qué necesitas.";
  } else if (raw.message.trim().length > 3000) {
    errors.message = "El mensaje no puede exceder 3000 caracteres.";
  }

  // 11. Consentimiento de privacidad (Obligatorio, estrictamente boolean true)
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
      firstName: (rawFirstName as string).trim(),
      lastName: (rawLastName as string).trim(),
      company: (raw.company as string).trim(),
      email: (raw.email as string).trim().toLowerCase(),
      phone: sanitizedPhone,
      mobilePhone: sanitizedMobilePhone,
      interest: (raw.interest as string).trim(),
      message: (raw.message as string).trim(),
      privacyConsent: true,
    },
  };
}
