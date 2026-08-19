import { expect, test } from "@playwright/test";

const mockUser = {
  id: 9001, openId: "playwright-learner", name: "Playwright Learner", email: "learner@example.com",
  role: "learner", locale: "en", loginMethod: "test", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), lastSignedIn: new Date().toISOString(),
};

const usableSubjects = [
  { id: 1, curriculumId: 1, code: "MATH-IGCSE", titleEn: "Mathematics", titleAr: "الرياضيات", curriculumFamily: "igcse", curriculumBoard: "Edexcel", curriculumTitleEn: "IGCSE Edexcel", curriculumTitleAr: "IGCSE إيدكسيل", profileKey: "igcse_edexcel" },
  { id: 2, curriculumId: 1, code: "ENG-IGCSE", titleEn: "English Language", titleAr: "اللغة الإنجليزية", curriculumFamily: "igcse", curriculumBoard: "Edexcel", curriculumTitleEn: "IGCSE Edexcel", curriculumTitleAr: "IGCSE إيدكسيل", profileKey: "igcse_edexcel" },
  { id: 3, curriculumId: 1, code: "SCI-IGCSE", titleEn: "Science (Double)", titleAr: "العلوم (مزدوج)", curriculumFamily: "igcse", curriculumBoard: "Edexcel", curriculumTitleEn: "IGCSE Edexcel", curriculumTitleAr: "IGCSE إيدكسيل", profileKey: "igcse_edexcel" },
];

test.describe("authenticated tutor narration", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      let active: SpeechSynthesisUtterance | null = null;
      Object.defineProperty(window, "speechSynthesis", { configurable: true, value: {
        getVoices: () => [],
        addEventListener: () => {}, removeEventListener: () => {},
        speak: (utterance: SpeechSynthesisUtterance) => { active = utterance; setTimeout(() => utterance.onstart?.(new Event("start") as SpeechSynthesisEvent), 0); },
        cancel: () => { active?.onend?.(new Event("end") as SpeechSynthesisEvent); active = null; },
      }});
    });
    await page.route(/\/api\/trpc\/auth\.me/, route => route.fulfill({ contentType: "application/json", body: JSON.stringify([{ result: { data: { json: mockUser } } }]) }));
    await page.route("**/api/tts/config", route => route.fulfill({ contentType: "application/json", body: JSON.stringify({ hasElevenLabs: false }) }));
    await page.route(/\/api\/trpc\/curriculum\.list/, route => route.fulfill({ contentType: "application/json", body: JSON.stringify([{ result: { data: { json: [] } } }]) }));
    await page.route(/\/api\/trpc\/curriculum\.availableSubjects/, route => route.fulfill({ contentType: "application/json", body: JSON.stringify([{ result: { data: { json: usableSubjects } } }]) }));
  });

  test("shows the speaking wave and stops authenticated tutor narration", async ({ page }) => {
    await page.goto("/tutor");
    await expect(page.getByRole("log", { name: /hikma ai conversation/i })).toBeVisible();
    // Allow the auth query and initial tutor greeting to settle before interacting.
    await page.waitForTimeout(700);
    await page.locator('button[aria-label="Listen"]').first().evaluate((button: HTMLButtonElement) => button.click());
    await expect(page.getByRole("status", { name: "Hikma is speaking" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Stop narration" })).toBeVisible();
    await page.getByRole("button", { name: "Stop narration" }).click();
    await expect(page.getByRole("status", { name: "Voice is idle" })).toBeVisible();
  });

  test("keeps learner dashboard surface tokens profile-aware for cream, calm, and high contrast", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator("#main-content")).toBeVisible();
    for (const [theme, expectedCard] of [["cream", "255 253 248"], ["calm", "248 250 248"], ["high_contrast", "0 0 0"]] as const) {
      await page.evaluate(({ nextTheme }) => { document.documentElement.dataset.theme = nextTheme; }, { nextTheme: theme });
      await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--card").trim())).toBe(expectedCard);
    }
  });

  test("operates the repaired curriculum, subject, ECC, and admin cards as named native buttons", async ({ page }) => {
    await page.route(/\/api\/trpc\/curriculum\.list/, route => route.fulfill({ contentType: "application/json", body: JSON.stringify([{ result: { data: { json: [{ id: 1, titleEn: "IGCSE Edexcel", titleAr: "إدكسل IGCSE", board: "Edexcel" }] } } }]) }));
    await page.route(/\/api\/trpc\/curriculum\.subjects/, route => route.fulfill({ contentType: "application/json", body: JSON.stringify([{ result: { data: { json: [{ id: 1, titleEn: "Mathematics", titleAr: "الرياضيات", code: "MATH-IGCSE" }] } } }]) }));
    await page.route(/\/api\/trpc\/curriculum\.topics/, route => route.fulfill({ contentType: "application/json", body: JSON.stringify([{ result: { data: { json: [] } } }]) }));
    await page.goto("/curriculum");

    const curriculum = page.getByRole("button", { name: /igcse edexcel/i });
    await expect(curriculum).toHaveAttribute("aria-pressed", "false");
    await curriculum.focus();
    await page.keyboard.press("Space");
    await expect(curriculum).toHaveAttribute("aria-pressed", "true");

    const mathematicsDisclosure = page.getByRole("button", { name: /mathematics/i });
    await expect(mathematicsDisclosure).toHaveAttribute("aria-expanded", "false");
    await mathematicsDisclosure.focus();
    await page.keyboard.press("Enter");
    await expect(mathematicsDisclosure).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#subject-topics-1")).toBeVisible();

    await page.goto("/subjects/1");
    const mathematicsSubject = page.getByRole("button", { name: "Mathematics" });
    await mathematicsSubject.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/subjects\/1\/topics\/1/);

    await page.route(/\/api\/trpc\/ecc\.areas/, route => route.fulfill({ contentType: "application/json", body: JSON.stringify([{ result: { data: { json: [{ id: 1, number: 1, nameEn: "Sensory Awareness", nameAr: "الوعي الحسي", descriptionEn: "Learn sensory skills", descriptionAr: "تعلم المهارات الحسية" }] } } }]) }));
    await page.route(/\/api\/trpc\/ecc\.myProgress/, route => route.fulfill({ contentType: "application/json", body: JSON.stringify([{ result: { data: { json: [] } } }]) }));
    await page.goto("/ecc");
    const eccArea = page.getByRole("button", { name: "Sensory Awareness", exact: true });
    await eccArea.focus();
    await page.keyboard.press("Space");
    await expect(page).toHaveURL(/\/ecc\/1/);

    await page.route(/\/api\/trpc\/auth\.me/, route => route.fulfill({ contentType: "application/json", body: JSON.stringify([{ result: { data: { json: { ...mockUser, role: "admin" } } } }]) }));
    await page.goto("/admin");
    const users = page.getByRole("button", { name: "Users" });
    await users.focus();
    await page.keyboard.press("Space");
    await expect(page.getByText("User management coming soon")).toBeVisible();
  });

  test("uses the shared contrast-safe compact HIKMA brand in the authenticated app header", async ({ page }) => {
    await page.goto("/dashboard");
    const brand = page.getByRole("link", { name: "Hikma home" });
    await expect(brand).toBeVisible();
    const logo = brand.locator('[data-hikma-logo="compact"] img');
    await expect(logo).toHaveAttribute("src", /hikma_icon_forest_white_330f7c62\.png/);
    const box = await logo.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(48);
    expect((box?.height ?? 0) / (box?.width ?? 1)).toBeCloseTo(1, 1);
  });

  test("persists learner subject priorities from accessible Settings controls", async ({ page }) => {
    let persistedInterest = false;
    await page.route(/\/api\/trpc\/profile\.update/, route => {
      persistedInterest = route.request().postData()?.includes("MATH-IGCSE") ?? false;
      return route.fulfill({ contentType: "application/json", body: JSON.stringify([{ result: { data: { json: {} } } }]) });
    });
    await page.goto("/settings");
    const subjectGroup = page.getByRole("group", { name: "Subjects to prioritise" });
    const mathematics = subjectGroup.getByRole("button", { name: "Mathematics" });
    await expect(mathematics).toHaveAttribute("aria-pressed", "false");
    await mathematics.click();
    await expect(mathematics).toHaveAttribute("aria-pressed", "true");
    await expect.poll(() => persistedInterest).toBe(true);
  });

  test("shows tashkeel and numeral preferences only in the Arabic interface", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByRole("switch", { name: "Arabic numerals" })).toHaveCount(0);
    await expect(page.getByRole("switch", { name: "Tashkeel" })).toHaveCount(0);

    await page.goto("/settings?lang=ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("switch", { name: "الأرقام العربية" })).toBeVisible();
    await expect(page.getByRole("switch", { name: "التشكيل" })).toBeVisible();
  });

  test("persists an editable learning goal from the Learning preferences settings", async ({ page }) => {
    let persistedGoal = false;
    await page.route(/\/api\/trpc\/profile\.update/, route => {
      persistedGoal = route.request().postData()?.includes("exam") ?? false;
      return route.fulfill({ contentType: "application/json", body: JSON.stringify([{ result: { data: { json: {} } } }]) });
    });
    await page.goto("/settings");
    const goals = page.getByRole("group", { name: "Current learning goals" });
    const examGoal = goals.getByRole("button", { name: "Prepare for exams" });
    await expect(examGoal).toHaveAttribute("aria-pressed", "false");
    await examGoal.click();
    await expect(examGoal).toHaveAttribute("aria-pressed", "true");
    await expect.poll(() => persistedGoal).toBe(true);
  });

  test("shows the preference-weighted recommendation reason beside the primary learning action", async ({ page }) => {
    await page.route(/\/api\/trpc\/progress\.learnerSummary/, route => route.fulfill({
      contentType: "application/json",
      body: JSON.stringify([{ result: { data: { json: {
        stats: { masteredConcepts: 1, inProgressLessons: 0, completedLessons: 0, totalLessons: 3 },
        continueLesson: { lessonId: 71, titleEn: "Algebra foundations", titleAr: "أساسيات الجبر", topicEn: "Algebra", topicAr: "الجبر", subjectEn: "Mathematics", subjectAr: "الرياضيات", status: "not_started", updatedAt: new Date().toISOString() },
        recommendationSource: "priority_subject",
        recentLessons: [],
        weakAreas: [],
      } } } }]),
    }));
    await page.goto("/dashboard");
    await expect(page.getByRole("button", { name: /continue algebra foundations/i })).toBeVisible();
    await expect(page.getByText("Recommended from the subjects you chose to prioritise.")).toBeVisible();
  });

  test("presents the new learning-goals step in Arabic after the learner selects Arabic", async ({ page }) => {
    await page.goto("/onboarding");
    await page.getByRole("radio", { name: /no specific need/i }).click();
    await page.getByRole("button", { name: "Go to next step" }).click();
    await page.getByRole("radio", { name: "Arabic: All content in Arabic" }).click();
    await page.getByRole("button", { name: /الانتقال للخطوة التالية/ }).click();
    await page.getByRole("button", { name: /الانتقال للخطوة التالية/ }).click();
    await page.getByRole("button", { name: /الانتقال للخطوة التالية/ }).click();
    await expect(page.getByRole("heading", { name: "ما الذي تعمل من أجله الآن؟" })).toBeVisible();
    await expect(page.getByRole("group", { name: "أهداف التعلّم" })).toBeVisible();
  });

  test("shows only live usable subjects in Arabic onboarding and never invents Arabic as a subject", async ({ page }) => {
    await page.goto("/onboarding");
    await page.getByRole("radio", { name: /no specific need/i }).click();
    await page.getByRole("button", { name: "Go to next step" }).click();
    await page.getByRole("radio", { name: "Arabic: All content in Arabic" }).click();
    await page.getByRole("button", { name: /الانتقال للخطوة التالية/ }).click();
    const subjects = page.getByRole("group", { name: "اهتمامات المواد" });
    await expect(subjects.getByRole("button", { name: "الرياضيات" })).toBeVisible();
    await expect(subjects.getByRole("button", { name: "اللغة الإنجليزية" })).toBeVisible();
    await expect(subjects.getByRole("button", { name: "العلوم (مزدوج)" })).toBeVisible();
    await expect(subjects.getByRole("button", { name: /^العربية$/ })).toHaveCount(0);
  });

  test("executes a recognized live subject voice command and confirms the action visibly", async ({ page }) => {
    await page.addInitScript(() => {
      class VoiceRecognition {
        lang = ""; continuous = false; interimResults = false; maxAlternatives = 1;
        onstart?: () => void; onresult?: (event: any) => void; onerror?: () => void; onend?: () => void;
        start() { (window as any).__hikmaRecognition = this; this.onstart?.(); }
        stop() { this.onend?.(); }
        abort() {}
        emit(transcript: string) { this.onresult?.({ resultIndex: 0, results: [{ isFinal: true, 0: { transcript } }] }); }
      }
      Object.defineProperty(window, "SpeechRecognition", { configurable: true, value: VoiceRecognition });
      Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia: async () => ({ getTracks: () => [{ stop: () => {} }] }) } });
    });
    await page.route("**/api/trpc/**", async route => {
      const procedureNames = new URL(route.request().url()).pathname.split("/").at(-1)?.split(",") ?? [];
      if (!procedureNames.includes("curriculum.availableSubjects")) return route.fallback();
      const body = procedureNames.map(name => ({ result: { data: { json:
        name === "auth.me" ? mockUser
          : name === "curriculum.availableSubjects" ? usableSubjects
            : name === "progress.learnerSummary" ? { stats: { masteredConcepts: 0, inProgressLessons: 0, completedLessons: 0, totalLessons: 0 }, continueLesson: null, recentLessons: [], weakAreas: [] }
              : name === "curriculum.list" ? []
                : null,
      } } }));
      await route.fulfill({ contentType: "application/json", body: JSON.stringify(body) });
    });
    const availableSubjectsResponse = page.waitForResponse(response => response.url().includes("curriculum.availableSubjects"));
    await page.goto("/dashboard");
    await availableSubjectsResponse;
    const speak = page.getByRole("button", { name: "Speak a command" });
    await expect(speak).toBeEnabled();
    await speak.click();
    await expect(page.getByText("Listening…", { exact: true })).toBeVisible();
    await page.evaluate(() => (window as any).__hikmaRecognition.emit("Open mathematics"));
    await expect(page.getByText("Opening Mathematics", { exact: true })).toBeVisible();
  });

  test("reports an unsupported spoken feature and preserves a typed fallback", async ({ page }) => {
    await page.addInitScript(() => {
      class VoiceRecognition {
        onstart?: () => void; onresult?: (event: any) => void; onend?: () => void;
        start() { (window as any).__hikmaRecognition = this; this.onstart?.(); }
        stop() { this.onend?.(); } abort() {}
        emit(transcript: string) { this.onresult?.({ resultIndex: 0, results: [{ isFinal: true, 0: { transcript } }] }); }
      }
      Object.defineProperty(window, "SpeechRecognition", { configurable: true, value: VoiceRecognition });
      Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia: async () => ({ getTracks: () => [{ stop: () => {} }] }) } });
    });
    await page.goto("/dashboard");
    await page.getByRole("button", { name: "Speak a command" }).click();
    await page.evaluate(() => (window as any).__hikmaRecognition.emit("Open Arabic"));
    await expect(page.getByText("That feature is not available", { exact: false })).toBeVisible();
    await expect(page.getByRole("button", { name: "Type instead" })).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("explains denied microphone permission and keeps the typed fallback available", async ({ page }) => {
    await page.addInitScript(() => {
      class VoiceRecognition { start() {} stop() {} abort() {} }
      Object.defineProperty(window, "SpeechRecognition", { configurable: true, value: VoiceRecognition });
      Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia: async () => { throw Object.assign(new Error("Denied"), { name: "NotAllowedError" }); } } });
    });
    await page.goto("/dashboard");
    await page.getByRole("button", { name: "Speak a command" }).click();
    await expect(page.getByText("Microphone access was denied", { exact: false })).toBeVisible();
    await expect(page.getByRole("button", { name: "Type instead" })).toBeVisible();
  });

  test("renders every command route once without duplicate-key console errors", async ({ page }, testInfo) => {
    const duplicateKeyErrors: string[] = [];
    page.on("console", message => {
      if (message.type() === "error" && /same key|duplicate.*key/i.test(message.text())) {
        duplicateKeyErrors.push(message.text());
      }
    });

    await page.goto("/dashboard");
    if (testInfo.project.name === "mobile") {
      await page.getByRole("button", { name: "More" }).click();
      await page.getByRole("button", { name: "Search" }).click();
    } else {
      await page.getByRole("button", { name: /open command palette/i }).click();
    }
    const palette = page.getByRole("dialog");
    await expect(palette.getByPlaceholder(/search lessons, topics, or subjects/i)).toBeVisible();
    await expect(palette.getByText("ECC", { exact: true })).toHaveCount(1);
    await expect(palette.getByText("Practice", { exact: true })).toHaveCount(1);
    await expect.poll(() => duplicateKeyErrors).toEqual([]);
  });

  test("discovers matching learning content from the shared command search", async ({ page }, testInfo) => {
    await page.route(/\/api\/trpc\/curriculum\.search/, route => route.fulfill({
      contentType: "application/json",
      body: JSON.stringify([{ result: { data: { json: [{ id: 17, type: "lesson", titleEn: "Energy transfer", titleAr: "انتقال الطاقة", contextEn: "Physics", contextAr: "الفيزياء", href: "/lesson/17" }] } } }]),
    }));
    await page.goto("/dashboard");
    if (testInfo.project.name === "mobile") {
      await page.getByRole("button", { name: "More" }).click();
      await page.getByRole("button", { name: "Search" }).click();
    } else {
      await page.getByRole("button", { name: /open command palette/i }).click();
    }
    const palette = page.getByRole("dialog");
    const search = palette.getByPlaceholder(/search lessons, topics, or subjects/i);
    await search.fill("energy");
    await expect(palette.getByText("Energy transfer", { exact: true })).toBeVisible();
    await expect(palette.getByText("Physics", { exact: true })).toBeVisible();
  });

  test("renders the reported ECC area route without duplicate navigation keys", async ({ page }) => {
    const duplicateKeyErrors: string[] = [];
    page.on("console", message => {
      if (message.type() === "error" && /same key|duplicate.*key/i.test(message.text())) {
        duplicateKeyErrors.push(message.text());
      }
    });
    await page.route(/\/api\/trpc\/ecc\.areas/, route => route.fulfill({
      contentType: "application/json",
      body: JSON.stringify([{ result: { data: { json: [{ id: 1, nameEn: "Independent living", nameAr: "الاستقلالية", descriptionEn: "Daily life skills", descriptionAr: "مهارات الحياة اليومية" }] } } }]),
    }));
    await page.route(/\/api\/trpc\/ecc\.units/, route => route.fulfill({
      contentType: "application/json",
      body: JSON.stringify([{ result: { data: { json: [
        { id: 10, areaId: 1, titleEn: "Plan a journey", titleAr: "خطط لرحلة", descriptionEn: "", descriptionAr: "", lessonId: null, requiresInPersonPractice: false },
        { id: 11, areaId: 1, titleEn: "Choose a route", titleAr: "اختر مسارًا", descriptionEn: "", descriptionAr: "", lessonId: null, requiresInPersonPractice: false },
      ] } } }]),
    }));
    await page.route(/\/api\/trpc\/ecc\.myProgress/, route => route.fulfill({
      contentType: "application/json",
      body: JSON.stringify([{ result: { data: { json: [] } } }]),
    }));

    await page.goto("/ecc/1");
    await expect(page.getByRole("heading", { name: "Independent living" })).toBeVisible();
    const firstTab = page.getByRole("tab", { name: "Plan a journey" });
    const secondTab = page.getByRole("tab", { name: "Choose a route" });
    await expect(firstTab).toBeVisible();
    await firstTab.focus();
    await page.keyboard.press("ArrowRight");
    await expect(secondTab).toBeFocused();
    await expect(secondTab).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("ArrowLeft");
    await expect(firstTab).toBeFocused();
    await expect.poll(() => duplicateKeyErrors).toEqual([]);
  });
});
