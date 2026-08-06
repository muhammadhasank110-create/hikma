/**
 * TTS Router — ElevenLabs proxy with browser speech fallback.
 *
 * POST /api/tts/speak → streams audio from ElevenLabs
 * GET  /api/tts/voices → lists available ElevenLabs voices
 *
 * Falls back gracefully if ELEVENLABS_API_KEY is not set.
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { ENV } from "../_core/env";

// Default voice IDs for ElevenLabs
const VOICES = {
  en: "EXAVITQu4vr4xnSDxMaL", // "Sarah" — warm, clear English
  ar: "pFZP5JQG7iQjIQuC4Bku", // "Lily" — closest to Arabic-friendly
};

export const ttsRouter = router({
  // Returns available voices and whether ElevenLabs is configured
  config: protectedProcedure.query(() => {
    return {
      hasElevenLabs: !!ENV.elevenLabsApiKey,
      voices: VOICES,
    };
  }),
});
