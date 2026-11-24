import { VOICE_AGENT_ID } from "@/lib/contour/variant";

/**
 * The website voice assistant: ElevenLabs Conversational AI, embedded with
 * its own widget. It needs only the agent's public id
 * (NEXT_PUBLIC_ELEVENLABS_AGENT_ID) — the API key stays in the ElevenLabs
 * dashboard, never in the site. With no id set, nothing renders.
 * Setup: ads/voice/ELEVENLABS.md.
 */
export function VoiceAgent() {
  if (!VOICE_AGENT_ID) return null;
  return (
    <>
      {/* @ts-expect-error — a custom element defined by the ElevenLabs script */}
      <elevenlabs-convai agent-id={VOICE_AGENT_ID} />
      <script src="https://unpkg.com/@elevenlabs/convai-widget-embed@0.25.1" async type="text/javascript" />
    </>
  );
}
