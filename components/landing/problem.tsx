export function Problem() {
  const problems = [
    {
      stat: "12h",
      label: "par an en moyenne",
      description:
        "Un vacataire a si peu d'heures qu'il n'a pas de réflexe campus. Six mois plus tard, il a oublié son planning.",
    },
    {
      stat: "3x",
      label: "plus de changements",
      description:
        "Changements de salle, d'horaire, d'annulation... mais personne pour prévenir l'intervenant à temps.",
    },
    {
      stat: "67%",
      label: "gèrent ça par mail",
      description:
        "Des mails, du Excel, des coups de fil. Chaque semestre, c'est la même galère pour caler les plannings.",
    },
  ];

  return (
    <section id="probleme" className="bg-zinc-900 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-white md:text-4xl">
            Faire intervenir un pro en cours,
            <br />
            <span className="text-zinc-400">
              ça ne devrait pas être un casse-tête.
            </span>
          </h2>
          <p className="mt-4 text-zinc-400">
            Les vacataires ne sont pas des profs à plein temps. Ils ont un
            métier, un agenda chargé, et peu de visibilité sur le monde
            universitaire.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {problems.map((p, i) => (
            <div
              key={i}
              className="rounded-2xl border border-zinc-800 bg-zinc-800/50 p-8"
            >
              <div className="mb-4">
                <span className="text-4xl font-bold text-amber-400">
                  {p.stat}
                </span>
                <span className="ml-2 text-sm text-zinc-500">{p.label}</span>
              </div>
              <p className="text-sm leading-relaxed text-zinc-400">
                {p.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-lg font-medium text-zinc-300">
            Résultat :{" "}
            <span className="text-amber-400">
              des cours annulés, des étudiants frustrés, et des pros qui ne
              reviennent pas.
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
