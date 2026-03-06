export function Footer() {
  return (
    <footer className="border-t border-zinc-200 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
        <div className="flex items-center">
          <img src="/logo.svg" alt="EasyVacataire" className="h-5" />
        </div>

        <nav className="flex flex-wrap justify-center gap-6">
          <a
            href="mailto:contact@easyvacataire.fr"
            className="text-sm text-zinc-500 transition hover:text-zinc-700"
          >
            Contact
          </a>
          <a
            href="https://github.com/ncleton-petitmaker/easyvacataire"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-zinc-500 transition hover:text-zinc-700"
          >
            GitHub
          </a>
          <a
            href="/politique-de-confidentialite"
            className="text-sm text-zinc-500 transition hover:text-zinc-700"
          >
            Politique de confidentialité
          </a>
          <a
            href="/login"
            className="text-sm text-zinc-500 transition hover:text-zinc-700"
          >
            Connexion
          </a>
        </nav>

        <p className="text-xs text-zinc-400">
          &copy; {new Date().getFullYear()} EasyVacataire. Tous droits
          réservés.
        </p>
      </div>
    </footer>
  );
}
