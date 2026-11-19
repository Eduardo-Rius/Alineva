import test from "node:test";
import assert from "node:assert/strict";
import {
  validateAssistantLeadPayload,
  resolveAssistantSourceChannel,
  ASSISTANT_VOICE_CHANNEL,
  ASSISTANT_TEXT_CHANNEL,
} from "../src/lib/assistant/leadValidator";
import {
  HubSpotClient,
  clearOwnerMemoryCache,
} from "../src/lib/hubspot/client";
import { validateContactPayload } from "../src/lib/hubspot/validator";

const BASE_VALID_PAYLOAD = {
  firstName: "Ana",
  lastName: "Martínez",
  company: "Grupo Industrial Norte",
  email: "ana.martinez@example.com",
  phone: "+52 55 1111 2222",
  whatsapp: "+52 55 3333 4444",
  interest: "Tecnología y automatización",
  needSummary: "Busca ordenar procesos comerciales y atención al cliente.",
  consentConfirmed: true,
  isTextOnly: false,
};

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
  assert.equal(res.sanitizedData?.mobilePhone, "+52 55 3333 4444");
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

test("validateAssistantLeadPayload permite WhatsApp sin email y rechaza usuarios/URLs en WhatsApp", () => {
  const okRes = validateAssistantLeadPayload({
    ...BASE_VALID_PAYLOAD,
    email: undefined,
    phone: undefined,
    whatsapp: "+52 55 9876 5432",
    isTextOnly: true,
  });
  assert.equal(okRes.ok, true);
  assert.equal(
    okRes.sanitizedData?.email,
    "contacto-525598765432@contacto.alineva.com.mx"
  );
  assert.equal(okRes.sanitizedData?.mobilePhone, "+52 55 9876 5432");

  const badWa = validateAssistantLeadPayload({
    ...BASE_VALID_PAYLOAD,
    whatsapp: "@usuario_whatsapp",
    isTextOnly: true,
  });
  assert.equal(badWa.ok, false);
  assert.ok(badWa.errors.whatsapp);
});

test("HubSpotClient registra sourceChannel en contacto nuevo (Voz y Texto) sin mobilephone ni BSUID", async () => {
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
    assert.equal(props.hs_whatsapp_phone_number, "+52 55 3333 4444");
    assert.equal(props.hubspot_owner_id, "12345");
    assert.equal(props.hs_lead_status, "NEW");
    assert.equal("mobilephone" in props, false);
    assert.equal("hs_whatsapp_bsuid" in props, false);
    assert.equal("whatsapp_bsuid" in props, false);
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
    // First-touch: sourceChannel original NO se sobrescribe
    assert.equal("alineva_canal_origen" in patched, false);
    assert.equal("alineva__canal_de_origen" in patched, false);
    // Tampoco se reasigna propietario ni estado
    assert.equal("hubspot_owner_id" in patched, false);
    assert.equal("hs_lead_status" in patched, false);
    // El canal de la interacción posterior SÍ queda en el mensaje
    assert.match(patched.alineva_mensaje, /^\[Interacción: Chat texto ElevenLabs\]/);
  } finally {
    if (prevToken === undefined) delete process.env.HUBSPOT_ACCESS_TOKEN;
    else process.env.HUBSPOT_ACCESS_TOKEN = prevToken;
  }
});

test("Política first-touch: contacto existente SIN sourceChannel previo recibe el canal una sola vez", async () => {
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
              id: "888",
              properties: {
                email: "ana.martinez@example.com",
                alineva_canal_origen: "",
              },
            },
          ],
        }),
        { status: 200 }
      );
    }

    if (method === "PATCH" && url.includes("/contacts/888")) {
      const parsed = JSON.parse(String(init?.body)) as {
        properties: Record<string, string>;
      };
      patchPayload = parsed.properties;
      return new Response(JSON.stringify({ id: "888" }), { status: 200 });
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
    assert.equal(patched.alineva_canal_origen, "Chat texto ElevenLabs");
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
