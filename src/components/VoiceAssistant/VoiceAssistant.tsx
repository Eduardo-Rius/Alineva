"use client";

import React from "react";
import Script from "next/script";
import styles from "./VoiceAssistant.module.css";

const ELEVENLABS_AGENT_ID = "agent_9101m7n94v6kesnbxdb3283fjryz";

export default function VoiceAssistant() {
  return (
    <>
      <div className={styles.container} aria-label="Asistente virtual Alineva">
        <div className={styles.badge}>
          <span className={styles.robotIcon} aria-hidden="true">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="10" rx="2" />
              <circle cx="12" cy="5" r="2" />
              <path d="M12 7v4" />
              <line x1="8" y1="16" x2="8" y2="16" />
              <line x1="16" y1="16" x2="16" y2="16" />
            </svg>
          </span>
          <span>Asistente virtual Alineva</span>
        </div>

        <div className={styles.widgetWrapper}>
          {React.createElement("elevenlabs-convai", {
            "agent-id": ELEVENLABS_AGENT_ID,
          })}
        </div>
      </div>

      <Script
        src="https://elevenlabs.io/convai-widget/index.js"
        strategy="lazyOnload"
      />
    </>
  );
}
