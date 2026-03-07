"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ViewMode } from "./types";

const VIEW_LABELS: Record<ViewMode, string> = {
  day: "Jour",
  week: "Semaine",
  month: "Mois",
};

export function CalendarHeader({
  label,
  view,
  onPrev,
  onNext,
  onToday,
  onViewChange,
}: {
  label: string;
  view: ViewMode;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onViewChange: (v: ViewMode) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border bg-card px-4 py-2">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" className="size-8" onClick={onPrev}>
          <ChevronLeft className="size-4" />
        </Button>
        <Button variant="outline" size="icon" className="size-8" onClick={onNext}>
          <ChevronRight className="size-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={onToday}>
          Aujourd&apos;hui
        </Button>
      </div>

      <h2 className="text-sm font-semibold text-foreground">{label}</h2>

      <div className="flex rounded-md border border-border bg-muted/50">
        {(["day", "week", "month"] as ViewMode[]).map((v) => (
          <button
            key={v}
            onClick={() => onViewChange(v)}
            className={`px-3 py-1 text-xs font-medium transition-colors ${
              view === v
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            } ${v === "day" ? "rounded-l-md" : v === "month" ? "rounded-r-md" : ""}`}
          >
            {VIEW_LABELS[v]}
          </button>
        ))}
      </div>
    </div>
  );
}
