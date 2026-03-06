export function Mission() {
  return (
    <section id="contact" className="bg-zinc-900 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-white md:text-4xl">
            L&apos;université a besoin du terrain.
            <br />
            <span className="bg-gradient-to-r from-amber-400 to-amber-300 bg-clip-text text-transparent">
              Le terrain a besoin de l&apos;université.
            </span>
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-zinc-400">
            Chaque cours donné par un professionnel, c&apos;est un pont entre la
            théorie et la réalité. Notre mission : que ce pont soit le plus
            simple possible à construire.
          </p>

          {/* Stats preview */}
          <div className="mt-16 grid grid-cols-3 gap-8">
            {[
              { value: "100%", label: "via WhatsApp" },
              { value: "0", label: "app à installer" },
              { value: "2 min", label: "pour donner ses dispos" },
            ].map((s, i) => (
              <div key={i}>
                <p className="text-3xl font-bold text-white">{s.value}</p>
                <p className="mt-1 text-sm text-zinc-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
