export function Testimonials() {
  const testimonials = [
    {
      quote:
        "En 15 ans d'interventions en école, je n'ai jamais eu d'outil qui me rappelle mes cours. Là, je reçois un message WhatsApp la veille. C'est tout bête, mais ça change tout.",
      name: "Marie D.",
      role: "Directrice artistique, vacataire UX",
      initials: "MD",
    },
    {
      quote:
        "Avant, je passais 2 jours par semestre à appeler les intervenants un par un pour caler le planning. Maintenant c'est fait en une après-midi.",
      name: "Philippe R.",
      role: "Responsable pédagogique, Université de Lyon",
      initials: "PR",
    },
    {
      quote:
        "Le matching de dispos, c'est génial. Je donne mes créneaux libres, l'école donne ses besoins, et ça se fait tout seul. Plus de mails à rallonge.",
      name: "Thomas B.",
      role: "CTO, vacataire Dev Web",
      initials: "TB",
    },
  ];

  return (
    <section className="bg-zinc-50 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-indigo-600">
            Témoignages
          </p>
          <h2 className="text-3xl font-bold text-zinc-900 md:text-4xl">
            Pensé par des gens
            <br />
            qui connaissent le problème.
          </h2>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="rounded-2xl border border-zinc-200 bg-white p-6"
            >
              {/* Stars */}
              <div className="mb-4 flex gap-1">
                {Array.from({ length: 5 }).map((_, j) => (
                  <svg
                    key={j}
                    className="h-4 w-4 text-amber-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-sm leading-relaxed text-zinc-600">
                &quot;{t.quote}&quot;
              </p>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-800">
                    {t.name}
                  </p>
                  <p className="text-xs text-zinc-500">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
