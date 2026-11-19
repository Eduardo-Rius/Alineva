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

const ELEVENLABS_AGENT_ID = "agent_9101m7n94v6kesnbxdb3283fjryz";

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

      // Cierre iniciado por el agente o fin natural de sesión
      setVisualState("idle");
      updateActiveMode("none");
      setStatusAnnouncement("Conversación finalizada.");
    },
    [updateActiveMode]
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

    updateActiveMode("none");
    setVisualState("idle");
  }, [updateActiveMode]);

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
          restoreFocusToInvoker();
        }
        setStatusAnnouncement("Conversación finalizada.");
      } finally {
        transitionLockRef.current = false;
      }
    },
    [restoreFocusToInvoker, stopCurrentSessionSafely]
  );

  const closePanel = useCallback(async (): Promise<void> => {
    await endActiveSession(true);
  }, [endActiveSession]);

  const startVoiceSession = useCallback(
    async (invoker?: HTMLElement | null): Promise<void> => {
      if (transitionLockRef.current) return;
      if (
        activeModeRef.current === "voice" &&
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
        // 1. Cerrar completamente cualquier sesión previa (ej. texto) antes de iniciar voz
        await stopCurrentSessionSafely();

        setMessages([]);
        setErrorMessage(null);
        setMicDenied(false);
        setIsAgentTyping(false);
        updateActiveMode("voice");
        setIsPanelOpen(true);
        setVisualState("connecting");
        setIsRequestingMic(true);
        setStatusAnnouncement("Solicitando permiso de micrófono para hablar con el asistente.");

        // 2. Solicitar micrófono SOLO como consecuencia de esta acción explícita del usuario
        if (
          typeof navigator === "undefined" ||
          !navigator.mediaDevices ||
          typeof navigator.mediaDevices.getUserMedia !== "function"
        ) {
          throw new DOMException(
            "Micrófono no disponible en este navegador",
            "NotFoundError"
          );
        }

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Liberar pista de verificación de permisos para que WebRTC tome el dispositivo sin conflicto
        stream.getTracks().forEach((track) => track.stop());
        setIsRequestingMic(false);

        setStatusAnnouncement("Conectando conversación por voz con Alineva.");
        intentionalCloseRef.current = false;

        // 3. Iniciar sesión oficial de voz vía WebRTC
        conversationRef.current.startSession({
          agentId: ELEVENLABS_AGENT_ID,
          connectionType: "webrtc",
          textOnly: false,
          stripAudioTags: true,
          overrides: {
            conversation: {
              textOnly: false,
            },
          },
        });
      } catch (error: unknown) {
        setIsRequestingMic(false);
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

        // 2. Iniciar sesión exclusivamente por texto vía WebSocket (CERO audio / CERO micrófono)
        conversationRef.current.startSession({
          agentId: ELEVENLABS_AGENT_ID,
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
