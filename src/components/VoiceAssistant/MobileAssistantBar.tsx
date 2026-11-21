"use client";

import { useEffect, useState } from "react";
import styles from "./VoiceAssistant.module.css";
import { useAssistant, logVoiceEntry } from "./AssistantProvider";
import { AssistantRobot } from "./AssistantRobot";

/**
 * Barra inferior compacta exclusiva para móvil/tableta (< 1024 px).
 * Se oculta automáticamente cuando la sección #contacto está visible en viewport
 * para no interferir jamás con los campos, casillas de privacidad ni botones del formulario.
 */
export function MobileAssistantBar() {
  const {
    visualState,
    isPanelOpen,
    startVoiceSession,
    startTextSession,
  } = useAssistant();

  const [isContactVisible, setIsContactVisible] = useState(false);

  useEffect(() => {
    const contactSection = document.getElementById("contacto");
    if (!contactSection || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          setIsContactVisible(entry.isIntersecting);
        }
      },
      { threshold: 0.08 }
    );

    observer.observe(contactSection);
    return () => {
      observer.disconnect();
    };
  }, []);

  if (isPanelOpen || isContactVisible) {
    return null;
  }

  const isBusy =
    visualState === "connecting" || visualState === "disconnecting";

  return (
    <aside
      className={styles.mobileBar}
      aria-label="Acceso rápido al asistente virtual Alineva"
    >
      <div className={styles.mobileBarIdentity}>
        <AssistantRobot visualState={visualState} size="mini" decorative />
        <span className={styles.mobileBarLabel}>Asistente Alineva</span>
      </div>

      <div className={styles.mobileBarActions}>
        <button
          type="button"
          className={styles.mobileVoiceBtn}
          disabled={isBusy}
          aria-label="Hablar con el asistente por voz"
          onClick={(e) => {
            logVoiceEntry("primary button clicked");
            logVoiceEntry(`availability: ${visualState}`);
            logVoiceEntry("handler selected: startVoiceSession");
            logVoiceEntry("invoking provider startVoiceSession");
            void startVoiceSession(e.currentTarget);
          }}
        >
          <svg
            width="16"
            height="16"
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
          <span>Hablar</span>
        </button>

        <button
          type="button"
          className={styles.mobileTextBtn}
          disabled={isBusy}
          aria-label="Escribir al asistente sin micrófono"
          onClick={(e) => {
            void startTextSession(e.currentTarget);
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span>Escribir</span>
        </button>
      </div>
    </aside>
  );
}
