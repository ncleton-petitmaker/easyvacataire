export function Hero() {
  return (
    <section className="relative pt-32 pb-20 md:pt-44 md:pb-32">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 right-0 h-[500px] w-[500px] rounded-full bg-indigo-100 opacity-40 blur-3xl" />
        <div className="absolute -bottom-20 left-0 h-[400px] w-[400px] rounded-full bg-amber-100 opacity-30 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          {/* Headline */}
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-zinc-900 md:text-6xl md:leading-[1.1]">
            Les pros ont l&apos;expertise.
            <br />
            <span className="bg-gradient-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent">
              Vos étudiants en ont besoin.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-zinc-600 md:text-xl">
            EasyVacataire synchronise les disponibilités des professionnels avec
            les besoins de votre établissement.{" "}
            <span className="font-medium text-zinc-800">
              Fini les créneaux oubliés et les salles qui changent sans prévenir.
            </span>
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href="https://github.com/ncleton-petitmaker/easyvacataire"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 rounded-full bg-zinc-900 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-zinc-900/25 transition hover:bg-zinc-800 hover:shadow-xl hover:shadow-zinc-900/30"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              Voir sur GitHub
            </a>
          </div>

          {/* Social proof mini */}
          <p className="mt-12 text-sm text-zinc-400">
            Un outil pensé pour donner envie aux pros de partager leur expérience facilement
          </p>
        </div>

        {/* Hero visual — Floating cards */}
        <div className="relative mx-auto mt-16 max-w-2xl">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl shadow-zinc-200/50">
            {/* Mock calendar header */}
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-zinc-700">
                Mars 2026
              </span>
              <div className="flex gap-1">
                <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700">
                  3 matchs trouvés
                </span>
              </div>
            </div>
            {/* Mock calendar grid */}
            <div className="grid grid-cols-5 gap-2">
              {["Lun", "Mar", "Mer", "Jeu", "Ven"].map((d) => (
                <div
                  key={d}
                  className="py-1 text-center text-xs font-medium text-zinc-400"
                >
                  {d}
                </div>
              ))}
              {Array.from({ length: 20 }, (_, i) => i + 1).map((day) => {
                const isMatch = [3, 11, 18].includes(day);
                const hasBesoin = [3, 5, 11, 14, 18, 20].includes(day);
                const hasDispo = [2, 3, 9, 10, 11, 17, 18, 19].includes(day);

                return (
                  <div
                    key={day}
                    className={`relative flex h-10 items-center justify-center rounded-lg text-sm transition ${
                      isMatch
                        ? "bg-emerald-100 font-semibold text-emerald-800 ring-2 ring-emerald-400"
                        : hasBesoin && hasDispo
                          ? "bg-indigo-50 text-indigo-700"
                          : hasBesoin
                            ? "bg-amber-50 text-amber-700"
                            : hasDispo
                              ? "bg-blue-50 text-blue-600"
                              : "text-zinc-600 hover:bg-zinc-50"
                    }`}
                  >
                    {day}
                    {isMatch && (
                      <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    )}
                  </div>
                );
              })}
            </div>
            {/* Legend */}
            <div className="mt-4 flex items-center justify-center gap-6 text-xs text-zinc-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-amber-200" />
                Besoins
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-blue-200" />
                Disponibilités
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-emerald-400" />
                Match
              </span>
            </div>
          </div>

          {/* Floating notification card */}
          <div className="animate-float absolute -right-4 top-8 rounded-xl border border-zinc-200 bg-white p-3 shadow-lg md:-right-12">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                <svg
                  className="h-4 w-4 text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-800">
                  Match confirmé
                </p>
                <p className="text-[10px] text-zinc-500">
                  Mar. 11 mars — 14h-16h
                </p>
              </div>
            </div>
          </div>

          {/* Floating WhatsApp card */}
          <div
            className="animate-float absolute -left-4 bottom-12 rounded-xl border border-zinc-200 bg-white p-3 shadow-lg md:-left-16"
            style={{ animationDelay: "2s" }}
          >
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                <svg
                  className="h-4 w-4 text-green-600"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-800">
                  Rappel envoyé
                </p>
                <p className="text-[10px] text-zinc-500">
                  &quot;Demain cours UX, salle B204&quot;
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
