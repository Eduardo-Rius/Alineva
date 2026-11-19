/**
 * Tipos y estados de la interfaz del Asistente Virtual Alineva (Voz + Texto).
 * Protocolo: SR-ALINEVA-VOICE-TEXT-02B
 */

export type AssistantMode = "none" | "voice" | "text";

export type AssistantVisualState =
  | "idle"
  | "connecting"
  | "listening"
  | "speaking"
  | "text-active"
  | "disconnecting"
  | "error";

export interface ChatMessage {
  id: string;
  role: "user" | "agent";
  text: string;
  timestamp: number;
}

export interface AssistantContextValue {
  activeMode: AssistantMode;
  visualState: AssistantVisualState;
  isPanelOpen: boolean;
  isRequestingMic: boolean;
  isMuted: boolean;
  isAgentTyping: boolean;
  messages: ChatMessage[];
  errorMessage: string | null;
  micDenied: boolean;
  statusAnnouncement: string;
  startVoiceSession: (invoker?: HTMLElement | null) => Promise<void>;
  startTextSession: (invoker?: HTMLElement | null) => Promise<void>;
  sendTextMessage: (text: string) => void;
  toggleMute: () => void;
  endActiveSession: (closePanel?: boolean) => Promise<void>;
  closePanel: () => Promise<void>;
  clearError: () => void;
}
