"use client";

import { format, isSameMonth, isToday, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { CheckCircle2, Shuffle, AlertCircle } from "lucide-react";
import { getMonthDays, getDayEvents } from "./utils";
import type { CalendarEvent } from "./types";

const COLOR_PILL: Record<string, { bg: string; text: string; icon: string }> = {
  emerald: { bg: "bg-emerald-100", text: "text-emerald-800", icon: "text-emerald-600" },
  indigo: { bg: "bg-indigo-100", text: "text-indigo-800", icon: "text-indigo-600" },
  amber: { bg: "bg-amber-100", text: "text-amber-800", icon: "text-amber-600" },
  rose: { bg: "bg-rose-100", text: "text-rose-800", icon: "text-rose-600" },
  sky: { bg: "bg-sky-100", text: "text-sky-800", icon: "text-sky-600" },
};

const STATUS_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  emerald: CheckCircle2,
  indigo: Shuffle,
  amber: AlertCircle,
};

export function CalendarMonthView({
  currentDate,
  events,
  onEventClick,
  onSlotClick,
}: {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onSlotClick?: (date: Date, hour: number) => void;
}) {
  const weeks = getMonthDays(currentDate);
  const dayNames = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  return (
    <div className="flex flex-col h-full">
      {/* En-têtes */}
      <div className="grid grid-cols-7 border-b border-border bg-card">
        {dayNames.map((name) => (
          <div
            key={name}
            className="px-2 py-2 text-center text-xs font-medium text-muted-foreground"
          >
            {name}
          </div>
        ))}
      </div>

      {/* Semaines */}
      <div className="grid flex-1" style={{ gridTemplateRows: `repeat(${weeks.length}, 1fr)` }}>
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b border-border last:border-b-0">
            {week.map((day) => {
              const dayEvts = getDayEvents(events, day);
              const inMonth = isSameMonth(day, currentDate);
              const today = isToday(day);

              return (
                <div
                  key={day.toISOString()}
                  className={`border-r border-border last:border-r-0 p-1 min-h-[4.5rem] cursor-pointer hover:bg-muted/30 ${
                    !inMonth ? "opacity-40" : ""
                  } ${today ? "bg-primary/5" : ""}`}
                  onClick={onSlotClick ? () => onSlotClick(day, 8) : undefined}
                >
                  <span
                    className={`inline-flex items-center justify-center text-xs font-medium ${
                      today
                        ? "bg-primary text-primary-foreground rounded-full size-6"
                        : "text-foreground"
                    }`}
                  >
                    {format(day, "d")}
                  </span>

                  <div className="mt-0.5 space-y-0.5">
                    {dayEvts.slice(0, 3).map((evt) => {
                      const pill = COLOR_PILL[evt.color] ?? { bg: "bg-gray-100", text: "text-gray-700", icon: "text-gray-500" };
                      const Icon = STATUS_ICON[evt.color];
                      return (
                        <div
                          key={evt.id}
                          className={`flex items-center gap-1 truncate rounded-md px-1 py-px text-[10px] font-semibold cursor-pointer ${pill.bg} ${pill.text}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventClick?.(evt);
                          }}
                        >
                          {Icon && <Icon className={`size-2.5 shrink-0 ${pill.icon}`} />}
                          <span className="truncate">{evt.title}</span>
                        </div>
                      );
                    })}
                    {dayEvts.length > 3 && (
                      <span className="text-[10px] text-muted-foreground pl-1">
                        +{dayEvts.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
