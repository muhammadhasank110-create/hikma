import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { concepts, learnerProfiles, lessons, mastery, parkedThoughts, progress, sessionStates, subjects, topics } from "../../drizzle/schema";
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

  masteryDetails: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const [learnerMastery, allConcepts] = await Promise.all([
      db.select().from(mastery).where(eq(mastery.userId, ctx.user.id)),
      db.select().from(concepts),
    ]);
    const conceptById = new Map(allConcepts.map(concept => [concept.id, concept]));
    return learnerMastery.map(item => {
      const concept = conceptById.get(item.conceptId);
      return {
        ...item,
        conceptEn: concept?.canonicalStatementEn ?? `Concept ${item.conceptId}`,
        conceptAr: concept?.canonicalStatementAr ?? `المفهوم ${item.conceptId}`,
        topicEn: concept?.subjectArea ?? "",
        topicAr: concept?.subjectArea ?? "",
      };
    });
  }),

  learnerSummary: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      return {
        stats: { masteredConcepts: 0, inProgressLessons: 0, completedLessons: 0, totalLessons: 0 },
        continueLesson: null,
        recentLessons: [],
        weakAreas: [],
      };
    }

    const [allLessons, allTopics, allSubjects, learnerProgress, learnerMastery, profileRows] = await Promise.all([
      db.select().from(lessons),
      db.select().from(topics),
      db.select().from(subjects),
      db.select().from(progress).where(eq(progress.userId, ctx.user.id)).orderBy(desc(progress.updatedAt)),
      db.select().from(mastery).where(eq(mastery.userId, ctx.user.id)),
      db.select().from(learnerProfiles).where(eq(learnerProfiles.userId, ctx.user.id)).limit(1),
    ]);

    const topicById = new Map(allTopics.map(topic => [topic.id, topic]));
    const subjectById = new Map(allSubjects.map(subject => [subject.id, subject]));
    const lessonById = new Map(allLessons.map(lesson => [lesson.id, lesson]));
    const progressByLessonId = new Map(learnerProgress.map(item => [item.lessonId, item]));
    const completedLessonIds = new Set(learnerProgress.filter(item => item.status === "complete").map(item => item.lessonId));
    const inProgress = learnerProgress.filter(item => item.status === "in_progress");

    const describeLesson = (lessonId: number) => {
      const lesson = lessonById.get(lessonId);
      if (!lesson) return null;
      const topic = topicById.get(lesson.topicId);
      const subject = topic ? subjectById.get(topic.subjectId) : undefined;
      return {
        lessonId: lesson.id,
        titleEn: lesson.titleEn,
        titleAr: lesson.titleAr,
        topicEn: topic?.titleEn ?? "",
        topicAr: topic?.titleAr ?? "",
        subjectEn: subject?.titleEn ?? "",
        subjectAr: subject?.titleAr ?? "",
        subjectCode: subject?.code ?? "",
        status: progressByLessonId.get(lesson.id)?.status ?? "not_started",
        updatedAt: progressByLessonId.get(lesson.id)?.updatedAt ?? lesson.updatedAt,
      };
    };

    const availableLessons = allLessons
      .map(lesson => describeLesson(lesson.id))
      .filter((lesson): lesson is NonNullable<typeof lesson> => Boolean(lesson && !completedLessonIds.has(lesson.lessonId)));
    const prioritySubjects = new Set((profileRows[0]?.subjectInterests ?? []).map(subject => subject.toLowerCase()));
    const isPrioritySubject = (lesson: NonNullable<ReturnType<typeof describeLesson>>) => {
      const subject = lesson.subjectEn.toLowerCase();
      return prioritySubjects.has(lesson.subjectCode.toLowerCase())
        || (prioritySubjects.has("mathematics") && /math/.test(subject))
        || (prioritySubjects.has("science") && /science|biology|chemistry|physics/.test(subject))
        || (prioritySubjects.has("english") && /english/.test(subject))
        || (prioritySubjects.has("arabic") && /arabic/.test(subject))
        || (prioritySubjects.has("exam_skills") && /exam/.test(subject));
    };
    const inProgressLesson = describeLesson(inProgress[0]?.lessonId);
    const priorityLesson = availableLessons.find(isPrioritySubject);
    const continueLesson = inProgressLesson ?? priorityLesson ?? availableLessons[0];
    const recommendationSource = inProgressLesson ? "continue" : priorityLesson ? "priority_subject" : "next";

    const recentLessons = learnerProgress
      .map(item => describeLesson(item.lessonId))
      .filter((lesson): lesson is NonNullable<typeof lesson> => Boolean(lesson))
      .slice(0, 3);

    const lessonCountsByTopic = new Map<number, { total: number; completed: number }>();
    allLessons.forEach(lesson => {
      const current = lessonCountsByTopic.get(lesson.topicId) ?? { total: 0, completed: 0 };
      current.total += 1;
      if (completedLessonIds.has(lesson.id)) current.completed += 1;
      lessonCountsByTopic.set(lesson.topicId, current);
    });
    const weakAreas = Array.from(lessonCountsByTopic.entries())
      .map(([topicId, counts]) => {
        const topic = topicById.get(topicId);
        return topic ? {
          topicId,
          titleEn: topic.titleEn,
          titleAr: topic.titleAr,
          completed: counts.completed,
          total: counts.total,
          coveragePct: counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0,
        } : null;
      })
      .filter((topic): topic is NonNullable<typeof topic> => Boolean(topic && topic.coveragePct < 100))
      .sort((a, b) => a.coveragePct - b.coveragePct)
      .slice(0, 3);

    return {
      stats: {
        masteredConcepts: learnerMastery.filter(item => item.level >= 4).length,
        inProgressLessons: inProgress.length,
        completedLessons: completedLessonIds.size,
        totalLessons: allLessons.length,
      },
      continueLesson: continueLesson ?? null,
      recommendationSource,
      recentLessons,
      weakAreas,
    };
  }),

  subjectCoverage: protectedProcedure
    .input(z.object({ subjectId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { totalLessons: 0, completedLessons: 0, coveragePct: 0 };
      const subjectTopics = await db.select({ id: topics.id }).from(topics)
        .where(eq(topics.subjectId, input.subjectId));
      if (subjectTopics.length === 0) return { totalLessons: 0, completedLessons: 0, coveragePct: 0 };
      const topicIds = subjectTopics.map(t => t.id);
      const allLessons = await db.select({ id: lessons.id }).from(lessons)
        .where(inArray(lessons.topicId, topicIds));
      if (allLessons.length === 0) return { totalLessons: 0, completedLessons: 0, coveragePct: 0 };
      const lessonIds = allLessons.map(l => l.id);
      const completedProgress = await db.select({ lessonId: progress.lessonId }).from(progress)
        .where(and(eq(progress.userId, ctx.user.id), inArray(progress.lessonId, lessonIds)));
      const completedSet = new Set(completedProgress.map(p => p.lessonId));
      const completedLessons = lessonIds.filter(id => completedSet.has(id)).length;
      const totalLessons = lessonIds.length;
      return { totalLessons, completedLessons, coveragePct: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0 };
    }),
});
