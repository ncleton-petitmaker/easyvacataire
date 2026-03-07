"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Clock, MapPin, BookOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

type MatchOverlayProps = {
  besoin: {
    date: string;
    heure_debut: string;
    heure_fin: string;
    salle: string | null;
    matiere?: string | null;
    matiereCode?: string | null;
  };
  intervenant: {
    first_name: string;
    last_name: string;
    specialite: string | null;
  };
  onClose: () => void;
};

const PARTICLE_COUNT = 24;

function Particles() {
  const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle = (i / PARTICLE_COUNT) * 360;
    const distance = 80 + Math.random() * 120;
    const tx = Math.cos((angle * Math.PI) / 180) * distance;
    const ty = Math.sin((angle * Math.PI) / 180) * distance;
    const colors = [
      "bg-emerald-400",
      "bg-[#4243C4]",
      "bg-amber-400",
      "bg-rose-400",
      "bg-cyan-400",
      "bg-violet-400",
      "bg-pink-400",
      "bg-lime-400",
    ];
    const size = Math.random() > 0.5 ? "h-2 w-2" : "h-1.5 w-1.5";
    const shape = Math.random() > 0.3 ? "rounded-full" : "rounded-sm rotate-45";
    return (
      <span
        key={i}
        className={`absolute ${size} ${shape} ${colors[i % colors.length]} animate-match-particle`}
        style={{
          "--tx": `${tx}px`,
          "--ty": `${ty}px`,
          animationDelay: `${0.5 + Math.random() * 0.4}s`,
          animationDuration: `${0.8 + Math.random() * 0.6}s`,
        } as React.CSSProperties}
      />
    );
  });
  return <>{particles}</>;
}

export function MatchOverlay({ besoin, intervenant, onClose }: MatchOverlayProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 400);
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 400);
  }

  const initials = `${intervenant.first_name[0]}${intervenant.last_name[0]}`;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-400 ${
        visible ? "animate-match-overlay" : "opacity-0"
      }`}
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Content */}
      <div
        className="relative flex flex-col items-center gap-6 px-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Expanding rings */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="absolute -inset-16 rounded-full border-2 border-emerald-400/30 animate-match-ring" />
          <div
            className="absolute -inset-16 rounded-full border-2 border-[#4243C4]/30 animate-match-ring"
            style={{ animationDelay: "0.8s" }}
          />
        </div>

        {/* Particles */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <Particles />
        </div>

        {/* Title */}
        <div className="animate-match-title text-center">
          <div className="flex items-center justify-center gap-3">
            <Sparkles className="size-8 text-amber-400" />
            <h2
              className="text-4xl font-black tracking-wide text-white drop-shadow-lg"
              style={{ textShadow: "0 0 40px rgba(66, 67, 196, 0.6)" }}
            >
              MATCH !
            </h2>
            <Sparkles className="size-8 text-amber-400" />
          </div>
          <p className="mt-2 text-sm text-white/70 font-medium">
            Créneau attribué avec succès
          </p>
        </div>

        {/* Cards */}
        <div className="flex items-center gap-4">
          {/* Besoin card */}
          <div className="animate-match-card-left w-56 rounded-2xl border border-white/10 bg-gradient-to-br from-[#4243C4] to-[#3234A0] p-5 shadow-2xl shadow-[#4243C4]/30">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-white/20">
                <CalendarDays className="size-4 text-white" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-white/60">
                Besoin
              </span>
            </div>
            {besoin.matiere && (
              <p className="mb-2 flex items-center gap-1.5 text-base font-bold text-white">
                <BookOpen className="size-4 shrink-0" />
                {besoin.matiere}
              </p>
            )}
            <p className="flex items-center gap-1.5 text-sm text-white/80">
              <Clock className="size-3.5 shrink-0" />
              {besoin.heure_debut.slice(0, 5)} - {besoin.heure_fin.slice(0, 5)}
            </p>
            <p className="mt-1 text-sm text-white/80">
              {besoin.date}
            </p>
            {besoin.salle && (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-white/60">
                <MapPin className="size-3.5 shrink-0" />
                Salle {besoin.salle}
              </p>
            )}
          </div>

          {/* Heart connector */}
          <div className="relative flex items-center justify-center">
            <div className="animate-match-heart flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/40">
              <svg
                viewBox="0 0 24 24"
                className="size-7 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path
                  d="M20 6L9 17l-5-5"
                  className="[stroke-dasharray:50] animate-[match-checkmark_0.5s_ease-out_1s_forwards]"
                  style={{ strokeDashoffset: 50 }}
                />
              </svg>
            </div>
          </div>

          {/* Intervenant card */}
          <div className="animate-match-card-right w-56 rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500 to-emerald-700 p-5 shadow-2xl shadow-emerald-500/30">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-white/20">
                <span className="text-xs font-bold text-white">{initials}</span>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-white/60">
                Intervenant
              </span>
            </div>
            <p className="text-base font-bold text-white">
              {intervenant.first_name} {intervenant.last_name}
            </p>
            {intervenant.specialite && (
              <p className="mt-2 text-sm text-white/70">
                {intervenant.specialite}
              </p>
            )}
          </div>
        </div>

        {/* Shimmer bar */}
        <div className="mt-2 h-1 w-48 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-full animate-match-shimmer rounded-full" />
        </div>

        {/* Close button */}
        <Button
          onClick={handleClose}
          variant="outline"
          className="mt-2 border-white/20 bg-white/10 text-white hover:bg-white/20 backdrop-blur animate-match-title"
          style={{ animationDelay: "1s" }}
        >
          Continuer
        </Button>
      </div>
    </div>
  );
}
