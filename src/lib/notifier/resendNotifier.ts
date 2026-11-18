/**
 * Notificador desacoplado para envío de alertas operativas de nuevos prospectos vía Resend API.
 * Protocolo: SR-ALINEVA-WHATSAPP-06H-R1
 *
 * Directivas de privacidad y seguridad:
 * 1. Minimización estricta de datos: CERO teléfono, WhatsApp, correo personal o mensaje en el correo.
 * 2. Idempotencia: Idempotency-Key basada exclusivamente en contactId (alineva-new-lead/{contactId}).
 * 3. Trazabilidad: Registra únicamente resendId, contactId y timestamp (diferenciando 'Aceptado por Resend').
 * 4. Cero secretos en código o logs.
 * 5. Llamada segura con timeout de 6000ms.
 */

import { SanitizedLeadData } from "../hubspot/types";

export interface NotificationContext {
  contactId?: string;
  isNewContact: boolean;
  localConsentDate: string;
  portalId?: string;
}

export interface NotificationResult {
  ok: boolean;
  skipped?: boolean;
  error?: string;
  resendId?: string;
}

export type FetchFunction = typeof fetch;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function getNotifierConfig() {
  const apiKey = process.env.RESEND_API_KEY?.trim() || "";
  const toEmail = process.env.ALINEVA_LEAD_NOTIFICATION_EMAIL?.trim() || "";
  const fromEmail = process.env.ALINEVA_LEAD_NOTIFICATION_FROM?.trim() || "";
  const replyTo = process.env.ALINEVA_LEAD_NOTIFICATION_REPLY_TO?.trim() || "";

  return {
    apiKey,
    toEmail,
    fromEmail,
    replyTo,
    isConfigured: Boolean(apiKey && toEmail),
  };
}

export class ResendNotifier {
  private customFetch: FetchFunction;

  constructor(customFetch?: FetchFunction) {
    this.customFetch = customFetch || fetch;
  }

  /**
   * Genera el contenido estrictamente minimizado del aviso.
   * Prohibido incluir correo del prospecto, teléfono, WhatsApp o mensaje.
   */
  public buildNotificationContent(
    lead: SanitizedLeadData,
    context: NotificationContext
  ): { subject: string; text: string; html: string; crmLink: string | null } {
    const actionLabel = context.isNewContact
      ? "Nuevo prospecto registrado"
      : "Prospecto actualizado";

    const subject = `[Alineva CRM] ${actionLabel} — Pendiente de asignación`;

    const name = escapeHtml(`${lead.firstName} ${lead.lastName}`.trim());
    const company = escapeHtml(lead.company.trim());
    const interest = escapeHtml(lead.interest.trim());
    const hasPhone = Boolean(lead.phone && lead.phone.trim() !== "");
    const hasWhatsApp = Boolean(lead.mobilePhone && lead.mobilePhone.trim() !== "");

    let crmLink: string | null = null;
    const portalId = context.portalId?.trim() || "248017141";
    if (context.contactId && /^[a-zA-Z0-9_-]+$/.test(context.contactId)) {
      crmLink = `https://app.hubspot.com/contacts/${encodeURIComponent(portalId)}/contact/${encodeURIComponent(context.contactId)}`;
    }

    const text = [
      `ALINEVA CRM — ALERTA OPERATIVA`,
      `----------------------------------------`,
      `Estatus: Pendiente de asignación en HubSpot CRM`,
      `Tipo: ${actionLabel}`,
      `Fecha: ${context.localConsentDate}`,
      `Canal de origen: Formulario web`,
      ``,
      `DATOS GENERALES (DATOS DE CONTACTO PROTEGIDOS):`,
      `Nombre: ${name}`,
      `Empresa: ${company}`,
      `Área de interés: ${interest}`,
      `Teléfono de la empresa proporcionado: ${hasPhone ? "Sí" : "No"}`,
      `WhatsApp autorizado proporcionado: ${hasWhatsApp ? "Sí" : "No"}`,
      ``,
      crmLink ? `Enlace HubSpot: ${crmLink}` : `Enlace HubSpot: Pendiente de sincronización`,
      `----------------------------------------`,
      `Aviso automatizado. Para consultar datos de contacto completos, acceder a HubSpot CRM.`,
    ].join("\n");

    const html = `
<div style="font-family: sans-serif; font-size: 14px; line-height: 1.5; color: #111;">
  <h3 style="margin-top:0;">Alineva CRM — Alerta Operativa</h3>
  <p><strong>Estatus:</strong> Pendiente de asignación en HubSpot CRM<br/>
  <strong>Fecha:</strong> ${context.localConsentDate}<br/>
  <strong>Canal de origen:</strong> Formulario web</p>
  <hr style="border: 0; border-top: 1px solid #ccc;"/>
  <p><strong>Nombre:</strong> ${name}<br/>
  <strong>Empresa:</strong> ${company}<br/>
  <strong>Área de interés:</strong> ${interest}<br/>
  <strong>Teléfono de empresa:</strong> ${hasPhone ? "Sí" : "No"}<br/>
  <strong>WhatsApp autorizado:</strong> ${hasWhatsApp ? "Sí" : "No"}</p>
  ${crmLink ? `<p><strong>HubSpot CRM:</strong> <a href="${crmLink}">Ver registro seguro en HubSpot</a></p>` : ""}
  <hr style="border: 0; border-top: 1px solid #ccc;"/>
  <p style="font-size: 11px; color: #666;">Datos de contacto protegidos. Consultar ficha en HubSpot para gestión.</p>
</div>`.trim();

    return { subject, text, html, crmLink };
  }

  /**
   * Envía la notificación operativa con Idempotency-Key y registro saneado.
   */
  public async sendLeadNotification(
    lead: SanitizedLeadData,
    context: NotificationContext
  ): Promise<NotificationResult> {
    const config = getNotifierConfig();

    if (!config.isConfigured) {
      return { ok: false, skipped: true, error: "RESEND_NOT_CONFIGURED" };
    }

    const { subject, text, html } = this.buildNotificationContent(lead, context);

    const headers: Record<string, string> = {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    };

    // Idempotency-Key basada exclusivamente en contactId (SR-ALINEVA-WHATSAPP-06H-R1)
    if (context.contactId && /^[a-zA-Z0-9_-]+$/.test(context.contactId)) {
      headers["Idempotency-Key"] = `alineva-new-lead/${context.contactId}`;
    }

    const payload: Record<string, unknown> = {
      from: config.fromEmail || "Alineva CRM <onboarding@resend.dev>",
      to: [config.toEmail],
      subject,
      text,
      html,
    };

    if (config.replyTo) {
      payload.reply_to = config.replyTo;
    }

    try {
      const response = await this.customFetch("https://api.resend.com/emails", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(6000),
      });

      if (!response.ok) {
        return { ok: false, error: `RESEND_HTTP_${response.status}` };
      }

      let resendId: string | undefined;
      try {
        const resJson = (await response.json()) as { id?: string };
        resendId = resJson?.id;
      } catch {
        // ignore JSON parse error
      }

      // Trazabilidad saneada (cero tokens, cero payload, diferenciando 'Aceptado por Resend')
      if (resendId) {
        console.info(
          JSON.stringify({
            event: "RESEND_ACCEPTED",
            status: "ACCEPTED_BY_RESEND",
            resendId,
            contactId: context.contactId || "unknown",
            timestamp: new Date().toISOString(),
          })
        );
      }

      return { ok: true, resendId };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "NETWORK_ERROR";
      return { ok: false, error: msg };
    }
  }
}
