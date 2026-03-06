export function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Ajoutez vos vacataires",
      description:
        "Importez votre liste ou ajoutez-les un par un. Ils reçoivent un message WhatsApp d'accueil.",
      visual: (
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="space-y-2">
            {[
              { name: "Marie D.", spec: "UX Design" },
              { name: "Thomas R.", spec: "Dev Web" },
              { name: "Sophie L.", spec: "Marketing" },
            ].map((p) => (
              <div
                key={p.name}
                className="flex items-center gap-3 rounded-lg bg-zinc-50 p-2"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                  {p.name[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-800">
                    {p.name}
                  </p>
                  <p className="text-[10px] text-zinc-500">{p.spec}</p>
                </div>
                <span className="ml-auto rounded-full bg-green-100 px-2 py-0.5 text-[10px] text-green-700">
                  actif
                </span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      number: "02",
      title: "Renseignez vos besoins",
      description:
        "Saisie manuelle ou import CSV. Dates, horaires, matières, salles — tout est centralisé.",
      visual: (
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="space-y-2">
            {[
              {
                date: "Mar. 11 mars",
                heure: "14h-16h",
                matiere: "UX Design",
                salle: "B204",
              },
              {
                date: "Jeu. 13 mars",
                heure: "09h-12h",
                matiere: "Dev Web",
                salle: "A102",
              },
            ].map((b, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg bg-amber-50 p-2.5"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-800">
                    {b.date} — {b.heure}
                  </p>
                  <p className="text-[10px] text-zinc-500">
                    {b.matiere} | {b.salle}
                  </p>
                </div>
                <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-medium text-amber-800">
                  ouvert
                </span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      number: "03",
      title: "Les vacataires donnent leurs dispos",
      description:
        "Via WhatsApp en langage naturel ou via un lien calendrier. Simple, rapide, sans friction.",
      visual: (
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          {/* Mock WhatsApp chat */}
          <div className="space-y-2">
            <div className="flex justify-end">
              <div className="max-w-[200px] rounded-2xl rounded-br-sm bg-green-100 p-2.5">
                <p className="text-xs text-zinc-800">
                  Je suis dispo mardi et jeudi après-midi en mars
                </p>
                <p className="mt-1 text-right text-[9px] text-zinc-500">
                  10:34
                </p>
              </div>
            </div>
            <div className="flex justify-start">
              <div className="max-w-[220px] rounded-2xl rounded-bl-sm bg-white p-2.5 shadow-sm ring-1 ring-zinc-200">
                <p className="text-xs text-zinc-800">
                  Parfait Marie ! J&apos;ai enregistré vos dispos : mardi 11,
                  jeudi 13, mardi 18 et jeudi 20 mars, 14h-18h.
                </p>
                <p className="mt-1 text-[9px] text-zinc-500">10:34</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      number: "04",
      title: "Match et confirmation",
      description:
        "EasyVacataire trouve les créneaux communs. Vous confirmez en un clic, le vacataire est notifié.",
      visual: (
        <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50 p-4 text-center">
          <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-200">
            <svg
              className="h-5 w-5 text-emerald-700"
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
          <p className="text-sm font-semibold text-emerald-800">
            3 créneaux confirmés
          </p>
          <p className="mt-1 text-[11px] text-emerald-600">
            Marie D. — UX Design — Mars 2026
          </p>
        </div>
      ),
    },
  ];

  return (
    <section id="fonctionnement" className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-indigo-600">
            Comment ça marche
          </p>
          <h2 className="text-3xl font-bold text-zinc-900 md:text-4xl">
            4 étapes. Zéro friction.
          </h2>
        </div>

        <div className="mt-16 space-y-16">
          {steps.map((step, i) => (
            <div
              key={i}
              className={`flex flex-col items-center gap-10 md:flex-row ${
                i % 2 === 1 ? "md:flex-row-reverse" : ""
              }`}
            >
              <div className="flex-1">
                <span className="mb-2 inline-block font-mono text-sm font-bold text-indigo-400">
                  {step.number}
                </span>
                <h3 className="text-2xl font-bold text-zinc-900">
                  {step.title}
                </h3>
                <p className="mt-3 text-zinc-500">{step.description}</p>
              </div>
              <div className="w-full max-w-sm flex-shrink-0">{step.visual}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
