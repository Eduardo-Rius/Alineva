"use client";

import { AssistantPanel } from "./AssistantPanel";
import { MobileAssistantBar } from "./MobileAssistantBar";

export { AssistantProvider, useAssistant } from "./AssistantProvider";
export { AssistantContactCard } from "./AssistantContactCard";

export default function VoiceAssistant() {
  return (
    <>
      <MobileAssistantBar />
      <AssistantPanel />
    </>
  );
}
