"use client";

import type { CalendarEvent } from "./types";
import { getEventPosition } from "./utils";

const COLOR_MAP: Record<string, { bg: string; border: string; text: string }> = {
  indigo: { bg: "bg-indigo-100 dark:bg-indigo-900/40", border: "border-indigo-400 dark:border-indigo-500", text: "text-indigo-900 dark:text-indigo-100" },
  emerald: { bg: "bg-emerald-100 dark:bg-emerald-900/40", border: "border-emerald-400 dark:border-emerald-500", text: "text-emerald-900 dark:text-emerald-100" },
  amber: { bg: "bg-amber-100 dark:bg-amber-900/40", border: "border-amber-400 dark:border-amber-500", text: "text-amber-900 dark:text-amber-100" },
  rose: { bg: "bg-rose-100 dark:bg-rose-900/40", border: "border-rose-400 dark:border-rose-500", text: "text-rose-900 dark:text-rose-100" },
  sky: { bg: "bg-sky-100 dark:bg-sky-900/40", border: "border-sky-400 dark:border-sky-500", text: "text-sky-900 dark:text-sky-100" },
};

const DEFAULT_COLOR = { bg: "bg-gray-100 dark:bg-gray-800", border: "border-gray-400", text: "text-gray-900 dark:text-gray-100" };

export function CalendarEventBlock({
  event,
  dayStartHour,
  dayEndHour,
  onClick,
  style,
}: {
  event: CalendarEvent;
  dayStartHour: number;
  dayEndHour: number;
  onClick?: (event: CalendarEvent) => void;
  style?: React.CSSProperties;
}) {
  const pos = getEventPosition(event, dayStartHour, dayEndHour);
  const colors = COLOR_MAP[event.color] ?? DEFAULT_COLOR;

  return (
    <div
      className={`absolute z-10 rounded-md border-l-[3px] px-1.5 py-0.5 text-[11px] leading-tight overflow-hidden ${colors.bg} ${colors.border} ${colors.text} ${onClick ? "cursor-pointer hover:brightness-95" : ""}`}
      style={{
        top: pos.top,
        height: pos.height,
        ...style,
      }}
      onClick={onClick ? () => onClick(event) : undefined}
      title={event.title}
    >
      <span className="font-medium line-clamp-2">{event.title}</span>
    </div>
  );
}
