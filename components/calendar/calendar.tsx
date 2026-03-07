"use client";

import { useCalendarNavigation } from "./use-calendar-navigation";
import { CalendarHeader } from "./calendar-header";
import { CalendarDayView } from "./calendar-day-view";
import { CalendarWeekView } from "./calendar-week-view";
import { CalendarMonthView } from "./calendar-month-view";
import type { CalendarProps } from "./types";

export function Calendar({
  events,
  defaultView = "week",
  dayStartHour = 7,
  dayEndHour = 21,
  daysInWeek = 6,
  readOnly = false,
  onEventClick,
  onSlotClick,
}: CalendarProps) {
  const nav = useCalendarNavigation(defaultView);

  return (
    <div className="flex flex-col h-full">
      <CalendarHeader
        label={nav.label}
        view={nav.view}
        onPrev={nav.goPrev}
        onNext={nav.goNext}
        onToday={nav.goToday}
        onViewChange={nav.setView}
      />

      <div className="flex-1 overflow-hidden">
        {nav.view === "day" && (
          <CalendarDayView
            currentDate={nav.currentDate}
            events={events}
            dayStartHour={dayStartHour}
            dayEndHour={dayEndHour}
            onEventClick={onEventClick}
            onSlotClick={readOnly ? undefined : onSlotClick}
          />
        )}
        {nav.view === "week" && (
          <CalendarWeekView
            currentDate={nav.currentDate}
            events={events}
            dayStartHour={dayStartHour}
            dayEndHour={dayEndHour}
            daysInWeek={daysInWeek}
            onEventClick={onEventClick}
            onSlotClick={readOnly ? undefined : onSlotClick}
          />
        )}
        {nav.view === "month" && (
          <CalendarMonthView
            currentDate={nav.currentDate}
            events={events}
            onEventClick={onEventClick}
            onSlotClick={readOnly ? undefined : onSlotClick}
          />
        )}
      </div>
    </div>
  );
}
