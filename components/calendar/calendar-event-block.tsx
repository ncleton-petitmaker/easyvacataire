"use client";

import { CheckCircle2, Shuffle, AlertCircle } from "lucide-react";
import type { CalendarEvent } from "./types";
import { getEventPosition } from "./utils";

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  emerald: { bg: "bg-emerald-50 dark:bg-emerald-900/40", border: "border-emerald-500", text: "text-emerald-800 dark:text-emerald-100", icon: "text-emerald-600" },
  indigo: { bg: "bg-indigo-50 dark:bg-indigo-900/40", border: "border-indigo-500", text: "text-indigo-800 dark:text-indigo-100", icon: "text-indigo-600" },
  amber: { bg: "bg-amber-50 dark:bg-amber-900/40", border: "border-amber-500", text: "text-amber-800 dark:text-amber-100", icon: "text-amber-600" },
  rose: { bg: "bg-rose-100 dark:bg-rose-900/40", border: "border-rose-400", text: "text-rose-900 dark:text-rose-100", icon: "text-rose-600" },
  sky: { bg: "bg-sky-100 dark:bg-sky-900/40", border: "border-sky-400", text: "text-sky-900 dark:text-sky-100", icon: "text-sky-600" },
};

const DEFAULT_COLOR = { bg: "bg-gray-100 dark:bg-gray-800", border: "border-gray-400", text: "text-gray-900 dark:text-gray-100", icon: "text-gray-500" };

const STATUS_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  emerald: CheckCircle2,
  indigo: Shuffle,
  amber: AlertCircle,
};

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
  const Icon = STATUS_ICON[event.color];

  return (
    <div
      className={`absolute z-10 rounded-lg border-l-4 px-2 py-1 text-[11px] leading-tight overflow-hidden shadow-sm ${colors.bg} ${colors.border} ${colors.text} ${onClick ? "cursor-pointer hover:shadow-md hover:brightness-[0.97] transition-all" : ""}`}
      style={{
        top: pos.top,
        height: pos.height,
        ...style,
      }}
      onClick={onClick ? () => onClick(event) : undefined}
      title={event.title}
    >
      <div className="flex items-start gap-1.5">
        {Icon && <Icon className={`size-3.5 shrink-0 mt-px ${colors.icon}`} />}
        <span className="font-semibold line-clamp-2">{event.title}</span>
      </div>
    </div>
  );
}
