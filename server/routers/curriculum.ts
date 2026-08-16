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

  availableSubjects: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const rows = await db.select({
      id: subjects.id,
      curriculumId: subjects.curriculumId,
      code: subjects.code,
      titleEn: subjects.titleEn,
      titleAr: subjects.titleAr,
      curriculumFamily: curricula.family,
      curriculumBoard: curricula.board,
      curriculumTitleEn: curricula.titleEn,
      curriculumTitleAr: curricula.titleAr,
    })
      .from(subjects)
      .innerJoin(curricula, eq(curricula.id, subjects.curriculumId))
      .innerJoin(topics, eq(topics.subjectId, subjects.id))
      .innerJoin(lessons, eq(lessons.topicId, topics.id))
      .where(and(
        eq(subjects.isActive, true),
        eq(curricula.isActive, true),
        eq(topics.isActive, true),
        eq(lessons.isActive, true),
      ))
      .groupBy(subjects.id, subjects.curriculumId, subjects.code, subjects.titleEn, subjects.titleAr, curricula.family, curricula.board, curricula.titleEn, curricula.titleAr)
      .orderBy(subjects.order, subjects.id);

    return rows.map(subject => ({
      ...subject,
      profileKey: subject.curriculumFamily === "igcse" && /edexcel/i.test(subject.curriculumBoard)
        ? "igcse_edexcel"
        : subject.curriculumFamily === "national" && /qatar/i.test(subject.curriculumBoard)
          ? "qatar_moehe"
          : subject.curriculumFamily,
    }));
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
      const [topic] = await db.select({ subjectId: topics.subjectId, conceptId: topics.conceptId })
        .from(topics)
        .where(eq(topics.id, lesson.topicId))
        .limit(1);
      const [subject] = topic
        ? await db.select({ titleEn: subjects.titleEn, titleAr: subjects.titleAr })
          .from(subjects)
          .where(eq(subjects.id, topic.subjectId))
          .limit(1)
        : [];
      const [concept] = topic?.conceptId
        ? await db.select({ subjectArea: concepts.subjectArea })
          .from(concepts)
          .where(eq(concepts.id, topic.conceptId))
          .limit(1)
        : [];
      return {
        ...lesson,
        sections: lessonSections,
        subjectArea: subject?.titleEn ?? concept?.subjectArea ?? "",
        subjectAreaAr: subject?.titleAr ?? concept?.subjectArea ?? "",
      };
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

  search: publicProcedure
    .input(z.object({ query: z.string().trim().min(2).max(80) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const query = input.query.toLocaleLowerCase();
      const [allSubjects, allTopics, allLessons] = await Promise.all([
        db.select().from(subjects).where(eq(subjects.isActive, true)),
        db.select().from(topics).where(eq(topics.isActive, true)),
        db.select().from(lessons).where(eq(lessons.isActive, true)),
      ]);
      const subjectById = new Map(allSubjects.map(subject => [subject.id, subject]));
      const topicById = new Map(allTopics.map(topic => [topic.id, topic]));
      const matches = (values: Array<string | null | undefined>) => values.some(value => value?.toLocaleLowerCase().includes(query));
      return [
        ...allSubjects.filter(subject => matches([subject.titleEn, subject.titleAr])).map(subject => ({
          id: subject.id,
          type: "subject" as const,
          titleEn: subject.titleEn,
          titleAr: subject.titleAr,
          contextEn: "Subject",
          contextAr: "مادة",
          href: `/subjects/${subject.id}`,
        })),
        ...allTopics.filter(topic => matches([topic.titleEn, topic.titleAr])).map(topic => {
          const subject = subjectById.get(topic.subjectId);
          return {
            id: topic.id,
            type: "topic" as const,
            titleEn: topic.titleEn,
            titleAr: topic.titleAr,
            contextEn: subject?.titleEn ?? "Topic",
            contextAr: subject?.titleAr ?? "موضوع",
            href: `/subjects/${topic.subjectId}`,
          };
        }),
        ...allLessons.filter(lesson => matches([lesson.titleEn, lesson.titleAr])).map(lesson => {
          const topic = topicById.get(lesson.topicId);
          return {
            id: lesson.id,
            type: "lesson" as const,
            titleEn: lesson.titleEn,
            titleAr: lesson.titleAr,
            contextEn: topic?.titleEn ?? "Lesson",
            contextAr: topic?.titleAr ?? "درس",
            href: `/lesson/${lesson.id}`,
          };
        }),
      ].slice(0, 12);
    }),
});
