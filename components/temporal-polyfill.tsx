"use client";

import { Temporal } from "temporal-polyfill";

if (typeof (globalThis as Record<string, unknown>).Temporal === "undefined") {
  (globalThis as Record<string, unknown>).Temporal = Temporal;
}

export default function TemporalPolyfill() {
  return null;
}
