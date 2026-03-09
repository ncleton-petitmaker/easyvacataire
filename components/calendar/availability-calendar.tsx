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
  day_of_week: number;
  heure_debut: string;
  heure_fin: string;
};

type Props = {
  slots: Slot[];
  busySlots?: BusySlot[];
  confirmedSlots?: ConfirmedSlot[];
  recurringRules?: RecurringRule[];
  onAddSlot: (slot: Omit<Slot, "id">) => void;
  onRemoveSlot: (slotId: string) => void;
  readOnly?: boolean;
};

function getDayOfWeekMon(date: Date): number {
  const d = getDay(date);
  return d === 0 ? 6 : d - 1;
}

export function AvailabilityCalendar({
  slots,
  busySlots = [],
  confirmedSlots = [],
  recurringRules = [],
  onAddSlot,
  onRemoveSlot,
  readOnly = false,
}: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [heureDebut, setHeureDebut] = useState("09:00");
  const [heureFin, setHeureFin] = useState("12:00");

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

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

  const rulesByDay = useMemo(() => {
    const map = new Map<number, RecurringRule[]>();
    for (const r of recurringRules) {
      if (!map.has(r.day_of_week)) map.set(r.day_of_week, []);
      map.get(r.day_of_week)!.push(r);
    }
    return map;
  }, [recurringRules]);

  function handleAddSlot() {
    if (!selectedDate || readOnly) return;
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    onAddSlot({ date: dateStr, heure_debut: heureDebut, heure_fin: heureFin });
  }

  const today = startOfDay(new Date());

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Calendar grid */}
      <div className="flex-1">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          {/* Month navigation */}
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h3 className="text-sm font-semibold text-zinc-800">
              {format(currentMonth, "MMMM yyyy", { locale: fr })}
            </h3>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Day headers */}
          <div className="mb-2 grid grid-cols-7 text-center">
            {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
              <div key={d} className="py-1 text-xs font-medium text-zinc-400">
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const daySlots = slotsByDate.get(dateStr) || [];
              const dayConfirmed = confirmedByDate.get(dateStr) || [];
              const dayBusy = busyByDate.get(dateStr) || [];
              const dayRules = rulesByDay.get(getDayOfWeekMon(day)) || [];
              const isCurrentMonth = isSameMonth(day, currentMonth);
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
                  onClick={() => !isPast && setSelectedDate(day)}
                  disabled={isPast}
                  className={`relative flex h-11 flex-col items-center justify-center rounded-xl text-sm transition ${
                    !isCurrentMonth
                      ? "text-zinc-300"
                      : isPast
                        ? "cursor-not-allowed text-zinc-300"
                        : isSelected
                          ? "bg-[#4243C4] font-semibold text-white shadow-md"
                          : hasConfirmed
                            ? "bg-emerald-100 font-semibold text-emerald-800 ring-2 ring-emerald-400 hover:bg-emerald-200"
                            : isToday
                              ? "bg-[#4243C4]/10 font-semibold text-[#4243C4]"
                              : hasSlots
                                ? "bg-emerald-50 font-medium text-emerald-700 hover:bg-emerald-100"
                                : "text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  {format(day, "d")}
                  <div className="absolute bottom-1 flex gap-0.5">
                    {hasConfirmed && !isSelected && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    )}
                    {hasSlots && !hasConfirmed && !isSelected && (
                      <span className="h-1 w-1 rounded-full bg-emerald-500" />
                    )}
                    {hasRules && !isSelected && (
                      <span className="h-1 w-1 rounded-full bg-amber-500" />
                    )}
                    {hasBusy && !isSelected && (
                      <span className="h-1 w-1 rounded-full bg-red-500" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Slot panel */}
      <div className="w-full lg:w-80">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          {selectedDate ? (
            <>
              <h3 className="mb-4 text-sm font-semibold text-zinc-800">
                {format(selectedDate, "EEEE d MMMM", { locale: fr })}
              </h3>

              {/* Confirmed creneaux (matchs) */}
              {(confirmedByDate.get(format(selectedDate, "yyyy-MM-dd")) || []).map(
                (c) => (
                  <div
                    key={c.id}
                    className="mb-2 flex items-center gap-2 rounded-xl border-2 border-emerald-400 bg-emerald-50 p-3"
                  >
                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-emerald-800">
                        {c.heure_debut} — {c.heure_fin}
                      </div>
                      <div className="text-xs text-emerald-600 truncate">
                        [{c.session_type || "TD"}] {c.matiere || "Cours"}
                        {c.salle ? ` · ${c.salle}` : ""}
                      </div>
                    </div>
                  </div>
                )
              )}

              {/* Recurring unavailability for this day */}
              {(rulesByDay.get(getDayOfWeekMon(selectedDate)) || []).map(
                (rule, i) => (
                  <div
                    key={`rule-${i}`}
                    className="mb-2 flex items-center justify-between rounded-xl bg-amber-50 p-3"
                  >
                    <span className="text-sm font-medium text-amber-800">
                      {rule.heure_debut} — {rule.heure_fin}
                    </span>
                    <span className="text-[10px] text-amber-500">Indisponible</span>
                  </div>
                )
              )}

              {/* Google Calendar busy slots */}
              {(busyByDate.get(format(selectedDate, "yyyy-MM-dd")) || []).map(
                (busy, i) => {
                  const startH = new Date(busy.start).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
                  const endH = new Date(busy.end).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
                  return (
                    <div
                      key={`busy-${i}`}
                      className="mb-2 flex items-center justify-between rounded-xl bg-red-50 p-3"
                    >
                      <span className="text-sm font-medium text-red-800">
                        {startH} — {endH}
                      </span>
                      <span className="text-[10px] text-red-500">Google Agenda</span>
                    </div>
                  );
                }
              )}

              {/* Existing availability slots */}
              {(slotsByDate.get(format(selectedDate, "yyyy-MM-dd")) || []).map(
                (slot) => (
                  <div
                    key={slot.id || `${slot.date}-${slot.heure_debut}`}
                    className="mb-2 flex items-center justify-between rounded-xl bg-emerald-50 p-3"
                  >
                    <span className="text-sm font-medium text-emerald-800">
                      {slot.heure_debut} — {slot.heure_fin}
                    </span>
                    {!readOnly && slot.id && (
                      <button
                        onClick={() => onRemoveSlot(slot.id!)}
                        className="text-xs text-red-400 hover:text-red-600"
                      >
                        Retirer
                      </button>
                    )}
                  </div>
                )
              )}

              {/* Add slot form */}
              {!readOnly && (
                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="mb-1 block text-xs text-zinc-500">
                        De
                      </label>
                      <select
                        value={heureDebut}
                        onChange={(e) => setHeureDebut(e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-sm"
                      >
                        {TIME_OPTIONS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-zinc-500">
                        À
                      </label>
                      <select
                        value={heureFin}
                        onChange={(e) => setHeureFin(e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-sm"
                      >
                        {TIME_OPTIONS.filter((t) => t > heureDebut).map(
                          (t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={handleAddSlot}
                    className="w-full rounded-lg bg-[#4243C4] py-2 text-sm font-medium text-white hover:bg-[#3234A0]"
                  >
                    Ajouter ce créneau
                  </button>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-zinc-400">
              Sélectionnez un jour pour voir ou ajouter des disponibilités.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
