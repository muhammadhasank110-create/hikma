import type { Express, Request, Response } from "express";
import { ENV } from "./_core/env";
import { getDb } from "./db";
import { tutorConversations } from "../drizzle/schema";
import { and, eq } from "drizzle-orm";
import { sdk } from "./_core/sdk";

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

const resolveApiUrl = () =>
  ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0
    ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions`
    : "https://forge.manus.im/v1/chat/completions";

export function registerTutorStreamRoute(app: Express) {
  app.post("/api/tutor/stream", async (req: Request, res: Response) => {
    try {
      let userId: number | undefined;
      try {
        const authUser = await sdk.authenticateRequest(req);
        userId = authUser?.id;
      } catch {
        // anonymous — still allow tutor
      }

      const { message, sessionId, profile, conversationHistory = [] } = req.body as {
        message: string;
        sessionId: string;
        profile: {
          mode: string;
          chunkSize: string;
          readingLevel: number;
          locale: string;
          curriculum: string;
          tier?: string | null;
          tashkeel: boolean;
          numerals: string;
        };
        conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
      };

      if (!message || !sessionId) {
        res.status(400).json({ error: "message and sessionId are required" });
        return;
      }

      const profileContext = `
Learner profile:
- Mode: ${profile?.mode ?? "reading"}
- Chunk size: ${profile?.chunkSize ?? "standard"}
- Reading level: ${profile?.readingLevel ?? 2}/3
- Locale: ${profile?.locale ?? "en"}
- Curriculum: ${profile?.curriculum ?? "IGCSE Edexcel"}
- Tier: ${profile?.tier ?? "standard"}
- Tashkeel: ${profile?.tashkeel ?? false}
- Numerals: ${profile?.numerals ?? "western"}
`;

      const messages = [
        { role: "system" as const, content: TUTOR_SYSTEM_PROMPT + "\n\n" + profileContext },
        ...conversationHistory.map((m: { role: "user" | "assistant"; content: string }) => ({
          role: m.role,
          content: m.content,
        })),
        { role: "user" as const, content: message },
      ];

      // Set up SSE headers
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders();

      let finished = false;
      req.on("close", () => { finished = true; });

      // Call LLM with stream: true
      const llmRes = await fetch(resolveApiUrl(), {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${ENV.forgeApiKey}`,
        },
        body: JSON.stringify({ messages, stream: true }),
      });

      if (!llmRes.ok) {
        const errText = await llmRes.text();
        if (!finished) {
          res.write(`data: ${JSON.stringify({ error: errText })}\n\n`);
          res.end();
        }
        return;
      }

      const reader = llmRes.body?.getReader();
      if (!reader) {
        if (!finished) { res.write("data: [DONE]\n\n"); res.end(); }
        return;
      }

      const decoder = new TextDecoder();
      let fullContent = "";
      let buffer = "";

      while (true) {
        if (finished) { reader.cancel(); break; }
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (finished) break;
          const trimmed = line.trim();
          if (!trimmed || trimmed === "data: [DONE]") {
            if (trimmed === "data: [DONE]") {
              res.write("data: [DONE]\n\n");
            }
            continue;
          }
          if (trimmed.startsWith("data: ")) {
            const jsonStr = trimmed.slice(6);
            try {
              const chunk = JSON.parse(jsonStr);
              const delta = chunk.choices?.[0]?.delta?.content;
              if (delta) {
                fullContent += delta;
                res.write(`data: ${JSON.stringify({ delta })}\n\n`);
              }
            } catch {
              // skip malformed chunk
            }
          }
        }
      }

      if (!finished) {
        res.write("data: [DONE]\n\n");
        res.end();
      }

      // Save conversation to DB if user is authenticated
      if (userId && fullContent) {
        try {
          const db = await getDb();
          if (db) {
            const [existing] = await db.select().from(tutorConversations)
              .where(and(eq(tutorConversations.userId, userId), eq(tutorConversations.sessionId, sessionId))).limit(1);
            const newMessages = [
              ...((existing?.messages as any[]) ?? []),
              { role: "user" as const, content: message, timestamp: Date.now() },
              { role: "assistant" as const, content: fullContent, timestamp: Date.now() },
            ];
            if (existing) {
              await db.update(tutorConversations).set({ messages: newMessages as any })
                .where(eq(tutorConversations.id, existing.id));
            } else {
              await db.insert(tutorConversations).values({
                userId,
                sessionId,
                lessonId: null,
                messages: newMessages as any,
              });
            }
          }
        } catch (e) {
          console.warn("[TutorStream] Failed to save conversation:", e);
        }
      }
    } catch (err) {
      console.error("[TutorStream] Error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });
}
