import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { transcribeAudio } from "../_core/voiceTranscription";

export const sttRouter = router({
  transcribe: protectedProcedure
    .input(z.object({
      audioUrl: z.string().url(),
      language: z.enum(["ar", "en"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const result = await transcribeAudio({
        audioUrl: input.audioUrl,
        language: input.language,
        prompt: input.language === "ar"
          ? "هذا تسجيل صوتي لطالب يتعلم. قد يحتوي على مصطلحات علمية."
          : "This is a student learning recording. May contain scientific terminology.",
      });
      if ("text" in result) {
        return { text: result.text, language: (result as any).language ?? input.language ?? "en" };
      }
      throw new Error("Transcription failed");
    }),
});
