import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { profileRouter } from "./routers/profile";
import { curriculumRouter } from "./routers/curriculum";
import { progressRouter } from "./routers/progress";
import { tutorRouter } from "./routers/tutor";
import { classesRouter } from "./routers/classes";
import { ttsRouter } from "./routers/tts";
import { sttRouter } from "./routers/stt";
import { eccRouter } from "./routers/ecc";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(({ ctx }) => {
      if (!ctx.user) return null;
      // Never expose the password hash to the client
      const { passwordHash: _pw, ...safeUser } = ctx.user as any;
      return safeUser;
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  profile: profileRouter,
  curriculum: curriculumRouter,
  progress: progressRouter,
  tutor: tutorRouter,
  classes: classesRouter,
  tts: ttsRouter,
  stt: sttRouter,
  ecc: eccRouter,
});

export type AppRouter = typeof appRouter;
