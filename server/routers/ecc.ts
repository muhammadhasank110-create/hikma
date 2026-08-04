import { eq } from "drizzle-orm";
import { z } from "zod";
import { eccAreas, eccProgress, eccUnits } from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

export const eccRouter = router({
  areas: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(eccAreas);
  }),

  units: publicProcedure
    .input(z.object({ areaId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(eccUnits).where(eq(eccUnits.areaId, input.areaId));
    }),

  myProgress: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(eccProgress).where(eq(eccProgress.userId, ctx.user.id));
  }),

  updateProgress: protectedProcedure
    .input(z.object({
      unitId: z.number(),
      status: z.enum(["not_started", "rehearsed", "practised", "mastered"]),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const [existing] = await db.select({ id: eccProgress.id }).from(eccProgress)
        .where(eq(eccProgress.userId, ctx.user.id)).limit(1);
      if (existing) {
        await db.update(eccProgress).set({ status: input.status, notes: input.notes })
          .where(eq(eccProgress.id, existing.id));
      } else {
        await db.insert(eccProgress).values({
          userId: ctx.user.id,
          unitId: input.unitId,
          status: input.status,
          notes: input.notes,
        });
      }
      return { success: true };
    }),
});

