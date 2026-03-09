import { describe, expect, it } from "vitest";
import { appendCronStyleCurrentTimeLine, expandCronEventTextTime } from "./current-time.js";

const FIXED_NOW_MS = new Date("2026-03-10T23:14:30.000Z").getTime(); // 07:14:30 CST

const cfgWithShanghai = {
  agents: { defaults: { userTimezone: "Asia/Shanghai", timeFormat: "12" as const } },
};

const cfgEmpty = {};

describe("expandCronEventTextTime", () => {
  it("returns text unchanged when {time} is absent", () => {
    const text = "⏰ Heartbeat triggered – no timestamp here";
    expect(expandCronEventTextTime(text, cfgEmpty, FIXED_NOW_MS)).toBe(text);
  });

  it("expands {time} with formatted time and timezone", () => {
    const result = expandCronEventTextTime("Triggered at {time}", cfgWithShanghai, FIXED_NOW_MS);
    expect(result).toContain("(Asia/Shanghai)");
    expect(result).not.toContain("{time}");
  });

  it("expands multiple {time} occurrences in the same text", () => {
    const result = expandCronEventTextTime(
      "Start: {time}\nEnd: {time}",
      cfgWithShanghai,
      FIXED_NOW_MS,
    );
    // Both placeholders should be replaced
    expect(result).not.toContain("{time}");
    const count = (result.match(/Asia\/Shanghai/g) ?? []).length;
    expect(count).toBe(2);
  });

  it("falls back gracefully when timezone is invalid", () => {
    const cfg = { agents: { defaults: { userTimezone: "Invalid/Timezone" } } };
    // Should not throw; may fall back to ISO or default timezone
    const result = expandCronEventTextTime("at {time}", cfg, FIXED_NOW_MS);
    expect(result).not.toContain("{time}");
  });

  it("handles empty text without throwing", () => {
    expect(expandCronEventTextTime("", cfgEmpty, FIXED_NOW_MS)).toBe("");
  });
});

describe("appendCronStyleCurrentTimeLine", () => {
  it("appends current time to text", () => {
    const result = appendCronStyleCurrentTimeLine("Do something.", cfgWithShanghai, FIXED_NOW_MS);
    expect(result).toContain("Current time:");
    expect(result).toContain("Asia/Shanghai");
  });

  it("does not double-stamp when text already contains Current time:", () => {
    const existing = "Do something.\nCurrent time: already here";
    expect(appendCronStyleCurrentTimeLine(existing, cfgWithShanghai, FIXED_NOW_MS)).toBe(existing);
  });
});
