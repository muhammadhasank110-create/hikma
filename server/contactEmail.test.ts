import { describe, expect, it } from "vitest";
import { getContactEmailConfig } from "./contactEmail";

describe("contact email configuration", () => {
  it("does not expose or invent an email configuration when credentials are absent", () => {
    const originalKey = process.env.RESEND_API_KEY;
    const originalFrom = process.env.RESEND_FROM_EMAIL;
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM_EMAIL;
    expect(getContactEmailConfig()).toBeNull();
    if (originalKey) process.env.RESEND_API_KEY = originalKey;
    if (originalFrom) process.env.RESEND_FROM_EMAIL = originalFrom;
  });
});
