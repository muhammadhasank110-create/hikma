import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { concepts, curricula, curriculumMappings, lessons, sections, specPoints, subjects, topics } from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

export const curriculumRouter = router({
  list: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(curricula).where(eq(curricula.isActive, true));
  }),

  subjects: publicProcedure
    .input(z.object({ curriculumId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(subjects)
        .where(and(eq(subjects.curriculumId, input.curriculumId), eq(subjects.isActive, true)));
    }),

  topics: publicProcedure
    .input(z.object({ subjectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(topics)
        .where(and(eq(topics.subjectId, input.subjectId), eq(topics.isActive, true)));
    }),

  lesson: publicProcedure
    .input(z.object({ lessonId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const [lesson] = await db.select().from(lessons)
        .where(eq(lessons.id, input.lessonId)).limit(1);
      if (!lesson) return null;
      const lessonSections = await db.select().from(sections)
        .where(eq(sections.lessonId, input.lessonId));
      return { ...lesson, sections: lessonSections };
    }),

  specPoints: publicProcedure
    .input(z.object({ curriculumId: z.number(), subjectId: z.number().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const conditions = [eq(specPoints.curriculumId, input.curriculumId)];
      if (input.subjectId) conditions.push(eq(specPoints.subjectId, input.subjectId));
      return db.select().from(specPoints).where(and(...conditions));
    }),

  lessonsByTopic: publicProcedure
    .input(z.object({ topicId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(lessons)
        .where(and(eq(lessons.topicId, input.topicId), eq(lessons.isActive, true)));
    }),
});
