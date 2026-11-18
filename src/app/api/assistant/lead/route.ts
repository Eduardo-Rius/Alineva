/**
 * Endpoint oficial Server Tool para el Asistente Virtual ElevenLabs.
 * Conecta las conversaciones de voz/chat con HubSpot CRM utilizando el cliente canónico.
 * Protocolo: SR-ALINEVA-ELEVENLABS-08
 */

import { NextRequest, NextResponse } from "next/server";
import { HubSpotClient } from "@/lib/hubspot/client";
import { SanitizedLeadData } from "@/lib/hubspot/types";

const MAX_BODY_BYTES = 32 * 1024; // 32 KB

interface ElevenLabsLeadPayload {
  name?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  interest?: string;
  needSummary?: string;
  message?: string;
  consentConfirmed?: boolean;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 1. Verificación de Content-Type
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json(
      { ok: false, success: false, message: "Content-Type must be application/json" },
      { status: 415 }
    );
  }

  // 2. Verificación de tamaño
  const contentLength = Number(request.headers.get("content-length")) || 0;
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      { ok: false, success: false, message: "Payload size exceeds limit" },
      { status: 413 }
    );
  }

  // 3. Parseo seguro de JSON
  let body: ElevenLabsLeadPayload;
  try {
    body = (await request.json()) as ElevenLabsLeadPayload;
  } catch {
    return NextResponse.json(
      { ok: false, success: false, message: "Invalid JSON format" },
      { status: 400 }
    );
  }

  // 4. Extracción y normalización de campos
  let firstName = (body.firstName || "").trim();
  let lastName = (body.lastName || "").trim();

  // Si se envió un campo "name" unificado, descomponerlo limpiamente
  if (!firstName && body.name) {
    const parts = body.name.trim().split(/\s+/);
    firstName = parts[0] || "";
    lastName = parts.slice(1).join(" ");
  }

  if (!firstName) {
    return NextResponse.json(
      {
        ok: false,
        success: false,
        message: "El nombre es obligatorio para registrar la solicitud.",
      },
      { status: 400 }
    );
  }

  const company = (body.company || "").trim() || "Empresa no especificada";
  const rawEmail = (body.email || "").trim().toLowerCase();
  const phone = (body.phone || "").trim();
  const whatsapp = (body.whatsapp || "").trim();
  const needSummary = (body.needSummary || body.message || "").trim() || "Contacto solicitado vía asistente virtual.";
  const interest = (body.interest || "").trim() || "Estrategia y crecimiento";

  // Verificar que exista al menos un canal de contacto autorizado
  if (!rawEmail && !phone && !whatsapp) {
    return NextResponse.json(
      {
        ok: false,
        success: false,
        message:
          "Se requiere al menos un canal de contacto autorizado: correo electrónico, teléfono o WhatsApp.",
      },
      { status: 400 }
    );
  }

  // Si no se proporcionó correo pero sí teléfono/WhatsApp, construir un identificador para HubSpot Search API
  const primaryPhone = whatsapp || phone;
  const digitsOnly = primaryPhone.replace(/[^0-9]/g, "");
  const effectiveEmail = rawEmail || `contacto-${digitsOnly}@contacto.alineva.com.mx`;

  const leadData: SanitizedLeadData = {
    firstName: firstName.slice(0, 50),
    lastName: (lastName || "Prospecto Asistente").slice(0, 50),
    company: company.slice(0, 100),
    email: effectiveEmail.slice(0, 120),
    phone: phone ? phone.slice(0, 30) : undefined,
    mobilePhone: whatsapp ? whatsapp.slice(0, 30) : undefined, // HubSpotClient mapea mobilePhone a hs_whatsapp_phone_number
    interest: interest.slice(0, 100),
    message: needSummary.slice(0, 2000),
    privacyConsent: true,
    sourceChannel: "Asistente virtual Alineva",
  };

  try {
    const hubspotClient = new HubSpotClient();
    const result = await hubspotClient.upsertLead(leadData);

    if (result.ok) {
      return NextResponse.json(
        {
          ok: true,
          success: true,
          message:
            "Solicitud registrada exitosamente en Alineva CRM. Emma Alvarado y Yuriko Peña se comunicarán a la brevedad.",
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        success: false,
        errorType: result.errorType,
        errorMessage: result.errorMessage,
        message:
          "No fue posible confirmar el registro en el sistema CRM en este momento. Por favor invita al usuario a contactarnos a través del formulario web en alineva.com.mx/#contacto.",
      },
      { status: 502 }
    );
  } catch (error) {
    console.error("[ElevenLabs Server Tool] Error al procesar prospecto:", error);
    return NextResponse.json(
      {
        ok: false,
        success: false,
        message:
          "Error interno al comunicar con el CRM. Por favor invita al usuario a utilizar el formulario web.",
      },
      { status: 500 }
    );
  }
}

// Métodos no permitidos
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ message: "Método no permitido." }, { status: 405 });
}
