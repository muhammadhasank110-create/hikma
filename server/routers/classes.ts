import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { assignments, classes, enrolments, subjects } from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { nanoid } from "nanoid";

export const classesRouter = router({
  join: protectedProcedure
    .input(z.object({ joinCode: z.string().length(8) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const [cls] = await db.select().from(classes)
        .where(and(eq(classes.joinCode, input.joinCode.toUpperCase()), eq(classes.isActive, true))).limit(1);
      if (!cls) throw new Error("Class not found. Check the code and try again.");
      const [existing] = await db.select().from(enrolments)
        .where(and(eq(enrolments.classId, cls.id), eq(enrolments.userId, ctx.user.id))).limit(1);
      if (existing) return { success: true, classId: cls.id, alreadyEnrolled: true };
      await db.insert(enrolments).values({ classId: cls.id, userId: ctx.user.id });
      return { success: true, classId: cls.id, alreadyEnrolled: false };
    }),

  create: protectedProcedure
    .input(z.object({
      curriculumId: z.number(),
      subjectId: z.number().optional(),
      nameEn: z.string(),
      nameAr: z.string(),
      tier: z.enum(["foundation", "higher", "core", "extended", "sl", "hl", "all"]).optional(),
      language: z.enum(["ar", "en"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const joinCode = nanoid(8).toUpperCase();
      const [cls] = await db.insert(classes).values({
        teacherId: ctx.user.id,
        curriculumId: input.curriculumId,
        subjectId: input.subjectId,
        nameEn: input.nameEn,
        nameAr: input.nameAr,
        tier: input.tier ?? "all",
        language: input.language,
        joinCode,
      });
      return { success: true, joinCode };
    }),

  myClasses: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const enrolmentList = await db.select({ classId: enrolments.classId })
      .from(enrolments).where(eq(enrolments.userId, ctx.user.id));
    if (enrolmentList.length === 0) return [];
    return db.select().from(classes)
      .where(eq(classes.isActive, true));
  }),
});
