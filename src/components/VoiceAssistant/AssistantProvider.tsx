"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ConversationProvider, useConversation } from "@elevenlabs/react";
import type {
  DisconnectionDetails,
  MessagePayload,
  Mode,
  Status,
} from "@elevenlabs/react";
import type {
  AssistantContextValue,
  AssistantMode,
  AssistantVisualState,
  ChatMessage,
} from "./types";

export const ELEVENLABS_AGENT_ID_REGEX = /^agent_[a-zA-Z0-9_-]{10,64}$/;

export interface ResolvedAgentConfig {
  agentId: string;
  error?: string;
}

/**
 * Resuelve y valida estrictamente el Agent ID de ElevenLabs desde la variable de entorno.
 * Protocolo: SR-ALINEVA-WHATSAPP-CONSENT-GUARD-02-B
 *
 * Exige configuración explícita en todos los entornos:
 * - Ausente: error, sin fallback.
 * - Vacía: error.
 * - Formato inválido: error.
 * - Válida: devuelve el Agent ID configurado.
 */
export function resolveAssistantAgentId(envValue?: string): ResolvedAgentConfig {
  const raw =
    envValue !== undefined ? envValue : process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

  if (raw === undefined || raw === null) {
    return {
      agentId: "",
      error:
        "NEXT_PUBLIC_ELEVENLABS_AGENT_ID no está configurado en las variables de entorno.",
    };
  }

  const trimmed = raw.trim();

  if (trimmed === "") {
    return {
      agentId: "",
      error: "NEXT_PUBLIC_ELEVENLABS_AGENT_ID no puede ser una cadena vacía.",
    };
  }

  if (!ELEVENLABS_AGENT_ID_REGEX.test(trimmed)) {
    return {
      agentId: "",
      error:
        "NEXT_PUBLIC_ELEVENLABS_AGENT_ID tiene un formato inválido. Debe comenzar con 'agent_' seguido de caracteres alfanuméricos válidos.",
    };
  }

  return {
    agentId: trimmed,
  };
}

/**
 * Observabilidad diagnóstica exclusiva para el dominio DEVELOP (SR-ALINEVA-VOICE-STATE-DIAG-02).
 * Estrictamente deshabilitada en producción (alineva.netlify.app).
 * Registra únicamente nombres de etapa y estados sanitizados, sin tokens, credenciales ni PII.
 */
export function isVoiceDiagEnabled(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return (
    host === "develop--alineva.netlify.app" ||
    host === "localhost" ||
    host === "127.0.0.1"
  );
}

function sanitizeDiagText(raw: string): string {
  return raw
    .replace(/[a-zA-Z0-9_-]{20,}/g, "[REDACTED_ID]")
    .replace(/[^\w\s.:|/-]/g, "");
}

export function logVoiceDiag(stage: string, detail?: string): void {
  if (!isVoiceDiagEnabled()) return;
  const detailSuffix = detail ? `: ${sanitizeDiagText(detail)}` : "";
  console.log(`[VoiceDiag] ${stage}${detailSuffix}`);
}

const AssistantControllerContext = createContext<AssistantContextValue | null>(
  null
);

function mapErrorToSpanish(error: unknown, mode: AssistantMode): {
  message: string;
  isMicDenied: boolean;
} {
  if (error instanceof DOMException || error instanceof Error) {
    const name = error.name;
    const lower = error.message.toLowerCase();

    if (
      name === "NotAllowedError" ||
      name === "PermissionDeniedError" ||
      lower.includes("permission") ||
      lower.includes("not allowed") ||
      lower.includes("denied")
    ) {
      return {
        message:
          "No se concedió permiso para usar el micrófono. Puedes habilitarlo en tu navegador o continuar de inmediato por chat escrito.",
        isMicDenied: true,
      };
    }

    if (
      name === "NotFoundError" ||
      name === "DevicesNotFoundError" ||
      lower.includes("requested device not found")
    ) {
      return {
        message:
          "No detectamos un micrófono disponible en este dispositivo. Puedes continuar de inmediato mediante el chat escrito.",
        isMicDenied: true,
      };
    }

    if (
      lower.includes("origin") ||
      lower.includes("403") ||
      lower.includes("unauthorized") ||
      lower.includes("forbidden")
    ) {
      return {
        message:
          "La conexión con el asistente solo está autorizada en los dominios oficiales de Alineva. Si prefieres, utiliza el formulario de contacto.",
        isMicDenied: false,
      };
    }
  }

  return {
    message:
      mode === "voice"
        ? "No fue posible conectar la conversación por voz en este momento. Puedes intentar nuevamente o cambiar al chat escrito."
        : "No fue posible conectar el chat escrito en este momento. Puedes intentar nuevamente o usar el formulario de contacto.",
    isMicDenied: false,
  };
}

function waitMs(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function getStatusText(
  visualState: AssistantVisualState,
  isRequestingMic: boolean,
  isAgentTyping: boolean,
  activeMode: AssistantMode,
  hasMessages: boolean
): string {
  if (isRequestingMic) return "Solicitando permiso de micrófono…";
  switch (visualState) {
    case "connecting":
      return "Conectando con Alineva…";
    case "listening":
      return "Escuchando… habla con naturalidad";
    case "speaking":
      return "Alineva está respondiendo…";
    case "text-active":
      return isAgentTyping
        ? "Alineva está escribiendo una respuesta…"
        : "Chat escrito activo (sin micrófono)";
    case "disconnecting":
      return "Finalizando conversación…";
    case "error":
      return "No se pudo continuar la conexión";
    case "idle":
    default:
      if (hasMessages) {
        return "Conversación finalizada";
      }
      if (activeMode === "text") {
        return "Chat escrito listo";
      }
      if (activeMode === "voice") {
        return "Listo para conversar";
      }
      return "Disponible ahora";
  }
}

export function getDialogTitle(activeMode: AssistantMode): string {
  if (activeMode === "text") return "Chat escrito · Alineva";
  if (activeMode === "voice") return "Asistente por voz · Alineva";
  return "Asistente Virtual · Alineva";
}

export function getComposerPlaceholder(
  visualState: AssistantVisualState,
  hasMessages: boolean
): string {
  if (visualState === "text-active") {
    return "Escribe tu mensaje… (Enter para enviar, Shift+Enter nueva línea)";
  }
  if (hasMessages && visualState === "idle") {
    return "Conversación finalizada";
  }
  if (visualState === "connecting") {
    return "Conectando…";
  }
  return "Esperando conexión…";
}

function AssistantControllerInner({ children }: { children: React.ReactNode }) {
  const [activeMode, setActiveMode] = useState<AssistantMode>("none");
  const [visualState, setVisualState] = useState<AssistantVisualState>("idle");
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isRequestingMic, setIsRequestingMic] = useState(false);
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [micDenied, setMicDenied] = useState(false);
  const [statusAnnouncement, setStatusAnnouncement] = useState("");

  const activeModeRef = useRef<AssistantMode>("none");
  const transitionLockRef = useRef(false);
  const isSendingRef = useRef(false);
  const lastInvokerRef = useRef<HTMLElement | null>(null);
  const msgCounterRef = useRef(0);
  const intentionalCloseRef = useRef(false);
  const streamingMessageIdRef = useRef<string | null>(null);

  const nextMessageId = useCallback((): string => {
    msgCounterRef.current += 1;
    return `msg-${Date.now()}-${msgCounterRef.current}`;
  }, []);

  const updateActiveMode = useCallback((mode: AssistantMode) => {
    activeModeRef.current = mode;
    setActiveMode(mode);
  }, []);

  const handleConnect = useCallback(() => {
    const mode = activeModeRef.current;
    setErrorMessage(null);
    setMicDenied(false);
    setIsRequestingMic(false);
    if (mode === "text") {
      setVisualState("text-active");
      setStatusAnnouncement("Chat escrito conectado con el asistente de Alineva.");
    } else if (mode === "voice") {
      setVisualState("listening");
      setStatusAnnouncement("Asistente por voz conectado. Te escuchamos.");
    }
  }, []);

  const handleDisconnect = useCallback(
    (details: DisconnectionDetails) => {
      logVoiceDiag("disconnect callback", details.reason);
      streamingMessageIdRef.current = null;
      isSendingRef.current = false;
      setIsAgentTyping(false);
      setIsRequestingMic(false);

      if (intentionalCloseRef.current) {
        intentionalCloseRef.current = false;
        setVisualState("idle");
        return;
      }

      if (details.reason === "error") {
        logVoiceDiag("disconnect reason error", details.message);
        const mapped = mapErrorToSpanish(
          new Error(details.message || "Error de conexión"),
          activeModeRef.current
        );
        setVisualState("error");
        setErrorMessage(mapped.message);
        setMicDenied(mapped.isMicDenied);
        setStatusAnnouncement(`Error: ${mapped.message}`);
        return;
      }

      // Cierre iniciado por el agente o fin natural de sesión.
      // Preservamos activeMode mientras el panel permanezca abierto
      // para no colapsar la interfaz de texto a voz ni desmontar el historial.
      // activeMode solo se restablece a "none" cuando el usuario cierra expresamente el panel.
      setVisualState("idle");
      setStatusAnnouncement("Conversación finalizada.");
    },
    []
  );

  const handleModeChange = useCallback((prop: { mode: Mode }) => {
    if (activeModeRef.current !== "voice") {
      return;
    }
    if (prop.mode === "speaking") {
      setVisualState("speaking");
      setStatusAnnouncement("El asistente está respondiendo.");
    } else {
      setVisualState("listening");
      setStatusAnnouncement("El asistente te está escuchando.");
    }
  }, []);

  const handleStatusChange = useCallback((prop: { status: Status }) => {
    logVoiceDiag("status callback", prop.status);
    if (prop.status === "connecting") {
      setVisualState("connecting");
    } else if (prop.status === "disconnecting") {
      setVisualState("disconnecting");
    } else if (prop.status === "connected") {
      if (activeModeRef.current === "text") {
        setVisualState("text-active");
      } else if (activeModeRef.current === "voice") {
        setVisualState("listening");
      }
    }
  }, []);

  const handleMessage = useCallback(
    (payload: MessagePayload) => {
      const cleanText = payload.message.trim();
      if (!cleanText) return;

      const role: "user" | "agent" =
        payload.role === "user" || payload.source === "user" ? "user" : "agent";

      if (role === "agent") {
        isSendingRef.current = false;
        setIsAgentTyping(false);
      }

      setMessages((prev) => {
        // Reconciliar mensaje en streaming si existe
        if (role === "agent" && streamingMessageIdRef.current) {
          const streamId = streamingMessageIdRef.current;
          streamingMessageIdRef.current = null;
          const idx = prev.findIndex((m) => m.id === streamId);
          if (idx !== -1) {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], text: cleanText };
            return updated;
          }
        }

        // Evitar duplicación inmediata del mismo turno del usuario
        const last = prev[prev.length - 1];
        if (
          last &&
          last.role === role &&
          last.text === cleanText &&
          Date.now() - last.timestamp < 5000
        ) {
          return prev;
        }

        return [
          ...prev,
          {
            id: nextMessageId(),
            role,
            text: cleanText,
            timestamp: Date.now(),
          },
        ];
      });
    },
    [nextMessageId]
  );

  const handleAgentChatResponsePart = useCallback(
    (part: { text?: string; type?: string }) => {
      if (activeModeRef.current !== "text") return;

      if (part.type === "start") {
        setIsAgentTyping(true);
        const id = nextMessageId();
        streamingMessageIdRef.current = id;
        setMessages((prev) => [
          ...prev,
          { id, role: "agent", text: "", timestamp: Date.now() },
        ]);
        return;
      }

      if (part.type === "delta" && part.text) {
        setIsAgentTyping(true);
        if (!streamingMessageIdRef.current) {
          const id = nextMessageId();
          streamingMessageIdRef.current = id;
          setMessages((prev) => [
            ...prev,
            { id, role: "agent", text: part.text || "", timestamp: Date.now() },
          ]);
          return;
        }
        const streamId = streamingMessageIdRef.current;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === streamId ? { ...m, text: m.text + (part.text || "") } : m
          )
        );
        return;
      }

      if (part.type === "stop") {
        setIsAgentTyping(false);
        isSendingRef.current = false;
      }
    },
    [nextMessageId]
  );

  const handleAgentTyping = useCallback(() => {
    if (activeModeRef.current === "text") {
      setIsAgentTyping(true);
    }
  }, []);

  const handleError = useCallback((message: string, context?: unknown) => {
    isSendingRef.current = false;
    setIsAgentTyping(false);
    setIsRequestingMic(false);
    const errName = context instanceof Error ? context.name : "ConversationError";
    const errMessage = context instanceof Error ? context.message : message;
    logVoiceDiag("error callback", `${errName} | ${errMessage}`);
    if (process.env.NODE_ENV !== "production") {
      console.error(`[Assistant Error] ${errName}: ${errMessage}`);
    }
    const mapped = mapErrorToSpanish(
      context instanceof Error ? context : new Error(message),
      activeModeRef.current
    );
    setVisualState("error");
    setErrorMessage(mapped.message);
    setMicDenied(mapped.isMicDenied);
    setStatusAnnouncement(`Error: ${mapped.message}`);
  }, []);

  const conversation = useConversation({
    onConnect: handleConnect,
    onDisconnect: handleDisconnect,
    onModeChange: handleModeChange,
    onStatusChange: handleStatusChange,
    onMessage: handleMessage,
    onAgentChatResponsePart: handleAgentChatResponsePart,
    onAgentTyping: handleAgentTyping,
    onError: handleError,
  });

  const conversationRef = useRef(conversation);
  useEffect(() => {
    conversationRef.current = conversation;
  }, [conversation]);

  const stopCurrentSessionSafely = useCallback(async (): Promise<void> => {
    const conv = conversationRef.current;
    const isActive =
      conv.status === "connected" ||
      conv.status === "connecting" ||
      activeModeRef.current !== "none";

    if (!isActive) {
      return;
    }

    intentionalCloseRef.current = true;
    streamingMessageIdRef.current = null;
    isSendingRef.current = false;
    setIsAgentTyping(false);
    setVisualState("disconnecting");
    setStatusAnnouncement("Finalizando conversación actual.");

    try {
      conv.endSession();
      // Pequeña espera para permitir liberación limpia de WebRTC/WebSocket antes de abrir otra modalidad
      await waitMs(220);
    } catch {
      // Silencioso: continuar limpieza de estado
    }

    setVisualState("idle");
  }, []);

  const restoreFocusToInvoker = useCallback(() => {
    const invoker = lastInvokerRef.current;
    if (invoker && typeof invoker.focus === "function" && document.contains(invoker)) {
      requestAnimationFrame(() => {
        invoker.focus();
      });
    }
  }, []);

  const endActiveSession = useCallback(
    async (shouldClosePanel = true): Promise<void> => {
      if (transitionLockRef.current) return;
      transitionLockRef.current = true;
      try {
        await stopCurrentSessionSafely();
        setErrorMessage(null);
        setMicDenied(false);
        setIsRequestingMic(false);
        if (shouldClosePanel) {
          setIsPanelOpen(false);
          updateActiveMode("none");
          setMessages([]);
          restoreFocusToInvoker();
        }
        setStatusAnnouncement("Conversación finalizada.");
      } finally {
        transitionLockRef.current = false;
      }
    },
    [restoreFocusToInvoker, stopCurrentSessionSafely, updateActiveMode]
  );

  const closePanel = useCallback(async (): Promise<void> => {
    await endActiveSession(true);
  }, [endActiveSession]);

  const startVoiceSession = useCallback(
    async (invoker?: HTMLElement | null): Promise<void> => {
      logVoiceDiag("startVoiceSession invoked");
      if (transitionLockRef.current) {
        logVoiceDiag("transition lock active - early return");
        return;
      }
      if (
        activeModeRef.current === "voice" &&
        (conversationRef.current.status === "connected" ||
          conversationRef.current.status === "connecting")
      ) {
        logVoiceDiag("voice session already connecting/connected - early return");
        setIsPanelOpen(true);
        return;
      }

      transitionLockRef.current = true;
      if (invoker) {
        lastInvokerRef.current = invoker;
      }

      try {
        // 1. Cerrar completamente cualquier sesión previa (ej. texto) antes de iniciar voz
        await stopCurrentSessionSafely();

        setMessages([]);
        setErrorMessage(null);
        setMicDenied(false);
        setIsAgentTyping(false);
        updateActiveMode("voice");
        setIsPanelOpen(true);
        setVisualState("connecting");
        setIsRequestingMic(false);
        setStatusAnnouncement("Conectando conversación por voz con Alineva.");
        intentionalCloseRef.current = false;

        logVoiceDiag("preflight state accepted");

        const { agentId, error: agentError } = resolveAssistantAgentId();
        if (agentError || !agentId) {
          logVoiceDiag("agentId error", agentError);
          throw new Error(agentError || "Identificador de agente no configurado.");
        }
        logVoiceDiag("agentId present");

        if (conversationRef.current) {
          logVoiceDiag("conversation ref present");
        } else {
          logVoiceDiag("conversation ref missing");
        }

        // 2. Iniciar sesión oficial de voz vía WebRTC delegando la captura de audio directamente al SDK
        logVoiceDiag("calling startSession");
        await conversationRef.current.startSession({
          agentId,
          connectionType: "webrtc",
          textOnly: false,
          stripAudioTags: true,
          overrides: {
            conversation: {
              textOnly: false,
            },
          },
        });
        logVoiceDiag("startSession resolved");
      } catch (error: unknown) {
        setIsRequestingMic(false);
        const errName = error instanceof Error ? error.name : "UnknownError";
        const errMessage = error instanceof Error ? error.message : String(error);
        logVoiceDiag("startSession rejected", `${errName} | ${errMessage}`);
        if (process.env.NODE_ENV !== "production") {
          console.error(`[Assistant Voice Error] ${errName}: ${errMessage}`);
        }
        const mapped = mapErrorToSpanish(error, "voice");
        setVisualState("error");
        setErrorMessage(mapped.message);
        setMicDenied(mapped.isMicDenied);
        setStatusAnnouncement(`Error: ${mapped.message}`);
      } finally {
        transitionLockRef.current = false;
      }
    },
    [stopCurrentSessionSafely, updateActiveMode]
  );

  const startTextSession = useCallback(
    async (invoker?: HTMLElement | null): Promise<void> => {
      if (transitionLockRef.current) return;
      if (
        activeModeRef.current === "text" &&
        (conversationRef.current.status === "connected" ||
          conversationRef.current.status === "connecting")
      ) {
        setIsPanelOpen(true);
        return;
      }

      transitionLockRef.current = true;
      if (invoker) {
        lastInvokerRef.current = invoker;
      }

      try {
        // 1. Cerrar completamente cualquier sesión previa (ej. voz) y liberar micrófono
        await stopCurrentSessionSafely();

        setMessages([]);
        setErrorMessage(null);
        setMicDenied(false);
        setIsRequestingMic(false);
        setIsAgentTyping(false);
        updateActiveMode("text");
        setIsPanelOpen(true);
        setVisualState("connecting");
        setStatusAnnouncement("Conectando chat escrito con Alineva sin micrófono.");
        intentionalCloseRef.current = false;

        const { agentId, error: agentError } = resolveAssistantAgentId();
        if (agentError || !agentId) {
          throw new Error(agentError || "Identificador de agente no configurado.");
        }

        // 2. Iniciar sesión exclusivamente por texto vía WebSocket (CERO audio / CERO micrófono)
        conversationRef.current.startSession({
          agentId,
          connectionType: "websocket",
          textOnly: true,
          stripAudioTags: true,
          overrides: {
            conversation: {
              textOnly: true,
            },
          },
        });
      } catch (error: unknown) {
        const mapped = mapErrorToSpanish(error, "text");
        setVisualState("error");
        setErrorMessage(mapped.message);
        setMicDenied(false);
        setStatusAnnouncement(`Error: ${mapped.message}`);
      } finally {
        transitionLockRef.current = false;
      }
    },
    [stopCurrentSessionSafely, updateActiveMode]
  );

  const sendTextMessage = useCallback(
    (rawText: string) => {
      const trimmed = rawText.trim();
      if (!trimmed) return;
      if (activeModeRef.current !== "text") return;
      if (conversationRef.current.status !== "connected") return;
      if (isSendingRef.current) return;

      isSendingRef.current = true;
      setIsAgentTyping(true);
      setMessages((prev) => [
        ...prev,
        {
          id: nextMessageId(),
          role: "user",
          text: trimmed,
          timestamp: Date.now(),
        },
      ]);

      try {
        conversationRef.current.sendUserMessage(trimmed);
      } catch {
        isSendingRef.current = false;
        setIsAgentTyping(false);
        setVisualState("error");
        setErrorMessage(
          "No fue posible enviar tu mensaje. Por favor intenta nuevamente."
        );
      }
    },
    [nextMessageId]
  );

  const toggleMute = useCallback(() => {
    if (activeModeRef.current !== "voice") return;
    if (conversationRef.current.status !== "connected") return;
    const nextMuted = !conversationRef.current.isMuted;
    conversationRef.current.setMuted(nextMuted);
    setStatusAnnouncement(
      nextMuted ? "Micrófono silenciado." : "Micrófono activado."
    );
  }, []);

  const clearError = useCallback(() => {
    setErrorMessage(null);
    setMicDenied(false);
    if (activeModeRef.current === "none") {
      setVisualState("idle");
    }
  }, []);

  // Limpieza segura al cerrar pestaña o desmontar el proveedor
  useEffect(() => {
    const handlePageHide = () => {
      intentionalCloseRef.current = true;
      try {
        conversationRef.current.endSession();
      } catch {
        // ignore teardown errors on unload
      }
    };

    window.addEventListener("pagehide", handlePageHide);
    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      handlePageHide();
    };
  }, []);

  const value = useMemo<AssistantContextValue>(
    () => ({
      activeMode,
      visualState,
      isPanelOpen,
      isRequestingMic,
      isMuted: conversation.isMuted,
      isAgentTyping,
      messages,
      errorMessage,
      micDenied,
      statusAnnouncement,
      startVoiceSession,
      startTextSession,
      sendTextMessage,
      toggleMute,
      endActiveSession,
      closePanel,
      clearError,
    }),
    [
      activeMode,
      visualState,
      isPanelOpen,
      isRequestingMic,
      conversation.isMuted,
      isAgentTyping,
      messages,
      errorMessage,
      micDenied,
      statusAnnouncement,
      startVoiceSession,
      startTextSession,
      sendTextMessage,
      toggleMute,
      endActiveSession,
      closePanel,
      clearError,
    ]
  );

  return (
    <AssistantControllerContext.Provider value={value}>
      {children}
    </AssistantControllerContext.Provider>
  );
}

export function AssistantProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConversationProvider>
      <AssistantControllerInner>{children}</AssistantControllerInner>
    </ConversationProvider>
  );
}

export function useAssistant(): AssistantContextValue {
  const ctx = useContext(AssistantControllerContext);
  if (!ctx) {
    throw new Error("useAssistant debe usarse dentro de AssistantProvider.");
  }
  return ctx;
}
