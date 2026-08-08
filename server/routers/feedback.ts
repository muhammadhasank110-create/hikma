import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { feedbackReports } from "../../drizzle/schema";
import { storagePut } from "../storage";
import { notifyOwner } from "../_core/notification";

export const feedbackRouter = router({
  /** Submit a feedback report with optional screenshot (base64 PNG) */
  submit: protectedProcedure
    .input(
      z.object({
        message:         z.string().min(5).max(4000),
        screenshotB64:   z.string().optional(), // base64-encoded PNG
        page:            z.string().max(255).optional(),
        userAgent:       z.string().max(512).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      let screenshotKey: string | undefined;
      let screenshotUrl: string | undefined;

      // Upload screenshot to S3 if provided
      if (input.screenshotB64) {
        try {
          const buf = Buffer.from(
            input.screenshotB64.replace(/^data:image\/\w+;base64,/, ""),
            "base64"
          );
          const result = await storagePut(
            `feedback/${ctx.user.id}/${Date.now()}.png`,
            buf,
            "image/png"
          );
          screenshotKey = result.key;
          screenshotUrl = result.url;
        } catch (e) {
          console.warn("[Feedback] Screenshot upload failed:", e);
        }
      }

      // Store in DB
      await db.insert(feedbackReports).values({
        userId:        ctx.user.id,
        message:       input.message,
        screenshotKey: screenshotKey ?? null,
        screenshotUrl: screenshotUrl ?? null,
        page:          input.page ?? null,
        userAgent:     input.userAgent ?? null,
        status:        "open",
      });

      // Notify owner via Manus notification (email)
      const screenshotLine = screenshotUrl
        ? `\n\nScreenshot: https://hikmalearn-ainbnehq.manus.space${screenshotUrl}`
        : "";
      await notifyOwner({
        title: `📋 Hikma Feedback from ${ctx.user.name ?? ctx.user.email ?? "user"}`,
        content: [
          `User: ${ctx.user.name ?? "unknown"} (${ctx.user.email ?? "no email"})`,
          `Page: ${input.page ?? "unknown"}`,
          ``,
          `Message:`,
          input.message,
          screenshotLine,
        ].join("\n"),
      });

      return { success: true };
    }),

  /** List own feedback reports */
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const { eq, desc } = await import("drizzle-orm");
    return db
      .select()
      .from(feedbackReports)
      .where(eq(feedbackReports.userId, ctx.user.id))
      .orderBy(desc(feedbackReports.createdAt))
      .limit(20);
  }),
});
