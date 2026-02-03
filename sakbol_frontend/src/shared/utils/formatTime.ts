import type { TimeInputValue } from "@heroui/react";

export function formatTime(value: TimeInputValue) {
  if (!value) return "";
  const h = String(value.hour).padStart(2, "0");
  const m = String(value.minute).padStart(2, "0");
  return `${h}:${m}`;
}