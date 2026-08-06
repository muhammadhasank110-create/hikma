import {
  boolean,
  float,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ============================================================
// USERS & AUTH
// ============================================================
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["learner", "guardian", "teacher", "admin"]).default("learner").notNull(),
  locale: mysqlEnum("locale", ["ar", "en"]).default("en").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  passwordHash: varchar("passwordHash", { length: 255 }),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================================================
// LEARNER PROFILE — all switches from §3
// ============================================================
export const learnerProfiles = mysqlTable("learner_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),

  // Mode
  mode: mysqlEnum("mode", ["audio_first", "reading", "focus", "custom"]).default("reading").notNull(),
  primaryModality: mysqlEnum("primaryModality", ["audio", "text", "visual"]).default("text").notNull(),

  // Audio delivery
  autoNarrate: boolean("autoNarrate").default(false).notNull(),
  speechRate: float("speechRate").default(1.0).notNull(),
  voice: varchar("voice", { length: 128 }).default("alloy"),
  earcons: boolean("earcons").default(true).notNull(),

  // Typography & colour
  theme: mysqlEnum("theme", ["light", "dark", "cream", "calm", "high_contrast"]).default("light").notNull(),
  fontFamily: mysqlEnum("fontFamily", ["atkinson", "plex", "opendyslexic", "naskh"]).default("atkinson").notNull(),
  fontScale: float("fontScale").default(1.0).notNull(),
  lineHeight: float("lineHeight").default(1.7).notNull(),
  letterSpacing: float("letterSpacing").default(0).notNull(),
  wordSpacing: float("wordSpacing").default(0).notNull(),
  maxLineLength: int("maxLineLength").default(65).notNull(),
  rulerOverlay: boolean("rulerOverlay").default(false).notNull(),
  overlayTint: mysqlEnum("overlayTint", ["none", "blue", "yellow", "peach", "green", "grey"]).default("none").notNull(),
  overlayOpacity: float("overlayOpacity").default(0.35).notNull(),

  // Cognition & attention
  chunkSize: mysqlEnum("chunkSize", ["micro", "standard"]).default("standard").notNull(),
  reduceMotion: boolean("reduceMotion").default(false).notNull(),
  hideDecorative: boolean("hideDecorative").default(false).notNull(),
  timers: boolean("timers").default(false).notNull(),
  bodyDouble: boolean("bodyDouble").default(false).notNull(),
  rewards: mysqlEnum("rewards", ["off", "gentle", "full"]).default("gentle").notNull(),
  readingLevel: int("readingLevel").default(2).notNull(),

  // Language support
  tashkeel: boolean("tashkeel").default(false).notNull(),
  numerals: mysqlEnum("numerals", ["arabic_indic", "western"]).default("western").notNull(),
  syllableSplit: boolean("syllableSplit").default(false).notNull(),

  // Curriculum
  curriculum: mysqlEnum("curriculum", ["igcse_edexcel", "qatar_moehe", "gcse", "igcse_caie", "us", "ib", "a_level", "none"]).default("none").notNull(),
  board: varchar("board", { length: 64 }),
  tier: mysqlEnum("tier", ["foundation", "higher", "core", "extended", "sl", "hl"]),
  yearGroup: varchar("yearGroup", { length: 32 }),
  classCodes: json("classCodes").$type<string[]>().default([]),
  accessArrangements: json("accessArrangements").$type<string[]>().default([]),

  // Input
  inputMethod: mysqlEnum("inputMethod", ["keyboard", "pointer", "switch", "voice", "braille_display"]).default("keyboard").notNull(),
  singleKeyShortcuts: boolean("singleKeyShortcuts").default(true).notNull(),
  keyMap: json("keyMap").$type<Record<string, string>>().default({}),
  brailleOutput: mysqlEnum("brailleOutput", ["off", "ueb", "ueb_contracted", "arabic_braille"]).default("off").notNull(),
  mathNotation: mysqlEnum("mathNotation", ["mathml", "nemeth", "ueb_math", "spoken"]).default("mathml").notNull(),

  // ECC
  eccEnabled: boolean("eccEnabled").default(false).notNull(),
  eccAreas: json("eccAreas").$type<string[]>().default([]),
  tviId: int("tviId"),

  // Daily study goal
  dailyGoalMinutes: int("dailyGoalMinutes").default(20).notNull(),

  // Onboarding
  onboardingComplete: boolean("onboardingComplete").default(false).notNull(),
  onboardingStep: int("onboardingStep").default(0).notNull(),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LearnerProfile = typeof learnerProfiles.$inferSelect;
export type InsertLearnerProfile = typeof learnerProfiles.$inferInsert;

// ============================================================
// CURRICULUM SYSTEM — §9
// ============================================================
export const curricula = mysqlTable("curricula", {
  id: int("id").autoincrement().primaryKey(),
  family: varchar("family", { length: 64 }).notNull(),   // gcse, igcse, ib, qatar_moehe…
  board: varchar("board", { length: 64 }).notNull(),     // edexcel, caie, moehe…
  region: varchar("region", { length: 64 }),
  language: mysqlEnum("language", ["ar", "en", "both"]).default("en").notNull(),
  version: varchar("version", { length: 32 }),
  titleEn: text("titleEn").notNull(),
  titleAr: text("titleAr").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const subjects = mysqlTable("subjects", {
  id: int("id").autoincrement().primaryKey(),
  curriculumId: int("curriculumId").notNull(),
  titleEn: text("titleEn").notNull(),
  titleAr: text("titleAr").notNull(),
  code: varchar("code", { length: 32 }),
  iconName: varchar("iconName", { length: 64 }),
  colorToken: varchar("colorToken", { length: 32 }),
  order: int("order").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
});

export const specPoints = mysqlTable("spec_points", {
  id: int("id").autoincrement().primaryKey(),
  curriculumId: int("curriculumId").notNull(),
  subjectId: int("subjectId").notNull(),
  code: varchar("code", { length: 64 }).notNull(),
  titleEn: text("titleEn").notNull(),
  titleAr: text("titleAr").notNull(),
  tier: mysqlEnum("tier", ["foundation", "higher", "core", "extended", "sl", "hl", "all"]).default("all").notNull(),
  depth: mysqlEnum("depth", ["recall", "understand", "apply", "analyse", "evaluate"]).default("understand").notNull(),
  weighting: float("weighting").default(1.0),
  parentId: int("parentId"),
  order: int("order").default(0).notNull(),
});

// Canonical concepts — board-independent truths
export const concepts = mysqlTable("concepts", {
  id: int("id").autoincrement().primaryKey(),
  canonicalStatementEn: text("canonicalStatementEn").notNull(),
  canonicalStatementAr: text("canonicalStatementAr").notNull(),
  prerequisites: json("prerequisites").$type<number[]>().default([]),
  subjectArea: varchar("subjectArea", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const curriculumMappings = mysqlTable("curriculum_mappings", {
  id: int("id").autoincrement().primaryKey(),
  conceptId: int("conceptId").notNull(),
  specPointId: int("specPointId").notNull(),
  depth: mysqlEnum("depth", ["recall", "understand", "apply", "analyse", "evaluate"]).default("understand").notNull(),
  terminologyEn: text("terminologyEn"),
  terminologyAr: text("terminologyAr"),
  commandWords: json("commandWords").$type<string[]>().default([]),
  assessmentStyle: varchar("assessmentStyle", { length: 128 }),
  practicalRequired: boolean("practicalRequired").default(false).notNull(),
});

// ============================================================
// TOPICS & LESSONS
// ============================================================
export const topics = mysqlTable("topics", {
  id: int("id").autoincrement().primaryKey(),
  subjectId: int("subjectId").notNull(),
  specPointId: int("specPointId"),
  conceptId: int("conceptId"),
  titleEn: text("titleEn").notNull(),
  titleAr: text("titleAr").notNull(),
  summaryEn: text("summaryEn"),
  summaryAr: text("summaryAr"),
  order: int("order").default(0).notNull(),
  prerequisites: json("prerequisites").$type<number[]>().default([]),
  estimatedMinutes: int("estimatedMinutes").default(15),
  isActive: boolean("isActive").default(true).notNull(),
});

export const lessons = mysqlTable("lessons", {
  id: int("id").autoincrement().primaryKey(),
  topicId: int("topicId").notNull(),
  titleEn: text("titleEn").notNull(),
  titleAr: text("titleAr").notNull(),
  conceptGraph: json("conceptGraph").$type<{
    nodes: Array<{ id: string; label: string; type: string; detail: string; labelAr?: string }>;
    edges: Array<{ from: string; to: string; label: string; labelAr?: string }>;
    textAlternative: string;
    textAlternativeAr?: string;
  }>(),
  order: int("order").default(0).notNull(),
  estimatedMinutes: int("estimatedMinutes").default(15),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const sections = mysqlTable("sections", {
  id: int("id").autoincrement().primaryKey(),
  lessonId: int("lessonId").notNull(),
  order: int("order").default(0).notNull(),
  titleEn: text("titleEn").notNull(),
  titleAr: text("titleAr").notNull(),
  summaryEn: text("summaryEn").notNull(),
  summaryAr: text("summaryAr").notNull(),
  bodyEn: text("bodyEn").notNull(),
  bodyAr: text("bodyAr").notNull(),
  narrationScriptEn: text("narrationScriptEn"),
  narrationScriptAr: text("narrationScriptAr"),
  mediaRefs: json("mediaRefs").$type<number[]>().default([]),
  readingLevel: int("readingLevel").default(2).notNull(),
});

export const media = mysqlTable("media", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["image", "diagram", "chart", "audio", "video", "mathml", "tactile_svg"]).notNull(),
  srcRef: text("srcRef").notNull(),
  altShortEn: text("altShortEn").notNull(),   // NOT NULL — enforced at DB level
  altShortAr: text("altShortAr").notNull(),
  altLongEn: text("altLongEn"),
  altLongAr: text("altLongAr"),
  sonificationData: json("sonificationData"),
  mathml: text("mathml"),
  tactileSvg: text("tactileSvg"),
  captionEn: text("captionEn"),
  captionAr: text("captionAr"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ============================================================
// PROGRESS & SESSION STATE
// ============================================================
export const mastery = mysqlTable("mastery", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  conceptId: int("conceptId").notNull(),
  level: int("level").default(0).notNull(),   // 0–5
  evidence: json("evidence").$type<string[]>().default([]),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const progress = mysqlTable("progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  lessonId: int("lessonId").notNull(),
  sectionId: int("sectionId"),
  cursorOffset: int("cursorOffset").default(0),
  status: mysqlEnum("status", ["not_started", "in_progress", "complete"]).default("not_started").notNull(),
  completedAt: timestamp("completedAt"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const sessionStates = mysqlTable("session_states", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  payload: json("payload").notNull(),   // exact-position resume
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const attempts = mysqlTable("attempts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  checkItemId: int("checkItemId").notNull(),
  response: text("response"),
  correct: boolean("correct"),
  attemptedAt: timestamp("attemptedAt").defaultNow().notNull(),
  // No duration scoring — §11
});

// ============================================================
// ASSESSMENT
// ============================================================
export const checkItems = mysqlTable("check_items", {
  id: int("id").autoincrement().primaryKey(),
  lessonId: int("lessonId").notNull(),
  conceptId: int("conceptId"),
  specPointId: int("specPointId"),
  type: mysqlEnum("type", ["multiple_choice", "short_answer", "voice", "selection"]).default("multiple_choice").notNull(),
  questionEn: text("questionEn").notNull(),
  questionAr: text("questionAr").notNull(),
  optionsEn: json("optionsEn").$type<string[]>(),
  optionsAr: json("optionsAr").$type<string[]>(),
  correctAnswer: text("correctAnswer"),
  markSchemeEn: text("markSchemeEn"),
  markSchemeAr: text("markSchemeAr"),
  commandWord: varchar("commandWord", { length: 64 }),
  marks: int("marks").default(1),
  order: int("order").default(0).notNull(),
  readingLevel: int("readingLevel").default(2),
});

// ============================================================
// CLASS & SCHOOL SYSTEM — §9.3
// ============================================================
export const classes = mysqlTable("classes", {
  id: int("id").autoincrement().primaryKey(),
  teacherId: int("teacherId").notNull(),
  curriculumId: int("curriculumId").notNull(),
  subjectId: int("subjectId"),
  tier: mysqlEnum("tier", ["foundation", "higher", "core", "extended", "sl", "hl", "all"]).default("all"),
  language: mysqlEnum("language", ["ar", "en"]).default("en").notNull(),
  nameEn: text("nameEn").notNull(),
  nameAr: text("nameAr").notNull(),
  joinCode: varchar("joinCode", { length: 8 }).notNull().unique(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const enrolments = mysqlTable("enrolments", {
  id: int("id").autoincrement().primaryKey(),
  classId: int("classId").notNull(),
  userId: int("userId").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

export const assignments = mysqlTable("assignments", {
  id: int("id").autoincrement().primaryKey(),
  classId: int("classId").notNull(),
  specPointIds: json("specPointIds").$type<number[]>().default([]),
  dueAt: timestamp("dueAt"),   // informational only — never punitive
  noteEn: text("noteEn"),
  noteAr: text("noteAr"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const accessArrangements = mysqlTable("access_arrangements", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: varchar("type", { length: 64 }).notNull(),   // extra_time_25, reader, scribe…
  approvedBy: varchar("approvedBy", { length: 128 }),
  evidenceLog: json("evidenceLog").$type<Array<{ date: string; note: string }>>().default([]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================================
// ECC — Expanded Core Curriculum — §10
// ============================================================
export const eccAreas = mysqlTable("ecc_areas", {
  id: int("id").autoincrement().primaryKey(),
  number: int("number").notNull(),   // 1–9
  nameEn: text("nameEn").notNull(),
  nameAr: text("nameAr").notNull(),
  descriptionEn: text("descriptionEn"),
  descriptionAr: text("descriptionAr"),
  iconName: varchar("iconName", { length: 64 }),
});

export const eccUnits = mysqlTable("ecc_units", {
  id: int("id").autoincrement().primaryKey(),
  areaId: int("areaId").notNull(),
  lessonId: int("lessonId"),
  titleEn: text("titleEn").notNull(),
  titleAr: text("titleAr").notNull(),
  requiresInPersonPractice: boolean("requiresInPersonPractice").default(false).notNull(),
  inPersonNoteEn: text("inPersonNoteEn"),
  inPersonNoteAr: text("inPersonNoteAr"),
  order: int("order").default(0).notNull(),
});

export const eccProgress = mysqlTable("ecc_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  unitId: int("unitId").notNull(),
  status: mysqlEnum("status", ["not_started", "rehearsed", "practised", "mastered"]).default("not_started").notNull(),
  source: mysqlEnum("source", ["self", "tvi", "guardian"]).default("self").notNull(),
  verifiedBy: int("verifiedBy"),
  notes: text("notes"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const tviLinks = mysqlTable("tvi_links", {
  id: int("id").autoincrement().primaryKey(),
  tviId: int("tviId").notNull(),
  learnerId: int("learnerId").notNull(),
  consentAt: timestamp("consentAt").defaultNow().notNull(),
  scope: json("scope").$type<string[]>().default([]),
});

// ============================================================
// FOCUS MODE — §8
// ============================================================
export const parkedThoughts = mysqlTable("parked_thoughts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  sessionId: varchar("sessionId", { length: 64 }),
  text: text("text").notNull(),
  resolved: boolean("resolved").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ============================================================
// PERSONALISATION
// ============================================================
export const insights = mysqlTable("insights", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: varchar("type", { length: 64 }).notNull(),
  value: json("value"),
  confidence: float("confidence").default(0.5),
  visibleToLearner: boolean("visibleToLearner").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================================
// GUARDIAN & TEACHER LINKS
// ============================================================
export const guardianLinks = mysqlTable("guardian_links", {
  id: int("id").autoincrement().primaryKey(),
  guardianId: int("guardianId").notNull(),
  learnerId: int("learnerId").notNull(),
  consentAt: timestamp("consentAt").defaultNow().notNull(),
  scope: json("scope").$type<string[]>().default(["progress", "time", "preferences"]),
});

// ============================================================
// TUTOR CONVERSATIONS
// ============================================================
export const tutorConversations = mysqlTable("tutor_conversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  lessonId: int("lessonId"),
  sessionId: varchar("sessionId", { length: 64 }).notNull(),
  messages: json("messages").$type<Array<{
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: number;
    modality?: "text" | "audio" | "map";
  }>>().default([]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
