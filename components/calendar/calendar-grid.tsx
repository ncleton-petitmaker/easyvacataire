"use client";

import { format, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import { formatHour, getDayEvents, getOverlappingGroups } from "./utils";
import { CalendarEventBlock } from "./calendar-event-block";
import type { CalendarEvent } from "./types";

const HOUR_HEIGHT = 64; // 4rem

export function CalendarGrid({
  days,
  events,
  dayStartHour,
  dayEndHour,
  onEventClick,
  onSlotClick,
}: {
  days: Date[];
  events: CalendarEvent[];
  dayStartHour: number;
  dayEndHour: number;
  onEventClick?: (event: CalendarEvent) => void;
  onSlotClick?: (date: Date, hour: number) => void;
}) {
  const hours = Array.from(
    { length: dayEndHour - dayStartHour },
    (_, i) => dayStartHour + i,
  );

  const totalHeight = hours.length * HOUR_HEIGHT;

  return (
    <div className="flex flex-col overflow-auto h-full">
      {/* En-têtes des jours */}
      <div
        className="grid sticky top-0 z-10 bg-card border-b border-border"
        style={{
          gridTemplateColumns: `4rem repeat(${days.length}, 1fr)`,
        }}
      >
        <div className="border-r border-border" />
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className={`border-r border-border px-2 py-2 text-center ${
              isToday(day) ? "bg-primary/5" : ""
            }`}
          >
            <div className="text-xs text-muted-foreground capitalize">
              {format(day, "EEE", { locale: fr })}
            </div>
            <div
              className={`text-lg font-semibold ${
                isToday(day)
                  ? "text-primary"
                  : "text-foreground"
              }`}
            >
              {format(day, "d")}
            </div>
          </div>
        ))}
      </div>

      {/* Grille horaire */}
      <div
        className="grid flex-1"
        style={{
          gridTemplateColumns: `4rem repeat(${days.length}, 1fr)`,
        }}
      >
        {/* Colonne des heures + colonnes des jours */}
        <div className="relative border-r border-border" style={{ height: totalHeight }}>
          {hours.map((h) => (
            <div
              key={h}
              className="absolute right-2 -translate-y-1/2 text-[11px] text-muted-foreground"
              style={{ top: (h - dayStartHour) * HOUR_HEIGHT }}
            >
              {formatHour(h)}
            </div>
          ))}
        </div>

        {days.map((day) => {
          const dayEvts = getDayEvents(events, day);
          const positioned = getOverlappingGroups(dayEvts);

          return (
            <div
              key={day.toISOString()}
              className={`relative border-r border-border ${
                isToday(day) ? "bg-primary/[0.02]" : ""
              }`}
              style={{ height: totalHeight }}
            >
              {/* Lignes horizontales */}
              {hours.map((h) => (
                <div
                  key={h}
                  className="absolute inset-x-0 z-0 border-t border-border/50 cursor-pointer hover:bg-muted/30"
                  style={{
                    top: (h - dayStartHour) * HOUR_HEIGHT,
                    height: HOUR_HEIGHT,
                  }}
                  onClick={
                    onSlotClick
                      ? () => onSlotClick(day, h)
                      : undefined
                  }
                />
              ))}

              {/* Événements */}
              {positioned.map((evt) => (
                <CalendarEventBlock
                  key={evt.id}
                  event={evt}
                  dayStartHour={dayStartHour}
                  dayEndHour={dayEndHour}
                  onClick={onEventClick}
                  style={{
                    left: `${(evt.colIndex / evt.colTotal) * 100}%`,
                    width: `${(1 / evt.colTotal) * 100 - 2}%`,
                  }}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
