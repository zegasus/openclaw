import {
  type TimeFormatPreference,
  formatUserTime,
  resolveUserTimeFormat,
  resolveUserTimezone,
} from "./date-time.js";

export type CronStyleNow = {
  userTimezone: string;
  formattedTime: string;
  timeLine: string;
};

type TimeConfigLike = {
  agents?: {
    defaults?: {
      userTimezone?: string;
      timeFormat?: TimeFormatPreference;
    };
  };
};

export function resolveCronStyleNow(cfg: TimeConfigLike, nowMs: number): CronStyleNow {
  const userTimezone = resolveUserTimezone(cfg.agents?.defaults?.userTimezone);
  const userTimeFormat = resolveUserTimeFormat(cfg.agents?.defaults?.timeFormat);
  const formattedTime =
    formatUserTime(new Date(nowMs), userTimezone, userTimeFormat) ?? new Date(nowMs).toISOString();
  const utcTime = new Date(nowMs).toISOString().replace("T", " ").slice(0, 16) + " UTC";
  const timeLine = `Current time: ${formattedTime} (${userTimezone}) / ${utcTime}`;
  return { userTimezone, formattedTime, timeLine };
}

export function appendCronStyleCurrentTimeLine(text: string, cfg: TimeConfigLike, nowMs: number) {
  const base = text.trimEnd();
  if (!base || base.includes("Current time:")) {
    return base;
  }
  const { timeLine } = resolveCronStyleNow(cfg, nowMs);
  return `${base}\n${timeLine}`;
}

/**
 * Expand `{time}` template variables in cron systemEvent text with the current
 * formatted time and timezone (e.g. "Monday, March 10th, 2026 — 7:14 AM (Asia/Shanghai)").
 *
 * This lets cron reminder text include the trigger timestamp without relying on
 * the model to infer it from context.  A job whose text is
 * "⏰ Reminder triggered at {time}" will fire with the time injected.
 */
export function expandCronEventTextTime(text: string, cfg: TimeConfigLike, nowMs: number): string {
  if (!text.includes("{time}")) {
    return text;
  }
  const { formattedTime, userTimezone } = resolveCronStyleNow(cfg, nowMs);
  const timeWithTz = `${formattedTime} (${userTimezone})`;
  return text.replace(/\{time\}/g, timeWithTz);
}
