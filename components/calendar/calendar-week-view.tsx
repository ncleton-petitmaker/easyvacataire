"use client";

import { getWeekDays } from "./utils";
import { CalendarGrid } from "./calendar-grid";
import type { CalendarEvent } from "./types";

export function CalendarWeekView({
  currentDate,
  events,
  dayStartHour,
  dayEndHour,
  daysInWeek,
  onEventClick,
  onSlotClick,
}: {
  currentDate: Date;
  events: CalendarEvent[];
  dayStartHour: number;
  dayEndHour: number;
  daysInWeek: number;
  onEventClick?: (event: CalendarEvent) => void;
  onSlotClick?: (date: Date, hour: number) => void;
}) {
  const days = getWeekDays(currentDate, daysInWeek);

  return (
    <CalendarGrid
      days={days}
      events={events}
      dayStartHour={dayStartHour}
      dayEndHour={dayEndHour}
      onEventClick={onEventClick}
      onSlotClick={onSlotClick}
    />
  );
}
