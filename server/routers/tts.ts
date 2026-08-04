import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { ENV } from "../_core/env";

export const ttsRouter = router({
  synthesize: protectedProcedure
    .input(z.object({
      text: z.string().max(4096),
      voice: z.enum(["alloy", "echo", "fable", "onyx", "nova", "shimmer"]).default("nova"),
      speed: z.number().min(0.25).max(4.0).default(1.0),
      locale: z.enum(["ar", "en"]).default("en"),
    }))
    .mutation(async ({ input }) => {
      const { text, voice, speed } = input;
      try {
        const response = await fetch(`${ENV.forgeApiUrl}/v1/audio/speech`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${ENV.forgeApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "tts-1",
            input: text,
            voice,
            speed,
            response_format: "mp3",
          }),
        });
        if (!response.ok) {
          throw new Error(`TTS API error: ${response.status}`);
        }
        const audioBuffer = await response.arrayBuffer();
        const base64 = Buffer.from(audioBuffer).toString("base64");
        return { audioBase64: base64, mimeType: "audio/mpeg" };
      } catch (error) {
        console.error("[TTS] Error:", error);
        throw new Error("TTS synthesis failed. Browser TTS will be used as fallback.");
      }
    }),
});
