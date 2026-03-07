export type ViewMode = "day" | "week" | "month";

export type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color: string;
  metadata?: Record<string, unknown>;
};

export type CalendarProps = {
  events: CalendarEvent[];
  defaultView?: ViewMode;
  dayStartHour?: number;
  dayEndHour?: number;
  daysInWeek?: number;
  readOnly?: boolean;
  onEventClick?: (event: CalendarEvent) => void;
  onSlotClick?: (date: Date, hour: number) => void;
};
