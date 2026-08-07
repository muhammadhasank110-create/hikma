/**
 * ElevenLabs TTS REST route.
 * POST /api/tts/speak  { text, voiceId?, locale? }
 * Streams MP3 audio back to the client.
 * Falls back gracefully if ELEVENLABS_API_KEY is not configured.
 * Concurrency limited to 1 to stay under the free plan limit.
 */
import type { Express, Request, Response } from "express";
import { ENV } from "./env";

const VOICE_IDS: Record<string, string> = {
  en: "ZQe5CZNOzWyzPSCn5a3c", // James — warm, authoritative British male (ElevenLabs)
  ar: "EXAVITQu4vr4xnSDxMaL", // Bella — warm female, multilingual
};

// Concurrency limiter — ElevenLabs free plan: max 2 concurrent requests
let activeRequests = 0;
const MAX_CONCURRENT = 1;
const requestQueue: Array<() => void> = [];

function acquireSlot(): Promise<void> {
  return new Promise(resolve => {
    if (activeRequests < MAX_CONCURRENT) {
      activeRequests++;
      resolve();
      return;
    }
    requestQueue.push(() => { activeRequests++; resolve(); });
  });
}

function releaseSlot() {
  activeRequests = Math.max(0, activeRequests - 1);
  const next = requestQueue.shift();
  if (next) next();
}

export function registerElevenLabsTTSRoute(app: Express) {
  app.post("/api/tts/speak", async (req: Request, res: Response) => {
    const { text, locale = "en", voiceId } = req.body as {
      text?: string;
      locale?: string;
      voiceId?: string;
    };

    if (!text || typeof text !== "string") {
      res.status(400).json({ error: "text is required" });
      return;
    }

    if (!ENV.elevenLabsApiKey) {
      res.status(503).json({ error: "ElevenLabs not configured", fallback: true });
      return;
    }

    const selectedVoiceId = voiceId || VOICE_IDS[locale] || VOICE_IDS.en;
    const cleanText = text.replace(/[#*_`~\[\]]/g, "").slice(0, 2500);

    await acquireSlot();
    try {
      const elevenRes = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}`,
        {
          method: "POST",
          headers: {
            "xi-api-key": ENV.elevenLabsApiKey,
            "Content-Type": "application/json",
            Accept: "audio/mpeg",
          },
          body: JSON.stringify({
            text: cleanText,
            model_id: "eleven_multilingual_v2",
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
              style: 0.3,
              use_speaker_boost: true,
            },
          }),
        }
      );

      if (!elevenRes.ok) {
        const errText = await elevenRes.text();
        console.error(`ElevenLabs TTS error ${elevenRes.status}:`, errText);
        releaseSlot();
        res.status(502).json({ error: "ElevenLabs error", fallback: true });
        return;
      }

      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Transfer-Encoding", "chunked");
      res.setHeader("Cache-Control", "no-cache");

      const reader = elevenRes.body?.getReader();
      if (!reader) {
        releaseSlot();
        res.status(502).json({ error: "No stream body", fallback: true });
        return;
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (!res.writableEnded) res.write(Buffer.from(value));
      }
      res.end();
    } catch (err: any) {
      console.error("ElevenLabs TTS fetch error:", err?.message);
      if (!res.headersSent) {
        res.status(502).json({ error: err?.message ?? "Unknown error", fallback: true });
      }
    } finally {
      releaseSlot();
    }
  });

  // Config endpoint — probes ElevenLabs to check if it actually works
  // Caches the result for 5 minutes to avoid hammering the API
  let cachedConfig: { hasElevenLabs: boolean; ts: number } | null = null;
  app.get("/api/tts/config", async (_req: Request, res: Response) => {
    // Return cached result if fresh
    if (cachedConfig && Date.now() - cachedConfig.ts < 5 * 60 * 1000) {
      res.json({ hasElevenLabs: cachedConfig.hasElevenLabs, voices: VOICE_IDS });
      return;
    }
    if (!ENV.elevenLabsApiKey) {
      cachedConfig = { hasElevenLabs: false, ts: Date.now() };
      res.json({ hasElevenLabs: false, voices: VOICE_IDS });
      return;
    }
    // Probe with a minimal request (1 char) to check if the API actually works
    try {
      const probe = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_IDS.en}`,
        {
          method: "POST",
          headers: {
            "xi-api-key": ENV.elevenLabsApiKey,
            "Content-Type": "application/json",
            Accept: "audio/mpeg",
          },
          body: JSON.stringify({
            text: "Hi",
            model_id: "eleven_multilingual_v2",
            voice_settings: { stability: 0.5, similarity_boost: 0.75 },
          }),
          signal: AbortSignal.timeout(8000),
        }
      );
      const ct = probe.headers.get("content-type") ?? "";
      const works = probe.ok && ct.includes("audio");
      cachedConfig = { hasElevenLabs: works, ts: Date.now() };
      res.json({ hasElevenLabs: works, voices: VOICE_IDS });
    } catch {
      cachedConfig = { hasElevenLabs: false, ts: Date.now() };
      res.json({ hasElevenLabs: false, voices: VOICE_IDS });
    }
  });
}
