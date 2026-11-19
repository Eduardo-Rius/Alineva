"use client";

import Image from "next/image";
import styles from "./VoiceAssistant.module.css";
import type { AssistantVisualState } from "./types";

interface AssistantRobotProps {
  visualState: AssistantVisualState;
  size?: "card" | "panel" | "mini";
  decorative?: boolean;
}

const STATE_CLASS_MAP: Record<AssistantVisualState, string> = {
  idle: styles.robotStateIdle,
  connecting: styles.robotStateConnecting,
  listening: styles.robotStateListening,
  speaking: styles.robotStateSpeaking,
  "text-active": styles.robotStateTextActive,
  disconnecting: styles.robotStateDisconnecting,
  error: styles.robotStateError,
};

export function AssistantRobot({
  visualState,
  size = "card",
  decorative = true,
}: AssistantRobotProps) {
  const sizeClass =
    size === "panel"
      ? styles.robotSizePanel
      : size === "mini"
        ? styles.robotSizeMini
        : styles.robotSizeCard;

  return (
    <div
      className={`${styles.robotStage} ${sizeClass} ${STATE_CLASS_MAP[visualState]}`}
      aria-hidden={decorative ? "true" : undefined}
    >
      {/* Halo / pulso azul sincronizado en zona del visor */}
      <span className={styles.visorHalo} aria-hidden="true" />
      <span className={styles.visorRing} aria-hidden="true" />

      <div className={styles.robotFigure}>
        <Image
          src="/images/assistant/alineva-assistant-robot.png"
          alt={decorative ? "" : "Asistente virtual Alineva"}
          width={706}
          height={1382}
          sizes={
            size === "mini"
              ? "36px"
              : size === "panel"
                ? "(max-width: 768px) 96px, 112px"
                : "(max-width: 768px) 84px, 118px"
          }
          priority={false}
          className={styles.robotImage}
        />
      </div>
    </div>
  );
}
