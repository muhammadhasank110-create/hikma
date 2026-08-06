/**
 * Email / password authentication routes.
 * POST /api/auth/signup  — create account
 * POST /api/auth/signin  — sign in
 * POST /api/auth/signout — clear session cookie
 *
 * On success, issues the same JWT session cookie used by the Manus OAuth flow
 * so the rest of the app (protectedProcedure, useAuth) works unchanged.
 */
import bcrypt from "bcryptjs";
import type { Express, Request, Response } from "express";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { sdk } from "./_core/sdk";
import { getSessionCookieOptions } from "./_core/cookies";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { nanoid } from "nanoid";

const SALT_ROUNDS = 12;

function emailValid(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

export function registerAuthRoutes(app: Express) {
  // ── Sign Up ────────────────────────────────────────────────────────────────
  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    const { email, password, name } = req.body ?? {};
    if (!email || !password) {
      res.status(400).json({ error: "email and password are required" });
      return;
    }
    if (!emailValid(email)) {
      res.status(400).json({ error: "invalid email address" });
      return;
    }
    if (typeof password !== "string" || password.length < 8) {
      res.status(400).json({ error: "password must be at least 8 characters" });
      return;
    }
    try {
      const db = await getDb();
      if (!db) { res.status(503).json({ error: "database unavailable" }); return; }

      // Check duplicate
      const existing = await db.select({ id: users.id })
        .from(users).where(eq(users.email, email.toLowerCase())).limit(1);
      if (existing.length > 0) {
        res.status(409).json({ error: "An account with this email already exists. Please sign in." });
        return;
      }

      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      // openId is required and unique — use a deterministic prefix + nanoid
      const openId = `email:${nanoid(21)}`;
      const displayName = (typeof name === "string" && name.trim()) ? name.trim() : email.split("@")[0];

      await db.insert(users).values({
        openId,
        email: email.toLowerCase(),
        name: displayName,
        loginMethod: "email",
        passwordHash,
        lastSignedIn: new Date(),
      } as any);

      const sessionToken = await sdk.createSessionToken(openId, {
        name: displayName,
        expiresInMs: ONE_YEAR_MS,
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.json({ ok: true, name: displayName });
    } catch (err: any) {
      console.error("[signup]", err);
      res.status(500).json({ error: "signup failed — please try again" });
    }
  });

  // ── Sign In ────────────────────────────────────────────────────────────────
  app.post("/api/auth/signin", async (req: Request, res: Response) => {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      res.status(400).json({ error: "email and password are required" });
      return;
    }
    try {
      const db = await getDb();
      if (!db) { res.status(503).json({ error: "database unavailable" }); return; }

      const rows = await db.select()
        .from(users).where(eq(users.email, email.toLowerCase())).limit(1);
      const user = rows[0];

      if (!user || !user.passwordHash) {
        // Timing-safe: still run bcrypt to prevent user enumeration
        await bcrypt.compare(password, "$2b$12$invalidhashpadding00000000000000000000000000000000000");
        res.status(401).json({ error: "incorrect email or password" });
        return;
      }

      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) {
        res.status(401).json({ error: "incorrect email or password" });
        return;
      }

      // Update lastSignedIn
      await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));

      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name ?? email,
        expiresInMs: ONE_YEAR_MS,
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.json({ ok: true, name: user.name ?? email });
    } catch (err: any) {
      console.error("[signin]", err);
      res.status(500).json({ error: "sign in failed — please try again" });
    }
  });

  // ── Sign Out ───────────────────────────────────────────────────────────────
  app.post("/api/auth/signout", (req: Request, res: Response) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, cookieOptions);
    res.json({ ok: true });
  });
}
