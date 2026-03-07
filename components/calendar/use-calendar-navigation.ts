"use client";

import { useState, useCallback, useMemo } from "react";
import {
  addDays,
  addWeeks,
  addMonths,
  format,
  startOfWeek,
} from "date-fns";
import { fr } from "date-fns/locale";
import type { ViewMode } from "./types";

export function useCalendarNavigation(defaultView: ViewMode = "week") {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [view, setView] = useState<ViewMode>(defaultView);

  const goNext = useCallback(() => {
    setCurrentDate((d) => {
      if (view === "day") return addDays(d, 1);
      if (view === "week") return addWeeks(d, 1);
      return addMonths(d, 1);
    });
  }, [view]);

  const goPrev = useCallback(() => {
    setCurrentDate((d) => {
      if (view === "day") return addDays(d, -1);
      if (view === "week") return addWeeks(d, -1);
      return addMonths(d, -1);
    });
  }, [view]);

  const goToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const label = useMemo(() => {
    if (view === "day") {
      return format(currentDate, "EEEE d MMMM yyyy", { locale: fr });
    }
    if (view === "week") {
      const monday = startOfWeek(currentDate, { weekStartsOn: 1 });
      return `Semaine du ${format(monday, "d MMMM yyyy", { locale: fr })}`;
    }
    return format(currentDate, "MMMM yyyy", { locale: fr });
  }, [currentDate, view]);

  // Capitaliser la première lettre
  const capitalizedLabel = label.charAt(0).toUpperCase() + label.slice(1);

  return {
    currentDate,
    view,
    setView,
    goNext,
    goPrev,
    goToday,
    label: capitalizedLabel,
  };
}
