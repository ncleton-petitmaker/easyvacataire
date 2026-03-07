import {
  startOfWeek,
  addDays,
  isSameDay,
  startOfMonth,
  endOfMonth,
  getDay,
  addWeeks,
} from "date-fns";
import type { CalendarEvent } from "./types";

/** Retourne un tableau de `count` jours commençant au lundi de la semaine de `date`. */
export function getWeekDays(date: Date, count: number): Date[] {
  const monday = startOfWeek(date, { weekStartsOn: 1 });
  return Array.from({ length: count }, (_, i) => addDays(monday, i));
}

/** Formate une heure : 7 → "7h00", 14 → "14h00" */
export function formatHour(hour: number): string {
  return `${hour}h00`;
}

/** Calcule top/height en pourcentage pour un événement dans la grille horaire. */
export function getEventPosition(
  event: CalendarEvent,
  dayStartHour: number,
  dayEndHour: number,
): { top: string; height: string } {
  const totalMinutes = (dayEndHour - dayStartHour) * 60;

  const startMinutes =
    (event.start.getHours() - dayStartHour) * 60 + event.start.getMinutes();
  const endMinutes =
    (event.end.getHours() - dayStartHour) * 60 + event.end.getMinutes();

  const top = Math.max(0, (startMinutes / totalMinutes) * 100);
  const height = Math.max(0, ((endMinutes - startMinutes) / totalMinutes) * 100);

  return { top: `${top}%`, height: `${height}%` };
}

/** Regroupe les événements qui se chevauchent et calcule width/left pour chacun. */
export function getOverlappingGroups(
  events: CalendarEvent[],
): (CalendarEvent & { colIndex: number; colTotal: number })[] {
  if (events.length === 0) return [];

  const sorted = [...events].sort(
    (a, b) => a.start.getTime() - b.start.getTime(),
  );

  const result: (CalendarEvent & { colIndex: number; colTotal: number })[] = [];
  const groups: CalendarEvent[][] = [];

  let currentGroup: CalendarEvent[] = [sorted[0]];
  let groupEnd = sorted[0].end.getTime();

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].start.getTime() < groupEnd) {
      currentGroup.push(sorted[i]);
      groupEnd = Math.max(groupEnd, sorted[i].end.getTime());
    } else {
      groups.push(currentGroup);
      currentGroup = [sorted[i]];
      groupEnd = sorted[i].end.getTime();
    }
  }
  groups.push(currentGroup);

  for (const group of groups) {
    const colTotal = group.length;
    for (let col = 0; col < group.length; col++) {
      result.push({ ...group[col], colIndex: col, colTotal });
    }
  }

  return result;
}

/** Filtre les événements pour un jour donné. */
export function getDayEvents(
  events: CalendarEvent[],
  date: Date,
): CalendarEvent[] {
  return events.filter((e) => isSameDay(e.start, date));
}

/** Retourne les semaines du mois sous forme de tableau 2D (lignes × 7 colonnes). */
export function getMonthDays(date: Date): Date[][] {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);

  // Lundi = 1, on recule au lundi précédent
  const weekStart = startOfWeek(monthStart, { weekStartsOn: 1 });

  const weeks: Date[][] = [];
  let current = weekStart;

  while (current <= monthEnd || weeks.length < 5) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(addDays(current, d));
    }
    weeks.push(week);
    current = addWeeks(current, 1);
    if (weeks.length >= 6) break;
  }

  return weeks;
}
