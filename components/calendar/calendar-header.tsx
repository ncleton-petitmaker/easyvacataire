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
    <div className="flex flex-wrap items-center gap-2 border-b border-border bg-card px-3 py-2">
      {/* Navigation */}
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" className="size-8" onClick={onPrev}>
          <ChevronLeft className="size-4" />
        </Button>
        <Button variant="outline" size="icon" className="size-8" onClick={onNext}>
          <ChevronRight className="size-4" />
        </Button>
        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onToday}>
          Aujourd&apos;hui
        </Button>
      </div>

      {/* Label */}
      <h2 className="flex-1 text-center text-sm font-semibold text-foreground min-w-0 truncate">
        {label}
      </h2>

      {/* View switcher */}
      <div className="flex rounded-lg border border-border bg-muted/50 overflow-hidden">
        {(["day", "week", "month"] as ViewMode[]).map((v) => (
          <button
            key={v}
            onClick={() => onViewChange(v)}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              view === v
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {VIEW_LABELS[v]}
          </button>
        ))}
      </div>
    </div>
  );
}
