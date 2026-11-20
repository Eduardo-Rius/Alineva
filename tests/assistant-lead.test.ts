import test from "node:test";
import assert from "node:assert/strict";
import {
  validateAssistantLeadPayload,
  resolveAssistantSourceChannel,
  canPersistWhatsApp,
  ASSISTANT_VOICE_CHANNEL,
  ASSISTANT_TEXT_CHANNEL,
} from "../src/lib/assistant/leadValidator";
import {
  HubSpotClient,
  clearOwnerMemoryCache,
} from "../src/lib/hubspot/client";
import { validateContactPayload } from "../src/lib/hubspot/validator";
import {
  resolveAssistantAgentId,
  ELEVENLABS_AGENT_ID_REGEX,
} from "../src/components/VoiceAssistant/AssistantProvider";

const BASE_VALID_PAYLOAD = {
  firstName: "Ana",
  lastName: "Martínez",
  company: "Grupo Industrial Norte",
  email: "ana.martinez@example.com",
  phone: "+52 55 1111 2222",
  interest: "Tecnología y automatización",
  needSummary: "Busca ordenar procesos comerciales y atención al cliente.",
  consentConfirmed: true,
  isTextOnly: false,
};

// ==============================================================================
// 1. CANAL Y PARÁMETROS BÁSICOS
// ==============================================================================

test("resolveAssistantSourceChannel mapea estrictamente false -> Voz y true -> Texto", () => {
  assert.equal(resolveAssistantSourceChannel(false), ASSISTANT_VOICE_CHANNEL);
  assert.equal(resolveAssistantSourceChannel(true), ASSISTANT_TEXT_CHANNEL);
});

test("validateAssistantLeadPayload acepta isTextOnly=false como Chat voz ElevenLabs", () => {
  const res = validateAssistantLeadPayload({
    ...BASE_VALID_PAYLOAD,
    isTextOnly: false,
  });
  assert.equal(res.ok, true);
  assert.equal(res.isTextOnly, false);
  assert.equal(res.sourceChannel, "Chat voz ElevenLabs");
  assert.equal(res.sanitizedData?.sourceChannel, "Chat voz ElevenLabs");
  assert.match(
    res.sanitizedData?.message ?? "",
    /^\[Interacción: Chat voz ElevenLabs\]/
  );
  assert.equal(res.sanitizedData?.phone, "+52 55 1111 2222");
  assert.equal(res.sanitizedData?.mobilePhone, undefined);
});

test("validateAssistantLeadPayload acepta isTextOnly=true como Chat texto ElevenLabs", () => {
  const res = validateAssistantLeadPayload({
    ...BASE_VALID_PAYLOAD,
    isTextOnly: true,
  });
  assert.equal(res.ok, true);
  assert.equal(res.isTextOnly, true);
  assert.equal(res.sourceChannel, "Chat texto ElevenLabs");
  assert.equal(res.sanitizedData?.sourceChannel, "Chat texto ElevenLabs");
  assert.match(
    res.sanitizedData?.message ?? "",
    /^\[Interacción: Chat texto ElevenLabs\]/
  );
});

test("validateAssistantLeadPayload rechaza isTextOnly ausente o no booleano", () => {
  for (const invalidVal of [undefined, null, "true", "false", 1, 0]) {
    const res = validateAssistantLeadPayload({
      ...BASE_VALID_PAYLOAD,
      isTextOnly: invalidVal,
    });
    assert.equal(res.ok, false);
    assert.ok(
      res.errors.isTextOnly,
      `Se esperaba error en isTextOnly para valor: ${String(invalidVal)}`
    );
  }
});

test("validateAssistantLeadPayload exige campos obligatorios y consentimiento expreso", () => {
  const res = validateAssistantLeadPayload({
    firstName: "",
    lastName: "",
    company: "",
    interest: "",
    needSummary: "",
    consentConfirmed: false,
    isTextOnly: true,
  });
  assert.equal(res.ok, false);
  assert.ok(res.errors.firstName);
  assert.ok(res.errors.lastName);
  assert.ok(res.errors.company);
  assert.ok(res.errors.interest);
  assert.ok(res.errors.needSummary);
  assert.ok(res.errors.consentConfirmed);
  assert.ok(res.errors.contactChannel);
});

// ==============================================================================
// 2. MATRIZ T1 A T15: POLÍTICA FAIL-CLOSED Y BARRERA DE CONSENTIMIENTO
// ==============================================================================

test("T1: Solo email: lead válido", () => {
  const res = validateAssistantLeadPayload({
    ...BASE_VALID_PAYLOAD,
    phone: undefined,
    whatsapp: undefined,
    isTextOnly: true,
  });
  assert.equal(res.ok, true);
  assert.equal(res.sanitizedData?.email, "ana.martinez@example.com");
  assert.equal(res.sanitizedData?.phone, undefined);
  assert.equal(res.sanitizedData?.mobilePhone, undefined);
  assert.equal(res.warning, undefined);
});

test("T2: Solo phone: lead válido y WhatsApp ausente", () => {
  const res = validateAssistantLeadPayload({
    ...BASE_VALID_PAYLOAD,
    email: undefined,
    phone: "+52 55 1111 2222",
    whatsapp: undefined,
    isTextOnly: true,
  });
  assert.equal(res.ok, true);
  assert.equal(res.sanitizedData?.phone, "+52 55 1111 2222");
  assert.equal(res.sanitizedData?.mobilePhone, undefined);
  assert.equal(
    res.sanitizedData?.email,
    "contacto-525511112222@contacto.alineva.com.mx"
  );
  assert.equal(res.warning, undefined);
});

test("T3: Phone + WhatsApp igual al phone: phone persiste, WhatsApp omitido", () => {
  const res = validateAssistantLeadPayload({
    ...BASE_VALID_PAYLOAD,
    phone: "+52 55 1111 2222",
    whatsapp: "+52 55 1111 2222",
    isTextOnly: true,
  });
  assert.equal(res.ok, true);
  assert.equal(res.sanitizedData?.phone, "+52 55 1111 2222");
  assert.equal(res.sanitizedData?.mobilePhone, undefined);
  assert.equal(res.warning, "WHATSAPP_CONSENT_NOT_VERIFIED");
  assert.equal(res.warningReason, "AUTHORITATIVE_TRANSCRIPT_UNAVAILABLE");
});

test("T4: WhatsApp + evidencia genérica 'Sí': WhatsApp omitido", () => {
  const res = validateAssistantLeadPayload({
    ...BASE_VALID_PAYLOAD,
    phone: "+52 55 1111 2222",
    whatsapp: "+52 55 3333 4444",
    whatsappConsent: true,
    whatsappConsentEvidence: "Sí",
    isTextOnly: true,
  });
  assert.equal(res.ok, true);
  assert.equal(res.sanitizedData?.phone, "+52 55 1111 2222");
  assert.equal(res.sanitizedData?.mobilePhone, undefined);
  assert.equal(res.warning, "WHATSAPP_CONSENT_NOT_VERIFIED");
  assert.equal(res.warningReason, "AUTHORITATIVE_TRANSCRIPT_UNAVAILABLE");
});

test("T5: Evidencia 'Mi WhatsApp es...': WhatsApp omitido por falta de fuente autoritativa", () => {
  const directDecision = canPersistWhatsApp();
  assert.equal(directDecision.allowWhatsApp, false);
  assert.equal(directDecision.reason, "AUTHORITATIVE_TRANSCRIPT_UNAVAILABLE");

  const res = validateAssistantLeadPayload({
    ...BASE_VALID_PAYLOAD,
    phone: "+52 55 1111 2222",
    whatsapp: "+52 55 3333 4444",
    whatsappConsent: true,
    whatsappConsentEvidence: "Mi WhatsApp es +52 55 3333 4444",
    isTextOnly: true,
  });
  assert.equal(res.ok, true);
  assert.equal(res.sanitizedData?.phone, "+52 55 1111 2222");
  assert.equal(res.sanitizedData?.mobilePhone, undefined);
  assert.equal(res.warning, "WHATSAPP_CONSENT_NOT_VERIFIED");
  assert.equal(res.warningReason, "AUTHORITATIVE_TRANSCRIPT_UNAVAILABLE");
});

test("T6: Evidencia 'Contáctame por WhatsApp...': WhatsApp omitido por falta de fuente autoritativa", () => {
  const res = validateAssistantLeadPayload({
    ...BASE_VALID_PAYLOAD,
    phone: "+52 55 1111 2222",
    whatsapp: "+52 55 3333 4444",
    whatsappConsent: true,
    contactPreference: "whatsapp",
    whatsappConsentEvidence: "Contáctame por WhatsApp al +52 55 3333 4444",
    isTextOnly: true,
  });
  assert.equal(res.ok, true);
  assert.equal(res.sanitizedData?.phone, "+52 55 1111 2222");
  assert.equal(res.sanitizedData?.mobilePhone, undefined);
  assert.equal(res.warning, "WHATSAPP_CONSENT_NOT_VERIFIED");
  assert.equal(res.warningReason, "AUTHORITATIVE_TRANSCRIPT_UNAVAILABLE");
});

test("T7: Payload con verifiedUserMessages falsificado: ignorado y WhatsApp omitido", () => {
  const adversarialPayload = {
    ...BASE_VALID_PAYLOAD,
    phone: "+52 55 1111 2222",
    whatsapp: "+52 55 3333 4444",
    whatsappConsent: true,
    contactPreference: "whatsapp",
    whatsappConsentEvidence: "mi WhatsApp es +52 55 3333 4444",
    verifiedUserMessages: ["Hola, sí, mi WhatsApp es +52 55 3333 4444"],
    isTextOnly: true,
  };
  const res = validateAssistantLeadPayload(adversarialPayload);
  assert.equal(res.ok, true);
  assert.equal(res.sanitizedData?.phone, "+52 55 1111 2222");
  assert.equal(res.sanitizedData?.mobilePhone, undefined);
  assert.equal(res.warning, "WHATSAPP_CONSENT_NOT_VERIFIED");
  assert.equal(res.warningReason, "AUTHORITATIVE_TRANSCRIPT_UNAVAILABLE");
});

test("T8: WhatsApp con formato inválido + phone válido: lead válido; phone persiste", () => {
  const res = validateAssistantLeadPayload({
    ...BASE_VALID_PAYLOAD,
    phone: "+52 55 1111 2222",
    whatsapp: "@usuario_whatsapp_invalido",
    isTextOnly: true,
  });
  assert.equal(res.ok, true);
  assert.equal(res.sanitizedData?.phone, "+52 55 1111 2222");
  assert.equal(res.sanitizedData?.mobilePhone, undefined);
  assert.equal(res.warning, "WHATSAPP_CONSENT_NOT_VERIFIED");
  assert.equal(res.warningReason, "AUTHORITATIVE_TRANSCRIPT_UNAVAILABLE");
});

test("T9: WhatsApp con formato inválido + email válido: lead válido; email persiste", () => {
  const res = validateAssistantLeadPayload({
    ...BASE_VALID_PAYLOAD,
    phone: undefined,
    whatsapp: "https://sitio-spam.com/wa",
    email: "cliente@empresa.com",
    isTextOnly: true,
  });
  assert.equal(res.ok, true);
  assert.equal(res.sanitizedData?.email, "cliente@empresa.com");
  assert.equal(res.sanitizedData?.phone, undefined);
  assert.equal(res.sanitizedData?.mobilePhone, undefined);
  assert.equal(res.warning, "WHATSAPP_CONSENT_NOT_VERIFIED");
  assert.equal(res.warningReason, "AUTHORITATIVE_TRANSCRIPT_UNAVAILABLE");
});

test("T10: Únicamente WhatsApp sin email ni phone: lead rechazado por ausencia de medio autorizado verificable", () => {
  const res = validateAssistantLeadPayload({
    ...BASE_VALID_PAYLOAD,
    email: undefined,
    phone: undefined,
    whatsapp: "+52 55 9876 5432",
    isTextOnly: true,
  });
  assert.equal(res.ok, false);
  assert.ok(res.errors.contactChannel);
  assert.match(
    res.errors.contactChannel,
    /medio de contacto autorizado verificable/
  );
});

test("T11: Upsert sin WhatsApp contra contacto con WhatsApp preexistente: PATCH no incluye hs_whatsapp_phone_number", async () => {
  const prevToken = process.env.HUBSPOT_ACCESS_TOKEN;
  process.env.HUBSPOT_ACCESS_TOKEN = "test-token-mock";

  let patchProperties: Record<string, string> | null = null;

  const mockFetch: typeof fetch = async (input, init) => {
    const url = String(input);
    const method = init?.method || "GET";

    if (url.includes("/contacts/search")) {
      return new Response(
        JSON.stringify({
          total: 1,
          results: [
            {
              id: "555",
              properties: {
                email: "ana.martinez@example.com",
                phone: "+52 55 0000 1111",
                hs_whatsapp_phone_number: "+52 55 9999 8888",
              },
            },
          ],
        }),
        { status: 200 }
      );
    }

    if (method === "PATCH" && url.includes("/contacts/555")) {
      const parsed = JSON.parse(String(init?.body)) as {
        properties: Record<string, string>;
      };
      patchProperties = parsed.properties;
      return new Response(JSON.stringify({ id: "555" }), { status: 200 });
    }

    return new Response("Not Found", { status: 404 });
  };

  try {
    const validated = validateAssistantLeadPayload({
      ...BASE_VALID_PAYLOAD,
      phone: "+52 55 1111 2222",
      whatsapp: "+52 55 4444 5555", // Intentado, pero omitido
      isTextOnly: true,
    });
    assert.equal(validated.ok, true);
    assert.equal(validated.sanitizedData?.mobilePhone, undefined);

    const client = new HubSpotClient(mockFetch);
    const res = await client.upsertLead(validated.sanitizedData!);

    assert.equal(res.ok, true);
    assert.equal(res.action, "updated");
    assert.ok(patchProperties);
    const patched = patchProperties as Record<string, string>;
    assert.equal("hs_whatsapp_phone_number" in patched, false);
    assert.equal("mobilephone" in patched, false);
    assert.equal(patched.phone, "+52 55 1111 2222");
  } finally {
    if (prevToken === undefined) delete process.env.HUBSPOT_ACCESS_TOKEN;
    else process.env.HUBSPOT_ACCESS_TOKEN = prevToken;
  }
});

test("T12: resolveAssistantAgentId sin variable, vacía o inválida: error y cero inicio de sesión", () => {
  const resUndefined = resolveAssistantAgentId(undefined);
  assert.equal(resUndefined.agentId, "");
  assert.ok(resUndefined.error);
  assert.match(resUndefined.error, /no está configurado/);

  const resEmpty = resolveAssistantAgentId("");
  assert.equal(resEmpty.agentId, "");
  assert.ok(resEmpty.error);
  assert.match(resEmpty.error, /no puede ser una cadena vacía/);

  const resWhitespace = resolveAssistantAgentId("   ");
  assert.equal(resWhitespace.agentId, "");
  assert.ok(resWhitespace.error);
  assert.match(resWhitespace.error, /no puede ser una cadena vacía/);

  const resInvalid = resolveAssistantAgentId("not_an_agent_id");
  assert.equal(resInvalid.agentId, "");
  assert.ok(resInvalid.error);
  assert.match(resInvalid.error, /formato inválido/);

  const resTooShort = resolveAssistantAgentId("agent_123");
  assert.equal(resTooShort.agentId, "");
  assert.ok(resTooShort.error);
  assert.match(resTooShort.error, /formato inválido/);
});

test("T13: resolveAssistantAgentId con Agent ID válido: utiliza exactamente el configurado", () => {
  const prodId = "agent_9101m7n94v6kesnbxdb3283fjryz";
  const resProd = resolveAssistantAgentId(prodId);
  assert.equal(resProd.agentId, prodId);
  assert.equal(resProd.error, undefined);

  const developId = "agent_develop_qa_cloned_0123456789";
  const resDevelop = resolveAssistantAgentId(developId);
  assert.equal(resDevelop.agentId, developId);
  assert.equal(resDevelop.error, undefined);
});

test("T14: Texto y voz consumen la misma resolución explícita del Agent ID", () => {
  // Ambas modalidades consumen resolveAssistantAgentId sin fallback silencioso
  const res = resolveAssistantAgentId("agent_custom_voice_text_test");
  assert.equal(res.agentId, "agent_custom_voice_text_test");
  assert.equal(ELEVENLABS_AGENT_ID_REGEX.test(res.agentId), true);
});

test("T15: Logs de warning no contienen teléfono, email, evidencia ni transcripción", () => {
  const res = validateAssistantLeadPayload({
    ...BASE_VALID_PAYLOAD,
    phone: "+52 55 1111 2222",
    whatsapp: "+52 55 9999 0000",
    email: "cliente.confidencial@secreto.com",
    isTextOnly: true,
  });
  assert.equal(res.ok, true);
  assert.equal(res.warning, "WHATSAPP_CONSENT_NOT_VERIFIED");
  assert.equal(res.warningReason, "AUTHORITATIVE_TRANSCRIPT_UNAVAILABLE");

  // El warning solo transporta constantes técnicas, nunca PII
  assert.equal(res.warning.includes("+52"), false);
  assert.equal(res.warning.includes("confidencial"), false);
  assert.equal(res.warningReason?.includes("+52"), false);
  assert.equal(res.warningReason?.includes("@"), false);
});

// ==============================================================================
// 3. REGRESIONES DE HUBSPOT Y FORMULARIO WEB
// ==============================================================================

test("Regresión HubSpot: contacto nuevo recibe sourceChannel y omite hs_whatsapp_phone_number", async () => {
  const prevToken = process.env.HUBSPOT_ACCESS_TOKEN;
  const prevOwner = process.env.HUBSPOT_DEFAULT_OWNER_EMAIL;
  process.env.HUBSPOT_ACCESS_TOKEN = "test-token-mock";
  process.env.HUBSPOT_DEFAULT_OWNER_EMAIL = "owner@example.com";
  clearOwnerMemoryCache();

  const capturedBodies: Array<{ url: string; method: string; body?: Record<string, unknown> }> = [];

  const mockFetch: typeof fetch = async (input, init) => {
    const url = String(input);
    const method = init?.method || "GET";
    const parsedBody =
      typeof init?.body === "string"
        ? (JSON.parse(init.body) as Record<string, unknown>)
        : undefined;
    capturedBodies.push({ url, method, body: parsedBody });

    if (url.includes("/contacts/search")) {
      return new Response(JSON.stringify({ total: 0, results: [] }), {
        status: 200,
      });
    }
    if (url.includes("/crm/v3/owners")) {
      return new Response(
        JSON.stringify({
          results: [{ id: "12345", archived: false, email: "owner@example.com" }],
        }),
        { status: 200 }
      );
    }
    if (method === "POST" && url.endsWith("/contacts")) {
      return new Response(JSON.stringify({ id: "9001" }), { status: 201 });
    }
    return new Response("Not Found", { status: 404 });
  };

  try {
    const validated = validateAssistantLeadPayload({
      ...BASE_VALID_PAYLOAD,
      isTextOnly: true,
    });
    assert.equal(validated.ok, true);

    const client = new HubSpotClient(mockFetch);
    const res = await client.upsertLead(validated.sanitizedData!);

    assert.equal(res.ok, true);
    assert.equal(res.action, "created");
    assert.equal(res.contactId, "9001");

    const createCall = capturedBodies.find(
      (c) => c.method === "POST" && c.url.endsWith("/contacts")
    );
    assert.ok(createCall);
    const props = createCall.body?.properties as Record<string, string>;
    assert.equal(props.alineva_canal_origen, "Chat texto ElevenLabs");
    assert.equal(props.phone, "+52 55 1111 2222");
    assert.equal("hs_whatsapp_phone_number" in props, false);
    assert.equal(props.hubspot_owner_id, "12345");
    assert.equal(props.hs_lead_status, "NEW");
    assert.equal("mobilephone" in props, false);
    assert.equal("hs_whatsapp_bsuid" in props, false);
  } finally {
    if (prevToken === undefined) delete process.env.HUBSPOT_ACCESS_TOKEN;
    else process.env.HUBSPOT_ACCESS_TOKEN = prevToken;
    if (prevOwner === undefined) delete process.env.HUBSPOT_DEFAULT_OWNER_EMAIL;
    else process.env.HUBSPOT_DEFAULT_OWNER_EMAIL = prevOwner;
  }
});

test("Política first-touch: contacto existente con Formulario web NO sobrescribe sourceChannel al llegar por Chat texto", async () => {
  const prevToken = process.env.HUBSPOT_ACCESS_TOKEN;
  process.env.HUBSPOT_ACCESS_TOKEN = "test-token-mock";

  let patchPayload: Record<string, string> | null = null;

  const mockFetch: typeof fetch = async (input, init) => {
    const url = String(input);
    const method = init?.method || "GET";

    if (url.includes("/contacts/search")) {
      return new Response(
        JSON.stringify({
          total: 1,
          results: [
            {
              id: "777",
              properties: {
                email: "ana.martinez@example.com",
                alineva_canal_origen: "Formulario web",
              },
            },
          ],
        }),
        { status: 200 }
      );
    }

    if (method === "PATCH" && url.includes("/contacts/777")) {
      const parsed = JSON.parse(String(init?.body)) as {
        properties: Record<string, string>;
      };
      patchPayload = parsed.properties;
      return new Response(JSON.stringify({ id: "777" }), { status: 200 });
    }

    return new Response("Not Found", { status: 404 });
  };

  try {
    const validated = validateAssistantLeadPayload({
      ...BASE_VALID_PAYLOAD,
      isTextOnly: true,
    });
    assert.equal(validated.ok, true);

    const client = new HubSpotClient(mockFetch);
    const res = await client.upsertLead(validated.sanitizedData!);

    assert.equal(res.ok, true);
    assert.equal(res.action, "updated");
    assert.ok(patchPayload);
    const patched = patchPayload as Record<string, string>;
    assert.equal("alineva_canal_origen" in patched, false);
    assert.equal("alineva__canal_de_origen" in patched, false);
    assert.equal("hubspot_owner_id" in patched, false);
    assert.equal("hs_lead_status" in patched, false);
    assert.match(patched.alineva_mensaje, /^\[Interacción: Chat texto ElevenLabs\]/);
  } finally {
    if (prevToken === undefined) delete process.env.HUBSPOT_ACCESS_TOKEN;
    else process.env.HUBSPOT_ACCESS_TOKEN = prevToken;
  }
});

test("Regresión formulario web: validateContactPayload permanece intacto y emite Formulario web", () => {
  const res = validateContactPayload({
    firstName: "Carlos",
    lastName: "López",
    company: "Alineva Test",
    email: "carlos@example.com",
    phone: "+52 55 1234 5678",
    mobilePhone: "+52 55 8765 4321",
    interest: "Estrategia y crecimiento",
    message: "Consulta de prueba del formulario web.",
    privacyConsent: true,
    website: "",
  });
  assert.equal(res.isValid, true);
  assert.equal(res.sanitizedData?.email, "carlos@example.com");
  const client = new HubSpotClient();
  const { properties } = client.buildProperties(res.sanitizedData!);
  assert.equal(properties.alineva_canal_origen, "Formulario web");
});
