/**
 * Endpoint serverless para la recepción y procesamiento seguro de prospectos.
 * Conecta el formulario Web con HubSpot CRM sin exponer credenciales.
 * Protocolo: SR-ALINEVA-HUBSPOT-01D
 */

import { NextRequest, NextResponse } from "next/server";
import { HubSpotClient } from "@/lib/hubspot/client";
import { validateContactPayload } from "@/lib/hubspot/validator";
import { ApiContactResponse } from "@/lib/hubspot/types";

const MAX_BODY_BYTES = 32 * 1024; // 32 KB

// Protección local y best-effort por instancia serverless. Reduce abuso accidental o repetitivo dentro de una instancia activa, pero no constituye un rate limit distribuido ni una protección perimetral definitiva de producción.
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutos
const MAX_REQUESTS_PER_WINDOW = 10; // Máximo 10 envíos por ventana por IP

function checkIpRateLimit(ip: string): boolean {
  const now = Date.now();
  // Limpieza periódica si la tabla supera 1000 IPs
  if (rateLimitMap.size > 1000) {
    for (const [key, val] of rateLimitMap.entries()) {
      if (now > val.resetAt) rateLimitMap.delete(key);
    }
  }

  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  entry.count++;
  return true;
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiContactResponse>> {
  // 1. Verificación de Content-Type
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json(
      {
        ok: false,
        code: "VALIDATION_ERROR",
        message: "El encabezado Content-Type debe ser application/json.",
      },
      { status: 415 }
    );
  }

  // 2. Control de abusos por IP (Rate Limiting en memoria)
  const clientIp =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1";

  if (!checkIpRateLimit(clientIp)) {
    return NextResponse.json(
      {
        ok: false,
        code: "RATE_LIMIT_EXCEEDED",
        message: "Demasiadas solicitudes enviadas recientemente. Por favor espera unos minutos.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": "900",
        },
      }
    );
  }

  // 3. Verificación de tamaño del payload
  const contentLength = Number(request.headers.get("content-length")) || 0;
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      {
        ok: false,
        code: "VALIDATION_ERROR",
        message: "El tamaño de la solicitud excede el límite permitido.",
      },
      { status: 413 }
    );
  }

  // 4. Parseo seguro de JSON
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        code: "VALIDATION_ERROR",
        message: "Formato de solicitud inválido (JSON no interpretable).",
      },
      { status: 400 }
    );
  }

  // 5. Validación estricta y sanitización
  const validation = validateContactPayload(body);

  if (validation.isBot) {
    // Si se activa el honeypot ("website"), responder sin dar pistas a bots
    return NextResponse.json(
      {
        ok: false,
        code: "BOT_DETECTED",
        message: "Solicitud rechazada.",
      },
      { status: 400 }
    );
  }

  if (!validation.isValid || !validation.sanitizedData) {
    return NextResponse.json(
      {
        ok: false,
        code: "VALIDATION_ERROR",
        message: "Por favor revisa los campos requeridos del formulario.",
        details: validation.errors,
      },
      { status: 400 }
    );
  }

  // 6. Instanciar cliente de HubSpot y procesar
  const hubspotClient = new HubSpotClient();
  const result = await hubspotClient.upsertLead(validation.sanitizedData);

  // Manejo de servicio no configurado (sin token activo)
  if (!result.ok && result.errorType === "UNCONFIGURED") {
    return NextResponse.json(
      {
        ok: false,
        code: "SERVICE_UNCONFIGURED",
        message:
          "Formulario validado correctamente. El canal de entrega con HubSpot CRM aún no está activado con credenciales de producción.",
      },
      { status: 503 }
    );
  }

  // Manejo de límite de tasa del CRM upstream
  if (!result.ok && result.errorType === "RATE_LIMIT") {
    return NextResponse.json(
      {
        ok: false,
        code: "UPSTREAM_RATE_LIMIT",
        message: "El servicio de CRM se encuentra ocupado temporalmente. Por favor intenta más tarde.",
      },
      {
        status: 429,
        headers: result.retryAfterSeconds
          ? { "Retry-After": String(result.retryAfterSeconds) }
          : undefined,
      }
    );
  }

  // Manejo de errores de conexión o upstream
  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        code: "UPSTREAM_ERROR",
        message:
          "En este momento no fue posible registrar tu solicitud en nuestro sistema. Por favor intenta más tarde o escríbenos directamente.",
      },
      { status: 502 }
    );
  }

  // 7. Éxito institucional uniforme (Prevención de enumeración de prospectos)
  // Nota de seguridad: La respuesta hacia el cliente web es ESTRICTAMENTE IDÉNTICA
  // tanto si el contacto fue creado como si ya existía y fue actualizado.
  return NextResponse.json(
    {
      ok: true,
      code: "SUCCESS_PROCESSED",
      message:
        "Mensaje recibido. Muchas gracias por contactarnos. Emma Alvarado y Yuriko Peña se comunicarán contigo a la brevedad.",
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
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
