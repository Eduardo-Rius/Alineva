"use client";

import styles from "./VoiceAssistant.module.css";
import { useAssistant } from "./AssistantProvider";
import { AssistantRobot } from "./AssistantRobot";
import type { AssistantVisualState } from "./types";

const STATE_LABELS: Record<AssistantVisualState, string> = {
  idle: "Disponible ahora",
  connecting: "Conectando…",
  listening: "Escuchando",
  speaking: "Respondiendo",
  "text-active": "Chat escrito activo",
  disconnecting: "Finalizando…",
  error: "No disponible temporalmente",
};

export function AssistantContactCard() {
  const {
    activeMode,
    visualState,
    startVoiceSession,
    startTextSession,
    endActiveSession,
  } = useAssistant();

  const isBusy =
    visualState === "connecting" || visualState === "disconnecting";
  const isVoiceActive =
    activeMode === "voice" &&
    (visualState === "listening" || visualState === "speaking");
  const isTextActive =
    activeMode === "text" && visualState === "text-active";

  return (
    <aside
      className={styles.contactCard}
      aria-labelledby="assistant-card-heading"
    >
      <div className={styles.cardHeader}>
        <div className={styles.cardRobotWrap}>
          <AssistantRobot visualState={visualState} size="card" decorative />
        </div>

        <div className={styles.cardCopy}>
          <span className={styles.cardBadge}>Asistente por voz</span>
          <h3 id="assistant-card-heading" className={styles.cardTitle}>
            Conversa con Alineva en segundos
          </h3>
          <p className={styles.cardDescription}>
            Resuelve tus dudas por voz o por escrito con el mismo asistente
            especializado.
          </p>

          <div
            className={`${styles.statePill} ${
              visualState === "error"
                ? styles.statePillError
                : visualState === "idle"
                  ? styles.statePillIdle
                  : styles.statePillActive
            }`}
          >
            <span className={styles.stateDot} aria-hidden="true" />
            <span>{STATE_LABELS[visualState]}</span>
          </div>
        </div>
      </div>

      <div className={styles.cardActions}>
        <button
          type="button"
          className={styles.voiceButton}
          disabled={isBusy}
          aria-busy={isBusy && activeMode === "voice"}
          onClick={(e) => {
            void startVoiceSession(e.currentTarget);
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
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="22" />
          </svg>
          <span>
            {isVoiceActive
              ? "Ver conversación por voz"
              : "Hablar con el asistente"}
          </span>
        </button>

        <button
          type="button"
          className={styles.textButton}
          disabled={isBusy}
          aria-busy={isBusy && activeMode === "text"}
          onClick={(e) => {
            void startTextSession(e.currentTarget);
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
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            <line x1="8" y1="9" x2="16" y2="9" />
            <line x1="8" y1="13" x2="13" y2="13" />
          </svg>
          <span>
            {isTextActive
              ? "Ver chat escrito"
              : "Escribir al asistente"}
          </span>
        </button>
      </div>

      {(isVoiceActive || isTextActive) && (
        <div className={styles.cardFooterAction}>
          <button
            type="button"
            className={styles.inlineEndButton}
            onClick={() => {
              void endActiveSession(true);
            }}
          >
            Finalizar conversación activa
          </button>
        </div>
      )}

      <p className={styles.cardHint}>
        El micrófono solo se solicita si eliges hablar por voz. El chat escrito
        no activa audio ni micrófono.
      </p>
    </aside>
  );
}
