"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import styles from "./VoiceAssistant.module.css";
import { useAssistant } from "./AssistantProvider";
import { AssistantRobot } from "./AssistantRobot";
import type { AssistantVisualState } from "./types";

function getStatusText(
  visualState: AssistantVisualState,
  isRequestingMic: boolean,
  isAgentTyping: boolean
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
    default:
      return "Listo para conversar";
  }
}

export function AssistantPanel() {
  const {
    activeMode,
    visualState,
    isPanelOpen,
    isRequestingMic,
    isMuted,
    isAgentTyping,
    messages,
    errorMessage,
    micDenied,
    statusAnnouncement,
    startVoiceSession,
    startTextSession,
    sendTextMessage,
    toggleMute,
    closePanel,
  } = useAssistant();

  const [draft, setDraft] = useState("");
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const titleId = useId();
  const inputId = useId();

  // Sincronizar apertura/cierre con <dialog> nativo (showModal / close)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isPanelOpen) {
      if (!dialog.open) {
        try {
          dialog.showModal();
        } catch {
          // Si ya estuviera abierto en top-layer, ignorar
        }
      }
    } else if (dialog.open) {
      dialog.close();
      dialog.returnValue = "";
    }
  }, [isPanelOpen]);

  // Fallback de light-dismiss para navegadores sin closedby="any" (Safari)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if ("closedBy" in HTMLDialogElement.prototype) return;

    let pressedOutside = false;
    const isOutside = (e: PointerEvent) => {
      const rect = dialog.getBoundingClientRect();
      return (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      );
    };

    const handlePointerDown = (e: PointerEvent) => {
      pressedOutside = isOutside(e);
    };
    const handlePointerUp = (e: PointerEvent) => {
      if (pressedOutside && isOutside(e)) {
        void closePanel();
      }
      pressedOutside = false;
    };

    dialog.addEventListener("pointerdown", handlePointerDown);
    dialog.addEventListener("pointerup", handlePointerUp);
    return () => {
      dialog.removeEventListener("pointerdown", handlePointerDown);
      dialog.removeEventListener("pointerup", handlePointerUp);
    };
  }, [closePanel]);

  // Enfocar campo de texto al activar chat escrito
  useEffect(() => {
    if (isPanelOpen && activeMode === "text" && visualState === "text-active") {
      textareaRef.current?.focus();
    }
  }, [isPanelOpen, activeMode, visualState]);

  // Desplazamiento accesible al último mensaje respetando prefers-reduced-motion
  useEffect(() => {
    if (!isPanelOpen) return;
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    messagesEndRef.current?.scrollIntoView({
      behavior: prefersReduced ? "auto" : "smooth",
      block: "end",
    });
  }, [messages, isAgentTyping, isPanelOpen]);

  const handleDialogCancel = (e: React.SyntheticEvent<HTMLDialogElement>) => {
    e.preventDefault();
    void closePanel();
  };

  const handleDialogClose = () => {
    const dialog = dialogRef.current;
    if (dialog) {
      dialog.returnValue = "";
    }
    if (isPanelOpen) {
      void closePanel();
    }
  };

  const handleSubmitText = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (visualState !== "text-active" || isAgentTyping) return;
    sendTextMessage(trimmed);
    setDraft("");
    textareaRef.current?.focus();
  };

  const handleTextareaKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmitText();
    }
  };

  const isBusy =
    visualState === "connecting" || visualState === "disconnecting";
  const statusText = getStatusText(
    visualState,
    isRequestingMic,
    isAgentTyping
  );

  // Atributo closedby como mejora progresiva (Baseline en progreso)
  const closedByProps = { closedby: "any" } as Record<string, string>;

  return (
    <>
      {/* Región live centralizada para cambios de estado accesibles */}
      <div className={styles.srOnly} aria-live="polite" aria-atomic="true">
        {statusAnnouncement}
      </div>

      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-labelledby={titleId}
        onCancel={handleDialogCancel}
        onClose={handleDialogClose}
        {...closedByProps}
      >
        <div className={styles.dialogSurface}>
          {/* Encabezado */}
          <header className={styles.dialogHeader}>
            <div className={styles.dialogIdentity}>
              <AssistantRobot
                visualState={visualState}
                size="mini"
                decorative
              />
              <div className={styles.dialogHeadingGroup}>
                <h2 id={titleId} className={styles.dialogTitle}>
                  {activeMode === "text"
                    ? "Chat escrito · Alineva"
                    : "Asistente por voz · Alineva"}
                </h2>
                <p className={styles.dialogStatusLine}>
                  <span
                    className={`${styles.dialogStatusDot} ${
                      visualState === "error"
                        ? styles.dotError
                        : visualState === "speaking" ||
                            visualState === "listening" ||
                            visualState === "text-active"
                          ? styles.dotLive
                          : styles.dotPending
                    }`}
                    aria-hidden="true"
                  />
                  <span>{statusText}</span>
                </p>
              </div>
            </div>

            <div className={styles.dialogHeaderActions}>
              {activeMode === "voice" && (
                <button
                  type="button"
                  className={styles.switchModeButton}
                  disabled={isBusy}
                  onClick={() => {
                    void startTextSession();
                  }}
                >
                  Cambiar a texto
                </button>
              )}
              {activeMode === "text" && (
                <button
                  type="button"
                  className={styles.switchModeButton}
                  disabled={isBusy}
                  onClick={() => {
                    void startVoiceSession();
                  }}
                >
                  Cambiar a voz
                </button>
              )}
              <button
                type="button"
                className={styles.closeButton}
                aria-label="Cerrar asistente y finalizar conversación"
                onClick={() => {
                  void closePanel();
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </header>

          {/* Cuerpo del panel */}
          <div className={styles.dialogBody}>
            {/* Aviso de error recuperable */}
            {errorMessage && (
              <div className={styles.errorBox} role="alert">
                <p className={styles.errorBoxTitle}>
                  {micDenied
                    ? "Permiso de micrófono no disponible"
                    : "Ocurrió un inconveniente de conexión"}
                </p>
                <p className={styles.errorBoxText}>{errorMessage}</p>
                <div className={styles.errorBoxActions}>
                  {activeMode === "voice" && (
                    <button
                      type="button"
                      className={styles.errorPrimaryAction}
                      onClick={() => {
                        void startTextSession();
                      }}
                    >
                      Escribir al asistente
                    </button>
                  )}
                  <button
                    type="button"
                    className={styles.errorSecondaryAction}
                    onClick={() => {
                      if (activeMode === "text") {
                        void startTextSession();
                      } else {
                        void startVoiceSession();
                      }
                    }}
                  >
                    Reintentar
                  </button>
                </div>
              </div>
            )}

            {/* Modalidad Voz */}
            {activeMode === "voice" && (
              <div className={styles.voiceStage}>
                <AssistantRobot
                  visualState={visualState}
                  size="panel"
                  decorative
                />
                <p className={styles.voiceStateCaption}>{statusText}</p>

                {messages.length > 0 && (
                  <div
                    className={styles.voiceTranscript}
                    aria-label="Transcripción reciente de la conversación"
                    aria-live="polite"
                  >
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={
                          msg.role === "user"
                            ? styles.messageUser
                            : styles.messageAgent
                        }
                      >
                        <span className={styles.messageAuthor}>
                          {msg.role === "user" ? "Tú" : "Alineva"}
                        </span>
                        <p className={styles.messageText}>{msg.text}</p>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>
            )}

            {/* Modalidad Texto */}
            {activeMode === "text" && (
              <div
                className={styles.chatMessages}
                role="log"
                aria-label="Historial de conversación escrita con Alineva"
                aria-live="polite"
                aria-relevant="additions text"
              >
                {messages.length === 0 && !errorMessage && (
                  <div className={styles.chatWelcome}>
                    <p>
                      {visualState === "connecting"
                        ? "Conectando con el asistente escrito de Alineva…"
                        : "Escribe tu consulta o cuéntanos qué necesita tu empresa. Este chat no utiliza micrófono ni audio."}
                    </p>
                  </div>
                )}

                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={
                      msg.role === "user"
                        ? styles.messageUser
                        : styles.messageAgent
                    }
                  >
                    <span className={styles.messageAuthor}>
                      {msg.role === "user" ? "Tú" : "Alineva"}
                    </span>
                    <p className={styles.messageText}>{msg.text}</p>
                  </div>
                ))}

                {isAgentTyping && (
                  <div className={styles.typingIndicator}>
                    <span className={styles.typingDots} aria-hidden="true">
                      <span />
                      <span />
                      <span />
                    </span>
                    <span>Alineva está redactando una respuesta…</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Pie de controles */}
          <footer className={styles.dialogFooter}>
            {activeMode === "voice" ? (
              <div className={styles.voiceControls}>
                <button
                  type="button"
                  className={styles.muteButton}
                  disabled={
                    visualState !== "listening" && visualState !== "speaking"
                  }
                  aria-pressed={isMuted}
                  onClick={toggleMute}
                >
                  {isMuted ? "Activar micrófono" : "Silenciar micrófono"}
                </button>
                <button
                  type="button"
                  className={styles.endVoiceButton}
                  disabled={visualState === "disconnecting"}
                  onClick={() => {
                    void closePanel();
                  }}
                >
                  {visualState === "disconnecting"
                    ? "Finalizando…"
                    : "Finalizar conversación"}
                </button>
              </div>
            ) : (
              <form
                className={styles.chatComposer}
                onSubmit={handleSubmitText}
              >
                <label htmlFor={inputId} className={styles.srOnly}>
                  Escribe tu mensaje para el asistente de Alineva
                </label>
                <textarea
                  ref={textareaRef}
                  id={inputId}
                  rows={2}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={handleTextareaKeyDown}
                  placeholder={
                    visualState === "text-active"
                      ? "Escribe tu mensaje… (Enter para enviar, Shift+Enter nueva línea)"
                      : "Esperando conexión…"
                  }
                  disabled={visualState !== "text-active"}
                  className={styles.chatTextarea}
                />
                <div className={styles.chatComposerActions}>
                  <button
                    type="button"
                    className={styles.endTextButton}
                    onClick={() => {
                      void closePanel();
                    }}
                  >
                    Cerrar chat
                  </button>
                  <button
                    type="submit"
                    className={styles.sendButton}
                    disabled={
                      visualState !== "text-active" ||
                      isAgentTyping ||
                      draft.trim().length === 0
                    }
                  >
                    {isAgentTyping ? "Enviando…" : "Enviar"}
                  </button>
                </div>
              </form>
            )}
          </footer>
        </div>
      </dialog>
    </>
  );
}
