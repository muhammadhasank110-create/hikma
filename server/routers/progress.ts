import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { mastery, parkedThoughts, progress, sessionStates } from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

export const progressRouter = router({
  getLessonProgress: protectedProcedure
    .input(z.object({ lessonId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;
      const [result] = await db.select().from(progress)
        .where(and(eq(progress.userId, ctx.user.id), eq(progress.lessonId, input.lessonId))).limit(1);
      return result ?? null;
    }),

  updateProgress: protectedProcedure
    .input(z.object({
      lessonId: z.number(),
      sectionId: z.number().optional(),
      cursorOffset: z.number().optional(),
      status: z.enum(["not_started", "in_progress", "complete"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const existing = await db.select({ id: progress.id }).from(progress)
        .where(and(eq(progress.userId, ctx.user.id), eq(progress.lessonId, input.lessonId))).limit(1);
      if (existing.length === 0) {
        await db.insert(progress).values({
          userId: ctx.user.id,
          lessonId: input.lessonId,
          sectionId: input.sectionId,
          cursorOffset: input.cursorOffset ?? 0,
          status: input.status ?? "in_progress",
          completedAt: input.status === "complete" ? new Date() : undefined,
        });
      } else {
        await db.update(progress).set({
          sectionId: input.sectionId,
          cursorOffset: input.cursorOffset,
          status: input.status,
          completedAt: input.status === "complete" ? new Date() : undefined,
        }).where(and(eq(progress.userId, ctx.user.id), eq(progress.lessonId, input.lessonId)));
      }
      return { success: true };
    }),

  saveSession: protectedProcedure
    .input(z.object({ payload: z.record(z.string(), z.unknown()) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db.insert(sessionStates).values({
        userId: ctx.user.id,
        payload: input.payload,
      }).onDuplicateKeyUpdate({ set: { payload: input.payload } });
      return { success: true };
    }),

  getSession: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    const [result] = await db.select().from(sessionStates)
      .where(eq(sessionStates.userId, ctx.user.id)).limit(1);
    return result?.payload ?? null;
  }),

  parkThought: protectedProcedure
    .input(z.object({ text: z.string(), sessionId: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db.insert(parkedThoughts).values({
        userId: ctx.user.id,
        text: input.text,
        sessionId: input.sessionId,
      });
      return { success: true };
    }),

  getParkedThoughts: protectedProcedure
    .input(z.object({ sessionId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const conditions = [eq(parkedThoughts.userId, ctx.user.id), eq(parkedThoughts.resolved, false)];
      if (input.sessionId) conditions.push(eq(parkedThoughts.sessionId, input.sessionId));
      return db.select().from(parkedThoughts).where(and(...conditions));
    }),

  getMastery: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(mastery).where(eq(mastery.userId, ctx.user.id));
  }),
});
