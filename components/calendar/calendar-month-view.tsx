"use client";

import { format, isSameMonth, isToday, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { getMonthDays, getDayEvents } from "./utils";
import type { CalendarEvent } from "./types";

const COLOR_DOT: Record<string, string> = {
  indigo: "bg-indigo-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  sky: "bg-sky-500",
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
                    {dayEvts.slice(0, 3).map((evt) => (
                      <div
                        key={evt.id}
                        className={`truncate rounded px-1 py-px text-[10px] font-medium cursor-pointer ${
                          COLOR_DOT[evt.color]
                            ? `${COLOR_DOT[evt.color]}/15 text-foreground`
                            : "bg-gray-100 text-gray-700"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick?.(evt);
                        }}
                      >
                        {evt.title}
                      </div>
                    ))}
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
