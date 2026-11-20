/**
 * Endpoint oficial Server Tool para el Asistente Virtual ElevenLabs.
 * Conecta las conversaciones de voz y texto con HubSpot CRM utilizando el cliente canónico.
 * Protocolo: SR-ALINEVA-VOICE-TEXT-02B
 */

import { NextRequest, NextResponse } from "next/server";
import { HubSpotClient } from "@/lib/hubspot/client";
import { validateAssistantLeadPayload } from "@/lib/assistant/leadValidator";

const MAX_BODY_BYTES = 32 * 1024; // 32 KB

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 1. Verificación de Content-Type
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json(
      {
        ok: false,
        success: false,
        message: "El encabezado Content-Type debe ser application/json.",
      },
      { status: 415 }
    );
  }

  // 2. Verificación de tamaño
  const contentLength = Number(request.headers.get("content-length")) || 0;
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      {
        ok: false,
        success: false,
        message: "El tamaño de la solicitud excede el límite permitido.",
      },
      { status: 413 }
    );
  }

  // 3. Parseo seguro de JSON
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        success: false,
        message: "Formato JSON inválido.",
      },
      { status: 400 }
    );
  }

  // 4. Validación estricta, sanitización y resolución determinística de canal (isTextOnly)
  const validation = validateAssistantLeadPayload(body);

  if (!validation.ok || !validation.sanitizedData) {
    return NextResponse.json(
      {
        ok: false,
        success: false,
        message:
          "Faltan datos obligatorios o tienen formato inválido para registrar la solicitud.",
        details: validation.errors,
      },
      { status: 400 }
    );
  }

  // Registro de advertencia técnica sanitizada si WhatsApp no fue acreditado
  if (validation.warning) {
    console.warn("[ElevenLabs Server Tool] Advertencia de consentimiento WhatsApp:", {
      warning: validation.warning,
      reason: validation.warningReason,
      channel: validation.sourceChannel,
    });
  }

  // 5. Envío a HubSpot CRM mediante cliente canónico (con política first-touch)
  try {
    const hubspotClient = new HubSpotClient();
    const result = await hubspotClient.upsertLead(validation.sanitizedData);

    if (result.ok) {
      return NextResponse.json(
        {
          ok: true,
          success: true,
          message:
            "Solicitud registrada exitosamente en Alineva CRM. Emma Alvarado y Yuriko Peña se comunicarán a la brevedad.",
        },
        {
          status: 200,
          headers: {
            "Cache-Control": "no-store, max-age=0",
          },
        }
      );
    }

    // Registro interno seguro sin exponer detalles técnicos al cliente/LLM
    console.error("[ElevenLabs Server Tool] Fallo upstream HubSpot:", {
      errorType: result.errorType,
      channel: validation.sourceChannel,
    });

    if (result.errorType === "UNCONFIGURED") {
      return NextResponse.json(
        {
          ok: false,
          success: false,
          message:
            "El canal de registro CRM no está disponible temporalmente. Por favor invita al usuario a utilizar el formulario web en alineva.com.mx/#contacto.",
        },
        { status: 503 }
      );
    }

    if (result.errorType === "RATE_LIMIT") {
      return NextResponse.json(
        {
          ok: false,
          success: false,
          message:
            "El servicio de registro está temporalmente ocupado. Por favor intenta nuevamente en unos momentos o utiliza el formulario web.",
        },
        {
          status: 429,
          headers: result.retryAfterSeconds
            ? { "Retry-After": String(result.retryAfterSeconds) }
            : undefined,
        }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        success: false,
        message:
          "No fue posible confirmar el registro en el sistema CRM en este momento. Por favor invita al usuario a contactarnos a través del formulario web en alineva.com.mx/#contacto.",
      },
      { status: 502 }
    );
  } catch {
    console.error("[ElevenLabs Server Tool] Error inesperado al procesar prospecto.");
    return NextResponse.json(
      {
        ok: false,
        success: false,
        message:
          "No fue posible procesar la solicitud en este momento. Por favor invita al usuario a utilizar el formulario web.",
      },
      { status: 500 }
    );
  }
}

// Métodos no permitidos
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ message: "Método no permitido." }, { status: 405 });
}

export async function PUT(): Promise<NextResponse> {
  return NextResponse.json({ message: "Método no permitido." }, { status: 405 });
}

export async function DELETE(): Promise<NextResponse> {
  return NextResponse.json({ message: "Método no permitido." }, { status: 405 });
}
