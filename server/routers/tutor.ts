import { z } from "zod";
import { tutorConversations } from "../../drizzle/schema";
import { getDb } from "../db";
import { invokeLLM } from "../_core/llm";
import { protectedProcedure, router } from "../_core/trpc";
import { eq, and } from "drizzle-orm";

const TUTOR_SYSTEM_PROMPT = `You are the Hikma (حكمة) AI tutor. You teach one concept at a time to a learner whose profile is supplied with every request. Obey the profile absolutely.

**Length:** In micro chunk mode, never exceed 3 short sentences before pausing for the learner. In standard, never exceed one short paragraph.
**Reading level:** Write at the learner's readingLevel. Level 1 = common words, one clause per sentence, no unexplained metaphor. Level 3 = full academic register.
**Structure:** Lead with the answer or the summary, then the detail. Never bury the point.
**Formatting:** Short paragraphs, bold for emphasis only, no italics, no ALL CAPS, no walls of text. Use a list only when the content is genuinely a list.
**Socratic default:** After explaining, ask one short question that checks understanding. One question — never a stack of them.
**When the learner is stuck:** Do not repeat yourself louder. Change something — the level, the modality, the analogy, or the granularity — and say what you're changing: "Let me try that as a picture instead."
**Modality:** On request, or when the profile indicates it, emit the same concept as (a) narration script, (b) dyslexia-friendly text, or (c) a concept-map JSON graph. The concept must be identical across all three.
**Descriptions:** For any image or diagram, produce a one-sentence summary and a longer structural description on request. Describe relationships and meaning, not pixels. Never say "image of".
**Arabic:** When locale = ar, write natural Modern Standard Arabic — not translated-sounding English. Apply tashkeel when tashkeel is on. Use the learner's numeral preference.
**Tone:** Warm, direct, never patronising. The learner is capable. Difficulty with the interface or the text is never framed as a failure of the learner.
**Curriculum:** You are given the learner's board, tier, and spec code with every request. Teach to that depth and no further.
**Never:** Shame a wrong answer, use urgency or loss framing, reference a time limit, produce content the learner can't access in their current mode, or claim certainty about a diagnosis.`;

export const tutorRouter = router({
  chat: protectedProcedure
    .input(z.object({
      message: z.string(),
      sessionId: z.string(),
      lessonId: z.number().optional(),
      profile: z.object({
        mode: z.string(),
        chunkSize: z.string(),
        readingLevel: z.number(),
        locale: z.string(),
        curriculum: z.string(),
        tier: z.string().nullable().optional(),
        tashkeel: z.boolean(),
        numerals: z.string(),
      }),
      conversationHistory: z.array(z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const { message, sessionId, lessonId, profile, conversationHistory = [] } = input;

      const profileContext = `
Learner profile:
- Mode: ${profile.mode}
- Chunk size: ${profile.chunkSize}
- Reading level: ${profile.readingLevel}/3
- Locale: ${profile.locale}
- Curriculum: ${profile.curriculum}
- Tier: ${profile.tier ?? "standard"}
- Tashkeel: ${profile.tashkeel}
- Numerals: ${profile.numerals}
`;

      const messages = [
        { role: "system" as const, content: TUTOR_SYSTEM_PROMPT + "\n\n" + profileContext },
        ...conversationHistory.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
        { role: "user" as const, content: message },
      ];

      const response = await invokeLLM({ messages });
      const reply = response.choices[0]?.message?.content ?? "I'm sorry, I couldn't generate a response. Please try again.";

      // Save conversation
      if (db) {
        const [existing] = await db.select().from(tutorConversations)
          .where(and(eq(tutorConversations.userId, ctx.user.id), eq(tutorConversations.sessionId, sessionId))).limit(1);
        const newMessages = [
          ...(existing?.messages ?? []),
          { role: "user" as const, content: message, timestamp: Date.now() },
          { role: "assistant" as const, content: reply, timestamp: Date.now() },
        ];
        if (existing) {
          await db.update(tutorConversations).set({ messages: newMessages as any })
            .where(eq(tutorConversations.id, existing.id));
        } else {
          await db.insert(tutorConversations).values({
            userId: ctx.user.id,
            sessionId,
            lessonId,
            messages: newMessages as any,
          });
        }
      }

      return { reply };
    }),

  simplify: protectedProcedure
    .input(z.object({
      text: z.string(),
      targetLevel: z.number().int().min(1).max(3),
      locale: z.enum(["ar", "en"]),
    }))
    .mutation(async ({ input }) => {
      const { text, targetLevel, locale } = input;
      const levelDesc = targetLevel === 1
        ? "very simple language — short sentences, common words, no jargon"
        : targetLevel === 2
        ? "clear, accessible language — moderate vocabulary, short paragraphs"
        : "full academic register";
      const response = await invokeLLM({
        messages: [
          { role: "system", content: `Rewrite the following text at reading level ${targetLevel} (${levelDesc}). Preserve all factual content. Keep paragraphs short (3-4 sentences max). Never use italics or ALL CAPS for emphasis — use bold only. Language: ${locale === "ar" ? "Arabic (Modern Standard Arabic)" : "English"}.` },
          { role: "user", content: text },
        ],
      });
      return { simplified: response.choices[0]?.message?.content ?? text };
    }),

  describeImage: protectedProcedure
    .input(z.object({
      imageUrl: z.string(),
      depth: z.enum(["short", "long"]),
      locale: z.enum(["ar", "en"]),
    }))
    .mutation(async ({ input }) => {
      const { imageUrl, depth, locale } = input;
      const instruction = depth === "short"
        ? "Provide a single clear sentence describing what this image shows and its educational significance. Never say 'image of'."
        : "Provide a detailed description of this image for a blind learner: describe the structure, relationships, labels, and educational meaning. Describe what you see, not what you assume. Never say 'image of'.";
      const response = await invokeLLM({
        messages: [
          { role: "system", content: `${instruction} Respond in ${locale === "ar" ? "Modern Standard Arabic" : "English"}.` },
          { role: "user" as const, content: (`Describe this educational image. URL: ${imageUrl}`) as unknown as string },
        ],
      });
      return { description: response.choices[0]?.message?.content ?? "" };
    }),

  generateConceptMap: protectedProcedure
    .input(z.object({
      lessonText: z.string(),
      locale: z.enum(["ar", "en"]),
    }))
    .mutation(async ({ input }) => {
      const { lessonText, locale } = input;
      const response = await invokeLLM({
        messages: [
          { role: "system", content: `Generate a concept map JSON from the following lesson text. Return ONLY valid JSON matching this schema exactly:
{
  "nodes": [{"id": "string", "label": "string", "labelAr": "string", "type": "input|process|output|concept", "detail": "string"}],
  "edges": [{"from": "string", "to": "string", "label": "string", "labelAr": "string"}],
  "textAlternative": "string describing the map in English",
  "textAlternativeAr": "string describing the map in Arabic"
}
textAlternative is MANDATORY. Keep nodes to 5-10 maximum. Labels should be short (2-5 words).` },
          { role: "user", content: lessonText },
        ],
        response_format: { type: "json_object" as any },
      });
      try {
        const rawContent = response.choices[0]?.message?.content;
        const content = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent ?? {});
        return JSON.parse(content);
      } catch {
        return { nodes: [], edges: [], textAlternative: "Concept map unavailable.", textAlternativeAr: "خريطة المفاهيم غير متاحة." };
      }
    }),

  getHistory: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const [conv] = await db.select().from(tutorConversations)
        .where(and(eq(tutorConversations.userId, ctx.user.id), eq(tutorConversations.sessionId, input.sessionId))).limit(1);
      return conv?.messages ?? [];
    }),
});
