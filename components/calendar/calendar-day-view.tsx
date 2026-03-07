"use client";

import { CalendarGrid } from "./calendar-grid";
import type { CalendarEvent } from "./types";

export function CalendarDayView({
  currentDate,
  events,
  dayStartHour,
  dayEndHour,
  onEventClick,
  onSlotClick,
}: {
  currentDate: Date;
  events: CalendarEvent[];
  dayStartHour: number;
  dayEndHour: number;
  onEventClick?: (event: CalendarEvent) => void;
  onSlotClick?: (date: Date, hour: number) => void;
}) {
  return (
    <CalendarGrid
      days={[currentDate]}
      events={events}
      dayStartHour={dayStartHour}
      dayEndHour={dayEndHour}
      onEventClick={onEventClick}
      onSlotClick={onSlotClick}
    />
  );
}
