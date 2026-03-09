"use client";

import { useState, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  isSameMonth,
  isSameDay,
  isBefore,
  startOfDay,
  getDay,
} from "date-fns";
import { fr } from "date-fns/locale";
import { CheckCircle2 } from "lucide-react";

export type Slot = {
  id?: string;
  date: string;
  heure_debut: string;
  heure_fin: string;
};

const TIME_OPTIONS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00", "18:30", "19:00",
];

export type BusySlot = { start: string; end: string };

export type ConfirmedSlot = {
  id: string;
  date: string;
  heure_debut: string;
  heure_fin: string;
  session_type: string;
  matiere?: string | null;
  salle?: string | null;
};

export type RecurringRule = {
  day_of_week: number | null;
  heure_debut: string;
  heure_fin: string;
};

type ViewMode = "month" | "week" | "day";

type Props = {
  slots: Slot[];
  busySlots?: BusySlot[];
  confirmedSlots?: ConfirmedSlot[];
  recurringRules?: RecurringRule[];
  bufferMinutes?: number;
  onAddSlot: (slot: Omit<Slot, "id">) => void;
  onRemoveSlot: (slotId: string) => void;
  readOnly?: boolean;
};

function getDayOfWeekMon(date: Date): number {
  const d = getDay(date);
  return d === 0 ? 6 : d - 1;
}

// Convertit "HH:MM" en minutes depuis minuit
function timeToMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// Minutes vers "HH:MM"
function minToTime(mins: number): string {
  const clamped = Math.max(0, Math.min(1439, mins));
  return `${String(Math.floor(clamped / 60)).padStart(2, "0")}:${String(clamped % 60).padStart(2, "0")}`;
}

// Heures affichées dans la grille
const GRID_START = 7; // 07:00
const GRID_END = 20; // 20:00
const GRID_HOURS = Array.from({ length: GRID_END - GRID_START }, (_, i) => GRID_START + i);
const HOUR_HEIGHT = 60; // px par heure
const GRID_HEIGHT = (GRID_END - GRID_START) * HOUR_HEIGHT;

function timeToY(t: string): number {
  const min = timeToMin(t);
  return ((min / 60) - GRID_START) * HOUR_HEIGHT;
}

function timeToYClamped(t: string): number {
  return Math.max(0, Math.min(GRID_HEIGHT, timeToY(t)));
}

export function AvailabilityCalendar({
  slots,
  busySlots = [],
  confirmedSlots = [],
  recurringRules = [],
  bufferMinutes = 0,
  onAddSlot,
  onRemoveSlot,
  readOnly = false,
}: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [heureDebut, setHeureDebut] = useState("09:00");
  const [heureFin, setHeureFin] = useState("12:00");

  const today = startOfDay(new Date());

  // --- Data maps ---
  const slotsByDate = useMemo(() => {
    const map = new Map<string, Slot[]>();
    for (const slot of slots) {
      if (!map.has(slot.date)) map.set(slot.date, []);
      map.get(slot.date)!.push(slot);
    }
    return map;
  }, [slots]);

  const confirmedByDate = useMemo(() => {
    const map = new Map<string, ConfirmedSlot[]>();
    for (const c of confirmedSlots) {
      if (!map.has(c.date)) map.set(c.date, []);
      map.get(c.date)!.push(c);
    }
    return map;
  }, [confirmedSlots]);

  const busyByDate = useMemo(() => {
    const map = new Map<string, BusySlot[]>();
    for (const b of busySlots) {
      const d = b.start.slice(0, 10);
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(b);
    }
    return map;
  }, [busySlots]);

  const getRulesForDay = useMemo(() => {
    return (dayOfWeek: number): RecurringRule[] => {
      return recurringRules.filter(
        (r) =>
          r.day_of_week === null ||
          r.day_of_week === dayOfWeek ||
          (r.day_of_week === -1 && dayOfWeek >= 0 && dayOfWeek <= 4)
      );
    };
  }, [recurringRules]);

  // --- Navigation ---
  function navigatePrev() {
    if (viewMode === "month") setCurrentDate(subMonths(currentDate, 1));
    else if (viewMode === "week") setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subDays(currentDate, 1));
  }
  function navigateNext() {
    if (viewMode === "month") setCurrentDate(addMonths(currentDate, 1));
    else if (viewMode === "week") setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  }
  function navigateToday() {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  }

  function getTitle(): string {
    if (viewMode === "month") return format(currentDate, "MMMM yyyy", { locale: fr });
    if (viewMode === "week") {
      const ws = startOfWeek(currentDate, { weekStartsOn: 1 });
      const we = endOfWeek(currentDate, { weekStartsOn: 1 });
      if (ws.getMonth() === we.getMonth()) {
        return `${format(ws, "d")} — ${format(we, "d MMMM yyyy", { locale: fr })}`;
      }
      return `${format(ws, "d MMM", { locale: fr })} — ${format(we, "d MMM yyyy", { locale: fr })}`;
    }
    return format(currentDate, "EEEE d MMMM yyyy", { locale: fr });
  }

  function handleAddSlot() {
    const panelD = viewMode === "day" ? startOfDay(currentDate) : selectedDate;
    if (!panelD || readOnly) return;
    const dateStr = format(panelD, "yyyy-MM-dd");
    onAddSlot({ date: dateStr, heure_debut: heureDebut, heure_fin: heureFin });
  }

  function selectAndSwitchToDay(day: Date) {
    if (isBefore(day, today)) return;
    setSelectedDate(day);
    setCurrentDate(day);
    setViewMode("day");
  }

  // --- Week days ---
  const weekDays = useMemo(() => {
    const ws = startOfWeek(currentDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: ws, end: addDays(ws, 6) });
  }, [currentDate]);

  // --- Month grid ---
  const monthDays = useMemo(() => {
    const ms = startOfMonth(currentDate);
    const me = endOfMonth(currentDate);
    const cs = startOfWeek(ms, { weekStartsOn: 1 });
    const ce = endOfWeek(me, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: cs, end: ce });
  }, [currentDate]);

  // ============================================
  // RENDER: View mode toggle + navigation header
  // ============================================
  const header = (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-1">
        <button
          onClick={navigatePrev}
          className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={navigateToday}
          className="rounded-lg px-2 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
        >
          Aujourd&apos;hui
        </button>
        <button
          onClick={navigateNext}
          className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <h3 className="ml-2 text-sm font-semibold text-zinc-800 capitalize">{getTitle()}</h3>
      </div>
      <div className="flex rounded-lg border border-zinc-200 bg-zinc-50 p-0.5">
        {(["month", "week", "day"] as ViewMode[]).map((v) => (
          <button
            key={v}
            onClick={() => setViewMode(v)}
            className={`rounded-md px-3 py-1 text-xs font-medium transition ${
              viewMode === v
                ? "bg-white text-zinc-800 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            {v === "month" ? "Mois" : v === "week" ? "Semaine" : "Jour"}
          </button>
        ))}
      </div>
    </div>
  );

  // ============================================
  // RENDER: Day detail panel (sidebar or bottom)
  // ============================================
  function renderDayPanel(panelDate: Date | null) {
    if (!panelDate) {
      return (
        <p className="text-sm text-zinc-400">
          Sélectionnez un jour pour voir ou ajouter des disponibilités.
        </p>
      );
    }
    const dateStr = format(panelDate, "yyyy-MM-dd");
    return (
      <>
        <h3 className="mb-4 text-sm font-semibold text-zinc-800">
          {format(panelDate, "EEEE d MMMM", { locale: fr })}
        </h3>

        {/* Confirmed + buffer */}
        {(confirmedByDate.get(dateStr) || []).map((c) => {
          const bufferStart = bufferMinutes > 0
            ? minToTime(Math.max(0, timeToMin(c.heure_debut) - bufferMinutes))
            : null;
          return (
            <div key={c.id}>
              {bufferStart && (
                <div className="mb-1 flex items-center justify-between rounded-xl border border-dashed border-violet-300 bg-violet-50 p-2">
                  <span className="text-xs text-violet-600">{bufferStart} — {c.heure_debut}</span>
                  <span className="text-[10px] text-violet-400">Temps de route</span>
                </div>
              )}
              <div className="mb-2 flex items-center gap-2 rounded-xl bg-emerald-600 p-3">
                <CheckCircle2 className="size-4 text-white shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white">{c.heure_debut} — {c.heure_fin}</div>
                  <div className="text-xs text-emerald-100 truncate">
                    [{c.session_type || "TD"}] {c.matiere || "Cours"}{c.salle ? ` · ${c.salle}` : ""}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Rules */}
        {getRulesForDay(getDayOfWeekMon(panelDate)).map((rule, i) => (
          <div key={`rule-${i}`} className="mb-2 flex items-center justify-between rounded-xl bg-amber-50 p-3">
            <span className="text-sm font-medium text-amber-800">{rule.heure_debut} — {rule.heure_fin}</span>
            <span className="text-[10px] text-amber-500">Indisponible</span>
          </div>
        ))}

        {/* Busy */}
        {(busyByDate.get(dateStr) || []).map((busy, i) => {
          const startH = new Date(busy.start).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
          const endH = new Date(busy.end).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
          return (
            <div key={`busy-${i}`} className="mb-2 flex items-center justify-between rounded-xl bg-red-50 p-3">
              <span className="text-sm font-medium text-red-800">{startH} — {endH}</span>
              <span className="text-[10px] text-red-500">Google Agenda</span>
            </div>
          );
        })}

        {/* Slots */}
        {(slotsByDate.get(dateStr) || []).map((slot) => (
          <div key={slot.id || `${slot.date}-${slot.heure_debut}`} className="mb-2 flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 p-3">
            <span className="text-sm font-medium text-emerald-600">{slot.heure_debut} — {slot.heure_fin}</span>
            {!readOnly && slot.id && (
              <button onClick={() => onRemoveSlot(slot.id!)} className="text-xs text-red-400 hover:text-red-600">
                Retirer
              </button>
            )}
          </div>
        ))}

        {/* Add form */}
        {!readOnly && (
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs text-zinc-500">De</label>
                <select value={heureDebut} onChange={(e) => setHeureDebut(e.target.value)} className="w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-sm">
                  {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-zinc-500">À</label>
                <select value={heureFin} onChange={(e) => setHeureFin(e.target.value)} className="w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-sm">
                  {TIME_OPTIONS.filter((t) => t > heureDebut).map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <button onClick={handleAddSlot} className="w-full rounded-lg bg-[#4243C4] py-2 text-sm font-medium text-white hover:bg-[#3234A0]">
              Ajouter ce créneau
            </button>
          </div>
        )}
      </>
    );
  }

  // ============================================
  // RENDER: Time grid events for a single day column
  // ============================================
  function renderTimeEvents(day: Date, isCompact = false) {
    const dateStr = format(day, "yyyy-MM-dd");
    const dayConfirmed = confirmedByDate.get(dateStr) || [];
    const daySlots = slotsByDate.get(dateStr) || [];
    const dayBusy = busyByDate.get(dateStr) || [];
    const dayRules = getRulesForDay(getDayOfWeekMon(day));

    // En compact (semaine), on utilise des marges réduites
    const mx = isCompact ? "mx-0.5" : "mx-1";

    return (
      <>
        {/* Recurring rules (amber) */}
        {dayRules.map((rule, i) => {
          const top = timeToYClamped(rule.heure_debut);
          const bottom = timeToYClamped(rule.heure_fin);
          const height = Math.max(bottom - top, 2);
          return (
            <div
              key={`rule-${i}`}
              className={`absolute left-0 right-0 ${mx} rounded bg-amber-100/70 border border-amber-200 pointer-events-none overflow-hidden`}
              style={{ top, height }}
            >
              <div className="px-1 py-0.5 text-[10px] text-amber-700 truncate">
                {rule.heure_debut}–{rule.heure_fin}
              </div>
            </div>
          );
        })}

        {/* Google busy (red) */}
        {dayBusy.map((busy, i) => {
          const startH = new Date(busy.start).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
          const endH = new Date(busy.end).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
          const top = timeToYClamped(startH);
          const bottom = timeToYClamped(endH);
          const height = Math.max(bottom - top, 2);
          return (
            <div
              key={`busy-${i}`}
              className={`absolute left-0 right-0 ${mx} rounded bg-red-100/70 border border-red-200 pointer-events-none overflow-hidden`}
              style={{ top, height }}
            >
              <div className="px-1 py-0.5 text-[10px] text-red-700 truncate">
                {startH}–{endH}
              </div>
            </div>
          );
        })}

        {/* Availability slots (vert clair) */}
        {daySlots.map((slot, i) => {
          const top = timeToYClamped(slot.heure_debut);
          const bottom = timeToYClamped(slot.heure_fin);
          const height = Math.max(bottom - top, 2);
          return (
            <div
              key={`slot-${i}`}
              className={`absolute left-0 right-0 ${mx} rounded bg-emerald-50 border border-emerald-200 pointer-events-none overflow-hidden`}
              style={{ top, height }}
            >
              <div className="px-1 py-0.5 text-[10px] text-emerald-500 truncate">
                {slot.heure_debut}–{slot.heure_fin}
              </div>
            </div>
          );
        })}

        {/* Buffer zones avant créneaux confirmés (temps de route) */}
        {bufferMinutes > 0 && dayConfirmed.map((c, i) => {
          const cStartMin = timeToMin(c.heure_debut);
          const bufferStartMin = cStartMin - bufferMinutes;
          if (bufferStartMin < 0) return null;
          const bufferStart = minToTime(bufferStartMin);
          const top = timeToYClamped(bufferStart);
          const bottom = timeToYClamped(c.heure_debut);
          const height = Math.max(bottom - top, 2);
          return (
            <div
              key={`buffer-${i}`}
              className={`absolute left-0 right-0 ${mx} rounded bg-violet-50 border border-dashed border-violet-300 pointer-events-none overflow-hidden`}
              style={{ top, height }}
            >
              <div className="px-1 py-0.5 text-[10px] text-violet-500 truncate">
                {isCompact ? `${bufferMinutes}min` : `Temps de route (${bufferMinutes} min)`}
              </div>
            </div>
          );
        })}

        {/* Confirmed (vert foncé) */}
        {dayConfirmed.map((c) => {
          const top = timeToYClamped(c.heure_debut);
          const bottom = timeToYClamped(c.heure_fin);
          const height = Math.max(bottom - top, 2);
          return (
            <div
              key={c.id}
              className={`absolute left-0 right-0 ${mx} rounded bg-emerald-600 border-2 border-emerald-700 shadow-sm pointer-events-none overflow-hidden`}
              style={{ top, height }}
            >
              <div className="px-1 py-0.5">
                <div className="text-[10px] font-semibold text-white truncate">
                  {c.heure_debut}–{c.heure_fin}
                </div>
                {!isCompact && (
                  <div className="text-[9px] text-emerald-100 truncate">
                    [{c.session_type}] {c.matiere || "Cours"}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </>
    );
  }

  // ============================================
  // VIEW: MONTH
  // ============================================
  if (viewMode === "month") {
    return (
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            {header}
            <div className="mb-2 grid grid-cols-7 text-center">
              {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
                <div key={d} className="py-1 text-xs font-medium text-zinc-400">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {monthDays.map((day) => {
                const dateStr = format(day, "yyyy-MM-dd");
                const daySlots = slotsByDate.get(dateStr) || [];
                const dayConfirmed = confirmedByDate.get(dateStr) || [];
                const dayBusy = busyByDate.get(dateStr) || [];
                const dayRules = getRulesForDay(getDayOfWeekMon(day));
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isToday = isSameDay(day, today);
                const isPast = isBefore(day, today);
                const hasSlots = daySlots.length > 0;
                const hasConfirmed = dayConfirmed.length > 0;
                const hasBusy = dayBusy.length > 0;
                const hasRules = dayRules.length > 0;

                return (
                  <button
                    key={dateStr}
                    onClick={() => {
                      if (!isPast) {
                        setSelectedDate(day);
                      }
                    }}
                    onDoubleClick={() => selectAndSwitchToDay(day)}
                    disabled={isPast}
                    className={`relative flex h-11 flex-col items-center justify-center rounded-xl text-sm transition ${
                      !isCurrentMonth
                        ? "text-zinc-300"
                        : isPast
                          ? "cursor-not-allowed text-zinc-300"
                          : isSelected
                            ? "bg-[#4243C4] font-semibold text-white shadow-md"
                            : hasConfirmed
                              ? "bg-emerald-600 font-semibold text-white ring-2 ring-emerald-700 hover:bg-emerald-700"
                              : isToday
                                ? "bg-[#4243C4]/10 font-semibold text-[#4243C4]"
                                : hasSlots
                                  ? "bg-emerald-50 font-medium text-emerald-600 hover:bg-emerald-100"
                                  : "text-zinc-700 hover:bg-zinc-100"
                    }`}
                  >
                    {format(day, "d")}
                    <div className="absolute bottom-1 flex gap-0.5">
                      {hasConfirmed && !isSelected && <span className="h-1.5 w-1.5 rounded-full bg-emerald-800" />}
                      {hasSlots && !hasConfirmed && !isSelected && <span className="h-1 w-1 rounded-full bg-emerald-300" />}
                      {hasRules && !isSelected && <span className="h-1 w-1 rounded-full bg-amber-500" />}
                      {hasBusy && !isSelected && <span className="h-1 w-1 rounded-full bg-red-500" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="w-full lg:w-80">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            {renderDayPanel(selectedDate)}
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // VIEW: WEEK
  // ============================================
  if (viewMode === "week") {
    return (
      <div className="flex flex-col gap-6 xl:flex-row">
        <div className="flex-1">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4">
            {header}
            {/* Week grid */}
            <div className="flex">
              {/* Time labels */}
              <div className="w-12 shrink-0 pr-2">
                {GRID_HOURS.map((h) => (
                  <div key={h} style={{ height: HOUR_HEIGHT }} className="relative">
                    <span className="absolute -top-2 right-0 text-[10px] text-zinc-400">
                      {String(h).padStart(2, "0")}:00
                    </span>
                  </div>
                ))}
              </div>
              {/* Day columns */}
              <div className="flex flex-1 divide-x divide-zinc-100">
                {weekDays.map((day) => {
                  const isToday2 = isSameDay(day, today);
                  const isSelected2 = selectedDate && isSameDay(day, selectedDate);
                  return (
                    <div key={format(day, "yyyy-MM-dd")} className="flex-1 min-w-0">
                      {/* Day header */}
                      <button
                        onClick={() => {
                          setSelectedDate(day);
                          setCurrentDate(day);
                        }}
                        onDoubleClick={() => selectAndSwitchToDay(day)}
                        className={`mb-1 w-full rounded-lg py-1 text-center text-xs font-medium transition ${
                          isSelected2
                            ? "bg-[#4243C4] text-white"
                            : isToday2
                              ? "bg-[#4243C4]/10 text-[#4243C4] font-semibold"
                              : "text-zinc-600 hover:bg-zinc-50"
                        }`}
                      >
                        <div>{format(day, "EEE", { locale: fr })}</div>
                        <div className="text-sm">{format(day, "d")}</div>
                      </button>
                      {/* Time grid — clickable background */}
                      <div
                        className="relative cursor-pointer hover:bg-zinc-50/50 transition"
                        style={{ height: GRID_HEIGHT }}
                        onClick={() => {
                          setSelectedDate(day);
                        }}
                        onDoubleClick={() => selectAndSwitchToDay(day)}
                      >
                        {/* Hour lines */}
                        {GRID_HOURS.map((h) => (
                          <div
                            key={h}
                            className="absolute inset-x-0 border-t border-zinc-100 pointer-events-none"
                            style={{ top: (h - GRID_START) * HOUR_HEIGHT }}
                          />
                        ))}
                        {/* Now line */}
                        {isToday2 && (() => {
                          const now = new Date();
                          const nowStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
                          const y = timeToY(nowStr);
                          if (y >= 0 && y <= GRID_HEIGHT) {
                            return <div className="absolute inset-x-0 border-t-2 border-[#4243C4] z-10 pointer-events-none" style={{ top: y }} />;
                          }
                          return null;
                        })()}
                        {/* Events */}
                        {renderTimeEvents(day, true)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        <div className="w-full xl:w-80">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 sticky top-4">
            {renderDayPanel(selectedDate)}
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // VIEW: DAY
  // ============================================
  // Vue jour : selectedDate = currentDate toujours
  const dayDate = startOfDay(currentDate);
  const isToday3 = isSameDay(dayDate, today);
  const panelDate = dayDate;

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="flex-1">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          {header}
          <div className="flex">
            {/* Time labels */}
            <div className="w-14 shrink-0 pr-2">
              {GRID_HOURS.map((h) => (
                <div key={h} style={{ height: HOUR_HEIGHT }} className="relative">
                  <span className="absolute -top-2 right-0 text-xs text-zinc-400">
                    {String(h).padStart(2, "0")}:00
                  </span>
                </div>
              ))}
            </div>
            {/* Single day column */}
            <div className="flex-1 relative" style={{ height: GRID_HEIGHT }}>
              {/* Hour lines */}
              {GRID_HOURS.map((h) => (
                <div
                  key={h}
                  className="absolute inset-x-0 border-t border-zinc-100 pointer-events-none"
                  style={{ top: (h - GRID_START) * HOUR_HEIGHT }}
                />
              ))}
              {/* Now line */}
              {isToday3 && (() => {
                const now = new Date();
                const nowStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
                const y = timeToY(nowStr);
                if (y >= 0 && y <= GRID_HEIGHT) {
                  return (
                    <div className="absolute inset-x-0 z-10 flex items-center pointer-events-none" style={{ top: y }}>
                      <div className="h-2.5 w-2.5 rounded-full bg-[#4243C4] -ml-1" />
                      <div className="flex-1 border-t-2 border-[#4243C4]" />
                    </div>
                  );
                }
                return null;
              })()}
              {/* Events */}
              {renderTimeEvents(dayDate, false)}
            </div>
          </div>
        </div>
      </div>
      <div className="w-full lg:w-80">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 sticky top-4">
          {renderDayPanel(panelDate)}
        </div>
      </div>
    </div>
  );
}
