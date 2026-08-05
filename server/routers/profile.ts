import { eq } from "drizzle-orm";
import { z } from "zod";
import { learnerProfiles } from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

export const profileRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    const result = await db.select().from(learnerProfiles)
      .where(eq(learnerProfiles.userId, ctx.user.id)).limit(1);
    if (!result[0]) return null;
    const row = { ...(result[0] as any) };
    // Migrate legacy mode values stored before the enum was renamed
    const modeAliases: Record<string, string> = { audio: "audio_first" };
    if (row.mode && modeAliases[row.mode]) row.mode = modeAliases[row.mode];
    return row;
  }),

  update: protectedProcedure
    .input(z.object({
      mode: z.enum(["audio_first", "reading", "focus", "custom"]).optional(),
      primaryModality: z.enum(["audio", "text", "visual"]).optional(),
      autoNarrate: z.boolean().optional(),
      speechRate: z.number().min(0.5).max(3.0).optional(),
      voice: z.string().optional(),
      earcons: z.boolean().optional(),
      theme: z.enum(["light", "dark", "cream", "calm", "high_contrast"]).optional(),
      fontFamily: z.enum(["atkinson", "plex", "opendyslexic", "naskh"]).optional(),
      fontScale: z.number().min(1.0).max(2.5).optional(),
      lineHeight: z.number().min(1.5).max(2.2).optional(),
      letterSpacing: z.number().min(0).max(0.12).optional(),
      wordSpacing: z.number().min(0).max(0.3).optional(),
      maxLineLength: z.number().min(45).max(80).optional(),
      rulerOverlay: z.boolean().optional(),
      overlayTint: z.enum(["none", "blue", "yellow", "peach", "green", "grey"]).optional(),
      overlayOpacity: z.number().min(0).max(1).optional(),
      chunkSize: z.enum(["micro", "standard"]).optional(),
      reduceMotion: z.boolean().optional(),
      hideDecorative: z.boolean().optional(),
      timers: z.boolean().optional(),
      bodyDouble: z.boolean().optional(),
      rewards: z.enum(["off", "gentle", "full"]).optional(),
      readingLevel: z.number().int().min(1).max(3).optional(),
      tashkeel: z.boolean().optional(),
      numerals: z.enum(["arabic_indic", "western"]).optional(),
      syllableSplit: z.boolean().optional(),
      curriculum: z.string().optional(),
      board: z.string().optional(),
      tier: z.enum(["foundation", "higher", "core", "extended", "sl", "hl"]).nullable().optional(),
      yearGroup: z.string().optional(),
      eccEnabled: z.boolean().optional(),
      eccAreas: z.array(z.string()).optional(),
      inputMethod: z.enum(["keyboard", "pointer", "switch", "voice", "braille_display"]).optional(),
      singleKeyShortcuts: z.boolean().optional(),
      onboardingComplete: z.boolean().optional(),
      onboardingStep: z.number().int().optional(),
      locale: z.enum(["ar", "en"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const existing = await db.select({ id: learnerProfiles.id })
        .from(learnerProfiles).where(eq(learnerProfiles.userId, ctx.user.id)).limit(1);
      if (existing.length === 0) {
        await db.insert(learnerProfiles).values({ userId: ctx.user.id, ...input } as any);
      } else {
        await db.update(learnerProfiles).set(input as any)
          .where(eq(learnerProfiles.userId, ctx.user.id));
      }
      return { success: true };
    }),

  createDefault: protectedProcedure
    .input(z.object({
      mode: z.enum(["audio_first", "reading", "focus", "custom"]),
      curriculum: z.string(),
      locale: z.enum(["ar", "en"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const modeDefaults = {
        audio_first: { primaryModality: "audio" as const, autoNarrate: true, earcons: true, theme: "light" as const },
        reading: { primaryModality: "text" as const, theme: "cream" as const, fontFamily: "atkinson" as const },
        focus: { primaryModality: "text" as const, theme: "calm" as const, chunkSize: "micro" as const, hideDecorative: true, reduceMotion: true },
        custom: { primaryModality: "text" as const },
      };
      await db.insert(learnerProfiles).values({
        userId: ctx.user.id,
        mode: input.mode,
        curriculum: input.curriculum as any,
        ...modeDefaults[input.mode],
        onboardingComplete: false,
        onboardingStep: 0,
      }).onDuplicateKeyUpdate({ set: { mode: input.mode } });
      return { success: true };
    }),
});
