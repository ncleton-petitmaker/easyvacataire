import Link from "next/link";

const navItems = [
  { href: "/admin/creneaux", label: "Planning" },
  { href: "/admin/matching", label: "Matching" },
  { href: "/admin/besoins", label: "Besoins" },
  { href: "/admin/intervenants", label: "Intervenants" },
  { href: "/admin/matieres", label: "Matières" },
  { href: "/admin/knowledge", label: "Base de connaissances" },
  { href: "/admin/conversations", label: "Conversations" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <aside className="w-64 border-r border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-6">
          <img src="/logo.svg" alt="EasyVacataire" className="h-6" />
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
